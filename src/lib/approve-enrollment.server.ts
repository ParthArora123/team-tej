// Shared, server-only approval + ticket-generation logic used by both the
// single-registration approve action and the bulk "Approve All" action.
// Ticket codes are generated here once, and never re-generated for a
// registration that already has one (duplicate-ticket protection).
//
// Participant confirmation email: sent through the Salesforce REST API
// (Apex endpoint + Messaging.SingleEmailMessage) immediately after the
// approval transition — never on page load, payment upload, dashboard
// refresh, or via any database trigger/edge function. The
// `confirmation_email_sent` flag guarantees one email per registration.

export type ApproveResult = {
  enrollment: any;
  ticketCode: string;
  whatsappAlreadySent: boolean;
  alreadyConfirmed: boolean;
  emailSent: boolean;
  emailError: string | null;
};

const genCode = () => "TTJ-" + Math.random().toString(36).slice(2, 8).toUpperCase();

export async function approveEnrollmentById(
  supabaseAdmin: any,
  enrollmentId: string,
  adminUserId: string,
): Promise<ApproveResult> {
  const { data: prior, error: priorError } = await supabaseAdmin
    .from("enrollments")
    .select("status, whatsapp_status, ticket_code, confirmation_email_sent")
    .eq("id", enrollmentId)
    .maybeSingle();
  if (priorError) throw priorError;
  if (!prior) throw new Error("Registration not found");

  const wasConfirmed = prior.status === "confirmed";
  const whatsappAlreadySent = prior.whatsapp_status === "sent";

  // Reuse an existing ticket code — never issue a second ticket.
  let ticket: string = prior.ticket_code || genCode();
  if (!prior.ticket_code) {
    for (let i = 0; i < 5; i++) {
      const { data: dup } = await supabaseAdmin
        .from("enrollments").select("id").eq("ticket_code", ticket).maybeSingle();
      if (!dup) break;
      ticket = genCode();
    }
  }

  const now = new Date().toISOString();
  const { data: enr, error } = await supabaseAdmin.from("enrollments").update({
    status: "confirmed",
    ticket_code: ticket,
    approved_by: adminUserId,
    approved_at: now,
    ticket_generated_at: prior.ticket_code ? undefined : now,
  }).eq("id", enrollmentId).select("*, program:programs(*)").single();
  if (error) throw error;

  // Seats are only incremented on the actual transition into "confirmed".
  if (!wasConfirmed && enr?.program_id) {
    const { data: p } = await supabaseAdmin
      .from("programs").select("seats_taken").eq("id", enr.program_id).single();
    await supabaseAdmin.from("programs")
      .update({ seats_taken: (p?.seats_taken ?? 0) + 1 }).eq("id", enr.program_id);
  }

  // Confirmation email via Salesforce — only when this approval transitions
  // the registration into "confirmed" AND no confirmation email was sent
  // before. Salesforce failures never revert the approval; the flag stays
  // false so the admin can retry.
  let emailSent = false;
  let emailError: string | null = null;
  if (!wasConfirmed && !prior.confirmation_email_sent && enr?.email) {
    emailSent = await trySendConfirmationEmail(supabaseAdmin, enr, (msg) => { emailError = msg; });
  } else if (prior.confirmation_email_sent) {
    emailSent = true;
  }

  return {
    enrollment: enr,
    ticketCode: ticket,
    whatsappAlreadySent,
    alreadyConfirmed: wasConfirmed,
    emailSent,
    emailError,
  };
}

/**
 * Attempts the Salesforce confirmation email for an approved registration.
 * Returns true and flips `confirmation_email_sent` on success; on failure the
 * registration stays approved with the flag false and the error recorded.
 */
export async function trySendConfirmationEmail(
  supabaseAdmin: any,
  enr: any,
  onError?: (message: string) => void,
): Promise<boolean> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const origin = request ? new URL(request.url).origin : "https://tejasdhoke.com";

    const { buildConfirmationPayload, sendConfirmationViaSalesforce } =
      await import("./salesforce-email.server");
    const payload = buildConfirmationPayload(enr, origin);
    await sendConfirmationViaSalesforce(payload);

    await supabaseAdmin.from("enrollments").update({
      confirmation_email_sent: true,
      confirmation_email_error: null,
    }).eq("id", enr.id);
    return true;
  } catch (e: any) {
    const d = e?.details;
    const message = [
      e?.message ?? "Confirmation email failed",
      d?.step ? `step=${d.step}` : "",
      d?.authPath ? `auth=${d.authPath}` : "",
      d?.status ? `status=${d.status}${d.statusText ? " " + d.statusText : ""}` : "",
      d?.endpoint ? `endpoint=${d.endpoint}` : "",
      d?.responseBody ? `response=${d.responseBody}` : "",
      d?.hint ? `hint=${d.hint}` : "",
    ].filter(Boolean).join("\n");
    console.warn("[approve-enrollment] salesforce email failed:", message);
    await supabaseAdmin.from("enrollments").update({
      confirmation_email_sent: false,
      confirmation_email_error: message.slice(0, 2000),
    }).eq("id", enr.id).catch(() => {});
    onError?.(message);
    return false;
  }

}

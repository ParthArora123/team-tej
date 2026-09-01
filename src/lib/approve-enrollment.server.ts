// Shared, server-only approval + ticket-generation logic used by both the
// single-registration approve action and the bulk "Approve All" action.
// Ticket codes are generated here once, and never re-generated for a
// registration that already has one (duplicate-ticket protection).
//
// Notifications after approval are WhatsApp-only. No email is sent, queued or
// attempted from this flow.

export type ApproveResult = {
  enrollment: any;
  ticketCode: string;
  whatsappAlreadySent: boolean;
  confirmationEmailAlreadySent: boolean;
  alreadyConfirmed: boolean;
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
  const confirmationEmailAlreadySent = prior.confirmation_email_sent === true;

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

  // Multi-person registrations: every participant gets their own ticket code,
  // issued once and never re-issued. Participant 1 shares the registration's
  // ticket code so existing single-person tickets/QRs keep working unchanged.
  const { data: participants } = await supabaseAdmin
    .from("enrollment_participants")
    .select("id, position, ticket_code, full_name, email")
    .eq("enrollment_id", enrollmentId)
    .order("position", { ascending: true });

  for (const part of participants ?? []) {
    if (part.ticket_code) continue;
    const code = part.position === 1 ? ticket : `${ticket}-${String(part.position).padStart(2, "0")}`;
    await supabaseAdmin
      .from("enrollment_participants")
      .update({ ticket_code: code })
      .eq("id", part.id);
    part.ticket_code = code;
  }

  // Attach participants so the confirmation email can be sent to each of
  // them individually (same template, per-participant recipient/ticket).
  (enr as any).participants = participants ?? [];

  return {
    enrollment: enr,
    ticketCode: ticket,
    whatsappAlreadySent,
    confirmationEmailAlreadySent,
    alreadyConfirmed: wasConfirmed,
  };
}

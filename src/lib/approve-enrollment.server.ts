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
  /** One row per person when the registration covers more than one participant. */
  participants: Array<{ id: string; position: number; full_name: string; email: string | null; phone: string | null; ticket_code: string | null }>;
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

  return {
    enrollment: enr,
    ticketCode: ticket,
    whatsappAlreadySent,
    confirmationEmailAlreadySent,
    alreadyConfirmed: wasConfirmed,
  };
}

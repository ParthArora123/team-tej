// Shared, server-only approval + ticket-generation logic used by both the
// single-registration approve action and the bulk "Approve All" action.
// Ticket codes are generated here once, and never re-generated for a
// registration that already has one (duplicate-ticket protection).

export type ApproveResult = {
  enrollment: any;
  ticketCode: string;
  whatsappAlreadySent: boolean;
  alreadyConfirmed: boolean;
};

const genCode = () => "TTJ-" + Math.random().toString(36).slice(2, 8).toUpperCase();

// Resolves the human-readable selected workshop/class name(s) exactly like the
// student ticket does, so the confirmation email matches the ticket.
function selectedWorkshopNames(enr: any, prog: any): string | null {
  const w1 = prog?.workshop1_name || "Workshop 1";
  const w2 = prog?.workshop2_name || "Workshop 2";
  if (enr?.registration_type === "both") return [w1, w2].filter(Boolean).join(" + ");
  if (enr?.registration_type === "single") return enr?.selected_workshop === "w2" ? w2 : w1;
  return null;
}

export async function approveEnrollmentById(
  supabaseAdmin: any,
  enrollmentId: string,
  adminUserId: string,
): Promise<ApproveResult> {
  const { data: prior } = await supabaseAdmin
    .from("enrollments")
    .select("status, whatsapp_status, ticket_code")
    .eq("id", enrollmentId)
    .maybeSingle();
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

  if (!wasConfirmed && enr?.email) {
    const { sendConfirmationEmail } = await import("./email-confirmation.server");
    const prog: any = enr.program ?? {};
    await sendConfirmationEmail({
      to: enr.email,
      participantName: enr.full_name || "there",
      workshopName: prog.name || "the workshop",
      workshopDate: prog.event_date ? new Date(prog.event_date).toDateString() : null,
      workshopTime: prog.event_time ?? null,
      venue: prog.venue ?? null,
      selectedWorkshop: selectedWorkshopNames(enr, prog),
      amountPaid:
        typeof enr.amount_inr === "number"
          ? `₹${enr.amount_inr.toLocaleString("en-IN")}`
          : null,
      paymentReference: enr.payment_reference ?? null,
      ticketId: ticket,
    });
  }

  return { enrollment: enr, ticketCode: ticket, whatsappAlreadySent, alreadyConfirmed: wasConfirmed };
}

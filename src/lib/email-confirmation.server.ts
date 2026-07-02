// Sends the workshop confirmation email via the project's Lovable email
// queue. If the email infrastructure hasn't been provisioned yet (no
// `enqueue_email` RPC / no `transactional-confirmation` template), the send
// is skipped gracefully so ticket generation still succeeds.

export interface ConfirmationEmailPayload {
  to: string;
  studentName: string;
  workshopName: string;
  eventDate?: string | null;
  eventTime?: string | null;
  venue?: string | null;
  ticketCode: string;
  amount: number;
  verifyUrl: string;
}

export async function sendConfirmationEmail(p: ConfirmationEmailPayload): Promise<void> {
  if (!p.to) {
    console.warn("[email-confirmation] no recipient email; skipping");
    return;
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const templateData = {
    studentName: p.studentName,
    workshopName: p.workshopName,
    eventDate: p.eventDate ?? "",
    eventTime: p.eventTime ?? "",
    venue: p.venue ?? "",
    ticketCode: p.ticketCode,
    amount: p.amount,
    verifyUrl: p.verifyUrl,
  };

  const { error } = await (supabaseAdmin.rpc as any)("enqueue_email", {
    queue_name: "transactional_emails",
    template_name: "workshop-confirmation",
    recipient_email: p.to,
    template_data: templateData,
    idempotency_key: `confirm-${p.ticketCode}`,
  });


  if (error) {
    // RPC not present yet (email infra not provisioned) — skip silently but log.
    console.warn("[email-confirmation] enqueue skipped:", error.message);
  }
}

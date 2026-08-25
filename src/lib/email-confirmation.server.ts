// Sends the workshop registration confirmation email through the project's
// email infrastructure (`/lovable/email/transactional/send`). This is only ever
// invoked right after an admin approval transitions a registration to
// "confirmed" — never on submission, payment upload or dashboard refresh.

export interface ConfirmationEmailPayload {
  to: string;
  participantName: string;
  workshopName: string;
  workshopDate?: string | null;
  workshopTime?: string | null;
  venue?: string | null;
  selectedWorkshop?: string | null;
  amountPaid?: string | null;
  paymentReference?: string | null;
  ticketId: string;
}

export async function sendConfirmationEmail(p: ConfirmationEmailPayload): Promise<void> {
  if (!p.to) {
    console.warn("[email-confirmation] no recipient email; skipping");
    return;
  }

  const { getRequest } = await import("@tanstack/react-start/server");
  const request = getRequest();
  const authHeader = request?.headers?.get("authorization");
  if (!request || !authHeader) {
    console.warn("[email-confirmation] no request context; skipping");
    return;
  }

  const origin = new URL(request.url).origin;

  // Ticket QR encodes the same public verify URL used on the student ticket,
  // so the emailed code is scannable for attendance exactly like the ticket.
  const verifyUrl = `${origin}/verify?code=${encodeURIComponent(p.ticketId)}`;
  const qrCodeUrl =
    `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=16&data=${encodeURIComponent(verifyUrl)}`;

  try {
    const res = await fetch(`${origin}/lovable/email/transactional/send`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: authHeader },
      body: JSON.stringify({
        templateName: "workshop-confirmation",
        recipientEmail: p.to,
        // One confirmation per issued ticket — retries never duplicate a send.
        idempotencyKey: `workshop-confirmation-${p.ticketId}`,
        templateData: {
          participantName: p.participantName,
          workshopName: p.workshopName,
          workshopDate: p.workshopDate ?? "",
          workshopTime: p.workshopTime ?? "",
          venue: p.venue ?? "",
          selectedWorkshop: p.selectedWorkshop ?? "",
          amountPaid: p.amountPaid ?? "",
          paymentReference: p.paymentReference ?? "",
          ticketId: p.ticketId,
          qrCodeUrl,
        },
      }),
    });
    if (!res.ok) {
      console.warn("[email-confirmation] send failed:", res.status, await res.text());
    }
  } catch (e) {
    // Never let email delivery break ticket generation / approval.
    console.warn("[email-confirmation] send error:", e);
  }
}

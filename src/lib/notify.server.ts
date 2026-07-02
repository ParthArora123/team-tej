// Server-only helpers for sending confirmation SMS + WhatsApp via Twilio.
// Uses the Lovable connector gateway. If the Twilio connector is not linked
// yet, calls no-op and log a warning so ticket generation still succeeds.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) return "+" + trimmed.slice(1).replace(/\D/g, "");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  // Default to India country code if 10-digit number.
  if (digits.length === 10) return "+91" + digits;
  return "+" + digits;
}

async function twilioSend(params: Record<string, string>): Promise<void> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const twilioKey = process.env.TWILIO_API_KEY;
  if (!lovableKey || !twilioKey) {
    console.warn("[notify] Twilio not configured — skipping message send");
    return;
  }
  const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": twilioKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[notify] Twilio ${res.status}: ${body}`);
  }
}

export interface ConfirmationPayload {
  studentName: string;
  workshopName: string;
  eventDate?: string | null;
  eventTime?: string | null;
  venue?: string | null;
  ticketCode: string;
  amount: number;
  verifyUrl: string;
  phone: string;
}

function buildMessage(p: ConfirmationPayload): string {
  const lines = [
    `🎉 Congratulations, ${p.studentName}!`,
    `Your registration for ${p.workshopName} is CONFIRMED.`,
  ];
  if (p.eventDate) lines.push(`📅 ${p.eventDate}${p.eventTime ? ` · ${p.eventTime}` : ""}`);
  if (p.venue) lines.push(`📍 ${p.venue}`);
  lines.push(`🎟 Ticket ID: ${p.ticketCode}`);
  lines.push(`💳 Payment: Successful · ₹${p.amount.toLocaleString("en-IN")}`);
  lines.push(`Ticket / QR: ${p.verifyUrl}`);
  lines.push(`Please show this ticket or QR at the studio entrance. — Team Tej`);
  return lines.join("\n");
}

export async function sendConfirmation(p: ConfirmationPayload): Promise<void> {
  const to = normalizePhone(p.phone);
  if (!to) {
    console.warn("[notify] Missing/invalid phone, skipping");
    return;
  }
  const body = buildMessage(p);
  const smsFrom = process.env.TWILIO_SMS_FROM;
  const waFrom = process.env.TWILIO_WHATSAPP_FROM;
  const tasks: Promise<void>[] = [];
  if (smsFrom) tasks.push(twilioSend({ To: to, From: smsFrom, Body: body }));
  else console.warn("[notify] TWILIO_SMS_FROM not set — skipping SMS");
  if (waFrom) {
    const waTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    const waFromFmt = waFrom.startsWith("whatsapp:") ? waFrom : `whatsapp:${waFrom}`;
    tasks.push(twilioSend({ To: waTo, From: waFromFmt, Body: body }));
  } else {
    console.warn("[notify] TWILIO_WHATSAPP_FROM not set — skipping WhatsApp");
  }
  await Promise.allSettled(tasks);
}

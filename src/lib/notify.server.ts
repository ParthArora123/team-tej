// Server-only helpers for sending confirmation SMS + WhatsApp via MSG91.
// All API calls happen server-side using env-var secrets — the auth key is
// never exposed to the browser. Returns a structured delivery-status object
// so callers can persist it against the enrollment row.
//
// Required env vars:
//   MSG91_AUTH_KEY                       – account auth key
//   MSG91_SENDER_ID                      – 6-char DLT-registered SMS sender
//   MSG91_SMS_TEMPLATE_ID                – DLT-approved SMS template id
//   MSG91_WHATSAPP_INTEGRATED_NUMBER     – WhatsApp business number (digits)
//   MSG91_WHATSAPP_TEMPLATE_NAME         – approved WhatsApp template name
//   MSG91_WHATSAPP_LANGUAGE (optional)   – default 'en'
//   MSG91_WHATSAPP_NAMESPACE (optional)  – template namespace if required
//   MSG91_COUNTRY_CODE (optional)        – default '91'

const MSG91_BASE = "https://control.msg91.com/api/v5";

function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const cc = (process.env.MSG91_COUNTRY_CODE ?? "91").replace(/\D/g, "");
  if (trimmed.startsWith("+")) return trimmed.slice(1).replace(/\D/g, "");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  // 10-digit numbers get the default country code prefix.
  if (digits.length === 10) return cc + digits;
  return digits;
}

export interface ChannelResult {
  status: "sent" | "failed" | "skipped";
  messageId?: string | null;
  error?: string | null;
  sentAt?: string | null;
}

export interface DeliveryReport {
  provider: "msg91";
  sms: ChannelResult;
  whatsapp: ChannelResult;
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

async function sendSms(to: string, p: ConfirmationPayload): Promise<ChannelResult> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_SMS_TEMPLATE_ID;
  const senderId = process.env.MSG91_SENDER_ID;
  if (!authKey || !templateId || !senderId) {
    return { status: "skipped", error: "MSG91 SMS not configured" };
  }

  // MSG91 Flow API — DLT-approved template variables. Adjust variable names
  // in your MSG91 template to match VAR1..VAR7 below.
  const payload = {
    template_id: templateId,
    sender: senderId,
    short_url: "1",
    recipients: [{
      mobiles: to,
      VAR1: p.studentName,
      VAR2: p.workshopName,
      VAR3: p.eventDate ?? "",
      VAR4: p.eventTime ?? "",
      VAR5: p.venue ?? "",
      VAR6: p.ticketCode,
      VAR7: p.verifyUrl,
    }],
  };

  try {
    const res = await fetch(`${MSG91_BASE}/flow/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        authkey: authKey,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.text();
    if (!res.ok) {
      console.error(`[notify/msg91-sms] ${res.status}: ${body}`);
      return { status: "failed", error: `HTTP ${res.status}: ${body.slice(0, 300)}` };
    }
    let parsed: any;
    try { parsed = JSON.parse(body); } catch { /* ignore */ }
    return {
      status: "sent",
      messageId: parsed?.request_id ?? parsed?.message ?? null,
      sentAt: new Date().toISOString(),
    };
  } catch (e: any) {
    console.error("[notify/msg91-sms] error", e);
    return { status: "failed", error: e?.message ?? "Unknown SMS error" };
  }
}

function buildWhatsAppTextFallback(p: ConfirmationPayload): string {
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

async function sendWhatsApp(to: string, p: ConfirmationPayload): Promise<ChannelResult> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const integratedNumber = process.env.MSG91_WHATSAPP_INTEGRATED_NUMBER;
  const templateName = process.env.MSG91_WHATSAPP_TEMPLATE_NAME;
  const language = process.env.MSG91_WHATSAPP_LANGUAGE ?? "en";
  const namespace = process.env.MSG91_WHATSAPP_NAMESPACE;
  if (!authKey || !integratedNumber || !templateName) {
    return { status: "skipped", error: "MSG91 WhatsApp not configured" };
  }

  // MSG91 WhatsApp Outbound (template) API. Body variables are positional —
  // your MSG91 template must expect {{1}}..{{7}} in the order below, matching
  // the SMS template above.
  const bodyComponent = {
    type: "body",
    parameters: [
      { type: "text", text: p.studentName },
      { type: "text", text: p.workshopName },
      { type: "text", text: p.eventDate ?? "" },
      { type: "text", text: p.eventTime ?? "" },
      { type: "text", text: p.venue ?? "" },
      { type: "text", text: p.ticketCode },
      { type: "text", text: p.verifyUrl },
    ],
  };

  const template: any = {
    name: templateName,
    language: { code: language, policy: "deterministic" },
    components: [bodyComponent],
  };
  if (namespace) template.namespace = namespace;

  const payload = {
    integrated_number: integratedNumber,
    content_type: "template",
    payload: {
      messaging_product: "whatsapp",
      type: "template",
      template,
      to_and_components: [{
        to: [to],
        components: {
          body_1: { type: "text", value: p.studentName },
          body_2: { type: "text", value: p.workshopName },
          body_3: { type: "text", value: p.eventDate ?? "" },
          body_4: { type: "text", value: p.eventTime ?? "" },
          body_5: { type: "text", value: p.venue ?? "" },
          body_6: { type: "text", value: p.ticketCode },
          body_7: { type: "text", value: p.verifyUrl },
        },
      }],
      // Fallback plain text preserved for logs / template previews.
      text: buildWhatsAppTextFallback(p),
    },
  };

  try {
    const res = await fetch(`${MSG91_BASE}/whatsapp/whatsapp-outbound-message/bulk/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        authkey: authKey,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.text();
    if (!res.ok) {
      console.error(`[notify/msg91-wa] ${res.status}: ${body}`);
      return { status: "failed", error: `HTTP ${res.status}: ${body.slice(0, 300)}` };
    }
    let parsed: any;
    try { parsed = JSON.parse(body); } catch { /* ignore */ }
    return {
      status: "sent",
      messageId: parsed?.request_id ?? parsed?.data?.request_id ?? null,
      sentAt: new Date().toISOString(),
    };
  } catch (e: any) {
    console.error("[notify/msg91-wa] error", e);
    return { status: "failed", error: e?.message ?? "Unknown WhatsApp error" };
  }
}

export async function sendConfirmation(p: ConfirmationPayload): Promise<DeliveryReport> {
  const to = normalizePhone(p.phone);
  if (!to) {
    const skipped: ChannelResult = { status: "skipped", error: "Invalid mobile number" };
    return { provider: "msg91", sms: skipped, whatsapp: skipped };
  }
  const [sms, whatsapp] = await Promise.all([sendSms(to, p), sendWhatsApp(to, p)]);
  return { provider: "msg91", sms, whatsapp };
}

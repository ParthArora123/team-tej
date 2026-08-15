// Server-only WhatsApp confirmation sender.
//
// Trigger: called ONLY when a registration transitions into "confirmed"
// (admin approval), or from the explicit admin retry action. Never at
// registration submission time and never on payment completion.
//
// FROM   → the business WhatsApp number configured by the admin
//          (site_content.whatsapp_template.sender_number, falling back to the
//          contact_info WhatsApp number). Never hardcoded.
// TO     → the phone/WhatsApp number the student entered in the registration
//          form (enrollments.phone). Never hardcoded.
// BODY   → the exact admin-configured template with placeholders replaced.
//
// Delivery goes through Twilio server-side via the Lovable connector gateway,
// so no Twilio credentials ever reach the browser.

import { renderWhatsappTemplate, DEFAULT_WHATSAPP_TEMPLATE } from "./whatsapp-template";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

export function toE164(raw: unknown): string {
  let digits = String(raw ?? "").replace(/[^\d]/g, "");
  if (!digits) return "";
  digits = digits.replace(/^0+/, "");
  if (digits.length === 10) digits = `91${digits}`;
  return digits.length >= 11 ? `+${digits}` : "";
}

function siteOrigin(): string {
  return (
    process.env["PUBLIC_SITE_URL"] ||
    process.env["SITE_URL"] ||
    "https://www.tejasdhoke.com"
  ).replace(/\/$/, "");
}

async function loadWhatsappConfig(supabaseAdmin: any) {
  const { data } = await supabaseAdmin
    .from("site_content")
    .select("key, value")
    .in("key", ["whatsapp_template", "contact_info"]);

  const map = new Map<string, any>((data ?? []).map((r: any) => [r.key, r.value]));
  const tpl = map.get("whatsapp_template") ?? {};
  const contact = map.get("contact_info") ?? {};
  return {
    template: typeof tpl.template === "string" && tpl.template.trim()
      ? tpl.template
      : DEFAULT_WHATSAPP_TEMPLATE,
    sender: String(tpl.sender_number || contact.whatsapp || contact.phone || "").trim(),
  };
}

export type WhatsappSendResult = {
  sent: boolean;
  alreadySent?: boolean;
  messageId?: string | null;
  error?: string | null;
};

/**
 * Renders the admin template for an enrollment row (with `program` joined)
 * and sends it through Twilio. Persists sent/failed status on the row.
 */
export async function sendWhatsappConfirmation(
  enrollmentId: string,
  opts: { force?: boolean } = {},
): Promise<WhatsappSendResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: enr, error: readErr } = await supabaseAdmin
    .from("enrollments")
    .select("*, program:programs(*)")
    .eq("id", enrollmentId)
    .maybeSingle();
  if (readErr || !enr) return { sent: false, error: readErr?.message || "Registration not found" };

  // Only ever for confirmed registrations.
  if (enr.status !== "confirmed") return { sent: false, error: "Registration is not confirmed" };

  // Duplicate protection — never auto-send twice.
  if (enr.whatsapp_status === "sent" && !opts.force) {
    return { sent: false, alreadySent: true, messageId: enr.whatsapp_message_id ?? null };
  }
  if (enr.whatsapp_status === "sent" && opts.force) {
    return { sent: false, alreadySent: true, messageId: enr.whatsapp_message_id ?? null };
  }

  const fail = async (message: string) => {
    await supabaseAdmin
      .from("enrollments")
      .update({
        whatsapp_status: "failed",
        whatsapp_error: message.slice(0, 500),
        notification_provider: "twilio",
      })
      .eq("id", enrollmentId);
    return { sent: false, error: message } satisfies WhatsappSendResult;
  };

  const to = toE164(enr.phone);
  if (!to) return await fail("Registration has no valid WhatsApp/phone number.");

  const cfg = await loadWhatsappConfig(supabaseAdmin);
  // Sender priority: explicit TWILIO_WHATSAPP_FROM env (the number approved for
  // WhatsApp in Twilio) → the number configured in the admin panel.
  const from = toE164(process.env["TWILIO_WHATSAPP_FROM"] || cfg.sender);
  if (!from) return await fail("No business WhatsApp sender number configured in the admin panel.");

  // Two supported transports:
  //  1. Direct Twilio  — TWILIO_ACCOUNT_SID + (TWILIO_AUTH_TOKEN | TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET).
  //     Works on any host (Vercel, self-hosted) with your own Twilio credentials.
  //  2. Lovable connector gateway — LOVABLE_API_KEY + TWILIO_API_KEY (Lovable hosting).
  const accountSid = process.env["TWILIO_ACCOUNT_SID"];
  const authToken = process.env["TWILIO_AUTH_TOKEN"];
  const apiKeySid = process.env["TWILIO_API_KEY_SID"];
  const apiKeySecret = process.env["TWILIO_API_KEY_SECRET"];
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const twilioKey = process.env["TWILIO_API_KEY"];

  let endpoint: string;
  let authHeaders: Record<string, string>;
  if (accountSid && (authToken || (apiKeySid && apiKeySecret))) {
    const user = authToken ? accountSid : apiKeySid!;
    const pass = authToken ? authToken : apiKeySecret!;
    endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    authHeaders = { Authorization: `Basic ${btoa(`${user}:${pass}`)}` };
  } else if (lovableKey && twilioKey) {
    endpoint = `${GATEWAY_URL}/Messages.json`;
    authHeaders = { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": twilioKey };
  } else {
    return await fail(
      "WhatsApp provider is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN (plus TWILIO_WHATSAPP_FROM) in the hosting environment.",
    );
  }


  const prog: any = enr.program ?? {};
  const ticket = enr.ticket_code || enr.id;
  const verifyUrl = ticket ? `${siteOrigin()}/verify?code=${encodeURIComponent(ticket)}` : "";
  const qrImageUrl = verifyUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=20&data=${encodeURIComponent(verifyUrl)}`
    : "";

  const body = renderWhatsappTemplate(cfg.template, {
    StudentName: enr.full_name || "there",
    WorkshopName: prog.name || enr.selected_workshop || "the workshop",
    RegistrationId: ticket || "",
    PaymentStatus: enr.payment_confirmed_at ? "Verified" : "Confirmed",
    WorkshopDate: prog.event_date ? new Date(prog.event_date).toDateString() : "",
    WorkshopTime: prog.event_time || "",
    Venue: prog.venue || "",
    InstructorName: prog.instructor || "Tejas D Dhoke",
    SupportContact: cfg.sender,
    CustomInstructions: "",
    QRCodeUrl: qrImageUrl,
    TicketUrl: verifyUrl,
  });

  // WhatsApp business numbers that are outside a 24-hour customer service
  // window can only receive an approved template ("Content") message — Twilio
  // rejects free-form Body with error 21654 (ContentSid Required).
  // If TWILIO_CONTENT_SID is configured we use the approved template; we also
  // fall back to it automatically when Twilio returns 21654.
  const contentSid = process.env["TWILIO_CONTENT_SID"];
  const messagingServiceSid = process.env["TWILIO_MESSAGING_SERVICE_SID"];

  const contentVars = JSON.stringify({
    "1": enr.full_name || "there",
    "2": prog.name || enr.selected_workshop || "the workshop",
    "3": ticket || "",
    "4": prog.event_date ? new Date(prog.event_date).toDateString() : "",
    "5": prog.event_time || "",
    "6": prog.venue || "",
  });

  const buildParams = (useContent: boolean) => {
    const p = new URLSearchParams({ To: `whatsapp:${to}` });
    if (messagingServiceSid) p.set("MessagingServiceSid", messagingServiceSid);
    else p.set("From", `whatsapp:${from}`);
    if (useContent && contentSid) {
      p.set("ContentSid", contentSid);
      p.set("ContentVariables", contentVars);
    } else {
      p.set("Body", body);
    }
    return p;
  };

  const post = (useContent: boolean) =>
    fetch(endpoint, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: buildParams(useContent),
    });

  try {
    let res = await post(Boolean(contentSid));
    let text = await res.text();

    if (!res.ok && !contentSid && text.includes("21654")) {
      return await fail(
        "WhatsApp rejected the free-form message (Twilio 21654: ContentSid Required). " +
          "The recipient is outside the 24-hour session window, so Twilio needs an approved " +
          "WhatsApp template. Create/approve a template in Twilio Content Template Builder and " +
          "set TWILIO_CONTENT_SID (and optionally TWILIO_MESSAGING_SERVICE_SID) in the hosting environment.",
      );
    }

    // Approved template configured but rejected → try free-form as a fallback.
    if (!res.ok && contentSid) {
      const retry = await post(false);
      const retryText = await retry.text();
      if (retry.ok) {
        res = retry;
        text = retryText;
      }
    }

    if (!res.ok) {
      console.error(`Twilio WhatsApp send failed [${res.status}]: ${text}`);
      return await fail(`Provider error [${res.status}]: ${text.slice(0, 300)}`);
    }


    let sid: string | null = null;
    try {
      sid = JSON.parse(text)?.sid ?? null;
    } catch {
      sid = null;
    }

    await supabaseAdmin
      .from("enrollments")
      .update({
        whatsapp_status: "sent",
        whatsapp_message_id: sid,
        whatsapp_error: null,
        whatsapp_sent_at: new Date().toISOString(),
        notification_provider: "twilio",
      })
      .eq("id", enrollmentId);

    return { sent: true, messageId: sid };
  } catch (e: any) {
    console.error("Twilio WhatsApp send threw:", e?.message);
    return await fail(e?.message || "WhatsApp send failed");
  }
}

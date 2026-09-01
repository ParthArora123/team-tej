// EmailJS confirmation email — sent ONLY after an admin approval has been
// successfully saved (status -> confirmed). Never on registration, payment
// upload, rejection, or a dashboard refresh.
//
// Credentials come from Vite env vars; nothing is hardcoded here and no
// private/server-side EmailJS key is used (the browser SDK only needs the
// public key).

import emailjs from "@emailjs/browser";
import { getSelectedSessions, renderSessionDetails } from "@/lib/whatsapp-template";
import { buildConfirmationContent } from "@/lib/email-content";

const SERVICE_ID = import.meta.env['VITE_EMAILJS_SERVICE_ID'] as string | undefined;
const TEMPLATE_ID = import.meta.env['VITE_EMAILJS_TEMPLATE_ID'] as string | undefined;
const PUBLIC_KEY = import.meta.env['VITE_EMAILJS_PUBLIC_KEY'] as string | undefined;

export const isEmailJsConfigured = () => Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

// In-flight/completed guard for this browser session. Together with the
// persisted `confirmation_email_sent` flag on the registration, this prevents
// duplicates from double-clicks, re-renders, StrictMode or remounts.
const inFlight = new Set<string>();

export type EmailSendResult =
  | { status: "sent" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; message: string };

function isValidEmail(v: unknown): v is string {
  const s = String(v ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

export type EmailRecipient = { name: string; email: string; ticket?: string | null };

/** Builds the unique recipient list for a registration: the primary
 *  participant plus any additional participants (2..5), de-duplicated by
 *  email address (case-insensitive) so a repeated address only gets one
 *  confirmation email. Nothing is hardcoded — every address comes from the
 *  registration's own data. */
export function getEmailRecipients(enr: any): EmailRecipient[] {
  const seen = new Set<string>();
  const out: EmailRecipient[] = [];
  const add = (name: unknown, email: unknown, ticket?: unknown) => {
    const e = String(email ?? "").trim();
    if (!isValidEmail(e)) return;
    const key = e.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ name: String(name ?? "").trim() || "Participant", email: e, ticket: ticket ? String(ticket) : null });
  };
  add(enr?.full_name, enr?.email, enr?.ticket_code);
  const extras = Array.isArray(enr?.participants) ? enr.participants : [];
  for (const p of extras) add(p?.full_name, p?.email, p?.ticket_code);
  return out;
}

/** Builds the EmailJS template params from the approved registration record,
 *  addressed to one specific participant (name, email and their own ticket). */
export function buildEmailParams(enr: any, ticket: string | null, recipient?: EmailRecipient) {
  const sessions = getSelectedSessions(enr);
  const sessionDetails = renderSessionDetails(sessions);
  const content = buildConfirmationContent(enr);
  const registrationId = recipient?.ticket || ticket || enr?.ticket_code || enr?.id || "";
  const verifyUrl =
    registrationId && typeof window !== "undefined"
      ? `${window.location.origin}/verify?code=${encodeURIComponent(registrationId)}`
      : "";
  const qrCodeUrl = verifyUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=20&data=${encodeURIComponent(verifyUrl)}`
    : "";

  return {
    to_email: recipient?.email ?? String(enr?.email ?? "").trim(),
    to_name: recipient?.name ?? enr?.full_name ?? "Participant",
    participant_name: recipient?.name ?? enr?.full_name ?? "Participant",
    participant_email: recipient?.email ?? String(enr?.email ?? "").trim(),
    workshop_name: enr?.program?.name || "Workshop",
    workshop_date: content.workshopDate || (enr?.program?.event_date ? new Date(enr.program.event_date).toDateString() : ""),
    day: content.day,
    session_name: sessions.map((s) => s.name).filter(Boolean).join(" & "),
    session_time: content.sessionTime,
    session_summary: content.sessionSummary,
    session_details: sessionDetails,
    venue: enr?.program?.venue || "",
    registration_id: registrationId,
    ticket_id: registrationId,
    payment_status: "Verified",
    qr_code_url: qrCodeUrl,
    ticket_url: verifyUrl,
    // Dynamic, workshop/session-specific content
    subject: content.subject,
    email_subject: content.subject,
    email_headline: content.headline,
    message_html: content.bodyHtml,
    message: content.bodyText,
  };
}


/**
 * Sends the approval confirmation email to EVERY participant on the
 * registration (primary + participants 2..5), reusing the same EmailJS
 * service/template for each send. Duplicate email addresses receive only one
 * email. Returns a result instead of throwing so the approval is never rolled
 * back when the email provider fails.
 */
export type MultiEmailSendResult = EmailSendResult & { sentCount?: number; total?: number };

export async function sendApprovalConfirmationEmail(
  enr: any,
  ticket: string | null,
  opts: { alreadySent?: boolean } = {},
): Promise<MultiEmailSendResult> {
  const id = String(enr?.id ?? "");
  if (!id) return { status: "skipped", reason: "Missing registration id" };
  if (opts.alreadySent || enr?.confirmation_email_sent) {
    return { status: "skipped", reason: "Confirmation email was already sent" };
  }
  if (enr?.status !== "confirmed") {
    return { status: "skipped", reason: "Registration is not approved" };
  }
  if (!isEmailJsConfigured()) {
    return { status: "failed", message: "Email service is not configured (missing EmailJS keys)." };
  }
  const recipients = getEmailRecipients(enr);
  if (!recipients.length) {
    return { status: "failed", message: "Registration has no valid participant email address." };
  }
  if (inFlight.has(id)) return { status: "skipped", reason: "Email already being sent" };

  inFlight.add(id);
  let sentCount = 0;
  const failures: string[] = [];
  try {
    // Same existing template for every participant; only the recipient
    // (email, name, ticket) changes per send.
    for (const recipient of recipients) {
      try {
        await emailjs.send(SERVICE_ID!, TEMPLATE_ID!, buildEmailParams(enr, ticket, recipient), {
          publicKey: PUBLIC_KEY!,
        });
        sentCount++;
      } catch (e: any) {
        const message = e?.text || e?.message || "Unknown EmailJS error";
        failures.push(`${recipient.email}: ${message}`);
        console.error("[emailjs] confirmation email failed", { enrollmentId: id, to: recipient.email, message });
      }
    }
  } finally {
    // Allow a retry when not every participant got their email; keep the
    // guard when all sends succeeded so duplicates can't slip through.
    if (sentCount < recipients.length) inFlight.delete(id);
  }
  if (sentCount === recipients.length) {
    return { status: "sent", sentCount, total: recipients.length };
  }
  return {
    status: "failed",
    sentCount,
    total: recipients.length,
    message: `Sent ${sentCount}/${recipients.length} confirmation emails. ${failures.join("; ")}`,
  };
}

/**
 * Legacy single-recipient sender (kept for any direct single-participant use).
 */
export async function sendSingleApprovalConfirmationEmail(
  enr: any,
  ticket: string | null,
  opts: { alreadySent?: boolean } = {},
): Promise<EmailSendResult> {
  const id = String(enr?.id ?? "");
  if (!id) return { status: "skipped", reason: "Missing registration id" };
  if (opts.alreadySent || enr?.confirmation_email_sent) {
    return { status: "skipped", reason: "Confirmation email was already sent" };
  }
  if (enr?.status !== "confirmed") {
    return { status: "skipped", reason: "Registration is not approved" };
  }
  if (!isEmailJsConfigured()) {
    return { status: "failed", message: "Email service is not configured (missing EmailJS keys)." };
  }
  if (!isValidEmail(enr?.email)) {
    return { status: "failed", message: "Registration has no valid email address." };
  }
  if (inFlight.has(id)) return { status: "skipped", reason: "Email already being sent" };

  inFlight.add(id);
  try {
    await emailjs.send(SERVICE_ID!, TEMPLATE_ID!, buildEmailParams(enr, ticket), {
      publicKey: PUBLIC_KEY!,
    });
    return { status: "sent" };
  } catch (e: any) {
    inFlight.delete(id);
    const message = e?.text || e?.message || "Unknown EmailJS error";
    console.error("[emailjs] confirmation email failed", { enrollmentId: id, message });
    return { status: "failed", message };
  }
}
export async function sendApprovalConfirmationEmail(
  enr: any,
  ticket: string | null,
  opts: { alreadySent?: boolean } = {},
): Promise<EmailSendResult> {
  const id = String(enr?.id ?? "");
  if (!id) return { status: "skipped", reason: "Missing registration id" };
  if (opts.alreadySent || enr?.confirmation_email_sent) {
    return { status: "skipped", reason: "Confirmation email was already sent" };
  }
  if (enr?.status !== "confirmed") {
    return { status: "skipped", reason: "Registration is not approved" };
  }
  if (!isEmailJsConfigured()) {
    return { status: "failed", message: "Email service is not configured (missing EmailJS keys)." };
  }
  if (!isValidEmail(enr?.email)) {
    return { status: "failed", message: "Registration has no valid email address." };
  }
  if (inFlight.has(id)) return { status: "skipped", reason: "Email already being sent" };

  inFlight.add(id);
  try {
    await emailjs.send(SERVICE_ID!, TEMPLATE_ID!, buildEmailParams(enr, ticket), {
      publicKey: PUBLIC_KEY!,
    });
    return { status: "sent" };
  } catch (e: any) {
    inFlight.delete(id);
    const message = e?.text || e?.message || "Unknown EmailJS error";
    console.error("[emailjs] confirmation email failed", { enrollmentId: id, message });
    return { status: "failed", message };
  }
}

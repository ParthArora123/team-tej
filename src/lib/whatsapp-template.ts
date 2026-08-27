// Shared WhatsApp confirmation-message template helpers.
// Admin edits a plain-text template with {{Placeholders}} in the CMS; the
// pay page renders it and opens wa.me with the filled message.

export const WHATSAPP_PLACEHOLDERS = [
  "StudentName",
  "WorkshopName",
  "RegistrationId",
  "PaymentStatus",
  "WorkshopDate",
  "WorkshopTime",
  "Venue",
  "InstructorName",
  "SupportContact",
  "CustomInstructions",
  "QRCodeUrl",
  "TicketUrl",
  "SessionDetails",
  "SessionName",
  "SessionTiming",
] as const;

export type WhatsappPlaceholder = (typeof WHATSAPP_PLACEHOLDERS)[number];

export const DEFAULT_WHATSAPP_TEMPLATE = `🎉 Hi {{StudentName}},

✅ Your payment has been verified.
✅ Your seat has been confirmed.

Workshop: {{WorkshopName}}
{{SessionDetails}}
Date: {{WorkshopDate}}
Venue: {{Venue}}

🎫 Ticket ID: {{RegistrationId}}
Payment: {{PaymentStatus}}

Your Workshop Entry QR Code (tap to view / save the image):
{{QRCodeUrl}}

🔍 Present this QR code to the Workshop Manager at the venue — they will scan it during check-in.

{{CustomInstructions}}

For any help, reach out on {{SupportContact}}.

– {{InstructorName}}`;

// Workshop-specific confirmation templates. When the registered workshop is
// Govind Bolo or Shiv Tandav, the matching template below is used instead of
// the admin-configured/default template so outfit instructions never leak
// across workshops.
export const GOVIND_BOLO_TEMPLATE = `🎉 Hi {{StudentName}},

🎉 Your Spot is Confirmed! 🎉
Pune Bhakti Dance Experience by Tejas D Dhoke ⭐

You’re registered for:
🕕 {{SessionDetails}}
📅 {{WorkshopDate}}
📍 {{Venue}}

🕗 Please arrive 10 minutes prior to your class.

🎫 Ticket ID: {{RegistrationId}}

Your Workshop Entry QR Code (tap to view / save the image):
{{QRCodeUrl}}

🔍 Present this QR code to the Workshop Manager at the venue — they will scan it during check-in.

{{CustomInstructions}}

👗 Outfit for Govind Bolo:
Shri Krishna or Radha Rani outfit, OR White with Blue/Yellow elements — look as beautiful as you can! ✨
(If you don’t have anything specific, wear a comfortable outfit in this colour theme.)

👣 No need to wear shoes.
⚠️ Note: Your seat is confirmed, so no refunds/cancellations are available.

See you on the dance floor! 💃`;

export const TANDAV_TEMPLATE = `Hey {{StudentName}} 👋

Your seat has been successfully confirmed for our TANDAV Workshop ❤️

🗓 Date: {{WorkshopDate}}
⏰ Time: {{SessionDetails}}
📍 Location: {{Venue}}

🔱 Outfit Theme: Tandav (Shiva Theme)

Wear an all-black outfit — Dhoti with a black top, or you can customize your outfit according to the Shiva/Tandav theme.

Note:

Please make sure to reach the venue at least 10 minutes prior.

No refund policy is available once your seat is confirmed.

See you with full energyyy ❤️✌🏻
One Energy ❤️`;

/**
 * Picks the confirmation template from the actual registration data:
 * - workshop name containing "Govind Bolo" → Govind Bolo template
 * - workshop name containing "Shiv Tandav" / "Tandav" → Tandav template
 * - anything else → the admin-configured template (or the default).
 * The selected workshop (for split workshops) is checked first, then the
 * program name, resolved session names, and the other split workshop name.
 */
export function selectWhatsappTemplate(enr: any, adminTemplate: string): string {
  const prog = enr?.program;
  const candidates: string[] = [];

  const w1 = String(prog?.workshop1_name ?? "").trim();
  const w2 = String(prog?.workshop2_name ?? "").trim();
  if (enr?.registration_type === "both") {
    if (w1) candidates.push(w1);
    if (w2) candidates.push(w2);
  } else if (w1 || w2) {
    const selected = enr?.selected_workshop === "w2" ? w2 : w1;
    if (selected) candidates.push(selected);
  }
  if (prog?.name) candidates.push(String(prog.name));
  for (const s of getSelectedSessions(enr)) if (s.name) candidates.push(s.name);
  if (w1 && !candidates.includes(w1)) candidates.push(w1);
  if (w2 && !candidates.includes(w2)) candidates.push(w2);

  for (const raw of candidates) {
    const name = raw.toLowerCase();
    if (name.includes("govind bolo")) return GOVIND_BOLO_TEMPLATE;
    if (name.includes("tandav")) return TANDAV_TEMPLATE;
  }
  return adminTemplate || DEFAULT_WHATSAPP_TEMPLATE;
}

export function renderWhatsappTemplate(
  template: string,
  values: Partial<Record<WhatsappPlaceholder, string>>,
): string {
  let out = template ?? "";
  for (const key of WHATSAPP_PLACEHOLDERS) {
    const v = values[key] ?? "";
    out = out.replaceAll(`{{${key}}}`, String(v));
  }
  // Collapse any lines that became empty after substitution to keep the
  // message tidy when optional placeholders are blank.
  return out
    .split("\n")
    .filter((line, i, arr) => !(line.trim() === "" && arr[i - 1]?.trim() === ""))
    .join("\n")
    .trim();
}

// Formats a raw session time ("15:00", "1500", "3 pm") into "3:00 PM".
// Mirrors the workshop detail page formatting so the WhatsApp message shows
// exactly the timing the participant saw when registering.
function formatSessionTime(time: unknown): string {
  const raw = String(time ?? "").trim();
  if (!raw) return "";
  const withMeridiem = raw.match(/^(\d{1,2})(?::(\d{1,2}))?\s*([AaPp])\.?[Mm]\.?$/);
  if (withMeridiem) {
    const h = Number(withMeridiem[1]) % 12 || 12;
    const m = String(Number(withMeridiem[2] ?? 0)).padStart(2, "0");
    return `${h}:${m} ${withMeridiem[3].toUpperCase()}M`;
  }
  const hm = raw.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/) ?? raw.match(/^(\d{2})(\d{2})$/) ?? raw.match(/^(\d{1,2})$/);
  if (!hm) return raw;
  const h24 = Number(hm[1]);
  const mins = String(Number(hm[2] ?? 0)).padStart(2, "0");
  if (h24 > 24) return raw;
  const meridiem = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${h12}:${mins} ${meridiem}`;
}

export type SelectedSession = { name: string; time: string };

/**
 * Resolves the class/session(s) a participant actually selected, using the
 * Admin-configured Class / Session Schedule (`programs.session_schedule`) as
 * the source of truth. Session entries map to the two split workshops first
 * by matching the Admin workshop names, then by position (entry 1 →
 * Workshop 1, entry 2 → Workshop 2). A non-split registration gets the full
 * schedule of its workshop. Timings are never hardcoded.
 */
export function getSelectedSessions(enr: any): SelectedSession[] {
  const prog = enr?.program;
  const schedule: SelectedSession[] = Array.isArray(prog?.session_schedule)
    ? prog.session_schedule
        .map((s: any) => ({ name: String(s?.name ?? "").trim(), time: formatSessionTime(s?.time) }))
        .filter((s: SelectedSession) => s.name || s.time)
    : [];
  if (!schedule.length) return [];

  const w1Name = String(prog?.workshop1_name ?? "").trim().toLowerCase();
  const w2Name = String(prog?.workshop2_name ?? "").trim().toLowerCase();
  const hasSplit = !!(w1Name || w2Name);

  const sessionFor = (which: "w1" | "w2"): SelectedSession | null => {
    const target = which === "w1" ? w1Name : w2Name;
    if (target) {
      const byName = schedule.find((s) => s.name.trim().toLowerCase() === target);
      if (byName) return byName;
    }
    const idx = which === "w1" ? 0 : 1;
    return schedule[idx] ?? schedule[0] ?? null;
  };

  if (enr?.registration_type === "both") {
    if (!hasSplit) return schedule;
    const first = sessionFor("w1");
    const second = sessionFor("w2");
    const out: SelectedSession[] = [];
    if (first) out.push(first);
    if (second && second !== first) out.push(second);
    return out.length ? out : schedule;
  }
  if (hasSplit) {
    const which = enr?.selected_workshop === "w2" ? "w2" : "w1";
    const s = sessionFor(which);
    return s ? [s] : [];
  }
  return schedule;
}

// Renders the selected session(s) as the confirmation-message block, e.g.
//   Session: Bol Na Halke — 3:00 PM
// or, when the participant selected multiple sessions:
//   Sessions:
//   • Bol Na Halke — 3:00 PM
//   • Mehebooba — 5:00 PM
export function renderSessionDetails(sessions: SelectedSession[]): string {
  const list = sessions.filter((s) => s.name || s.time);
  if (!list.length) return "";
  const line = (s: SelectedSession) =>
    s.name && s.time ? `${s.name} — ${s.time}` : s.name || s.time;
  if (list.length === 1) return `Session: ${line(list[0])}`;
  return `Sessions:\n${list.map((s) => `• ${line(s)}`).join("\n")}`;
}

// Normalises a raw phone string into a wa.me-compatible international number.
// Indian 10-digit numbers (the common case in the registration form) get the
// 91 country code; anything already carrying a country code is left as-is.
function normalizeWaNumber(raw: unknown): string {
  let digits = String(raw ?? "").replace(/[^\d]/g, "");
  if (!digits) return "";
  digits = digits.replace(/^0+/, "");
  if (digits.length === 10) digits = `91${digits}`;
  return digits.length >= 11 ? digits : "";
}

// Builds the wa.me deep link addressed to the registered student's mobile
// number, pre-filled with the admin-configured confirmation template and the
// registration/ticket details. Used once a registration has been approved.
//
// TO   → the contact/WhatsApp number the student entered in the registration
//        form (`enr.phone`). Never falls back to the business number, so a
//        confirmation is never mis-delivered to the studio itself.
// FROM → the WhatsApp sender number is the logged-in admin's profile phone
//        number (passed in as `senderWhatsapp`). It is never hardcoded and
//        never the student's own number. wa.me sends from the WhatsApp account
//        signed in on the admin's device, so this number is also what the
//        student sees as the support/reply contact.
export function buildWaUrl(
  enr: any,
  ticket: string | null,
  template: string,
  senderWhatsapp: string,
): string | null {
  if (!enr) return null;
  const waNumber = normalizeWaNumber(enr.phone);
  if (!waNumber) return null;
  const supportNumber = String(senderWhatsapp ?? "").trim();

  const verifyUrl = ticket && typeof window !== "undefined"
    ? `${window.location.origin}/verify?code=${encodeURIComponent(ticket)}`
    : "";
  const qrImageUrl = verifyUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=20&data=${encodeURIComponent(verifyUrl)}`
    : "";

  // Resolve the participant's actually-selected class/session(s) from the
  // Admin-configured schedule so the confirmation only mentions what they
  // booked — timings come from the selected session, never hardcoded.
  const sessions = getSelectedSessions(enr);
  const sessionDetails = renderSessionDetails(sessions);
  const sessionNames = sessions.map((s) => s.name).filter(Boolean).join(" & ");
  const sessionTimings = sessions.map((s) => s.time).filter(Boolean).join(" & ");

  const activeTemplate = template || DEFAULT_WHATSAPP_TEMPLATE;
  let message = renderWhatsappTemplate(activeTemplate, {
    StudentName: enr.full_name || "there",
    WorkshopName: enr.program?.name || "the workshop",
    RegistrationId: ticket || enr.id || "",
    PaymentStatus: "Verified",
    WorkshopDate: enr.program?.event_date ? new Date(enr.program.event_date).toDateString() : "",
    WorkshopTime: enr.program?.event_time ? formatSessionTime(enr.program.event_time) : "",
    Venue: enr.program?.venue || "",
    InstructorName: "Tejas D Dhoke",
    SupportContact: supportNumber,
    CustomInstructions: "",
    QRCodeUrl: qrImageUrl,
    TicketUrl: verifyUrl,
    SessionDetails: sessionDetails,
    SessionName: sessionNames,
    SessionTiming: sessionTimings,
  });

  // Older admin-saved templates predate the session placeholders — append the
  // session block so the participant still gets their selected class + timing.
  if (sessionDetails && !activeTemplate.includes("{{Session")) {
    message = `${message}\n\n${sessionDetails}`;
  }

  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
}


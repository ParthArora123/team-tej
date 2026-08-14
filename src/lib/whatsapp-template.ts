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
] as const;

export type WhatsappPlaceholder = (typeof WHATSAPP_PLACEHOLDERS)[number];

export const DEFAULT_WHATSAPP_TEMPLATE = `🎉 Hi {{StudentName}},

✅ Your payment has been verified.
✅ Your seat has been confirmed.

Workshop: {{WorkshopName}}
Date: {{WorkshopDate}}
Time: {{WorkshopTime}}
Venue: {{Venue}}

🎫 Ticket ID: {{RegistrationId}}
Payment: {{PaymentStatus}}

Your Workshop Entry QR Code (tap to view / save the image):
{{QRCodeUrl}}

🔍 Present this QR code to the Workshop Manager at the venue — they will scan it during check-in.

{{CustomInstructions}}

For any help, reach out on {{SupportContact}}.

– {{InstructorName}}`;

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
// FROM → the WhatsApp sender number configured by the admin in the WhatsApp
//        message settings (passed in as `senderWhatsapp`). It is never
//        hardcoded and never the student's own number. wa.me sends from the
//        WhatsApp account signed in on the admin's device, so this number is
//        also what the student sees as the support/reply contact.
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
  const message = renderWhatsappTemplate(template || DEFAULT_WHATSAPP_TEMPLATE, {
    StudentName: enr.full_name || "there",
    WorkshopName: enr.program?.name || "the workshop",
    RegistrationId: ticket || enr.id || "",
    PaymentStatus: "Verified",
    WorkshopDate: enr.program?.event_date ? new Date(enr.program.event_date).toDateString() : "",
    WorkshopTime: enr.program?.event_time || "",
    Venue: enr.program?.venue || "",
    InstructorName: "Tejas D Dhoke",
    SupportContact: supportNumber,
    CustomInstructions: "",
    QRCodeUrl: qrImageUrl,
    TicketUrl: verifyUrl,
  });
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
}


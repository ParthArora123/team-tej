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

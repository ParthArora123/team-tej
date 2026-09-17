# External Link Registration Option

## What will change
- Replace the current WhatsApp checkbox with three clear registration choices: **Online**, **WhatsApp**, and **External Link**.
- Show the WhatsApp number field only when WhatsApp is selected.
- Show the Registration Redirect URL field only when External Link is selected.
- Existing workshops with a saved redirect URL will automatically open with External Link selected when edited.
- Keep Register Now behavior unchanged: external links open directly in the same tab; WhatsApp opens WhatsApp; Online uses the current registration and payment flow.

## Safeguards
- The external link remains optional and accepts only `http://` or `https://` URLs.
- No database, payment, participant, QR, pricing, or workshop listing behavior will change.

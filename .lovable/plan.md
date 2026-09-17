# Optional workshop registration redirect

## What will change
- Add an optional **Registration Redirect URL** input to the existing Add/Edit Workshop form, with the requested helper text and saved-value editing support.
- Validate the field in the form and again when saving; only complete `http://` or `https://` URLs will be accepted. Clearing it will save `null` and restore the current registration flow.
- Store the value on each workshop and expose it only through the existing public workshop catalogue data.
- Make every user-facing workshop registration button use the same rule:
  - saved redirect URL: navigate there in the same tab;
  - no redirect URL: keep the existing online or WhatsApp registration behavior unchanged.
- Remove any workshop-ID-specific redirect code if present; the saved workshop setting becomes the only external redirect override.

## Technical details
- Add nullable `registration_redirect_url text` to the existing workshop records through a database migration, and update the existing public workshop view to include it.
- Extend the existing admin save validation, Add/Edit form state, workshop list query, public catalogue projection, and fallback handling.
- Apply the override to registration actions on the homepage workshop cards, reusable programme cards, online-training cards where applicable, and the workshop detail page, without changing payment, participant, approval, schedule, pricing, Silver Seat, or WhatsApp logic.
- Preserve the current form layout and responsive styling; the new field will live in the Registration section.

## Verification
- Confirm an empty value creates/updates a workshop normally and opens the current internal registration flow.
- Confirm invalid or non-HTTP(S) values are rejected without saving.
- Confirm a saved URL reappears during edit and Register Now navigates in the same tab without opening internal registration.
- Confirm clearing the saved URL restores the existing flow, then check desktop/mobile rendering and the latest build status.

# Frontend-only workshop redirect URL

## What will change
- Add an optional **Registration Redirect URL** input to both Add Workshop and Edit Workshop.
- Validate that any entered value is a complete `http://` or `https://` URL.
- Keep each workshop URL in that admin browser only, keyed by the workshop ID.
- When **Register Now** is clicked in the same browser, open the saved URL; otherwise preserve the existing WhatsApp or online registration flow.

## Technical details
- Strip the frontend-only value from the workshop save payload so it never reaches the backend.
- Do not add migrations, database fields, or query columns.
- Preserve all current registration, payment, WhatsApp, participant, email, and approval behavior.
- Because the value is browser-only, it will not sync to other browsers, devices, or visitors.

## Verification
- Check create and edit forms, valid and invalid URL handling, redirect behavior, empty-field fallback, and the existing app build.

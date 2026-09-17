# Optional Workshop Registration Redirect

## Goal
Add an optional external registration URL to Add/Edit Workshop. Workshops without a URL keep every part of the current internal registration flow.

## Changes
- Add an optional `Registration Redirect URL` field to the existing Registration section, prefilled during edits and cleared to `null` when blank.
- Validate the field in both the form and the protected save action, accepting only complete `http://` or `https://` URLs.
- Add the field to the existing save payload and admin workshop query without replacing any current fields.
- Include the existing nullable field in public workshop catalogue reads while preserving ordering and past/upcoming filtering.
- On homepage workshop cards and the workshop detail page, check the redirect first. If present, open it in the same tab before any dialog, WhatsApp, payment, or participant flow starts.
- Preserve current behavior exactly when no redirect is configured.

## Data Safety
- The nullable database column and public view exposure already exist, so no table migration or existing-record update is needed.
- Existing workshops remain unchanged and resolve the field as `null`.

## Verification
- Confirm blank, valid HTTPS, and invalid-protocol form behavior.
- Confirm homepage and detail-page registration redirects use the same tab.
- Confirm workshops without a redirect still use the existing internal registration flow.
- Check the preview build and relevant mobile/desktop interactions.

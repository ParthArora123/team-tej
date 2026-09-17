# Fix Workshop Creation and Existing Workshop Access

## Changes
- Make the optional registration redirect fully backward-compatible so blank values never affect existing workshops.
- Fix the Add Workshop defaults and validation so optional “Both Workshops” fields cannot block a normal workshop save.
- Preserve all current registration, payment, WhatsApp, participant, schedule, and approval behavior.
- Keep published workshops visible in the workshop list and detail pages, including existing records without a redirect URL.

## Verification
- Create a normal workshop with no redirect URL and confirm it appears immediately.
- Open existing workshop links and confirm their details still load.
- Test a workshop with a valid redirect URL and confirm only that workshop redirects.
- Check desktop/mobile workshop pages and the final build status.

## Technical details
- Normalize the redirect field to `null` only at save time.
- Use cumulative catalogue fallbacks for older database/view shapes instead of retrying one missing field at a time.
- Remove unintended default activation of optional bundle settings for newly created workshops.

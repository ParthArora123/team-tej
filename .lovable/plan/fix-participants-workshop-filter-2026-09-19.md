# Fix Participants workshop filter

## Changes
- Build the Participants workshop dropdown from the complete Admin workshop list, not only workshops that already have registrations.
- Filter participant rows by workshop ID so duplicate workshop titles cannot cause incorrect matches.
- Keep the existing status, song, Silver Seat, search, export, and participant behavior unchanged.

## Verification
- Confirm a newly added workshop appears before it has registrations.
- Confirm selecting a workshop immediately filters participant rows and song choices correctly.
- Check the preview build for errors.

# Move the "Latest Reels" video collage below the hero portrait

## Goal
The cinematic video collage should appear immediately after the main Tejas hero photo on the homepage, instead of further down the page.

## Current state
The collage block was just removed from its old position further down `src/routes/index.tsx` (it previously sat between the Founder section and the Gallery). The hero (`CinematicHero`) renders near the top, followed by the Stats section.

## Change
Re-insert the "Latest Reels" section in `src/routes/index.tsx` directly after `<CinematicHero ... />` and before the Stats section:

- Heading block: "Latest Reels" eyebrow + "Straight from the feed." title + supporting line.
- `<VideoCollage items={reels.map(...)} />` with the same 10s spotlight rotation and manual lightbox behavior.
- Rendered only when `reels.length > 0`.
- Keep spacing/border styling consistent with neighbouring sections.

No other sections, data loading, or component behavior changes.

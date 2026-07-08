## Workshop admin enhancements — plan

Three new capabilities in the admin portal, wired to the /workshops page.

### 1. Workshop Hero Carousel (new)

- New table `workshop_hero_slides` — separate from the existing homepage `hero_slides` so nothing on the home page changes.
- Each slide: media (image / video / GIF), title, subtitle, description, CTA text, CTA link, sort order, active toggle, optional start & end dates.
- Admin UI: new "Workshop Hero" tab in the admin portal with add / edit / delete, drag-and-drop reordering (arrow buttons + drag handle), preview thumbnail, active toggle, date range pickers.
- Frontend: new hero carousel at the top of `/workshops`, auto-advancing every 6s, fade transition, keyboard + swipe navigation, respects active flag and date window. Videos autoplay muted + loop + `playsInline`. Uses existing `poster` while loading.

### 2. Per-workshop banner (video / image / GIF)

- Extend existing `programs` table with three optional columns: `banner_video_url`, `banner_video_path`, `banner_gif_url` (the current `banner_url` becomes the image fallback — no data migration needed).
- Admin workshop dialog gains a "Banner media" section with three uploaders (image / video / GIF). Video uploader accepts up to 500 MB, MP4 / WebM / MOV.
- Selection order at render time: video → GIF → image → nothing.
- `/workshops` cards render the chosen banner: `<video>` with `preload="metadata"`, `autoPlay muted loop playsInline`, poster set to the image if present so the card never shows a blank frame while loading.

### 3. Per-workshop media gallery (new)

- New table `workshop_media` (workshop_id fk, kind image|video|gif, url, path, sort_order, caption). Deleting a workshop cascades.
- Admin gets a "Media" panel inside each workshop's edit dialog: multi-upload, thumbnail grid, reorder (drag/arrows), delete, replace, live preview before saving.
- Frontend workshop detail block on `/workshops` shows the gallery as a lazy-loaded strip below the card; clicking opens a lightbox (existing motion). Videos in the strip lazy-load with a play overlay and only start on user click; the muted autoplay is limited to the banner slot to preserve performance.

### Storage

- Reuse existing private `workshop-images` bucket for images/GIFs.
- Create a new private `workshop-videos` bucket for videos (500 MB per object, mp4/webm/mov). Signed URLs at read time via existing helpers.
- All image uploads run through `src/lib/compress-image.ts` (already in place). Videos are not re-encoded client-side (would be too slow / lossy in-browser); we serve them with `preload="metadata"` and byte-range playback so only the initial fragment loads until the user hits play.

### Server functions (new / edited)

- `src/lib/workshop-hero.functions.ts` — `listPublicWorkshopHero`, `adminListWorkshopHero`, `adminSaveWorkshopHero`, `adminDeleteWorkshopHero`, `adminReorderWorkshopHero`, `adminUploadWorkshopHeroMedia`.
- `src/lib/workshop-media.functions.ts` — same shape for gallery items.
- Extend `catalog.functions.ts` / `admin` workshop functions to persist the three new banner columns and return signed URLs.
- Admin-only calls guarded via `requireSupabaseAuth` + `has_role('admin')`.

### RLS

- `workshop_hero_slides` and `workshop_media`: public SELECT for rows where `active = true` (and, for hero, within date window); admin full access via `has_role`.
- `GRANT` blocks in the same migration for `anon`, `authenticated`, `service_role`.

### Frontend polish

- Carousel: motion fade + subtle Ken-Burns zoom on images, magnetic CTA button (reuses `MagneticButton`).
- All media lazy-loaded (`loading="lazy"` on `<img>`, `preload="metadata"` on `<video>`, IntersectionObserver-gated play).
- Skeleton placeholder while media loads.
- `prefers-reduced-motion` disables autoplay + auto-advance.

### Out of scope (call out)

- Server-side video transcoding / automatic thumbnail extraction from uploaded videos requires a Node/ffmpeg host — the Cloudflare Worker runtime that hosts server functions does not support it (see server-runtime constraints). Workaround built into the UI: the admin can optionally upload a poster image beside each video slide; if none is provided we render the workshop's existing banner image as the poster. If you want true auto-thumbnail extraction, we'd add an external worker (e.g. Cloudflare Stream) as a follow-up.

### Files touched (technical)

- **Migrations**: create `workshop_hero_slides`, `workshop_media`; add three columns to `programs`; create `workshop-videos` bucket + storage policies.
- **New server fns**: `src/lib/workshop-hero.functions.ts`, `src/lib/workshop-media.functions.ts`.
- **Edited server fns**: `src/lib/catalog.functions.ts` (banner columns), `src/lib/enrollment.functions.ts` (unchanged, referenced only), admin save/list in `admin.tsx`.
- **Admin UI**: new `WorkshopHeroTab` component, extend `WorkshopsTab` dialog with banner-media + gallery sections in `src/routes/_authenticated/admin.tsx`.
- **Public UI**: `src/routes/workshops.tsx` — mount hero carousel, upgrade banner rendering, add gallery strip + lightbox.

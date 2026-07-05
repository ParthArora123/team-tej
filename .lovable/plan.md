
This is a large multi-part update. I'll break it into phases so we agree on scope before I write code. All existing sections/functionality not listed here stay intact.

## Phase 1 — Backend & Admin foundations
New DB tables + admin CRUD:
- `hero_slides` — up to 5 images, `sort_order`, `active`. Admin tab: upload/replace/delete/reorder.
- `featured_experience` — single active row (title, banner, description, city, dates, day_schedule JSON, cta_text, cta_link, active). Admin tab enforces one-active.
- `gallery_items` — for "Feel The Room" (image or short video, caption, sort). Admin tab.
- Storage bucket `hero-images`, `gallery` (private + signed URLs like `workshop-images`).
- Server functions: `listHeroSlides`, `getFeaturedExperience`, `listGalleryItems` (public reads via `programs_public`-style pattern).

## Phase 2 — Workshop form + backend
- Remove `age` and `medical_history` from `EnrollDialog` UI + `createEnrollment` validator. Existing DB columns left as-is (nullable) so history is preserved.
- Add `skill_level` (text) and `dance_style` (already `style`) surfaced on cards.
- Auto-hide expired workshops from public `listPrograms` (`event_date < today` OR `event_date is null` shown). Admin still sees all.
- Workshop card gets: Register, Get Details (opens modal or program page), WhatsApp button (uses admin phone from `app_settings`), Instagram DM button (admin IG handle from `app_settings`).

## Phase 3 — Homepage rebuild (`src/routes/index.tsx`)
Rewrite in this order, keeping the 3 preserved sections (Movers, On Stage, India→Globe) untouched:
1. Hero — dynamic next-event overlay + background carousel (fade, arrows, dots, autoplay 5s) driven by `hero_slides`. Buttons: "Join Next Workshop", "View All Upcoming Events". Swap the "Movement Unscripted" CTA order (Register a Workshop first, Classes second).
2. Upcoming Workshops & Events — rich cards (banner, name, city, date, venue, style, level, description, 4 buttons).
3. Featured Experience of the Month — from `featured_experience`, fallback to next premium upcoming program.
4. What We Do — 4 cards linking to /workshops, /experiences (or existing), /nritya-sadhana, /online-trainings.
5. Feel The Room — masonry gallery from `gallery_items`.
6. Preserved: We Train Movers.
7. Nritya Sadhana Preview + CTA.
8. Preserved: On Stage With The Best.
9. Learn Online With Tej — 5 items list + CTA.
10. The Tej Method — short block + CTA.
11. Preserved: India To The Globe.
12. Stories From The Room — video + text stories (heading changed, not "Testimonials").
13. About Tej / Founder — replaces Team section site-wide: large image, founder bio, "Know The Journey" → `/about`.
14. Final CTA — "Come Dance With Us" + 3 buttons.

Hero headline/subheading updated to the specified copy.

## Phase 4 — Navigation, branding, uploads
- `Header.tsx`: hide "Nritya Sadhana" link (route stays).
- Global find/replace `Tejas Dhoke` → `Tejas D Dhoke` (routes, meta, footer, alt text). Route metadata updated.
- About page: remove Team grid + modal, keep Founder-only block.
- Testimonial video upload: raise client + server cap to 500 MB, add upload progress. Existing videos untouched.

## Technical notes
- Migrations create tables + GRANTs + RLS (`anon SELECT` on hero/featured/gallery; admin write via `has_role`). Storage RLS mirrors `workshop-images`.
- All admin writes go through `createServerFn` with `requireSupabaseAuth` + admin role check.
- Homepage reads use public server fns to keep SSR simple.
- No changes to `programs_public` view schema — expiry filter applied at query time.
- Video upload progress needs `XMLHttpRequest` to `supabase.storage` signed upload URL (server issues URL via admin fn) so we can report progress.

## Out of scope / assumptions
- I'll add sensible placeholder copy for The Tej Method / Learn Online items — you can edit later; no separate CMS for them unless you want it.
- "Get Details" opens a modal with the workshop's full description (no new route) unless you'd prefer a `/workshops/$id` page.
- WhatsApp/Instagram handles come from `app_settings` (`whatsapp_number`, `instagram_handle`) — I'll add fields to the admin Settings tab.

This is roughly a full-day scope. Confirm and I'll ship it, or tell me which phases to do first (I'd suggest 2 + 4 first since they're quick wins, then 1 + 3).

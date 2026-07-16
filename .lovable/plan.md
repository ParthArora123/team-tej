# Complete Website Redesign — Phased Plan

This is a UI/UX-only redesign. Zero functional, routing, DB, API, auth, or business-logic changes. Every form field, submit handler, query, mutation, and integration (payments, QR, WhatsApp, admin CRUD) stays wired exactly as today — only the surrounding markup, tokens, motion, and layout change.

Given the size (30+ pages, admin, modals, forms), doing everything in one shot would produce a shallow, inconsistent result and risk regressions. I'll ship it in **6 focused phases**, each independently reviewable in the preview. You approve/tweak after each phase before I move on.

## Design Language (applied globally in Phase 1)

- **Palette**: Deep Midnight (#08090d base), Royal Purple (#6d28d9), Emerald (#059669), Warm Gold (#d4a24c), Electric Blue accent, soft white text. All via OKLCH tokens in `src/styles.css` — no hardcoded colors in components.
- **Typography**: DM Serif Display (headlines) + Fira Sans (body), already loaded. Tighten scale, add editorial display sizes.
- **Surfaces**: Glassmorphism (backdrop-blur + border-white/10 + subtle gradient), gradient borders, aurora glows, gold hairlines.
- **Motion**: Framer Motion reveals, magnetic CTAs, tilt cards, scroll parallax, smooth page transitions. Existing `FloatingWorldScene` backdrop stays.
- **Components**: Redesigned Button, Card, Input, Dialog, Dropdown, Table, Badge shadcn variants — same APIs, new visuals.

## Phases

**Phase 1 — Foundation (tokens + primitives + nav)**
- Refresh `src/styles.css` palette, gradients, shadows, glass utilities.
- Redesign shadcn primitives (button, input, card, dialog, dropdown, table, tabs, badge) — variants only, no API changes.
- Redesigned `Header` (floating glass navbar w/ animated active indicator, premium mobile drawer) and `Footer`.

**Phase 2 — Marketing pages**
- Homepage sections (below hero — stats, choreography, styles, testimonials, CTA).
- About, Contact (WhatsApp pill preserved), Testimonials.

**Phase 3 — Workshops flow**
- Workshops index (listing), Workshop detail (`workshops.$id`), Program list (Zero-to-Hero, Online Trainings, Nritya Sadhana).
- `EnrollDialog` redesign — same fields, same submit logic.

**Phase 4 — Payment & ticket flow**
- `pay.$enrollmentId`, dashboard QR ticket, verify page, success states.
- All UPI/QR/WhatsApp/screenshot upload logic untouched.

**Phase 5 — Auth & Admin**
- Auth page, `_authenticated/admin` shell, all CMS tabs (Workshop Hero, Media, Zero-to-Hero, Messages, Site Content), tables, forms, modals. Premium SaaS dashboard feel.

**Phase 6 — Edge states & polish**
- 404, loading skeletons, empty states, toasts, tooltips.
- Cross-page motion consistency pass, responsive audit (mobile/tablet/desktop), a11y sweep, perf check.

## Guardrails per phase

- Only JSX, className, tokens, and motion wrappers change. Handlers, hooks, queries, server functions, routes, and props stay identical.
- No file deletions. No route changes. No schema changes.
- Verify build after each phase; spot-check the affected flows in preview.

## Technical notes

- New/updated files will be scoped per phase (e.g. Phase 1 touches `styles.css`, `Header.tsx`, `Footer.tsx`, `src/components/ui/*`).
- Existing effects (`FloatingWorldScene`, `PremiumAmbient`, `CursorGlow`, `StageLights`, `AuroraBackground`) stay; I'll reconcile them so only one ambient layer runs per page for perf.
- All redesigns respect `prefers-reduced-motion` and stay 60fps on mobile.

---

**Shall I start with Phase 1 (foundation + nav)?** Once approved, I'll ship it and you can review in the preview before I move to Phase 2. If you'd rather I compress this into fewer/larger phases or reorder priorities (e.g. Admin first), tell me now.

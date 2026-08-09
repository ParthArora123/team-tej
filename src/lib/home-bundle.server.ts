// Server-side aggregator for the homepage.
//
// The homepage used to fire 13 separate server-function HTTP round-trips on
// mount (hero slides, programs, featured experience, celebrities, brands,
// globe, gallery, dance styles, choreographies, founder, testimonials,
// performances, signature programs). Each one paid full request overhead and
// re-created a Supabase client, and the browser could only run ~6 of them in
// parallel — so the last sections landed very late and every response caused
// another React commit.
//
// This module runs all of those reads in parallel *on the server* and returns
// them in a single payload, memoised for a short TTL per worker instance.
import { listPrograms } from "./catalog.functions";
import { listPublicCelebrities, listPublicBrands, listPublicGlobe } from "./content.functions";
import { listHeroSlides, getFeaturedExperience, listGalleryItems } from "./cms.functions";
import { listDanceStyles, getSiteContent } from "./site-content.functions";
import { listChoreographies } from "./choreographies.functions";
import { listPublicTestimonials } from "./testimonials.functions";
import { listPerformances, listSignaturePrograms } from "./home-sections.functions";

export type HomeBundle = {
  heroSlides: any[];
  heroPortrait: any;
  workshops: any[];
  featured: any;
  celebrities: any[];
  brands: any[];
  globe: any[];
  gallery: any[];
  danceStyles: any[];
  choreos: any[];
  founder: any;
  testimonials: any[];
  performances: any[];
  sigPrograms: any[];
};

const TTL_MS = 15_000;

/**
 * Homepage workshop ordering.
 *
 * `listPrograms` returns every published workshop newest-created first. Sorting
 * by creation date meant an older record that the admin later switched to
 * Published (or edited) stayed buried behind newer ones and got cut by the
 * display cap — so a genuinely published workshop never appeared on the home
 * page. Order by what the visitor cares about instead: soonest upcoming event
 * first, then undated entries, then past events, and keep the cap generous.
 */
function orderWorkshops(rows: any[]): any[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const t = (d: any) => (d ? new Date(d).getTime() : null);

  const rank = (r: any) => {
    const when = t(r.event_date);
    if (when == null) return 1; // undated — still eligible
    return when >= startOfToday.getTime() ? 0 : 2; // upcoming, then past
  };

  return [...rows].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    const da = t(a.event_date);
    const db = t(b.event_date);
    if (da != null && db != null && da !== db) return ra === 2 ? db - da : da - db;
    return (t(b.created_at) ?? 0) - (t(a.created_at) ?? 0);
  });
}
let cache: { at: number; promise: Promise<HomeBundle> } | undefined;

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return (await fn()) ?? fallback;
  } catch (error) {
    console.error("[home-bundle] section failed", error);
    return fallback;
  }
}

async function build(): Promise<HomeBundle> {
  const [
    heroSlides,
    heroPortrait,
    workshops,
    featured,
    celebrities,
    brands,
    globe,
    gallery,
    danceStyles,
    choreos,
    founder,
    testimonials,
    performances,
    sigPrograms,
  ] = await Promise.all([
    safe<any[]>(() => listHeroSlides() as any, []),
    safe<any>(() => getSiteContent({ data: { key: "hero_portrait" } }) as any, null),
    safe<any[]>(() => listPrograms({ data: { kind: "workshop" } }) as any, []),
    safe<any>(() => getFeaturedExperience() as any, null),
    safe<any[]>(() => listPublicCelebrities() as any, []),
    safe<any[]>(() => listPublicBrands() as any, []),
    safe<any[]>(() => listPublicGlobe() as any, []),
    safe<any[]>(() => listGalleryItems() as any, []),
    safe<any[]>(() => listDanceStyles() as any, []),
    safe<any[]>(() => listChoreographies() as any, []),
    safe<any>(() => getSiteContent({ data: { key: "founder" } }) as any, null),
    safe<any[]>(() => listPublicTestimonials() as any, []),
    safe<any[]>(() => listPerformances() as any, []),
    safe<any[]>(() => listSignaturePrograms() as any, []),
  ]);

  return {
    heroSlides,
    heroPortrait,
    workshops: orderWorkshops(workshops ?? []).slice(0, 12),
    featured,
    celebrities,
    brands,
    globe,
    gallery,
    danceStyles,
    choreos,
    founder,
    testimonials,
    performances,
    sigPrograms,
  };
}

export function getHomeBundleCached(): Promise<HomeBundle> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.promise;
  const promise = build().catch((error) => {
    cache = undefined;
    throw error;
  });
  cache = { at: now, promise };
  return promise;
}

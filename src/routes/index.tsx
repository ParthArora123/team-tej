import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { cachedCall } from "@/lib/public-data-cache";
import { CardSkeleton } from "@/components/site/Skeletons";
import { listPrograms } from "@/lib/catalog.functions";
import { listPublicCelebrities, listPublicBrands, listPublicGlobe } from "@/lib/content.functions";
import { listHeroSlides, getFeaturedExperience, listGalleryItems } from "@/lib/cms.functions";
import { listDanceStyles, getSiteContent } from "@/lib/site-content.functions";
import { listChoreographies } from "@/lib/choreographies.functions";
import { listPublicTestimonials } from "@/lib/testimonials.functions";
import { useServerFn } from "@tanstack/react-start";

import { ArrowUpRight, Sparkles, Calendar, MapPin, Play, Instagram, Youtube, Facebook, Twitter, Linkedin, HeartHandshake, Target, Music2, Users2, Rocket, Heart, Video, ChevronDown } from "lucide-react";

import heroImg from "@/assets/tejasdhoke.jpg";
import uploadedHeroImg from "@/assets/tejasdhoke-hero.webp.asset.json";
import classesImg from "@/assets/classes.jpg";

import { MotionImage } from "@/components/site/MotionImage";
import { MagneticButton } from "@/components/site/MagneticButton";
import { TiltCard } from "@/components/site/TiltCard";
import { StageLights } from "@/components/site/StageLights";
import { MouseParallax } from "@/components/site/MouseParallax";
import { EditorialHero } from "@/components/site/EditorialHero";
import { HorizontalPager } from "@/components/site/HorizontalPager";
import { Chapter } from "@/components/site/Chapter";

import { pauseHomepageVideo, playHomepageVideo } from "@/lib/home-video-playback";
import { LazySection } from "@/components/site/LazySection";

import { type HomeCard } from "@/components/site/HomeSectionCards";
import { listPerformances, listSignaturePrograms } from "@/lib/home-sections.functions";

// Below-the-fold, media-heavy sections are code-split and only fetched
// when the visitor scrolls near them.
const WorkshopDeck = lazy(() =>
  import("@/components/site/HomeDecks").then((m) => ({ default: m.WorkshopDeck }))
);
const CoverflowCarousel = lazy(() =>
  import("@/components/site/CoverflowCarousel").then((m) => ({ default: m.CoverflowCarousel }))
);
const MasonryGallery = lazy(() =>
  import("@/components/site/MasonryGallery").then((m) => ({ default: m.MasonryGallery }))
);
const FeaturedPerformances = lazy(() =>
  import("@/components/site/HomeSectionCards").then((m) => ({ default: m.FeaturedPerformances }))
);
const SignatureProgramsGrid = lazy(() =>
  import("@/components/site/HomeSectionCards").then((m) => ({ default: m.SignatureProgramsGrid }))
);








const defaultStyles = [
  { name: "Fusion", tagline: "Our signature blend." },
  { name: "Hip-Hop", tagline: "Bounce, groove, attitude." },
  { name: "Jazz", tagline: "Sharp lines, rhythm, and stage energy." },
  { name: "Contemporary", tagline: "Fluid, expressive, lyrical movement." },
  { name: "Semi-Classical", tagline: "Grace, mudras, and rooted expression." },
  { name: "Kathak", tagline: "Tatkar and storytelling." },
  { name: "Bollywood", tagline: "Built for the camera." },
];

const isVideoUrl = (u?: string | null) => !!u && /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u);

/** Smooth-scroll (and pager-jump) to a homepage section, with a page fallback. */
function goToHomeSection(id: string, fallbackHref: string) {
  if (typeof document === "undefined") return;
  if (window.location.pathname !== "/") {
    window.location.href = fallbackHref;
    return;
  }
  const target = document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  window.dispatchEvent(new CustomEvent("pager:goto", { detail: { id } }));
  if (!target) {
    window.setTimeout(() => {
      if (!document.getElementById(id)) window.location.href = fallbackHref;
    }, 700);
  }
}


type HeroSlide = {
  id?: string | null;
  image_url?: string | null;
  alt?: string | null;
  sort_order?: number | null;
};

type HomeLoaderData = {
  heroSlides: HeroSlide[];
};

const preloadLinkForHeroMedia = (src?: string | null) => {
  if (!src) return null;
  // Never preload video — hero clips load only once they become active.
  if (isVideoUrl(src)) return null;
  return { rel: "preload", as: "image", href: src, fetchpriority: "high" };
};



const preconnectLinkForHeroMedia = (src?: string | null) => {
  if (!src || src.startsWith("/")) return null;
  try {
    return { rel: "preconnect", href: new URL(src).origin, crossOrigin: "anonymous" };
  } catch {
    return null;
  }
};

function loadHomeData(): HomeLoaderData {
  // Never block the first homepage paint on remote carousel data.
  // The local hero image renders immediately; CMS slides hydrate after paint.
  return { heroSlides: [] };
}

function isSlowNetwork(): boolean {
  if (typeof navigator === "undefined") return false;
  const c: any = (navigator as any).connection;
  if (!c) return false;
  if (c.saveData) return true;
  const t = c.effectiveType as string | undefined;
  return t === "slow-2g" || t === "2g";
}

const warmedHeroMedia = new Set<string>();

function warmHeroMedia(slides: HeroSlide[], activeIndex: number, ahead = 2) {
  if (typeof window === "undefined" || slides.length < 2) return;
  if (isSlowNetwork()) return; // Respect data-saver / 2G — don't hog bandwidth.
  const n = slides.length;
  const targets: HeroSlide[] = [];
  for (let d = 1; d <= ahead; d++) {
    targets.push(slides[(activeIndex + d) % n]);
    targets.push(slides[(activeIndex - d + n) % n]);
  }
  for (const slide of targets) {
    const src = slide?.image_url;
    if (!src || warmedHeroMedia.has(src)) continue;
    warmedHeroMedia.add(src);
    // Videos are never pre-warmed; they load only when they become active.
    if (isVideoUrl(src)) continue;
    const img = new Image();
    img.decoding = "async";
    (img as any).fetchPriority = "low";
    img.src = src;
    img.decode?.().catch(() => {});
  }
}

function HeroSlideMedia({
  src,
  alt,
  active,
  priority = false,
  fallbackSrc,
  onReady,
}: {
  src?: string | null;
  alt?: string;
  active: boolean;
  priority?: boolean;
  fallbackSrc?: string;
  onReady?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readyNotifiedRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    readyNotifiedRef.current = false;
    setReady(false);
  }, [src]);

  const markReady = () => {
    if (readyNotifiedRef.current) return;
    readyNotifiedRef.current = true;
    onReady?.();
    setReady(true);
  };

  // Pause & release decoder when slide leaves view / becomes inactive.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      const raf = requestAnimationFrame(() => void playHomepageVideo(v));
      return () => cancelAnimationFrame(raf);
    } else {
      pauseHomepageVideo(v);
    }
    return () => pauseHomepageVideo(v);
  }, [active]);

  if (!src) return null;
  const common = "absolute inset-0 h-full w-full object-cover lg:object-contain transform-gpu backface-hidden";

  if (isVideoUrl(src)) {
    // For inactive video slides, render ONLY the poster image — keeps memory
    // low and avoids background decoding of hidden videos.
    if (!active) {
      return fallbackSrc ? (
        <img
          src={fallbackSrc}
          alt=""
          aria-hidden
          className={common}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          draggable={false}
        />
      ) : null;
    }
    return (
      <>
        {fallbackSrc && (
          <img
            src={fallbackSrc}
            alt=""
            aria-hidden
            className="blur-backdrop-wide opacity-80"
            draggable={false}
          />
        )}
        <video
          ref={videoRef}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={fallbackSrc}
          disableRemotePlayback
          disablePictureInPicture
          controls={false}
          onLoadedData={markReady}
          onCanPlay={markReady}
          className="absolute inset-0 h-full w-full object-contain transform-gpu backface-hidden"
          style={{ visibility: ready || !!fallbackSrc ? "visible" : "hidden" }}
        />
      </>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? ""}
      className={common}
      loading={priority || active ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : active ? "auto" : "low"}
      sizes="100vw"
      draggable={false}
      onLoad={markReady}
      onError={markReady}
      ref={(el) => {
        if (el && el.complete && el.naturalWidth > 0) markReady();
      }}
    />
  );

}





export const Route = createFileRoute("/")({
  loader: loadHomeData,
  head: ({ loaderData }) => {
    const firstHero = loaderData?.heroSlides?.[0]?.image_url || uploadedHeroImg.url;
    const preload = preloadLinkForHeroMedia(firstHero);
    const preconnect = preconnectLinkForHeroMedia(firstHero);
    return {
    meta: [
      { title: "Tejas D Dhoke — Fusion Dance Company" },
      {
        name: "description",
        content:
          "A fusion dance company shaping India's next generation of performers. Train, perform, transform.",
      },
      { property: "og:title", content: "Tejas D Dhoke — Fusion Dance Company" },
      {
        property: "og:description",
        content: "Train, perform, transform with Tejas D Dhoke.",
      },
    ],
    links: [preconnect, preload].filter(Boolean) as any,
  };
  },
  component: Index,
});

const stats: { value: number; suffix: string; label: string }[] = [
  { value: 100, suffix: "k+", label: "Dancers Trained" },
  { value: 300, suffix: "+", label: "Live Performances" },
  { value: 1000, suffix: "+", label: "Workshops" },
  { value: 16, suffix: "+", label: "Years of Experience" },
];

type Choreo = {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  video_url?: string | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
  uploaded_at: string;
};



/** Staggered CSS reveal — replaces the per-element Framer Motion runtime
 *  that used to ship (and tick) on the homepage. Pure compositor work. */
const revealDelay = (i: number) => ({ animationDelay: `${100 + i * 80}ms` });


function Index() {
  const loaderData = Route.useLoaderData() as HomeLoaderData;

  const [workshops, setWorkshops] = useState<any[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(loaderData.heroSlides ?? []);
  const [featured, setFeatured] = useState<any | null>(null);
  const [heroPhoto, setHeroPhoto] = useState<string | null>(null);

  // Every below-the-fold dataset lands in ONE state object. Previously each of
  // the ten fetches called its own setState, so the whole 5-screen homepage
  // tree re-rendered ten times in a row (the single biggest source of long
  // tasks + video re-mount flicker on mid/low-end phones).
  const [deferred, setDeferred] = useState<{
    celebrities: any[];
    brands: any[];
    globe: any[];
    gallery: any[];
    danceStyles: any[] | null;
    choreos: Choreo[];
    founder: any | null;
    testimonials: any[];
    performances: HomeCard[];
    sigPrograms: HomeCard[];
  }>({
    celebrities: [],
    brands: [],
    globe: [],
    gallery: [],
    danceStyles: null,
    choreos: [],
    founder: null,
    testimonials: [],
    performances: [],
    sigPrograms: [],
  });
  const {
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
  } = deferred;


  // Admin-managed homepage hero photo. The bundled portrait paints immediately
  // (it is preloaded in <head>); the CMS photo swaps in only once it has fully
  // decoded, so the hero is never blocked on a network round-trip.
  useEffect(() => {
    let cancelled = false;
    cachedCall("siteContent:hero_portrait", () => getSiteContent({ data: { key: "hero_portrait" } }))
      .then((r: any) => {
        const url = r?.image_url;
        if (!url || cancelled || url === uploadedHeroImg.url) return;
        const img = new Image();
        img.decoding = "async";
        const swap = () => { if (!cancelled) setHeroPhoto(url); };
        img.onload = swap;
        img.onerror = () => {};
        img.src = url;
        img.decode?.().then(swap).catch(() => {});
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const [slideIdx, setSlideIdx] = useState(0);
  const [heroReady, setHeroReady] = useState(false);
  const [warmSlides, setWarmSlides] = useState(false);
  const [showStageLights, setShowStageLights] = useState(false);
  const [workshopsLoaded, setWorkshopsLoaded] = useState(false);

  // Safety net: hero images cached before hydration never fire onLoad, so
  // ensure heroReady flips true shortly after mount even if the media
  // callback is missed. Without this, deferred sections (celebrities,
  // brands, gallery, choreographies, founder, etc.) never load.
  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 400);
    return () => clearTimeout(t);
  }, []);
  const fetchHeroSlides = useServerFn(listHeroSlides);
  const fetchPrograms = useServerFn(listPrograms);

  useEffect(() => {
    if (!heroReady) return;
    let cancelled = false;

    const hydrateSlides = () => {
      cachedCall("heroSlides", () => fetchHeroSlides())
        .then((rows: any) => {
          if (cancelled || !Array.isArray(rows) || rows.length === 0) return;
          const next = rows as HeroSlide[];
          const first = next[0]?.image_url;
          if (!first || isVideoUrl(first)) {
            setHeroSlides(next);
            return;
          }
          const img = new Image();
          img.decoding = "async";
          (img as any).fetchPriority = "high";
          img.onload = () => {
            if (!cancelled) setHeroSlides(next);
          };
          img.onerror = () => {
            if (!cancelled) setHeroSlides(next);
          };
          img.src = first;
          img.decode?.().then(() => {
            if (!cancelled) setHeroSlides(next);
          }).catch(() => {});
        })
        .catch(() => {});
    };

    const raf = requestAnimationFrame(() => setTimeout(hydrateSlides, 0));
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [fetchHeroSlides, heroReady]);
  useEffect(() => {
    if (!heroReady) return;

    // Highest priority — Upcoming Workshops is the #1 business section and
    // Featured Experience sits right below it. Fetch these immediately,
    // with no idle-callback wait at all, so they're never the reason a
    // visitor sees blank sections.
    cachedCall("programs:workshop", () => fetchPrograms({ data: { kind: "workshop" } }))
      .then((rows: any) => setWorkshops((rows ?? []).slice(0, 6)))
      .catch(() => setWorkshops([]))
      .finally(() => setWorkshopsLoaded(true));
    cachedCall("featuredExperience", () => getFeaturedExperience()).then((r: any) => setFeatured(r)).catch(() => setFeatured(null));

    // Everything else — still non-blocking, but the previous 1800ms idle
    // timeout meant browsers under any load could legitimately wait nearly
    // 2 full seconds before even starting these fetches. Capped much lower
    // now so it fires almost immediately in practice while still yielding
    // to the very first paint.
    const loadDeferred = () => {
      // Results are accumulated and committed in a single rAF-scheduled
      // setState, so ten network responses cost one render, not ten.
      let pending: Record<string, unknown> | null = null;
      let frame = 0;
      const commit = (patch: Record<string, unknown>) => {
        pending = { ...(pending ?? {}), ...patch };
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const next = pending;
          pending = null;
          if (next) setDeferred((prev) => ({ ...prev, ...next }));
        });
      };
      const load = (key: string, field: string, fn: () => Promise<any>, empty: any) =>
        cachedCall(key, fn)
          .then((r: any) => commit({ [field]: r ?? empty }))
          .catch(() => commit({ [field]: empty }));

      load("celebrities", "celebrities", () => listPublicCelebrities(), []);
      load("brands", "brands", () => listPublicBrands(), []);
      load("globe", "globe", () => listPublicGlobe(), []);
      load("gallery", "gallery", () => listGalleryItems(), []);
      load("danceStyles", "danceStyles", () => listDanceStyles(), []);
      load("choreographies", "choreos", () => listChoreographies(), []);
      load("siteContent:founder", "founder", () => getSiteContent({ data: { key: "founder" } }), null);
      load("testimonials", "testimonials", () => listPublicTestimonials(), []);
      load("homePerformances", "performances", () => listPerformances(), []);
      load("signaturePrograms", "sigPrograms", () => listSignaturePrograms(), []);
    };

    const ric: any = (window as any).requestIdleCallback;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;
    if (typeof ric === "function") idleId = ric(loadDeferred, { timeout: 200 });
    else timeout = setTimeout(loadDeferred, 100);
    return () => {
      if (timeout) clearTimeout(timeout);
      if (typeof (window as any).cancelIdleCallback === "function" && idleId) {
        (window as any).cancelIdleCallback(idleId);
      }
    };
  }, [fetchPrograms, heroReady]);

  useEffect(() => {
    if (!heroReady) return;
    const enableWarmup = () => {
      setWarmSlides(true);
      warmHeroMedia(heroSlides, slideIdx);
      setShowStageLights(true);
    };
    const ric: any = (window as any).requestIdleCallback;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;
    if (typeof ric === "function") idleId = ric(enableWarmup, { timeout: 300 });
    else timeout = setTimeout(enableWarmup, 150);
    return () => {
      if (timeout) clearTimeout(timeout);
      if (typeof (window as any).cancelIdleCallback === "function" && idleId) {
        (window as any).cancelIdleCallback(idleId);
      }
    };
  }, [heroReady, heroSlides, slideIdx]);



  // Admin-uploaded hero media that are videos become the cinematic montage.
  const heroClips = useMemo(
    () => heroSlides.map((s) => s.image_url).filter((u): u is string => isVideoUrl(u)),
    [heroSlides]
  );

  const heroSectionRef = useRef<HTMLElement>(null);
  const [heroVisible, setHeroVisible] = useState(true);

  // Homepage keeps the original light editorial palette.
  useEffect(() => {
    document.documentElement.classList.remove("cine-home");
  }, []);


  useEffect(() => {
    const el = heroSectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!heroReady || heroSlides.length < 2 || !heroVisible) return;
    const t = setInterval(() => {
      requestAnimationFrame(() => setSlideIdx((i) => (i + 1) % heroSlides.length));
    }, 5000);
    return () => clearInterval(t);
  }, [heroReady, heroSlides.length, heroVisible]);

  // Soonest upcoming workshop — fully dynamic, sourced from whatever the
  // admin has entered for event_date / capacity / seats_taken. No hardcoded
  // dates or seat counts anywhere in the hero.
  const nextWorkshop = useMemo(() => {
    const upcoming = workshops
      .filter((w) => w.event_date && new Date(w.event_date) >= new Date(new Date().toDateString()))
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    const w = upcoming[0];
    if (!w) return null;
    return {
      id: w.id,
      dateLabel: new Date(w.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "long" }),
    };
  }, [workshops]);

  const heroBadges = useMemo(
    () => [
      { value: "1000+", label: "Workshops" },
      { value: "100k+", label: "Dancers Trained" },
      { value: "300+", label: "Live Performances" },
      { value: "16+", label: "Years on Stage" },
    ],
    [],
  );





  return (
    <>

      {/* Sticky mobile CTA */}
      <Link
        to="/workshops"
        className="md:hidden fixed bottom-5 inset-x-5 z-40 flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold py-3.5 shadow-[0_10px_40px_-10px_color-mix(in_oklab,var(--accent-gold)_30%,transparent)]"
      >
        <Sparkles size={16} /> Register for a Workshop
      </Link>

      <HorizontalPager>
      {/* HERO — Cinematic split-screen: portrait carousel + editorial intro */}

      <Chapter index={1} total={5} bleed>
        <EditorialHero
          founder={founder}
          workshops={workshops}
          image={heroPhoto ?? uploadedHeroImg.url}
          clips={heroClips}
          badges={heroBadges}
          onReady={() => setHeroReady(true)}
          onExplore={() => goToHomeSection("workshops", "/workshops")}
          onWatch={() => goToHomeSection("showcase", "/#showcase")}
        />
      </Chapter>

      {/* SCREEN 2 — Viral Choreographies + Register & Book Your Experience */}
      <Chapter index={2} total={5} kicker="Start Moving — Book Your Experience">
        <CinematicShowreel choreos={choreos} workshops={workshops} />

        {/* Upcoming Workshops — merged into the same cinematic section */}
        <section id="workshops" className="max-w-7xl mx-auto px-6 lg:px-10 pt-2 pb-10 lg:pt-4 lg:pb-16">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary inline-flex items-center gap-1.5">
                <Calendar size={12} /> Start Moving
              </p>
              <h2 className="mt-2 font-display text-2xl lg:text-4xl font-bold leading-[1.02] text-balance">
                Upcoming <span className="italic font-light">Workshops.</span>
              </h2>
              <p className="mt-3 hidden sm:block text-muted-foreground max-w-xl">
                Live intensives with Tejas D Dhoke — seats fill fast. Grab yours before they're gone.
              </p>
            </div>
            <Link to="/workshops" className="inline-flex items-center gap-2 text-sm text-primary hover:gap-3 transition-all">
              See all workshops <ArrowUpRight size={14} />
            </Link>
          </div>

          {workshops.length === 0 && !workshopsLoaded ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }, (_, i) => <CardSkeleton key={`sk-${i}`} />)}
            </div>
          ) : workshops.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl py-16 text-center text-muted-foreground">
              <p className="font-display text-2xl">Coming Soon</p>
              <p className="mt-2 text-sm">New workshops drop every month — check back soon.</p>
            </div>
          ) : (
            <LazySection minHeight={520}>
              <WorkshopDeck workshops={workshops} />
            </LazySection>
          )}
        </section>






      {/* FINAL CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-6 lg:py-10">
        <div
          className="reveal-up relative overflow-hidden rounded-[2.5rem] border border-border/60 p-8 lg:p-14 text-center"
          style={{ background: "var(--gradient-jet)" }}
        >
          {/* Floating orbs — CSS-driven (compositor only). Framer's rAF loops
              kept ticking even while this slide was hidden. */}
          <div
            aria-hidden
            className="absolute top-10 left-10 h-40 w-40 rounded-full blur-3xl opacity-40 transform-gpu animate-[cta-orb-a_8s_ease-in-out_infinite] motion-reduce:animate-none"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)" }}
          />
          <div
            aria-hidden
            className="absolute bottom-10 right-10 h-56 w-56 rounded-full blur-3xl opacity-30 transform-gpu animate-[cta-orb-b_10s_ease-in-out_infinite] motion-reduce:animate-none"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.28) 0%, transparent 70%)" }}
          />
          <div
            aria-hidden
            className="absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full border border-white/20 transform-gpu animate-[cta-orb-spin_60s_linear_infinite] motion-reduce:animate-none"
          />


          <p className="relative text-xs uppercase tracking-[0.4em] text-alabaster/80">The stage is set</p>
          <h2 className="relative mt-3 font-display text-3xl lg:text-6xl font-bold text-alabaster text-balance leading-[1.02]">
            Your journey <span className="italic font-light text-alabaster/80">begins now.</span>
          </h2>
          <p className="relative mt-5 text-alabaster/80 max-w-xl mx-auto text-base lg:text-lg">
            Step in. Move freely. Leave transformed.
          </p>

          <div className="relative mt-7 flex justify-center">
            <MagneticButton strength={0.5}>
              <a
                href="/zero-to-hero"
                onClick={(e) => {
                  e.preventDefault();
                  const go = () => window.location.assign("/zero-to-hero");
                  try {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    setTimeout(go, 350);
                  } catch { go(); }
                }}
                className="group relative inline-flex items-center gap-3 px-9 py-5 rounded-full font-medium text-base lg:text-lg text-alabaster bg-alabaster/10 backdrop-blur-sm border border-alabaster/25 overflow-hidden hover:bg-alabaster/20 transition-colors"
                style={{
                  boxShadow: "0 24px 70px -22px color-mix(in oklab, var(--accent-gold) 30%, transparent)",
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Your Dance Journey
                  <ArrowUpRight size={20} className="group-hover:rotate-45 transition-transform" />
                </span>
                <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-out bg-gradient-to-r from-transparent via-alabaster/40 to-transparent" />
              </a>
            </MagneticButton>
          </div>

          <p className="relative mt-5 text-sm text-alabaster/70">
            Not ready to register today?{" "}
            <Link to="/contact" className="text-alabaster font-medium underline underline-offset-4 hover:text-alabaster/80 transition-colors">
              Get in touch and we'll notify you about the next batch
            </Link>.
          </p>

        </div>
      </section>
      </Chapter>

      {/* SCREEN 3 — Mindset & Movement (How We Teach) */}
      <Chapter index={3} total={5} kicker="How We Teach — Mindset & Movement">
      <section id="method" className="max-w-7xl mx-auto px-6 lg:px-10 pt-7 pb-5 lg:pt-10 lg:pb-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest df-gradient-text font-bold">How We Teach</p>
          <h2 className="mt-2 font-display text-2xl lg:text-4xl font-bold uppercase tracking-wide leading-[1.05]">
            Mindset &amp; <span className="df-gradient-text">Movement</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            A 4-pillar learning system designed to help absolute beginners and seasoned dancers express, grow, and feel alive.
          </p>
        </div>

        {/* Progression banner */}
        <div className="reveal-up ed-card mt-6 p-5 lg:p-6">
          <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-5">
            {["Come move with us", "Come express with us", "Come grow with us"].map((step, i) => (
              <div key={step} className="flex items-center gap-3 lg:gap-5">
                <div className="ed-pill flex items-center gap-2 text-sm font-semibold">
                  <span className="font-display df-gradient-text tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  {step}
                </div>
                {i < 2 && <span aria-hidden className="text-muted-foreground">&rarr;</span>}
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-sm lg:text-base italic text-muted-foreground max-w-3xl mx-auto">
            “You do not have to be perfect. You do not have to be trained. You do not have to know everything. You just have to begin.”
          </p>
        </div>

        {/* 4 pillars */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
          {[
            { icon: Target, title: "1. Technique", desc: "Mastering posture, footwork, core balance, and body mechanics for effortless execution.", tone: "var(--df-1)" },
            { icon: Heart, title: "2. Expression", desc: "Connecting emotion to motion, bringing authenticity and storytelling to every choreography.", tone: "var(--df-2)" },
            { icon: Music2, title: "3. Musicality", desc: "Deepening rhythm control, tempo changes, and beat timing across diverse global sounds.", tone: "var(--df-3)" },
            { icon: Users2, title: "4. Stage Presence", desc: "Building commanding charisma, spatial control, and authentic connection with audiences.", tone: "var(--df-5)" },
          ].map((p, pi) => (
            <div key={p.title} className="reveal-up" style={revealDelay(pi)}>
              <div className="group relative block h-full ed-card p-4 lg:p-6 overflow-hidden transition-transform duration-300 hover:-translate-y-1">
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
                  style={{ background: `linear-gradient(90deg, ${p.tone}, transparent)` }}
                />
                <div
                  className="relative h-11 w-11 rounded-xl flex items-center justify-center"
                  style={{
                    background: `color-mix(in oklab, ${p.tone} 12%, transparent)`,
                    color: p.tone,
                    border: `1px solid color-mix(in oklab, ${p.tone} 28%, transparent)`,
                  }}
                >
                  <p.icon size={20} />
                </div>
                <p className="relative mt-4 font-display text-lg lg:text-xl font-bold">{p.title}</p>
                <p className="relative mt-2 hidden sm:block text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}

        </div>

        {/* Designed for */}
        <div className="reveal-up ed-card mt-6 p-4 lg:p-5 flex flex-wrap items-center gap-3 lg:gap-5">
          <div className="min-w-[9rem]">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Designed for</p>
            <p className="font-display text-base font-bold">Who benefits most?</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["🌱 Complete Beginners", "🎭 Actors & Performers", "🎥 Content Creators", "🎓 Dance Teachers"].map((a) => (
              <span key={a} className="ed-pill text-sm">{a}</span>
            ))}
          </div>
        </div>
      </section>
      </Chapter>

      {/* SCREEN 4 — Programs & Styles */}
      <Chapter index={4} total={5} kicker="Programs & Formats — Ways to Train">
      <section id="programs" className="max-w-7xl mx-auto px-6 lg:px-10 pt-7 pb-5 lg:pt-10 lg:pb-6">
        <div>
          <p className="text-xs uppercase tracking-widest df-gradient-text font-bold">Programs &amp; Formats</p>
          <h2 className="mt-2 font-display text-2xl lg:text-4xl font-bold leading-[1.02] text-balance">
            Ways to <span className="italic font-light df-gradient-text">train.</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl">
            Signature movement experiences tailored for all levels.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5">
          {[
            { icon: "✨", title: "Workshops & Events", desc: "High-energy live sessions combining choreography and community energy.", tone: "var(--df-1)" },
            { icon: "🎗️", title: "Nritya Sadhana", desc: "A meditative movement exploration focusing on stillness and breath.", tone: "var(--df-2)" },
            { icon: "👥", title: "DanceFit App & Online", desc: "Structured online learning, live feedback, and dance fitness anywhere.", href: "https://dancefitstudio.app", cta: "Download App & Register", tone: "var(--df-3)" },
            { icon: "⚡", title: "The Tej Method", desc: "Core philosophy integrating body awareness and confidence.", tone: "var(--df-4)" },
            { icon: "🚀", title: "Zero to Hero", desc: "Step-by-step beginner program to eliminate stage fear.", to: "/zero-to-hero", tone: "var(--df-5)" },
            { icon: "🪔", title: "Bhakti Experience", desc: "A spiritual blend of grace, devotion, and movement.", tone: "var(--df-2)" },
          ].map((p, pi) => (
            <article
              key={p.title}
              style={revealDelay(pi)}
              className="reveal-up ed-card relative overflow-hidden p-4 lg:p-5 transition-transform duration-300 hover:-translate-y-1"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
                style={{ background: `linear-gradient(90deg, ${p.tone}, transparent)` }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl"
                style={{ background: `color-mix(in oklab, ${p.tone} 30%, transparent)` }}
              />
              <div
                className="relative grid h-11 w-11 place-items-center rounded-xl text-2xl leading-none"
                style={{
                  background: `color-mix(in oklab, ${p.tone} 12%, transparent)`,
                  border: `1px solid color-mix(in oklab, ${p.tone} 30%, transparent)`,
                }}
              >
                {p.icon}
              </div>
              <h3 className="relative mt-3 font-display text-lg font-bold">{p.title}</h3>
              <p className="relative mt-1.5 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              {p.href && (
                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  className="relative mt-3 inline-flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all"
                  style={{ color: p.tone }}
                >
                  {p.cta} <ArrowUpRight size={14} />
                </a>
              )}
              {p.to && (
                <Link
                  to={p.to}
                  className="relative mt-3 inline-flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all"
                  style={{ color: p.tone }}
                >
                  Explore program <ArrowUpRight size={14} />
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>



      {/* DANCE STYLES — premium two-column grid */}
      <section id="classes" className="max-w-7xl mx-auto px-6 lg:px-10 pt-5 pb-7 lg:pt-6 lg:pb-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">What we teach</p>
            <h2 className="mt-2 font-display text-2xl lg:text-4xl font-bold text-balance leading-[1.02]">
              Styles on the <span className="italic font-light">floor.</span>
            </h2>
          </div>
          <p className="hidden md:block text-xs uppercase tracking-widest text-muted-foreground max-w-xs text-right">
            Many vocabularies. One fusion.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-5">
          {((danceStyles ?? []).length > 0
            ? (danceStyles ?? []).map((s: any) => ({
                name: String(s.name ?? "Dance Style").trim() || "Dance Style",
                tagline: String(s.tagline ?? "").trim(),
                image_url: s.image_url ?? null,
              }))
            : defaultStyles.map((s) => ({ name: s.name, tagline: s.tagline, image_url: null }))
          ).map((s, si) => (
            <article
              key={s.name}
              style={revealDelay(si)}
              className="reveal-up ed-card group relative overflow-hidden p-5 lg:p-6"
            >
              {s.image_url && (
                <img
                  src={s.image_url}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  decoding="async"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-15 transition-opacity duration-500 group-hover:opacity-25"
                />
              )}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "var(--gradient-beige-wash)" }}
              />
              <div className="relative flex items-baseline gap-4">
                <span className="font-display text-sm text-primary/70 tabular-nums">
                  {String(si + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-xl lg:text-2xl font-bold truncate">{s.name}</h3>
                  {s.tagline && (
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.tagline}</p>
                  )}
                </div>
              </div>
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-0 h-px w-0 group-hover:w-full transition-[width] duration-500"
                style={{ background: "linear-gradient(90deg, var(--primary), transparent)" }}
              />
            </article>
          ))}
        </div>
      </section>
      </Chapter>


      {/* SCREEN 5 — Iconic Work: World Tour */}
      <Chapter index={5} total={5} kicker="Iconic Work — World Tour">

      <section className="relative px-6 lg:px-10 max-w-7xl mx-auto py-7 lg:py-10 space-y-7 lg:space-y-10">

        {brands.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Brands we've worked with</p>
            <h2 className="font-display text-2xl lg:text-4xl font-bold mt-2">Trusted partners</h2>
            <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {brands.map((b) => (
                <div key={b.id} className="h-20 rounded-xl bg-muted border border-border flex items-center justify-center font-display text-lg tracking-wide hover:text-primary transition overflow-hidden p-3">
                  {b.logo_url ? <img src={b.logo_url} alt={b.name} loading="lazy" className="max-h-full max-w-full object-contain" /> : <span>{b.name}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {celebrities.length > 0 && (

          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Celebrities we've worked with</p>
            <h2 className="font-display text-2xl lg:text-4xl font-bold mt-2">On stage with the best</h2>
            <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {celebrities.map((c, ci) => (
                <div
                  key={c.id}
                  style={revealDelay(ci)}
                  className="reveal-up transition-transform duration-300 hover:-translate-y-1 group relative aspect-square premium-card bg-card overflow-hidden flex flex-col items-center justify-end text-center"
                >
                  {c.photo_url ? (
                    <img
                      src={c.photo_url}
                      alt={c.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover lg:object-contain object-center transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                  ) : null}
                  {/* shine sweep on hover */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-out"
                    style={{
                      background:
                        "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
                    }}
                  />
                  <div className={`relative w-full p-3 ${c.photo_url ? "bg-gradient-to-t from-background/90 via-background/60 to-transparent" : ""}`}>
                    <p className="font-display text-sm">{c.name}</p>
                    {c.role && <p className="text-[10px] text-muted-foreground">{c.role}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {globe.length > 0 && (() => {
          const conducted = globe.filter((g) => g.status === "conducted");
          const upcoming = globe.filter((g) => g.status === "upcoming");
          
          return (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-card to-background border border-border p-6 lg:p-12">
              <p className="text-xs uppercase tracking-widest text-primary">India to the globe</p>
              <h2 className="font-display text-2xl lg:text-4xl font-bold mt-2 max-w-3xl">Carrying our story across the world</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl">Tejas D Dhoke has performed and taught on stages across continents.</p>
              {conducted.length > 0 && (
                <div className="mt-8">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">Conducted</p>
                  <div className="flex flex-wrap gap-2">
                    {conducted.map((g) => (
                      <span key={g.id} className="px-3 py-1.5 rounded-full text-xs border border-border bg-background/40">{g.city}, {g.country}</span>
                    ))}
                  </div>
                </div>
              )}
              {upcoming.length > 0 && (
                <div className="mt-6">
                  <p className="text-[11px] uppercase tracking-widest text-primary mb-3">Upcoming</p>
                  <div className="flex flex-wrap gap-2">
                    {upcoming.map((g) => (
                      <span key={g.id} className="px-3 py-1.5 rounded-full text-xs border border-primary/40 bg-primary/10 text-primary">
                        {g.city}, {g.country}{g.event_date ? ` · ${new Date(g.event_date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* RHYTHM & COUNTING — animated stats, immediately after the globe */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {stats.map((s, si) => (
            <div key={s.label} className="reveal-up relative border-t border-border pt-6" style={revealDelay(si)}>
              <div
                aria-hidden
                className="absolute -top-px left-0 h-px w-16"
                style={{ background: "linear-gradient(90deg, var(--primary), transparent)" }}
              />
              <p className="font-display text-4xl lg:text-6xl font-bold text-primary drop-shadow-[0_0_25px_color-mix(in_oklab,var(--accent-gold)_30%,transparent)]">
                {s.value}{s.suffix ?? ""}
              </p>
              <p className="mt-3 text-xs lg:text-sm text-muted-foreground uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
      </Chapter>


      </HorizontalPager>
    </>
  );
}

function countryToContinent(country: string): string | null {
  const c = (country || "").trim().toLowerCase();
  const map: Record<string, string> = {
    india: "Asia", "sri lanka": "Asia", nepal: "Asia", bhutan: "Asia", bangladesh: "Asia", pakistan: "Asia",
    china: "Asia", japan: "Asia", "south korea": "Asia", korea: "Asia", singapore: "Asia", malaysia: "Asia",
    thailand: "Asia", indonesia: "Asia", vietnam: "Asia", philippines: "Asia", "hong kong": "Asia", taiwan: "Asia",
    uae: "Asia", "united arab emirates": "Asia", "saudi arabia": "Asia", qatar: "Asia", bahrain: "Asia",
    kuwait: "Asia", oman: "Asia", israel: "Asia", turkey: "Asia",
    uk: "Europe", "united kingdom": "Europe", england: "Europe", scotland: "Europe", ireland: "Europe",
    france: "Europe", germany: "Europe", spain: "Europe", italy: "Europe", portugal: "Europe",
    netherlands: "Europe", belgium: "Europe", switzerland: "Europe", austria: "Europe", sweden: "Europe",
    norway: "Europe", denmark: "Europe", finland: "Europe", poland: "Europe", greece: "Europe",
    "czech republic": "Europe", hungary: "Europe", romania: "Europe", russia: "Europe",
    usa: "North America", "united states": "North America", "united states of america": "North America",
    "u.s.a.": "North America", "u.s.": "North America", america: "North America",
    canada: "North America", mexico: "North America",
    brazil: "South America", argentina: "South America", chile: "South America", colombia: "South America",
    peru: "South America",
    "south africa": "Africa", nigeria: "Africa", kenya: "Africa", egypt: "Africa", morocco: "Africa",
    ghana: "Africa", tanzania: "Africa", uganda: "Africa", mauritius: "Africa",
    australia: "Oceania", "new zealand": "Oceania", fiji: "Oceania",
  };
  return map[c] ?? null;
}

function youtubeEmbed(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/embed/")) return url;
      if (u.pathname.startsWith("/shorts/")) return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
    }
  } catch {}
  return null;
}

type ReelItem = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  videoSrc?: string | null;
  embedSrc?: string | null;
  poster?: string | null;
  ctaLabel?: string;
  ctaLink?: string;
  ctaExternal?: boolean;
};

function buildReelItems(choreos: Choreo[], workshops: any[]): ReelItem[] {
  // `choreos` already comes sorted newest-first (sort_order, then uploaded_at
  // desc), so keeping every published clip here means the deck is always
  // showing the full, current set of latest choreographies — nothing is
  // artificially trimmed out of rotation.
  const fromChoreos: ReelItem[] = (choreos || [])
    .filter((c) => !!(c.video_url || youtubeEmbed(c.youtube_url)))
    .map((c) => ({
      id: `choreo-${c.id}`,
      title: c.title,
      subtitle: "Choreography",
      badge: "Choreo",
      videoSrc: c.video_url ?? null,
      embedSrc: youtubeEmbed(c.youtube_url),
      poster: c.thumbnail_url ?? null,
      ctaLabel: c.instagram_url ? "Watch on Instagram" : undefined,
      ctaLink: c.instagram_url ?? undefined,
      ctaExternal: true,
    }));

  const fromWorkshops: ReelItem[] = (workshops || [])
    .filter((w: any) => !!w.banner_video_url)
    .map((w: any) => ({
      id: `workshop-${w.id}`,
      title: w.name,
      subtitle: [w.city, w.instructor].filter(Boolean).join(" · ") || "Workshop highlight",
      badge: "Workshop",
      videoSrc: w.banner_video_url as string,
      embedSrc: null,
      poster: w.banner_url ?? null,
      ctaLabel: "View workshop",
      ctaLink: `/workshops/${w.id}`,
      ctaExternal: false,
    }));

  // Weave the two sources together so the reel doesn't read as two blocks stitched end to end.
  const woven: ReelItem[] = [];
  const max = Math.max(fromChoreos.length, fromWorkshops.length);
  for (let i = 0; i < max; i++) {
    if (fromChoreos[i]) woven.push(fromChoreos[i]);
    if (fromWorkshops[i]) woven.push(fromWorkshops[i]);
  }
  return woven;
}


function MuteToggleIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4z" /><line x1="22" y1="9" x2="16" y2="15" /><line x1="16" y1="9" x2="22" y2="15" /></svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
  );
}

/**
 * Sprocket strip — a thin row of perforation dots that frames the filmstrip,
 * evoking a literal reel of film. Pure CSS, no image asset.
 */
function SprocketStrip() {
  return (
    <div
      aria-hidden
      className="h-3 w-full rounded-full opacity-70"
      style={{
        backgroundImage: "radial-gradient(circle, color-mix(in oklab, var(--primary) 55%, var(--border)) 1.6px, transparent 1.8px)",
        backgroundSize: "14px 100%",
        backgroundPosition: "center",
      }}
    />
  );
}

function CinematicShowreel({ choreos, workshops }: { choreos: Choreo[]; workshops: any[] }) {
  const items = useMemo(() => buildReelItems(choreos, workshops), [choreos, workshops]);

  if (!items.length) return null;

  return (
    <section id="showcase" className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-border">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary inline-flex items-center gap-1.5">
            <Play size={12} /> Iconic Work
          </p>
          <h2 className="mt-3 font-display text-4xl lg:text-6xl font-bold text-balance leading-[1.02]">
            Our Most Viral <span className="italic font-light">Choreographies.</span>
          </h2>
        </div>

      </div>

      <LazySection minHeight={560}>
        <CoverflowCarousel
          items={items.map((it) => ({
            id: it.id,
            title: it.title,
            subtitle: it.subtitle,
            badge: it.badge,
            videoSrc: it.videoSrc,
            embedSrc: it.embedSrc,
            poster: it.poster,
            ctaLabel: it.ctaLabel,
            ctaLink: it.ctaLink,
            ctaExternal: it.ctaExternal,
          }))}
          interval={5000}
        />
      </LazySection>

    </section>
  );
}


function FounderSection({ founder }: { founder: any | null }) {
  const [open, setOpen] = useState(false);
  const name = founder?.name || "Tejas D Dhoke";
  const title = founder?.title || "Founder";
  const intro = founder?.intro || "";
  const image = founder?.image_url || "";
  const biography = founder?.biography || "";
  const achievements: string[] = Array.isArray(founder?.achievements) ? founder.achievements : [];
  const belief = founder?.belief || founder?.philosophy || "";
  const vision = founder?.vision || "";
  const mission = founder?.mission || "";
  const socials = founder?.socials || {};

  const hasMore = Boolean(biography || achievements.length || vision || mission);

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-border">
      <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-start">
        {/* Portrait — editorial frame */}
        <div className="reveal-up lg:col-span-2 relative group">
          {/* decorative offset frame */}
          <div
            aria-hidden
            className="absolute -inset-3 lg:-inset-4 rounded-[2rem] opacity-70 blur-xl -z-10 transition-opacity duration-700 group-hover:opacity-100"
            style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--primary) 45%, transparent), transparent 60%)" }}
          />
          {/* offset border shape behind image */}
          <div aria-hidden className="absolute top-4 -left-4 lg:-left-6 w-full h-full rounded-3xl border border-primary/30" />

          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/40 border border-border">
            {image ? (
              <img
                src={image}
                alt={name}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover lg:object-contain transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-8xl font-display font-bold text-primary">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            {/* film grain accent */}
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              style={{ background: "radial-gradient(120% 80% at 50% 100%, color-mix(in oklab, var(--primary) 30%, transparent), transparent 60%)" }} />
            {/* shine sweep */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1400ms] ease-out"
              style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.16) 50%, transparent 70%)" }} />

            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-background/95 via-background/60 to-transparent">
              <p className="text-xs uppercase tracking-widest text-primary">{title}</p>
              <p className="font-display text-2xl font-bold mt-1">{name}</p>
            </div>

            {/* corner tick marks — editorial detail */}
            <span aria-hidden className="absolute top-3 left-3 h-4 w-4 border-t border-l border-white/70" />
            <span aria-hidden className="absolute top-3 right-3 h-4 w-4 border-t border-r border-white/70" />
            <span aria-hidden className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-white/70" />
            <span aria-hidden className="absolute bottom-3 right-3 h-4 w-4 border-b border-r border-white/70" />
          </div>
        </div>


        {/* Content */}
        <div className="reveal-up lg:col-span-3 space-y-6" style={{ animationDelay: "100ms" }}>
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">{title}</p>
            <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold text-balance leading-[1.05]">
              Meet <span className="italic font-light">{name}.</span>
            </h2>
            {intro && <p className="mt-4 text-lg text-muted-foreground max-w-2xl">{intro}</p>}
          </div>

          {/* Belief · Vision · Mission — always visible */}
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { k: "Belief", v: belief || "Anyone can dance. It only takes the courage to begin." },
              { k: "Vision", v: vision || "To make India's movement culture felt on every global stage." },
              { k: "Mission", v: mission || "Build dancers with craft, confidence and character." },
            ].map((c) => (
              <div key={c.k} className="rounded-2xl border border-border bg-card/60 p-5">
                <p className="text-xs uppercase tracking-widest text-primary">{c.k}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{c.v}</p>
              </div>
            ))}
          </div>



          <div className="flex flex-wrap items-center gap-3 pt-2">
            {hasMore && (
              <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:border-primary hover:text-primary font-medium transition"
              >
                Know more <ArrowUpRight size={18} />
              </button>
            )}
          </div>

          {/* Socials stay on homepage */}
          <div className="flex items-center gap-2 pt-1">
            {socials.instagram && (
              <a href={socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="p-2.5 rounded-full border border-border hover:border-primary hover:text-primary transition">
                <Instagram size={16} />
              </a>
            )}
            {socials.youtube && (
              <a href={socials.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                className="p-2.5 rounded-full border border-border hover:border-primary hover:text-primary transition">
                <Youtube size={16} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Full biography modal */}
      {open && (
        <div
          className="modal-fade fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-pop relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-8 lg:p-10 shadow-2xl"
          >

              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 h-9 w-9 grid place-items-center rounded-full border border-border hover:border-primary hover:text-primary transition"
                aria-label="Close"
              >
                ✕
              </button>

              <p className="text-xs uppercase tracking-widest text-primary">{title}</p>
              <h3 className="mt-2 font-display text-3xl lg:text-4xl font-bold">{name}</h3>

              {biography && (
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-widest text-primary mb-2">About</p>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{biography}</p>
                </div>
              )}

              {achievements.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-widest text-primary mb-3">Dance journey & achievements</p>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {achievements.map((a, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <Sparkles size={14} className="text-primary shrink-0 mt-0.5" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(belief || vision || mission) && (
                <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {belief && (
                    <div className="ed-card p-5">
                      <p className="text-xs uppercase tracking-widest text-primary">Belief</p>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{belief}</p>
                    </div>
                  )}
                  {vision && (
                    <div className="ed-card p-5">
                      <p className="text-xs uppercase tracking-widest text-primary">Vision</p>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{vision}</p>
                    </div>
                  )}
                  {mission && (
                    <div className="ed-card p-5">
                      <p className="text-xs uppercase tracking-widest text-primary">Mission</p>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{mission}</p>
                    </div>
                  )}
                </div>
              )}

          </div>
        </div>
      )}

    </section>
  );
}

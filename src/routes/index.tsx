import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { listPrograms } from "@/lib/catalog.functions";
import { listPublicCelebrities, listPublicBrands, listPublicGlobe } from "@/lib/content.functions";
import { listHeroSlides, getFeaturedExperience, listGalleryItems } from "@/lib/cms.functions";
import { listDanceStyles, getSiteContent } from "@/lib/site-content.functions";
import { listChoreographies } from "@/lib/choreographies.functions";
import { listPublicTestimonials } from "@/lib/testimonials.functions";
import { useServerFn } from "@tanstack/react-start";

import { ArrowUpRight, Sparkles, Calendar, MapPin, Play, Instagram, Youtube, Facebook, Twitter, Linkedin } from "lucide-react";

import heroImg from "@/assets/hero.jpg";
import classesImg from "@/assets/classes.jpg";
// aboutImg no longer used on homepage after workshops teaser was replaced with dynamic grid
import { MotionImage } from "@/components/site/MotionImage";
import { StyleAnimation } from "@/components/site/StyleAnimation";
import { MagneticButton } from "@/components/site/MagneticButton";
import { TiltCard } from "@/components/site/TiltCard";
import { StageLights } from "@/components/site/StageLights";
import { AnimatedCounter } from "@/components/site/AnimatedCounter";
import { MouseParallax } from "@/components/site/MouseParallax";
const TestimonialsCarousel = lazy(() =>
  import("@/components/site/TestimonialsCarousel").then((m) => ({ default: m.TestimonialsCarousel }))
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

type HeroSlide = {
  id?: string | null;
  image_url?: string | null;
  alt?: string | null;
  sort_order?: number | null;
};

type HomeLoaderData = {
  heroSlides: HeroSlide[];
};

const heroVideoType = (src: string) => {
  if (/\.webm(\?|#|$)/i.test(src)) return "video/webm";
  return "video/mp4";
};

const preloadLinkForHeroMedia = (src?: string | null) => {
  if (!src) return null;
  if (isVideoUrl(src)) {
    return { rel: "preload", as: "video", href: src, type: heroVideoType(src), crossOrigin: "anonymous" };
  }
  return { rel: "preload", as: "image", href: src };
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
    if (isVideoUrl(src)) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.src = src;
      video.load();
      continue;
    }
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
      const raf = requestAnimationFrame(() => v.play().catch(() => {}));
      return () => cancelAnimationFrame(raf);
    } else {
      try { v.pause(); } catch {}
    }
  }, [active]);

  if (!src) return null;
  const common = "absolute inset-0 h-full w-full object-cover transform-gpu backface-hidden";

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
        className={common}
        style={{ opacity: ready ? 1 : 0, transition: "opacity 200ms ease-out" }}
      />
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


function WorkshopCardMedia({ w, desktop }: { w: any; desktop?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  if (w.banner_video_url) {
    const toggle = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const v = videoRef.current;
      if (!v) return;
      v.muted = !v.muted;
      setMuted(v.muted);
      if (!v.muted) v.play().catch(() => {});
    };
    return (
      <div className="w-full bg-black flex items-center justify-center relative">
        <video ref={videoRef} src={w.banner_video_url} poster={w.banner_url ?? undefined}
          autoPlay muted loop playsInline preload="metadata"
          className={`w-full h-auto max-h-[75vh] object-contain ${desktop ? "transition-transform duration-500 group-hover:scale-105" : ""}`} />
        <button type="button" onClick={toggle} aria-label={muted ? "Unmute video" : "Mute video"}
          className="absolute bottom-3 right-3 z-10 h-9 w-9 flex items-center justify-center rounded-full bg-background/70 backdrop-blur border border-border text-foreground hover:bg-background transition">
          {muted ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          )}
        </button>
      </div>
    );
  }

  if (w.banner_gif_url) {
    return (
      <div className="w-full aspect-video overflow-hidden bg-muted">
        <img src={w.banner_gif_url} alt={w.name} loading="lazy"
          className={`w-full h-full object-cover ${desktop ? "transition-transform duration-500 group-hover:scale-105" : ""}`} />
      </div>
    );
  }
  if (w.banner_url) {
    return (
      <div className="w-full bg-muted flex items-center justify-center">
        <img src={w.banner_url} alt={w.name} loading="lazy"
          className={`w-full h-auto max-h-[75vh] object-contain ${desktop ? "transition-transform duration-500 group-hover:scale-105" : ""}`} />
      </div>
    );
  }
  return <div className="aspect-[16/10] w-full bg-gradient-to-br from-primary/20 to-secondary/40" />;
}



export const Route = createFileRoute("/")({
  loader: loadHomeData,
  head: ({ loaderData }) => {
    const firstHero = loaderData?.heroSlides?.[0]?.image_url || heroImg;
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
  { value: 300, suffix: "+", label: "Dancers Trained" },
  { value: 40, suffix: "+", label: "Live Performances" },
  { value: 60, suffix: "+", label: "Workshops" },
  { value: 12, suffix: "+", label: "Years of Experience" },
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



const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

function Index() {
  const loaderData = Route.useLoaderData() as HomeLoaderData;

  const [workshops, setWorkshops] = useState<any[]>([]);
  const [celebrities, setCelebrities] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [globe, setGlobe] = useState<any[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(loaderData.heroSlides ?? []);
  const [featured, setFeatured] = useState<any | null>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [danceStyles, setDanceStyles] = useState<any[] | null>(null);
  const [choreos, setChoreos] = useState<Choreo[]>([]);
  const [founder, setFounder] = useState<any | null>(null);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [heroReady, setHeroReady] = useState(false);
  const [warmSlides, setWarmSlides] = useState(false);
  const [showStageLights, setShowStageLights] = useState(false);

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
      fetchHeroSlides()
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
    // Non-critical: below the fold — defer until browser is idle so they don't compete with the hero paint.
    const loadDeferred = () => {
      fetchPrograms({ data: { kind: "workshop" } })
        .then((rows: any) => setWorkshops((rows ?? []).slice(0, 6)))
        .catch(() => setWorkshops([]));
      listPublicCelebrities().then((r: any) => setCelebrities(r ?? [])).catch(() => setCelebrities([]));
      listPublicBrands().then((r: any) => setBrands(r ?? [])).catch(() => setBrands([]));
      listPublicGlobe().then((r: any) => setGlobe(r ?? [])).catch(() => setGlobe([]));
      getFeaturedExperience().then((r: any) => setFeatured(r)).catch(() => setFeatured(null));
      listGalleryItems().then((r: any) => setGallery(r ?? [])).catch(() => setGallery([]));
      listDanceStyles().then((r: any) => setDanceStyles(r ?? [])).catch(() => setDanceStyles([]));
      listChoreographies().then((r: any) => setChoreos(r ?? [])).catch(() => setChoreos([]));
      getSiteContent({ data: { key: "founder" } }).then((r: any) => setFounder(r)).catch(() => setFounder(null));
      listPublicTestimonials().then((r: any) => setTestimonials(r ?? [])).catch(() => setTestimonials([]));
    };
    const ric: any = (window as any).requestIdleCallback;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;
    if (typeof ric === "function") idleId = ric(loadDeferred, { timeout: 1800 });
    else timeout = setTimeout(loadDeferred, 450);
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
    if (typeof ric === "function") idleId = ric(enableWarmup, { timeout: 900 });
    else timeout = setTimeout(enableWarmup, 300);
    return () => {
      if (timeout) clearTimeout(timeout);
      if (typeof (window as any).cancelIdleCallback === "function" && idleId) {
        (window as any).cancelIdleCallback(idleId);
      }
    };
  }, [heroReady, heroSlides, slideIdx]);



  const heroSectionRef = useRef<HTMLElement>(null);
  const [heroVisible, setHeroVisible] = useState(true);

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

  return (
    <>
      {/* HERO */}
      <section id="hero" ref={heroSectionRef} className="relative overflow-hidden">
        {/* Fixed-aspect hero container — identical size across all slides, no layout shift */}
        <div className="relative w-full overflow-hidden bg-black aspect-[4/5] sm:aspect-[16/10] lg:aspect-[16/9] max-h-[85vh]">
          {heroSlides.length > 0 ? (
            heroSlides.map((s, i) => {
              const active = i === slideIdx;
              // Mount current, previous-neighbor and next-neighbor only for cheap DOM
              const neighbor =
                heroSlides.length <= 3 ||
                i === (slideIdx + 1) % heroSlides.length ||
                i === (slideIdx - 1 + heroSlides.length) % heroSlides.length;
              const shouldMount = active || (warmSlides && (i === 0 || neighbor));
              return (
                <div
                  key={s.id ?? s.image_url ?? i}
                  aria-hidden={!active}
                  style={{
                    opacity: active ? 1 : 0,
                    transition: "opacity 400ms cubic-bezier(0.22, 1, 0.36, 1)",
                    pointerEvents: active ? "auto" : "none",
                    willChange: "opacity",
                    transform: "translateZ(0)",
                    backfaceVisibility: "hidden",
                  }}
                  className="absolute inset-0"
                >
                  {shouldMount && (
                    <HeroSlideMedia
                      src={s.image_url}
                      alt={s.alt ?? "Hero"}
                      active={active && heroVisible}
                      priority={i === 0}
                      fallbackSrc={heroImg}
                      onReady={i === 0 ? () => setHeroReady(true) : undefined}
                    />
                  )}
                </div>
              );
            })
          ) : (
            <HeroSlideMedia
              src={heroImg}
              alt="Tejas D Dhoke dancers in performance"
              active
              priority
              onReady={() => setHeroReady(true)}
            />
          )}
          {/* Cinematic stage lighting + smoke */}
          {heroReady && showStageLights && <StageLights />}
        </div>



        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-10 lg:py-16">
          <MouseParallax strength={heroReady ? 14 : 0}>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={heroReady ? "show" : "hidden"}
            className="max-w-2xl"
          >
            <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-background/50 backdrop-blur text-[10px] uppercase tracking-widest text-primary shadow-[0_0_30px_-8px_color-mix(in_oklab,var(--primary)_60%,transparent)]">
              <Sparkles size={12} className="text-primary" />
              Fusion Dance Company · Est. 2013
            </motion.div>

            <motion.h1
              variants={item}
              className="mt-4 font-display font-bold text-3xl sm:text-5xl lg:text-7xl leading-[1.02] text-balance tracking-tight"
              style={{
                textShadow:
                  "0 2px 40px rgba(0,0,0,0.55), 0 0 60px color-mix(in oklab, var(--primary) 25%, transparent)",
              }}
            >
              Where movement{" "}
              <span
                className="italic font-light bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(120deg, #C7A34A, #7A3BFF 55%, #3B82F6)" }}
              >
                becomes art.
              </span>
            </motion.h1>

            <motion.p variants={item} className="mt-3 text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl">
              Train. Perform. Transform — with Tejas D Dhoke.
            </motion.p>

            <motion.div variants={item} className="mt-6 flex flex-wrap gap-3">
              <MagneticButton>
                <Link
                  to="/workshops"
                  className="group relative inline-flex items-center gap-2 px-6 py-3 lg:px-7 lg:py-3.5 rounded-full bg-primary text-primary-foreground text-sm lg:text-base font-medium overflow-hidden shadow-[0_10px_60px_-8px_color-mix(in_oklab,var(--primary)_80%,transparent)]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Register Workshop
                    <ArrowUpRight size={16} className="group-hover:rotate-45 transition-transform" />
                  </span>
                  <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </Link>
              </MagneticButton>
              <MagneticButton strength={0.25}>
                <Link
                  to="/nritya-sadhana"
                  className="inline-flex items-center gap-2 px-6 py-3 lg:px-7 lg:py-3.5 rounded-full border border-primary/40 text-sm lg:text-base hover:border-primary hover:text-primary transition-colors backdrop-blur-sm bg-background/30"
                >
                  Join Classes
                </Link>
              </MagneticButton>
            </motion.div>
          </motion.div>
          </MouseParallax>

        </div>



        {/* Marquee */}
        <div className="relative border-y border-border bg-background/60 backdrop-blur overflow-hidden">
          <motion.div
            animate={heroReady ? { x: ["0%", "-50%"] } : { x: "0%" }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="flex gap-12 py-4 whitespace-nowrap text-sm uppercase tracking-[0.3em] text-muted-foreground"
          >
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-12 shrink-0">
                <span>Fusion</span><span className="text-primary">◆</span>
                <span>Contemporary</span><span className="text-primary">◆</span>
                <span>Bollywood</span><span className="text-primary">◆</span>
                <span>Hip-Hop</span><span className="text-primary">◆</span>
                <span>Kathak</span><span className="text-primary">◆</span>
                <span>Choreography</span><span className="text-primary">◆</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* WORKSHOPS — dynamic (primary CTA — placed directly after hero) */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-8 lg:pt-24 lg:pb-12">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary inline-flex items-center gap-1.5">
              <Calendar size={12} /> Upcoming Workshops
            </p>
            <h2 className="mt-3 font-display text-4xl lg:text-6xl font-bold leading-[1.02] text-balance">
              Register. Show up. Transform.
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl">
              Live intensives with Tejas D Dhoke — seats fill fast. Grab yours before they're gone.
            </p>
          </div>
          <Link to="/workshops" className="inline-flex items-center gap-2 text-sm text-primary hover:gap-3 transition-all">
            See all workshops <ArrowUpRight size={14} />
          </Link>
        </div>

        {workshops.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl py-16 text-center text-muted-foreground">
            <p className="font-display text-2xl">Coming Soon</p>
            <p className="mt-2 text-sm">New workshops drop every month — check back soon.</p>
          </div>
        ) : (
          <>
            {/* Mobile: horizontal snap carousel */}
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
              className="md:hidden -mx-6 px-6 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-pl-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {workshops.map((w) => (
                <motion.article key={w.id} variants={item}
                  className="snap-start shrink-0 w-[82%] rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
                  <WorkshopCardMedia w={w} />

                  <div className="p-5 flex-1 flex flex-col">
                    {w.category && <p className="text-[10px] uppercase tracking-widest text-primary">{w.category}</p>}
                    <p className="mt-1 font-display text-xl font-bold">{w.name}</p>
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {w.event_date && <p className="flex items-center gap-2"><Calendar size={12} />{new Date(w.event_date).toDateString()}{w.event_time ? ` · ${w.event_time}` : ""}</p>}
                      {w.venue && <p className="flex items-center gap-2"><MapPin size={12} />{w.venue}</p>}
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <p className="font-display text-xl">₹{Number(w.price_inr).toLocaleString("en-IN")}</p>
                      <Link to="/workshops" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Register</Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>

            {/* Desktop: grid */}
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
              className="hidden md:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {workshops.map((w) => (
                <motion.article key={w.id} variants={item}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary transition-colors flex flex-col">
                  <WorkshopCardMedia w={w} desktop />

                  <div className="p-5 flex-1 flex flex-col">
                    {w.category && <p className="text-[10px] uppercase tracking-widest text-primary">{w.category}</p>}
                    <p className="mt-1 font-display text-xl font-bold">{w.name}</p>
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {w.event_date && <p className="flex items-center gap-2"><Calendar size={12} />{new Date(w.event_date).toDateString()}{w.event_time ? ` · ${w.event_time}` : ""}</p>}
                      {w.venue && <p className="flex items-center gap-2"><MapPin size={12} />{w.venue}</p>}
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <p className="font-display text-xl">₹{Number(w.price_inr).toLocaleString("en-IN")}</p>
                      <Link to="/workshops" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Register</Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </>
        )}
      </section>

      {featured && (
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl border border-border bg-card"
          >
            <div className="grid lg:grid-cols-2">
              <div className="relative aspect-[4/3] lg:aspect-auto bg-muted">
                {featured.banner_url && (
                  <img src={featured.banner_url} alt={featured.title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent lg:hidden" />
              </div>
              <div className="p-8 lg:p-12">
                <p className="text-xs uppercase tracking-widest text-primary inline-flex items-center gap-1.5">
                  <Sparkles size={12} /> Featured experience
                </p>
                <h2 className="mt-3 font-display text-3xl lg:text-4xl font-bold leading-tight">{featured.title}</h2>
                {(featured.city || featured.start_date) && (
                  <p className="mt-2 text-sm text-muted-foreground inline-flex items-center gap-2">
                    {featured.city && <><MapPin size={12} /> {featured.city}</>}
                    {featured.start_date && <><Calendar size={12} /> {new Date(featured.start_date).toDateString()}{featured.end_date ? ` – ${new Date(featured.end_date).toDateString()}` : ""}</>}
                  </p>
                )}
                {featured.description && <p className="mt-4 text-muted-foreground leading-relaxed whitespace-pre-line">{featured.description}</p>}
                {Array.isArray(featured.day_schedule) && featured.day_schedule.length > 0 && (
                  <div className="mt-6 space-y-2">
                    {featured.day_schedule.map((d: any, i: number) => (
                      <div key={i} className="border-l-2 border-primary/50 pl-3">
                        <p className="text-xs uppercase tracking-widest text-primary">{d.day}</p>
                        <p className="text-sm text-muted-foreground">{d.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                {featured.cta_text && featured.cta_link && (
                  <a href={featured.cta_link}
                    className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition">
                    {featured.cta_text} <ArrowUpRight size={18} />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </section>
      )}



      {/* STATS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10"
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={item} className="relative border-t border-border pt-6">
              <div
                aria-hidden
                className="absolute -top-px left-0 h-px w-16"
                style={{ background: "linear-gradient(90deg, var(--primary), transparent)" }}
              />
              <p className="font-display text-5xl lg:text-7xl font-bold text-primary drop-shadow-[0_0_25px_color-mix(in_oklab,var(--primary)_45%,transparent)]">
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-3 text-xs lg:text-sm text-muted-foreground uppercase tracking-widest">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>





      {/* FOUNDER */}
      <FounderSection founder={founder} />

      {/* LATEST CHOREOGRAPHIES */}
      <LatestChoreographies items={choreos} />


      {/* DANCE STYLES */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-border">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-widest text-primary">What we teach</p>
          <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold text-balance max-w-2xl">
            Styles on the floor.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl">
            Four core vocabularies. They cross, collide, and become the Tejas D Dhoke fusion.
          </p>
        </div>

        {(() => {
          // Always show the restored live dance animations first. Backend style
          // names are merged only when they are truly custom, so variants like
          // "Hip hop" do not hide the canonical Hip-Hop dancer video.
          type RenderStyle = { name: string; tagline: string; image_url?: string | null; video_url?: string | null };
          const normalizeStyleName = (value: string) => value.trim().toLowerCase().replace(/[–—_-]+/g, " ").replace(/\s+/g, " ");
          const backend: RenderStyle[] = (danceStyles ?? []).map((s: any) => ({
            name: String(s.name ?? "Dance Style").trim() || "Dance Style",
            tagline: s.tagline ?? "",
            image_url: s.image_url ?? null,
            video_url: s.video_url ?? null,
          }));
          // If admin has added any dance styles, show ONLY those. Otherwise fall back to defaults.
          const stylesToRender: RenderStyle[] = backend.length > 0 ? backend : defaultStyles;

          const renderMedia = (s: RenderStyle) => {
            if (s.video_url) {
              return (
                <video src={s.video_url} poster={s.image_url ?? undefined}
                  autoPlay loop muted playsInline preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover" />
              );
            }
            if (s.image_url) {
              return <img src={s.image_url} alt={s.name} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />;
            }
            return <StyleAnimation name={s.name} />;
          };

          return (
            <>
              {/* Mobile: snap carousel */}
              <div className="md:hidden -mx-6 px-6 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-pl-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {stylesToRender.map((s) => (
                  <article key={s.name}
                    className="snap-start shrink-0 w-[78%] relative aspect-[4/5] rounded-2xl overflow-hidden border border-border group">
                    {renderMedia(s)}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5 z-10">
                      <p className="font-display text-2xl font-bold">{s.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.tagline}</p>
                    </div>
                  </article>
                ))}
              </div>

              {/* Desktop: grid */}
              <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
                className="hidden md:grid sm:grid-cols-2 lg:grid-cols-4 gap-6 [perspective:1200px]">
                {stylesToRender.map((s) => (
                  <motion.div key={s.name} variants={item} className="[transform-style:preserve-3d]">
                    <TiltCard className="aspect-[4/5] rounded-2xl">
                      <article className="relative h-full w-full rounded-2xl overflow-hidden border border-border group-hover:border-primary/60 transition-colors bg-card">
                        {renderMedia(s)}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                        {/* animated gradient border */}
                        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"
                          style={{ boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--primary) 55%, transparent)" }} />
                        {/* shine sweep */}
                        <div aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1100ms] ease-out"
                          style={{ background: "linear-gradient(115deg, transparent 30%, color-mix(in oklab, var(--primary) 30%, transparent) 50%, transparent 70%)" }} />
                        <div className="absolute bottom-5 left-5 right-5 z-10 [transform:translateZ(30px)]">
                          <div className="overflow-hidden">
                            <p className="font-display text-2xl font-bold translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                              {s.name}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 opacity-80 group-hover:opacity-100 transition-opacity">{s.tagline}</p>
                        </div>
                      </article>
                    </TiltCard>
                  </motion.div>
                ))}
              </motion.div>
            </>
          );
        })()}

      </section>


      {/* GALLERY — editorial bento */}
      {gallery.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-border">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary">Moments</p>
              <h2 className="mt-3 font-display text-4xl lg:text-6xl font-bold text-balance leading-[1.02]">
                From the <span className="italic font-light">floor.</span>
              </h2>
            </div>
            <div className="hidden sm:block text-xs uppercase tracking-widest text-muted-foreground">
              {gallery.length} frames
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 auto-rows-[110px] sm:auto-rows-[140px] lg:auto-rows-[170px] gap-3">
            {gallery.map((g, i) => {
              // Bento sizing pattern — repeats every 7 tiles for rhythm
              const pattern = [
                "col-span-2 row-span-2",           // 0 hero
                "col-span-1 row-span-1",
                "col-span-1 row-span-2",           // 2 tall
                "col-span-2 row-span-1",           // 3 wide
                "col-span-1 row-span-1",
                "col-span-1 row-span-1",
                "col-span-2 row-span-2",           // 6 hero echo
              ];
              const cls = pattern[i % pattern.length];
              return (
                <motion.figure
                  key={g.id}
                  initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.7, delay: (i % 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className={`group relative overflow-hidden rounded-2xl border border-border bg-muted ${cls}`}
                >
                  {g.image_url && (
                    <img
                      src={g.image_url}
                      alt={g.caption ?? ""}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]"
                    />
                  )}
                  {/* base gradient for depth */}
                  <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* accent tint on hover */}
                  <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay"
                    style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--primary) 35%, transparent) 0%, transparent 60%)" }} />
                  {/* shine sweep */}
                  <div aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1100ms] ease-out"
                    style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)" }} />
                  {g.caption && (
                    <figcaption className="absolute inset-x-0 bottom-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <span className="inline-block text-[11px] uppercase tracking-widest text-white/95 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
                        {g.caption}
                      </span>
                    </figcaption>
                  )}
                </motion.figure>
              );
            })}
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <Suspense fallback={null}>
        <TestimonialsCarousel items={testimonials.map((t) => ({
          id: t.id,
          name: t.name,
          role: t.role,
          story: t.story,
          rating: t.rating,
          avatar_url: t.avatar_url,
        }))} />
      </Suspense>

      {/* FINAL CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/10 p-12 lg:p-24 text-center"
          style={{
            background:
              "radial-gradient(80% 120% at 50% 0%, color-mix(in oklab, var(--primary) 55%, transparent) 0%, transparent 60%), linear-gradient(135deg, #0a0a12 0%, #1a0b2e 45%, #0a0a12 100%)",
          }}
        >
          {/* Floating orbs */}
          <motion.div
            aria-hidden
            animate={{ y: [0, -20, 0], x: [0, 12, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 left-10 h-40 w-40 rounded-full blur-3xl opacity-70"
            style={{ background: "radial-gradient(circle, #C7A34A 0%, transparent 70%)" }}
          />
          <motion.div
            aria-hidden
            animate={{ y: [0, 24, 0], x: [0, -18, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-10 right-10 h-56 w-56 rounded-full blur-3xl opacity-60"
            style={{ background: "radial-gradient(circle, #7A3BFF 0%, transparent 70%)" }}
          />
          <motion.div
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full border border-white/10"
          />

          <p className="relative text-xs uppercase tracking-[0.4em] text-primary">The stage is set</p>
          <h2 className="relative mt-4 font-display text-4xl lg:text-7xl font-bold text-white text-balance leading-[1.02]">
            Your journey <span className="italic font-light bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(120deg,#C7A34A,#7A3BFF,#3B82F6)" }}>begins now.</span>
          </h2>
          <p className="relative mt-5 text-white/70 max-w-xl mx-auto text-base lg:text-lg">
            Step in. Move freely. Leave transformed.
          </p>

          <div className="relative mt-10 flex justify-center">
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
                className="group relative inline-flex items-center gap-3 px-9 py-5 rounded-full font-medium text-base lg:text-lg text-primary-foreground overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, var(--primary) 0%, #7A3BFF 100%)",
                  boxShadow:
                    "0 0 60px color-mix(in oklab, var(--primary) 70%, transparent), 0 0 120px color-mix(in oklab, #7A3BFF 40%, transparent)",
                }}
              >
                {/* pulsing halo */}
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full animate-[ctaPulse_2.4s_ease-in-out_infinite]"
                  style={{
                    boxShadow: "0 0 0 0 color-mix(in oklab, var(--primary) 60%, transparent)",
                  }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  Start Your Dance Journey
                  <ArrowUpRight size={20} className="group-hover:rotate-45 transition-transform" />
                </span>
                <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-out bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </a>
            </MagneticButton>
          </div>

          <style>{`
            @keyframes ctaPulse {
              0%   { box-shadow: 0 0 0 0   color-mix(in oklab, var(--primary) 55%, transparent); }
              70%  { box-shadow: 0 0 0 22px color-mix(in oklab, var(--primary) 0%,  transparent); }
              100% { box-shadow: 0 0 0 0   color-mix(in oklab, var(--primary) 0%,  transparent); }
            }
          `}</style>

        </motion.div>
      </section>

      {/* Celebrities · Brands · India to the Globe — dynamic */}
      <section className="relative px-6 lg:px-10 max-w-7xl mx-auto py-24 space-y-20">
        {celebrities.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Celebrities we've worked with</p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold mt-2">On stage with the best</h2>
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
            >
              {celebrities.map((c) => (
                <motion.div
                  key={c.id}
                  variants={item}
                  whileHover={{ y: -4 }}
                  className="group relative aspect-square rounded-2xl bg-card border border-border overflow-hidden flex flex-col items-center justify-end text-center hover:border-primary/60 transition-colors"
                >
                  {c.photo_url ? (
                    <img
                      src={c.photo_url}
                      alt={c.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
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
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {brands.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Brands we've worked with</p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold mt-2">Trusted partners</h2>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {brands.map((b) => (
                <div key={b.id} className="h-20 rounded-xl bg-muted border border-border flex items-center justify-center font-display text-lg tracking-wide hover:text-primary transition overflow-hidden p-3">
                  {b.logo_url ? <img src={b.logo_url} alt={b.name} loading="lazy" className="max-h-full max-w-full object-contain" /> : <span>{b.name}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {globe.length > 0 && (() => {
          const conducted = globe.filter((g) => g.status === "conducted");
          const upcoming = globe.filter((g) => g.status === "upcoming");
          
          return (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-card to-background border border-border p-10 lg:p-16">
              <p className="text-xs uppercase tracking-widest text-primary">India to the globe</p>
              <h2 className="font-display text-4xl lg:text-5xl font-bold mt-2 max-w-3xl">Carrying our story across the world</h2>
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
      </section>

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

function ChoreoCard({ c }: { c: Choreo }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const embed = youtubeEmbed(c.youtube_url);
  const hasVideo = !!(c.video_url || embed);

  const goFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const el: any = videoRef.current ?? iframeRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.webkitEnterFullscreen) el.webkitEnterFullscreen(); // iOS <video>
    } catch {}
  };

  return (
    <motion.article variants={item}
      className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/70 transition-colors flex flex-col hover:shadow-[0_20px_60px_-20px_color-mix(in_oklab,var(--primary)_40%,transparent)] transition-shadow duration-500">
      <div className="relative aspect-video bg-black overflow-hidden">
        {playing && embed ? (
          <iframe ref={iframeRef} src={`${embed}?autoplay=1`} title={c.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen
            className="absolute inset-0 w-full h-full" />
        ) : playing && c.video_url ? (
          <video ref={videoRef} src={c.video_url} controls autoPlay playsInline preload="metadata"
            className="absolute inset-0 w-full h-full object-contain" />
        ) : (
          <>
            {c.thumbnail_url ? (
              <img src={c.thumbnail_url} alt={c.title} loading="lazy"
                className="absolute inset-0 w-full h-full object-contain group-hover:scale-[1.06] transition-transform duration-[900ms] ease-out" />
            ) : c.video_url ? (
              <video src={c.video_url} muted loop playsInline preload="metadata"
                className="absolute inset-0 w-full h-full object-contain" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/40" />
            )}
            {/* hover gradient veil */}
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            {/* shine sweep */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1100ms] ease-out"
              style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)" }} />
            {/* title reveal on hover (image-first storytelling) */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-10">
              <p className="font-display text-white text-lg font-bold leading-snug drop-shadow-md line-clamp-2">{c.title}</p>
            </div>
            {hasVideo && (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={`Play ${c.title}`}
                className="absolute inset-0 grid place-items-center bg-black/10 hover:bg-black/30 transition-colors z-20">
                <span className="h-16 w-16 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-[0_10px_40px_-5px_color-mix(in_oklab,var(--primary)_70%,transparent)] group-hover:scale-110 transition-transform duration-500">
                  <Play size={24} className="translate-x-0.5" />
                </span>
              </button>
            )}
          </>
        )}
        {playing && (
          <button type="button" onClick={goFullscreen} aria-label="Expand to fullscreen"
            className="absolute top-2 right-2 z-20 h-9 w-9 grid place-items-center rounded-full bg-background/70 backdrop-blur border border-border text-foreground hover:bg-background transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
          </button>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <p className="font-display text-lg font-bold leading-snug">{c.title}</p>
        {c.instagram_url && (
          <a
            href={c.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-[#f09433] via-[#e6683c] via-40% via-[#dc2743] via-60% via-[#cc2366] to-[#bc1888] text-white hover:opacity-90 transition-opacity self-start"
          >
            <Instagram size={16} /> Watch on Instagram
          </a>
        )}
      </div>
    </motion.article>
  );
}

function LatestChoreographies({ items }: { items: Choreo[] }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-border">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary inline-flex items-center gap-1.5">
            <Sparkles size={12} /> Fresh from the floor
          </p>
          <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold text-balance">
            Latest Choreographies by <span className="italic font-light">Tejas D Dhoke</span>
          </h2>
        </div>
      </div>

      {/* Mobile: snap carousel */}
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
        className="md:hidden -mx-6 px-6 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-pl-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((c) => (
          <div key={c.id} className="snap-start shrink-0 w-[86%]">
            <ChoreoCard c={c} />
          </div>
        ))}
      </motion.div>

      {/* Desktop: grid */}
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
        className="hidden md:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((c) => <ChoreoCard key={c.id} c={c} />)}
      </motion.div>
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
  const vision = founder?.vision || "";
  const mission = founder?.mission || "";
  const socials = founder?.socials || {};
  const ctaText = founder?.cta_text || "Register for Workshops";
  const ctaLink = founder?.cta_link || "/workshops";

  const hasMore = Boolean(biography || achievements.length || vision || mission);

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-border">
      <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-start">
        {/* Portrait — editorial frame */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-2 relative group"
        >
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
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-8xl font-display font-bold text-primary">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            {/* film grain accent */}
            <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-700"
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
        </motion.div>


        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-3 space-y-6"
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">{title}</p>
            <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold text-balance leading-[1.05]">
              Meet <span className="italic font-light">{name}.</span>
            </h2>
            {intro && <p className="mt-4 text-lg text-muted-foreground max-w-2xl">{intro}</p>}
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
            {ctaText && ctaLink && (
              ctaLink.startsWith("/") ? (
                <Link to={ctaLink} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition">
                  {ctaText} <ArrowUpRight size={18} />
                </Link>
              ) : (
                <a href={ctaLink} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition">
                  {ctaText} <ArrowUpRight size={18} />
                </a>
              )
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
        </motion.div>
      </div>

      {/* Full biography modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-8 lg:p-10 shadow-2xl"
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

              {(vision || mission) && (
                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  {vision && (
                    <div className="rounded-2xl border border-border bg-background p-5">
                      <p className="text-xs uppercase tracking-widest text-primary">Vision</p>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{vision}</p>
                    </div>
                  )}
                  {mission && (
                    <div className="rounded-2xl border border-border bg-background p-5">
                      <p className="text-xs uppercase tracking-widest text-primary">Mission</p>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{mission}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}


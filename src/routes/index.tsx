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

import { ArrowUpRight, Sparkles, Calendar, MapPin, Play, Instagram, Youtube, Facebook, Twitter, Linkedin, HeartHandshake, Target, Music2, Users2, Rocket, Heart, Video, ChevronDown } from "lucide-react";

import heroImg from "@/assets/tejasdhoke.jpg";
import classesImg from "@/assets/classes.jpg";

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
  const common = "absolute inset-0 h-full w-full object-cover lg:object-cover lg:object-center transform-gpu backface-hidden";

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
      listPublicCelebrities().then((r: any) => setCelebrities(r ?? [])).catch((e) => { console.error("Failed to load celebrities:", e); setCelebrities([]); });
      listPublicBrands().then((r: any) => setBrands(r ?? [])).catch((e) => { console.error("Failed to load brands:", e); setBrands([]); });
      listPublicGlobe().then((r: any) => setGlobe(r ?? [])).catch((e) => { console.error("Failed to load globe locations:", e); setGlobe([]); });
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

  // Soonest upcoming workshop — fully dynamic, sourced from whatever the
  // admin has entered for event_date / capacity / seats_taken. No hardcoded
  // dates or seat counts anywhere in the hero.
  const nextWorkshop = (() => {
    const upcoming = workshops
      .filter((w) => w.event_date && new Date(w.event_date) >= new Date(new Date().toDateString()))
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    const w = upcoming[0];
    if (!w) return null;
    return {
      id: w.id,
      dateLabel: new Date(w.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "long" }),
    };
  })();

  return (
    <>

      {/* Sticky mobile CTA */}
      <Link
        to="/workshops"
        className="md:hidden fixed bottom-5 inset-x-5 z-40 flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold py-3.5 shadow-[0_10px_40px_-10px_color-mix(in_oklab,var(--primary)_60%,transparent)]"
      >
        <Sparkles size={16} /> Register for a Workshop
      </Link>

      {/* HERO — Cinematic split-screen: portrait carousel + editorial intro */}
      <section
        id="hero"
        ref={heroSectionRef}
        className="relative overflow-hidden border-b border-border"
        style={{ background: "var(--background)" }}
      >
        {/* Stage-lighting radial glows */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
          <div
            className="absolute -top-40 -left-40 h-[38rem] w-[38rem] rounded-full blur-[120px] opacity-60"
            style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 55%, transparent), transparent 65%)" }}
          />
          <div
            className="absolute top-1/3 -right-40 h-[42rem] w-[42rem] rounded-full blur-[130px] opacity-50"
            style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--accent-cyan) 45%, transparent), transparent 65%)" }}
          />
          <div
            className="absolute -bottom-40 left-1/3 h-[32rem] w-[32rem] rounded-full blur-[120px] opacity-40"
            style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--accent-pink) 40%, transparent), transparent 65%)" }}
          />
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-4rem)]">
          {/* LEFT — Portrait carousel (cinematic) */}
          <div className="relative min-h-[70vh] lg:min-h-[calc(100vh-4rem)] overflow-hidden order-2 lg:order-1"
               style={{ background: "var(--surface)" }}>
            {/* Blurred backdrop layer for full coverage */}
            {heroSlides[slideIdx] && (
              <div aria-hidden className="absolute inset-0 overflow-hidden">
                <div
                  className="absolute inset-0 scale-110 blur-2xl opacity-50"
                  style={{
                    backgroundImage: `url(${heroSlides[slideIdx]?.image_url ?? heroImg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              </div>
            )}

            <AnimatePresence mode="sync" initial={false}>
              <motion.div
                key={heroSlides[slideIdx]?.id ?? `fallback-${slideIdx}`}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 1.1, ease: [0.22, 0.9, 0.28, 1] }}
                className="absolute inset-0"
              >
                {heroSlides.length > 0 ? (
                  <HeroSlideMedia
                    src={heroSlides[slideIdx]?.image_url}
                    alt={heroSlides[slideIdx]?.alt ?? "Tejas D Dhoke"}
                    active
                    priority
                    fallbackSrc={heroImg}
                    onReady={() => setHeroReady(true)}
                  />
                ) : (
                  <img
                    src={heroImg}
                    alt="Tejas D Dhoke"
                    className="absolute inset-0 h-full w-full object-cover"
                    fetchPriority="high"
                    decoding="async"
                    onLoad={() => setHeroReady(true)}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Warm neighbours off-screen */}
            {warmSlides && heroSlides.length > 1 && (
              <div aria-hidden className="hidden">
                {heroSlides.map((s, i) =>
                  i !== slideIdx ? (
                    <HeroSlideMedia
                      key={`warm-${s.id ?? i}`}
                      src={s.image_url}
                      alt=""
                      active={false}
                      fallbackSrc={heroImg}
                    />
                  ) : null,
                )}
              </div>
            )}

            {/* Luminosity tint + edge gradient bleeding into right side */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, oklch(0 0 0 / 15%) 0%, transparent 40%, oklch(0 0 0 / 55%) 100%)",
              }}
            />
            <div
              aria-hidden
              className="hidden lg:block absolute inset-y-0 right-0 w-40 pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, var(--background))" }}
            />
            {showStageLights && <StageLights />}

            {/* Corner artist label */}
            <div className="absolute bottom-8 left-8 z-10">
              <div className="h-px w-16 mb-4" style={{ background: "var(--accent-cyan)" }} />
              <p className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: "var(--accent-cyan)" }}>
                Movement Architect
              </p>
              {nextWorkshop && (
                <p className="mt-3 inline-flex items-center gap-2 text-xs sm:text-sm text-white/90">
                  <Calendar size={13} className="text-primary shrink-0" />
                  Next workshop: <span className="font-medium">{nextWorkshop.dateLabel}</span>
                </p>
              )}
            </div>

            {/* Dots */}
            {heroSlides.length > 1 && (
              <div className="absolute bottom-8 right-8 z-20 flex gap-2">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlideIdx(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === slideIdx ? 28 : 8,
                      background:
                        i === slideIdx
                          ? "var(--gradient-primary)"
                          : "color-mix(in oklab, white 40%, transparent)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — Editorial intro */}
          <div className="relative flex flex-col justify-center px-6 py-16 md:px-12 lg:px-16 xl:px-24 order-1 lg:order-2 z-10">
            {/* Subtle grid backdrop */}
            <div aria-hidden className="hero-grid pointer-events-none absolute inset-0 opacity-40" />
            {/* Floating ornament */}
            <motion.div
              aria-hidden
              animate={{ y: [0, -14, 0], rotate: [0, 6, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute top-16 right-10 h-28 w-28 rounded-full blur-3xl opacity-70"
              style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--accent-gold) 65%, transparent), transparent 70%)" }}
            />
            <motion.div variants={stagger} initial="hidden" animate="show" className="relative max-w-xl">
              <motion.h1
                variants={item}
                className="font-display text-5xl sm:text-7xl lg:text-8xl xl:text-[8.5rem] leading-[0.92] tracking-tight text-foreground text-balance"
              >
                Tejas D <br />
                <span className="italic shimmer-text">Dhoke</span>
              </motion.h1>

              <motion.div variants={item} className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-4">
                  <MagneticButton>
                    {nextWorkshop ? (
                      <Link
                        to="/workshops/$id"
                        params={{ id: nextWorkshop.id }}
                        className="group relative inline-flex items-center gap-2 rounded-full px-9 py-4 text-primary-foreground text-[11px] font-bold uppercase tracking-[0.22em] overflow-hidden shine-sweep"
                        style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Explore Workshops
                          <ArrowUpRight size={14} className="group-hover:rotate-45 transition-transform" />
                        </span>
                      </Link>
                    ) : (
                      <a
                        href="#workshops"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById("workshops")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="group relative inline-flex items-center gap-2 rounded-full px-9 py-4 text-primary-foreground text-[11px] font-bold uppercase tracking-[0.22em] overflow-hidden shine-sweep"
                        style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Explore Workshops
                          <ArrowUpRight size={14} className="group-hover:rotate-45 transition-transform" />
                        </span>
                      </a>
                    )}
                  </MagneticButton>
                </div>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </section>


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





      {/* WORKSHOPS — dynamic (primary CTA — placed directly after hero) */}
      <section id="workshops" className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-8 lg:pt-24 lg:pb-12">
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
                      <Link to="/workshops/$id" params={{ id: w.id }} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted/60 transition-colors">Details</Link>
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
                      <Link to="/workshops/$id" params={{ id: w.id }} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted/60 transition-colors">Details</Link>
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



      {/* FOUNDER / ABOUT */}
      <FounderSection founder={founder} />

      {/* THE TEJ METHOD — USP / philosophy */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-border">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-widest text-primary inline-flex items-center gap-1.5">
            <Sparkles size={12} /> The Tej Method
          </p>
          <h2 className="mt-3 font-display text-4xl lg:text-6xl font-bold leading-[1.02] text-balance">
            Not just steps. <span className="italic font-light">A way of moving.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every session is built around four pillars — whether you're stepping onto a
            dance floor for the first time or sharpening years of technique.
          </p>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            { icon: HeartHandshake, title: "Confidence", desc: "Every class is built to make you feel capable before it makes you feel correct." },
            { icon: Target, title: "Technique", desc: "Real fundamentals, broken down so beginners and pros both walk away sharper." },
            { icon: Music2, title: "Musicality", desc: "Movement that listens to the music, not just counts to it." },
            { icon: Users2, title: "Performance", desc: "Stage-ready energy — because a workshop should prepare you to be watched, not just to watch." },
          ].map((p) => (
            <motion.div key={p.title} variants={item} className="rounded-2xl border border-border bg-card p-6 hover:border-primary/60 transition-colors">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <p.icon size={20} />
              </div>
              <p className="mt-4 font-display text-xl font-bold">{p.title}</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* SIGNATURE PROGRAMS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-border">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Signature Programs</p>
            <h2 className="mt-3 font-display text-4xl lg:text-6xl font-bold leading-[1.02] text-balance">
              Find your <span className="italic font-light">format.</span>
            </h2>
          </div>
          <p className="hidden md:block text-xs uppercase tracking-widest text-muted-foreground max-w-xs text-right">
            Four ways to train with Tejas.
          </p>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            { icon: Rocket, title: "Zero to Hero", desc: "A full beginner-to-confident-dancer track — no prior experience needed.", href: "/zero-to-hero" },
            { icon: Calendar, title: "Workshops", desc: "Live intensives across styles, running through the year.", href: "/workshops" },
            { icon: Heart, title: "Wedding Choreography", desc: "Bespoke routines for the couple, the family, or the whole baraat.", href: "/contact" },
            { icon: Video, title: "Online Training", desc: "Structured remote training for dancers anywhere in the world.", href: "/online-trainings" },
          ].map((p) => (
            <motion.div key={p.title} variants={item}>
              <Link to={p.href} className="group block h-full rounded-2xl border border-border bg-card p-6 hover:border-primary transition-colors">
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <p.icon size={20} />
                </div>
                <p className="mt-4 font-display text-xl font-bold">{p.title}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowUpRight size={14} />
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* DANCE STYLES */}
      <section id="classes" className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-border">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">What we teach</p>
            <h2 className="mt-3 font-display text-4xl lg:text-6xl font-bold text-balance leading-[1.02]">
              Styles on the <span className="italic font-light">floor.</span>
            </h2>
          </div>
          <p className="hidden md:block text-xs uppercase tracking-widest text-muted-foreground max-w-xs text-right">
            Four vocabularies. One fusion.
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

      {/* LATEST CHOREOGRAPHIES */}
      <LatestChoreographies items={choreos} />


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

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 lg:px-10 py-24 border-t border-border">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-primary">Questions</p>
          <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold text-balance">
            Before you <span className="italic font-light">register.</span>
          </h2>
        </div>
        <div className="mt-12 space-y-3">
          {[
            { q: "I've never danced before — can I still join?", a: "Yes. Every workshop is taught with beginners in mind first — steps are broken down from the ground up, and there's no prerequisite experience needed." },
            { q: "What should I wear?", a: "Comfortable, breathable clothing you can move freely in, and shoes with grip (sneakers or dance shoes). Avoid anything too loose or slippery-soled." },
            { q: "Is there a refund if I can't make it?", a: "Reach out to us before the workshop date and we'll work out a fair option — reschedule to a future batch or a partial refund, depending on timing." },
            { q: "Do I get a video of my performance?", a: "Select workshops include a Silver Seat add-on with a professionally shot and edited solo video, ready for socials and your portfolio — look for it on the workshop's registration page." },
            { q: "How do I pay?", a: "Registration is done securely via UPI. After you register, you'll get a QR code to scan and a place to upload your payment screenshot for confirmation." },
          ].map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

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


          <p className="relative mt-8 text-sm text-white/60">
            Not ready to register today?{" "}
            <Link to="/contact" className="text-primary underline underline-offset-4 hover:text-white transition-colors">
              Get in touch and we'll notify you about the next batch
            </Link>.
          </p>

          <style>{`
            @keyframes ctaPulse {
              0%   { box-shadow: 0 0 0 0   color-mix(in oklab, var(--primary) 55%, transparent); }
              70%  { box-shadow: 0 0 0 22px color-mix(in oklab, var(--primary) 0%,  transparent); }
              100% { box-shadow: 0 0 0 0   color-mix(in oklab, var(--primary) 0%,  transparent); }
            }
          `}</style>

        </motion.div>
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

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
      >
        <span className="font-medium">{q}</span>
        <ChevronDown size={18} className={`shrink-0 text-primary transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

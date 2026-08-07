import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Compass,
  Eye,
  Flame,
  GraduationCap,
  Heart,
  Instagram,
  Music4,
  Play,
  Rocket,
  Sparkles,
  Target,
  Youtube,
} from "lucide-react";
import { AnimatedCounter } from "@/components/site/AnimatedCounter";

import { pauseHomepageVideo, playHomepageVideo } from "@/lib/home-video-playback";

/**
 * EditorialHero — the reference "story board" hero:
 * three editorial columns (philosophy · framed portrait with stat pills ·
 * upcoming studio day) sitting under one centered display title.
 *
 * Everything animates with compositor-only CSS (opacity + transform), so the
 * whole screen stays at 60fps on mobile.
 */
export function EditorialHero({
  founder,
  workshops,
  image,
  clips,
  badges,
  onReady,
  onExplore,
  onWatch,
}: {
  founder: any | null;
  workshops: any[];
  image: string;
  clips: string[];
  badges: { value: string; label: string }[];
  onReady?: () => void;
  onExplore: () => void;
  onWatch: () => void;
}) {
  const name = founder?.name || "Tejas D Dhoke";
  const belief = founder?.belief || founder?.philosophy ||
    "Beyond the steps and choreography, dance is a spark that makes us feel alive.";
  const vision = founder?.vision ||
    "To create a space where everyone — from absolute beginners to artists — can say, \u201CI belong here.\u201D";
  const mission = founder?.mission ||
    "Building dancers with craft, confidence and character — one honest rehearsal at a time.";
  const biography = founder?.biography || "";
  const achievements: string[] = Array.isArray(founder?.achievements) ? founder.achievements : [];
  const socials = founder?.socials || {};
  const [open, setOpen] = useState(false);
  const hasMore = Boolean(biography || achievements.length);

  

  const aboutCards = (
    <div className="flex w-full min-w-0 flex-col gap-2.5 sm:gap-3">
      {[
        {
          k: "About",
          t: "Visionary Choreographer",
          v: "A celebrated choreographer, dance educator, entrepreneur and founder of DanceFit Live — known for high-energy choreography and a teaching style that makes dance accessible, joyful and inclusive for every age and skill level, across Bollywood, Hip-Hop, Salsa and Contemporary.",
          Icon: Flame,
          float: "float-2",
        },
        {
          k: "About",
          t: "Inspiring Mentor",
          v: "Thousands of students trained, hundreds of masterclasses delivered, and collaborations with leading Bollywood and music-industry professionals — simplifying complex choreography into easy-to-follow steps that build confidence while keeping the joy alive.",
          Icon: Compass,
          float: "float-3",
        },
        {
          k: "About",
          t: "Founder of DanceFit Live",
          v: "Dance is a powerful medium for self-expression, confidence, fitness and personal transformation. Through DanceFit Live, workshops and digital platforms, Tejas keeps inspiring a global dance community and making quality dance education accessible to everyone.",
          Icon: Target,
          float: "float-1",
        },
      ].map((c, i) => (
        <div key={c.t} className={c.float}>
          <article
            className="ed-rise ed-card group/card flex h-[7.5rem] flex-col overflow-hidden rounded-[16px] p-3 transition-transform duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${260 + i * 110}ms` }}
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-border/40 pb-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[10px] border border-border/60 bg-surface/60 text-primary transition-transform duration-300 group-hover/card:scale-110">
                <c.Icon size={13} />
              </span>
              <div className="min-w-0">
                <p className="ed-eyebrow text-[8px]">{c.k}</p>
                <h2 className="font-display text-[13px] font-bold leading-tight">{c.t}</h2>
              </div>
            </div>
            <p className="ed-scroll mt-2 min-h-0 flex-1 overflow-y-auto pr-1 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-line">
              {c.v}
            </p>
          </article>
        </div>
      ))}
    </div>
  );


  const bvmCards = (
    <div className="flex w-full min-w-0 flex-col gap-2.5 sm:gap-3">
      {[
        {
          k: "Philosophy",
          t: "Belief",
          v: belief,
          Icon: Heart,
          float: "float-1",
        },
        {
          k: "Purpose",
          t: "Vision",
          v: vision,
          Icon: Eye,
          float: "float-2",
        },
        {
          k: "Mission",
          t: "Mission",
          v: mission,
          Icon: Rocket,
          float: "float-3",
        },
      ].map((c, i) => (
        <div key={c.t} className={c.float}>
          <article
            className="ed-rise ed-card group/card flex h-[7.5rem] flex-col overflow-hidden rounded-[16px] p-3 transition-transform duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${260 + i * 110}ms` }}
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-border/40 pb-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[10px] border border-border/60 bg-surface/60 text-primary transition-transform duration-300 group-hover/card:scale-110">
                <c.Icon size={13} />
              </span>
              <div className="min-w-0">
                <p className="ed-eyebrow text-[8px]">{c.k}</p>
                <h2 className="font-display text-[13px] font-bold leading-tight">{c.t}</h2>
              </div>
            </div>
            <p className="ed-scroll mt-2 min-h-0 flex-1 overflow-y-auto pr-1 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-line">
              {c.v}
            </p>
          </article>

        </div>
      ))}
    </div>
  );

  const stat = (needle: string) => {
    const b = badges?.find((x) => x.label.toLowerCase().includes(needle));
    const raw = b?.value ?? "0";
    const n = parseInt(raw.replace(/[^0-9]/g, ""), 10) || 0;
    const suffix = raw.replace(/[0-9]/g, "");
    return { n, suffix, label: b?.label ?? "" };
  };

  const roles = [
    {
      t: "Dance Educator",
      Icon: GraduationCap,
      d: "Structured, joyful training that turns absolute beginners into confident movers.",
      stat: stat("dancer"),
      action: null as null | { label: string; onClick: () => void; icon: "play" | "arrow" },
    },
    {
      t: "Performer",
      Icon: Sparkles,
      d: "Sixteen years on stage — live shows, tours and screens across the world.",
      stat: stat("performance"),
      action: { label: "Watch Performances", onClick: onWatch, icon: "play" as const },
    },
    {
      t: "Choreographer",
      Icon: Music4,
      d: "Signature choreographies and workshops crafted for artists at every level.",
      stat: stat("workshop"),
      action: { label: "Explore Workshops", onClick: onExplore, icon: "arrow" as const },
    },
  ];

  return (
    <section className="relative w-full px-3 sm:px-6 lg:px-8 xl:px-12 pt-24 pb-6 lg:pt-24 lg:pb-10">
      <div className="mx-auto w-full max-w-[96rem]">
        <div className="mb-4 text-center">
          <p
            className="ed-rise mx-auto max-w-xl text-xs sm:text-base font-medium uppercase tracking-[0.22em] text-foreground/85"
            style={{ animationDelay: "190ms" }}
          >
            Transforming passion into performance.
          </p>
        </div>

        {/* Full-width hero image with floating corner cards */}
        <div className="relative">
          <HeroFrame
            image={image}
            clips={clips}
            alt={name}
            onReady={onReady}
            className="w-full"
          />

          {/* LEFT — floating Belief · Vision · Mission cards */}
          <aside className="pointer-events-none absolute left-2 sm:left-4 lg:left-6 xl:left-8 top-4 sm:top-6 lg:top-8 xl:top-10 z-40 hidden w-[9.5rem] sm:w-[11rem] lg:w-[13rem] xl:w-[15rem] flex-col gap-2 sm:gap-3 lg:flex">
            <div className="pointer-events-auto">{bvmCards}</div>
          </aside>

          {/* RIGHT — floating About cards */}
          <aside className="pointer-events-none absolute right-2 sm:right-4 lg:right-6 xl:right-8 top-4 sm:top-6 lg:top-8 xl:top-10 z-40 hidden w-[9.5rem] sm:w-[11rem] lg:w-[13rem] xl:w-[15rem] flex-col gap-2 sm:gap-3 lg:flex">
            <div className="pointer-events-auto">{aboutCards}</div>
          </aside>
        </div>

        {/* Mobile / tablet cards below the image */}
        <div className="mt-6 grid gap-4 lg:hidden">
          <div className="grid gap-4 sm:grid-cols-2">
            {bvmCards}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {aboutCards}
          </div>
        </div>

        <div className="ed-rise mt-6 flex shrink-0 flex-wrap items-center justify-center gap-3" style={{ animationDelay: "560ms" }}>
          <button
            type="button"
            onClick={onExplore}
            className="ed-cta group inline-flex items-center gap-2 rounded-full px-9 py-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.16em]"
          >
            Explore Workshops
            <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>

          <button
            type="button"
            onClick={onWatch}
            className="ed-ghost group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.14em]"
          >
            <Play size={13} className="transition-transform group-hover:scale-110" /> Watch Performances
          </button>
        </div>

        {/* ROLE CARDS */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r, i) => {
            const floatClass = i % 3 === 0 ? "float-1" : i % 3 === 1 ? "float-2" : "float-3";
            return (
              <div key={r.t} className={floatClass}>
                <article
                  className="ed-rise ed-card group/role flex flex-col p-5 transition-transform duration-300 hover:-translate-y-1.5"
                  style={{ animationDelay: `${620 + i * 110}ms` }}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-border/70 bg-surface/60 text-primary transition-transform duration-300 group-hover/role:scale-110">
                    <r.Icon size={18} />
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold">{r.t}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{r.d}</p>

                  {r.stat.label && (
                    <p className="mt-4 flex items-baseline gap-2">
                      <AnimatedCounter
                        value={r.stat.n}
                        suffix={r.stat.suffix}
                        className="font-display text-2xl font-bold text-primary"
                      />
                      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {r.stat.label}
                      </span>
                    </p>
                  )}

                  {r.action && (
                    <button
                      type="button"
                      onClick={r.action.onClick}
                      className="ed-ghost mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                    >
                      {r.action.icon === "play" ? <Play size={12} /> : <ArrowUpRight size={13} />}
                      {r.action.label}
                    </button>
                  )}
                </article>
              </div>
            );
          })}
        </div>

        {(hasMore || socials.instagram || socials.youtube) && (
          <div className="ed-rise mt-6 flex items-center justify-center gap-2" style={{ animationDelay: "620ms" }}>
            {hasMore && (
              <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium transition hover:border-primary hover:text-primary"
              >
                Know more <ArrowUpRight size={14} />
              </button>
            )}
            {socials.instagram && (
              <a href={socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="grid h-9 w-9 place-items-center rounded-full border border-border transition hover:border-primary hover:text-primary">
                <Instagram size={15} />
              </a>
            )}
            {socials.youtube && (
              <a href={socials.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                className="grid h-9 w-9 place-items-center rounded-full border border-border transition hover:border-primary hover:text-primary">
                <Youtube size={15} />
              </a>
            )}
          </div>
        )}
      </div>

      {open && (
        <div className="modal-fade fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="modal-pop relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card p-7 shadow-2xl lg:p-10">
            <button onClick={() => setOpen(false)} aria-label="Close"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-border transition hover:border-primary hover:text-primary">✕</button>
            <p className="ed-eyebrow">{founder?.title || "Founder"}</p>
            <h3 className="mt-2 font-display text-3xl font-bold">{name}</h3>
            {biography && <p className="mt-5 whitespace-pre-line leading-relaxed text-muted-foreground">{biography}</p>}
            {achievements.length > 0 && (
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {achievements.map((a, i) => (
                  <li key={i} className="rounded-xl border border-border bg-surface/60 p-3 text-sm text-muted-foreground">{a}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Tiny inlined WebP of the hero portrait (208 bytes). It paints on the very
 * first frame with zero network cost, so the frame is never empty and never
 * shows a broken-image glyph while the full-size portrait streams in.
 */
const HERO_LQIP =
  "data:image/webp;base64,UklGRsgAAABXRUJQVlA4ILwAAACQBgCdASoYACQAPrVUoUynJKMiKrgKAOAWiWcAzu2LGOrXCeLgFuSrTZX4ZknjnbfTfw2jufWLM6VDyckAAP6XxzNOFXdGBWxS/37jYN0Ut0kY9HXKco15NJdq83Y3DXreKaIuN4vcj+lzSgD60F/11m/O5PAATv7ZaRuI4ILkFtjLpDZROCvVVqWEbKCS8GsqMa5zvRRjzdY8X52uq7T8zMJUW3OXI2Fmjl5nY5xzkxtEhNKzfOSJySIAAA==";

function HeroFrame({ image, clips, alt, onReady, overlay, className }: { image: string; clips: string[]; alt: string; onReady?: () => void; overlay?: React.ReactNode; className?: string }) {
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // A new source starts as "not loaded" again so the blurred placeholder
  // covers the swap instead of flashing an empty box. Images that were already
  // in cache (or decoded during SSR hydration) never fire `load`, so check
  // `complete` right after mount too.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setLoaded(true);
      setFailed(false);
      onReady?.();
      return;
    }
    setLoaded(false);
    setFailed(false);
  }, [image]);

  useEffect(() => {
    if (clips.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % clips.length), 6000);
    return () => clearInterval(t);
  }, [clips.length]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const raf = requestAnimationFrame(() => void playHomepageVideo(v));
    return () => {
      cancelAnimationFrame(raf);
      pauseHomepageVideo(v);
    };
  }, [idx, clips.length]);

  const clip = clips[idx];
  const frameRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  // Subtle GPU-only pointer parallax on the hero media.
  useEffect(() => {
    const frame = frameRef.current;
    const media = mediaRef.current;
    if (!frame || !media) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = frame.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        media.style.transform = `translate3d(${x * -14}px, ${y * -14}px, 0) scale(1.04)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      media.style.transform = "translate3d(0,0,0) scale(1)";
    };
    frame.addEventListener("pointermove", onMove);
    frame.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      frame.removeEventListener("pointermove", onMove);
      frame.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={frameRef}
      className={["ed-rise relative w-full aspect-[2/3]", className].filter(Boolean).join(" ")}
      style={{ animationDelay: "180ms" }}
    >
      {/* Subtle warm background behind the portrait to blend with the page. */}
      <div className="absolute inset-0 bg-[#F7F5F0]" aria-hidden />
      <div
        ref={mediaRef}
        className="absolute inset-0 will-change-transform"
        style={{ transition: "transform 420ms cubic-bezier(0.22,1,0.36,1)" }}
      >
        {/* Premium blurred placeholder: visible until the portrait (or video
            poster) has decoded, and it stays put if the source ever fails —
            the browser's broken-image glyph is never shown. */}
        <img
          src={HERO_LQIP}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-contain blur-xl saturate-125 transition-opacity duration-500"
          style={{ opacity: loaded ? 0 : 1 }}
          draggable={false}
        />
        {clip ? (
          <video
            ref={videoRef}
            key={clip}
            src={clip}
            muted
            loop
            playsInline
            preload="metadata"
            poster={image}
            disablePictureInPicture
            className="absolute inset-0 h-full w-full object-contain transition-opacity duration-500"
            style={{ opacity: loaded ? 1 : 0 }}
            onLoadedData={() => {
              setLoaded(true);
              onReady?.();
            }}
          />
        ) : (
          <img
            src={image}
            alt={alt}
            width={1066}
            height={1600}
            fetchPriority="high"
            decoding="async"
            className="ed-kenburns absolute inset-0 h-full w-full object-contain transition-opacity duration-500"
            style={{ opacity: loaded && !failed ? 1 : 0 }}
            ref={imgRef}
            onLoad={() => {
              setLoaded(true);
              onReady?.();
            }}
            onError={() => {
              setFailed(true);
              onReady?.();
            }}
            draggable={false}
          />
        )}
      </div>
      {/* cinematic vignette + top light falloff */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 40%, transparent 55%, oklch(0 0 0 / 45%) 100%)",
        }}
      />
      {overlay ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-2/5"
            style={{ background: "linear-gradient(to bottom, oklch(0 0 0 / 62%), transparent)" }}
          />
          {overlay}
        </>
      ) : null}
    </div>
  );
}

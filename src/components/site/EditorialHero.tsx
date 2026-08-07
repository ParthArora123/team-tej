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

  

  const cardWrap = "flex w-full min-w-0 flex-col gap-2.5 sm:gap-3";

  const renderAboutCards = (wrapClass = cardWrap) => (
    <div className={wrapClass}>
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
            className="ed-rise ed-card !bg-white group/card flex h-[7rem] sm:h-[8rem] flex-col overflow-hidden rounded-[18px] p-3 transition-transform duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${260 + i * 110}ms` }}
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-border/60 pb-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[10px] border border-border/70 bg-surface/60 text-primary transition-transform duration-300 group-hover/card:scale-110">
                <c.Icon size={13} />
              </span>
              <div className="min-w-0">
                <p className="ed-eyebrow text-[8px] sm:text-[9px] text-muted-foreground">{c.k}</p>
                <h2 className="font-display text-[13px] sm:text-[14px] font-bold leading-tight text-foreground">{c.t}</h2>
              </div>
            </div>
            <p className="ed-scroll mt-2 min-h-0 flex-1 overflow-y-auto pr-1 text-[11px] sm:text-[12px] leading-relaxed text-muted-foreground whitespace-pre-line">
              {c.v}
            </p>
          </article>
        </div>
      ))}
    </div>
  );


  const renderBvmCards = (wrapClass = cardWrap) => (
    <div className={wrapClass}>

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
            className="ed-rise ed-card !bg-white group/card flex h-[7rem] sm:h-[8rem] flex-col overflow-hidden rounded-[18px] p-3 transition-transform duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${260 + i * 110}ms` }}
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-border/60 pb-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[10px] border border-border/70 bg-surface/60 text-primary transition-transform duration-300 group-hover/card:scale-110">
                <c.Icon size={13} />
              </span>
              <div className="min-w-0">
                <p className="ed-eyebrow text-[8px] sm:text-[9px] text-muted-foreground">{c.k}</p>
                <h2 className="font-display text-[13px] sm:text-[14px] font-bold leading-tight text-foreground">{c.t}</h2>
              </div>
            </div>
            <p className="ed-scroll mt-2 min-h-0 flex-1 overflow-y-auto pr-1 text-[11px] sm:text-[12px] leading-relaxed text-muted-foreground whitespace-pre-line">
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
      stats: [
        { n: 16, suffix: "+", label: "Experience" },
        { n: 100, suffix: "k+", label: "Dancers Trained" },
      ],
      action: null as null | { label: string; onClick: () => void; icon: "play" | "arrow" },
    },
    {
      t: "Performer",
      Icon: Sparkles,
      d: "Sixteen years on stage — live shows, tours and screens across the world.",
      stats: [stat("performance")],
      action: { label: "Watch Performances", onClick: onWatch, icon: "play" as const },
    },
    {
      t: "Choreographer",
      Icon: Music4,
      d: "Signature choreographies and workshops crafted for artists at every level.",
      stats: [stat("workshop")],
      action: { label: "Explore Workshops", onClick: onExplore, icon: "arrow" as const },
    },
  ];

  return (
    <section className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-20 pb-8 sm:pt-24 lg:pt-24 lg:pb-10">
      <div className="mx-auto w-full max-w-[96rem]">
        <div className="mb-5 text-center sm:mb-4">
          <p
            className="ed-rise ed-eyebrow mb-2 text-[10px] tracking-[0.3em] text-muted-foreground sm:hidden"
            style={{ animationDelay: "80ms" }}
          >
            Founder · DanceFit Live
          </p>
          <h1
            className="ed-rise font-display text-[2.15rem] leading-[1.05] sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground"
            style={{ animationDelay: "120ms" }}
          >
            {name}
          </h1>
          <p
            className="ed-rise mx-auto mt-3 max-w-xl text-[10px] leading-relaxed sm:text-base font-medium uppercase tracking-[0.2em] sm:tracking-[0.22em] text-foreground/85"
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
          <aside className="pointer-events-none absolute left-2 sm:left-4 lg:left-6 xl:left-8 top-3 sm:top-4 lg:top-5 xl:top-6 z-40 hidden w-[9.5rem] sm:w-[10.5rem] lg:w-[12.5rem] xl:w-[14rem] flex-col gap-2.5 sm:gap-3 lg:flex">
            <div className="pointer-events-auto">{renderBvmCards()}</div>
          </aside>

          {/* RIGHT — floating About cards */}
          <aside className="pointer-events-none absolute right-2 sm:right-4 lg:right-6 xl:right-8 top-3 sm:top-4 lg:top-5 xl:top-6 z-40 hidden w-[9.5rem] sm:w-[10.5rem] lg:w-[12.5rem] xl:w-[14rem] flex-col gap-2.5 sm:gap-3 lg:flex">
            <div className="pointer-events-auto">{renderAboutCards()}</div>
          </aside>
        </div>

        {/* Mobile / tablet cards below the image */}
        <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 lg:hidden">
          {renderBvmCards("grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4")}
          {renderAboutCards("grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4")}
        </div>

        <div
          className="ed-rise mt-6 grid w-full grid-cols-1 gap-3 sm:flex sm:shrink-0 sm:flex-wrap sm:items-center sm:justify-center"
          style={{ animationDelay: "560ms" }}
        >
          <button
            type="button"
            onClick={onExplore}
            className="ed-cta group inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] sm:w-auto sm:px-9 sm:text-sm"
          >
            Explore Workshops
            <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>

          <button
            type="button"
            onClick={onWatch}
            className="ed-ghost group inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] sm:w-auto sm:text-sm"
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

                  {r.stats.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-2">
                      {r.stats.map((s) => (
                        <p key={s.label} className="flex items-baseline gap-2">
                          <AnimatedCounter
                            value={s.n}
                            suffix={s.suffix}
                            className="font-display text-2xl font-bold text-primary"
                          />
                          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            {s.label}
                          </span>
                        </p>
                      ))}
                    </div>
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

function HeroFrame({ image, clips, alt, onReady, overlay, className }: { image: string; clips: string[]; alt: string; onReady?: () => void; overlay?: React.ReactNode; className?: string }) {
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
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
    const bg = bgVideoRef.current;
    if (!v) return;
    const raf = requestAnimationFrame(() => {
      void playHomepageVideo(v);
      if (bg) void playHomepageVideo(bg);
    });
    return () => {
      cancelAnimationFrame(raf);
      pauseHomepageVideo(v);
      if (bg) pauseHomepageVideo(bg);
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
      className={["ed-rise light-sweep relative w-full overflow-hidden rounded-3xl aspect-[9/16] sm:aspect-[3/4] lg:aspect-[3/2] max-h-[85vh] sm:max-h-[80vh] lg:max-h-[75vh]", className].filter(Boolean).join(" ")}
      style={{ animationDelay: "180ms" }}
    >
      {/* Soft bottom wave overlay for a polished edge transition. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-1/3"
        style={{
          background:
            "linear-gradient(to top, color-mix(in oklab, var(--surface) 85%, transparent), transparent)",
          maskImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%23000' fill-opacity='1' d='M0,192L60,186.7C120,181,240,171,360,181.3C480,192,600,224,720,224C840,224,960,192,1080,181.3C1200,171,1320,181,1380,186.7L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z'%3E%3C/path%3E%3C/svg%3E\")",
          maskSize: "100% 100%",
          maskRepeat: "no-repeat",
        }}
      />

      <div
        ref={mediaRef}
        className="absolute inset-0 will-change-transform bg-surface"
        style={{ transition: "transform 420ms cubic-bezier(0.22,1,0.36,1)" }}
      >
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

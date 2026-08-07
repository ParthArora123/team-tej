import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Instagram, Play, Youtube } from "lucide-react";


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

  const columns = [
    { k: "Philosophy", t: "Belief", v: belief },
    { k: "Purpose", t: "Vision", v: vision },
    { k: "Mission", t: "Mission", v: mission },
  ];


  const cards = (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {columns.map((c, i) => (
        <article
          key={c.t}
          className="ed-rise ed-card group/card p-5 lg:p-6"
          style={{ animationDelay: `${260 + i * 110}ms` }}
        >
          <p className="ed-eyebrow">{c.k}</p>
          <h2 className="mt-1.5 font-display text-lg lg:text-xl font-bold">{c.t}</h2>
          <p
            className={`mt-2 text-[13.5px] leading-relaxed text-muted-foreground whitespace-pre-line ${
              c.t === "Mission" ? "ed-scroll max-h-[9.5rem] overflow-y-auto pr-2" : ""
            }`}
          >
            {c.v}
          </p>
        </article>
      ))}
    </div>
  );

  return (
    <section className="relative w-full px-3 sm:px-6 lg:px-10 pt-24 pb-10 lg:pt-24 lg:pb-16">
      <div className="mx-auto grid w-full max-w-[92rem] items-center gap-8 lg:grid-cols-[minmax(280px,22rem)_1fr] lg:gap-12">
        {/* LEFT — Belief · Vision · Mission (below hero on mobile via order) */}
        <aside className="order-2 lg:order-1">{cards}</aside>

        {/* RIGHT — headline, portrait, CTAs */}
        <div className="order-1 flex min-w-0 flex-col justify-center lg:order-2">
          <header className="relative z-10 shrink-0 text-center">
            <h1 className="ed-rise cine-title font-display text-[2.9rem] leading-[0.9] sm:text-6xl lg:text-7xl xl:text-[6.5rem] font-bold tracking-[-0.035em]">
              {name.toUpperCase()}
            </h1>
            <p className="ed-rise mt-3 flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[0.85rem] font-extrabold uppercase tracking-[0.24em]" style={{ animationDelay: "110ms" }}>
              <span className="role-educator">Dance Educator</span>
              <span className="text-muted-foreground text-[0.75rem]">•</span>
              <span className="role-performer">Performer</span>
              <span className="text-muted-foreground text-[0.75rem]">•</span>
              <span className="role-choreographer">Choreographer</span>
            </p>
            <p className="ed-rise mx-auto mt-3 max-w-xl text-sm sm:text-lg text-muted-foreground" style={{ animationDelay: "190ms" }}>
              Transforming passion into performance.
            </p>

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
          </header>

          <div className="relative z-30 mt-6 flex flex-col lg:mt-8">
            <div className="relative isolate z-30">
              <div aria-hidden className="cine-spot" />
              <HeroFrame image={image} clips={clips} alt={name} onReady={onReady} />
            </div>
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

function HeroFrame({ image, clips, alt, onReady }: { image: string; clips: string[]; alt: string; onReady?: () => void }) {
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
      className="ed-rise ed-float ed-frame light-sweep relative mx-auto aspect-[3/4] w-full max-w-[30rem] sm:max-w-[36rem] lg:aspect-[4/5] lg:max-w-[52rem] lg:max-h-[80svh]"
      style={{ animationDelay: "180ms" }}
    >
      {/* Blurred backdrop fill — inlined LQIP, so it costs no request and is
          painted before the real portrait arrives. */}
      <img
        src={HERO_LQIP}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
        draggable={false}
      />
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
    </div>
  );

}

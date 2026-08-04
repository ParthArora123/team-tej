import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { pauseHomepageVideo, playHomepageVideo } from "@/lib/home-video-playback";

export type CoverflowItem = {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  videoSrc?: string | null;
  embedSrc?: string | null;
  poster?: string | null;
  ctaLabel?: string | null;
  ctaLink?: string | null;
  ctaExternal?: boolean;
};

/**
 * Apple-style Cover Flow: a horizontal 3D carousel where the centre card is
 * the hero (playing, full size) and neighbours fan away in perspective.
 * Everything animates with GPU-friendly transforms only, so no layout shifts.
 */
export function CoverflowCarousel({
  items,
  interval = 5000,
}: {
  items: CoverflowItem[];
  interval?: number;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [side, setSide] = useState(1); // visible cards per side
  const rootRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<number | null>(null);
  // Set while the centre clip is buffering — the auto-advance timer waits so we
  // never cut away mid-stall (which is what looked like "freezing").
  const bufferingRef = useRef(false);

  const count = items.length;

  // Responsive fan width: desktop 3, tablet 2, mobile 1 card per side.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let frame = 0;
    const compute = () => {
      const w = window.innerWidth;
      setSide(w >= 1280 ? 3 : w >= 1024 ? 2 : 1);
    };
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || paused || count <= 1) return;
    let cancelled = false;
    let timer: number;
    const tick = () => {
      if (cancelled) return;
      if (bufferingRef.current) {
        // still loading — check again shortly instead of forcing a switch
        timer = window.setTimeout(tick, 600);
        return;
      }
      setActive((i) => (i + 1) % count);
      timer = window.setTimeout(tick, interval);
    };
    timer = window.setTimeout(tick, interval);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [inView, paused, count, interval]);

  const onBuffering = useCallback((b: boolean) => {
    bufferingRef.current = b;
  }, []);

  const go = useCallback((dir: number) => {
    setActive((i) => (i + dir + count) % count);
  }, [count]);


  // Shortest wrapped distance so the flow loops seamlessly in both directions.
  const rel = useCallback(
    (i: number) => {
      let d = i - active;
      if (d > count / 2) d -= count;
      if (d < -count / 2) d += count;
      return d;
    },
    [active, count]
  );

  const visible = useMemo(
    () => items.map((it, i) => ({ it, i, d: rel(i) })).filter((c) => Math.abs(c.d) <= side),
    [items, rel, side]
  );

  if (count === 0) return null;

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={(e) => { dragStart.current = e.clientX; }}
      onPointerUp={(e) => {
        const s = dragStart.current;
        dragStart.current = null;
        if (s == null) return;
        const dx = e.clientX - s;
        if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
      }}
      className="relative select-none overflow-hidden rounded-[28px] bg-muted/40 border border-border/60"
    >
      {/* soft ambient stage glow (light theme) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 118%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 68%), radial-gradient(80% 55% at 50% 0%, color-mix(in oklab, var(--primary) 10%, transparent), transparent 70%)",
        }}
      />

      <div
        className="relative mx-auto h-[104vw] max-h-[760px] min-h-[420px] w-full"
        style={{ perspective: "1400px", perspectiveOrigin: "50% 55%", touchAction: "pan-y" }}
      >

        {visible.map(({ it, i, d }) => {
          const isActive = d === 0;
          const dir = Math.sign(d);
          const abs = Math.abs(d);
          const translate = abs === 0 ? 0 : dir * (46 + (abs - 1) * 30);
          const rotate = isActive ? 0 : -dir * 62;
          const scale = isActive ? 1 : 0.9 - (abs - 1) * 0.07;
          const z = isActive ? 60 : -80 - (abs - 1) * 70;
          return (
            <div
              key={it.id}
              onClick={() => !isActive && setActive(i)}
              className={`absolute top-1/2 left-1/2 w-[78%] sm:w-[58%] lg:w-[44%] aspect-[3/4] rounded-[22px] overflow-hidden bg-foreground/90 will-change-transform ${
                isActive ? "" : "cursor-pointer"
              }`}
              style={{
                transform: `translate3d(calc(-50% + ${translate}%), -50%, ${z}px) rotateY(${rotate}deg) scale(${scale})`,
                transition: "transform 700ms cubic-bezier(0.22,1,0.36,1), opacity 700ms cubic-bezier(0.22,1,0.36,1), filter 700ms ease",
                zIndex: 50 - abs,
                opacity: isActive ? 1 : Math.max(0.5, 0.85 - (abs - 1) * 0.18),
                filter: isActive ? "none" : `brightness(0.82) saturate(0.9)`,
                boxShadow: isActive
                  ? "0 50px 100px -30px color-mix(in oklab, var(--foreground) 35%, transparent), 0 10px 30px -14px color-mix(in oklab, var(--foreground) 25%, transparent)"
                  : "0 30px 70px -34px color-mix(in oklab, var(--foreground) 30%, transparent)",
                backfaceVisibility: "hidden",
              }}
            >

              <Media item={it} isActive={isActive && inView} near={abs === 1} onEnded={() => count > 1 && go(1)} />

              {/* glassmorphism sheen */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[18px] border border-white/15"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(255,255,255,0.16), rgba(255,255,255,0.02) 38%, rgba(0,0,0,0.06))",
                  backdropFilter: isActive ? undefined : "blur(1px)",
                }}
              />

              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

              {it.badge && (
                <span className="absolute top-3 left-3 text-[10px] uppercase tracking-widest text-white/90 bg-white/10 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/20">
                  {it.badge}
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                  {it.subtitle && (
                    <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/70">{it.subtitle}</p>
                  )}
                  <h3 className="mt-0.5 font-display text-base sm:text-2xl font-bold text-white drop-shadow-md leading-snug line-clamp-2">
                    {it.title}
                  </h3>
                </div>
                {isActive && it.ctaLabel && it.ctaLink && (
                  it.ctaExternal ? (
                    <a
                      href={it.ctaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-medium hover:opacity-90 transition shrink-0"
                    >
                      {it.ctaLabel} <ArrowUpRight size={14} />
                    </a>
                  ) : (
                    <Link
                      to={it.ctaLink}
                      onClick={(e) => e.stopPropagation()}
                      className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-medium hover:opacity-90 transition shrink-0"
                    >
                      {it.ctaLabel} <ArrowUpRight size={14} />
                    </Link>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show ${it.title}`}
              aria-current={i === active}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-primary/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Media({ item, isActive, near = false, onEnded }: { item: CoverflowItem; isActive: boolean; near?: boolean; onEnded: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Only the active card (and the one queued next) keeps a <video> element in
  // the DOM — everything else falls back to the poster, so no off-screen clip
  // buffers or decodes in the background.
  const mounted = isActive || near;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      v.muted = true;
      void playHomepageVideo(v);
    } else {
      pauseHomepageVideo(v);
    }
    return () => { if (v) pauseHomepageVideo(v); };
  }, [isActive]);

  if (item.embedSrc && isActive) {
    return (
      <iframe
        src={`${item.embedSrc}?autoplay=1&mute=1&playsinline=1&rel=0&loop=1`}
        title={item.title}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    );
  }

  if (item.videoSrc) {
    return (
      <>
        {item.poster && (
          <img
            src={item.poster}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover scale-125 blur-xl opacity-100"
          />
        )}
        {item.poster && !isActive && (
          <img
            src={item.poster}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-contain"
          />
        )}
        {mounted && (
          <video
            ref={videoRef}
            src={item.videoSrc}
            poster={item.poster ?? undefined}
            muted
            loop
            playsInline
            preload={isActive ? "auto" : "metadata"}
            disableRemotePlayback
            disablePictureInPicture
            onEnded={onEnded}
            className="absolute inset-0 w-full h-full object-contain bg-transparent"
          />
        )}
      </>
    );
  }

  if (item.poster) {
    return (
      <>
        <img
          src={item.poster}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover scale-125 blur-xl opacity-100"
        />
        <img
          src={item.poster}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-contain"
        />
      </>
    );
  }

  return <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/40" />;
}

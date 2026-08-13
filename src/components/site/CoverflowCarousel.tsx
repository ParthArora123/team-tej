import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, Volume2, VolumeX } from "lucide-react";
import { pauseHomepageVideo, playHomepageVideo } from "@/lib/home-video-playback";

export type CoverflowItem = {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  videoSrc?: string | null;
  /** Lighter 720p encode used on small screens / slow links. */
  videoSrcMobile?: string | null;
  embedSrc?: string | null;
  poster?: string | null;
  ctaLabel?: string | null;
  ctaLink?: string | null;
  ctaExternal?: boolean;
};

/**
 * Cards render below 400px wide, so the 720p encode is the correct source on
 * every viewport. Avoid downloading the much heavier master unnecessarily.
 */
function pickSource(item: CoverflowItem): string | undefined {
  const full = item.videoSrc ?? undefined;
  const light = item.videoSrcMobile ?? undefined;
  return light || full;
}


/** Media layer — videos mount for all visible cards; only the active one plays. */
const CardMedia = memo(function CardMedia({
  item,
  active,
  playing,
  muted,
}: {
  item: CoverflowItem;
  active: boolean;
  playing: boolean;
  muted: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(false), [item.videoSrc, item.videoSrcMobile]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = active ? muted : true;
    if (!(active && playing)) {
      v.pause();
      return;
    }
    // Some browsers (battery saver, autoplay heuristics, slow decode) reject or
    // stall the first play() — retry on the events that signal readiness.
    // Bounded retries only: a permanent 1.5s interval woke the main thread
    // forever and showed up as periodic frame drops during playback.
    let tries = 0;
    let retry = 0;
    const attempt = () => {
      if (!v.paused) return;
      void playHomepageVideo(v);
      if (tries++ < 6 && !retry) {
        retry = window.setTimeout(() => {
          retry = 0;
          if (v.paused) attempt();
        }, 1200);
      }
    };
    attempt();
    v.addEventListener("canplay", attempt);
    v.addEventListener("loadeddata", attempt);
    return () => {
      if (retry) window.clearTimeout(retry);
      v.removeEventListener("canplay", attempt);
      v.removeEventListener("loadeddata", attempt);
    };
  }, [active, playing, muted]);



  useEffect(() => {
    const v = videoRef.current;
    return () => {
      if (v) pauseHomepageVideo(v);
    };
  }, []);

  // Nudge non-active videos so a real frame is decoded and painted.
  const primeFrame = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setReady(true);
    if (!active && v.currentTime === 0) {
      try {
        v.currentTime = 0.05;
      } catch {
        /* ignore */
      }
    }
  }, [active]);

  const backdrop = item.poster ? (
    <img
      src={item.poster}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className="blur-backdrop-wide opacity-70"
    />
  ) : (
    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/40" />
  );

  if (item.embedSrc) {
    return (
      <>
        {backdrop}
        {item.poster && !active && (
          <img
            src={item.poster}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-contain"
          />
        )}
        {active && (
          <iframe
            src={`${item.embedSrc}?autoplay=1&mute=1&playsinline=1&rel=0&loop=1`}
            title={item.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        )}
      </>
    );
  }

  return (
    <>
      {backdrop}
      {item.poster && (
        <img
          src={item.poster}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain"
          style={{ opacity: ready ? 0 : 1, transition: "opacity 400ms ease" }}
        />
      )}
      {playing && active && item.videoSrc && (
        <video
          ref={videoRef}
          src={pickSource(item)}
          poster={item.poster ?? undefined}
          muted
          loop
          playsInline
          preload="auto"
          disableRemotePlayback
          disablePictureInPicture
          onLoadedData={primeFrame}
          onCanPlay={primeFrame}
          className="absolute inset-0 h-full w-full object-contain"
          // Never place a blank video layer over its poster. The previous
          // condition made the video opaque merely because a poster existed.
          style={{ opacity: ready ? 1 : 0, transition: "opacity 250ms ease" }}
        />
      )}
    </>
  );
});


/**
 * Premium floating coverflow carousel for "Most Loved Choreographies".
 * Active clip is centred and largest; neighbours float behind with depth,
 * blur and dimming. Auto-advances every `interval` ms with smooth spring motion.
 */
export function CoverflowCarousel({
  items,
  interval = 5000,
}: {
  items: CoverflowItem[];
  interval?: number;
}) {
  const count = items.length;
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [width, setWidth] = useState(1200);
  const rootRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  // Responsive metrics
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setWidth(w));
    });
    obs.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      obs.disconnect();
    };
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      // Low threshold: on short/scaled laptop screens the tall card stage can
      // never reach 25% visibility, which would keep the video paused forever.
      threshold: 0.01,
      // Begin buffering before the user reaches the section. This avoids the
      // blank wait while still keeping all non-active cards poster-only.
      rootMargin: "900px 0px",
    });

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Auto-advance
  useEffect(() => {
    if (count < 2 || !inView || hovered) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, Math.max(2000, interval));
    return () => window.clearInterval(id);
  }, [count, inView, hovered, interval]);

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + count) % count),
    [count]
  );

  const metrics = useMemo(() => {
    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;
    const cardW = isMobile ? Math.min(280, width * 0.74) : isTablet ? 320 : 380;
    const spread = isMobile ? cardW * 0.52 : isTablet ? cardW * 0.62 : cardW * 0.72;
    const stageH = isMobile ? cardW * 1.42 : isTablet ? cardW * 1.36 : cardW * 1.34;
    return { cardW, spread, stageH, visible: isMobile ? 1 : 2 };
  }, [width]);

  if (count === 0) return null;

  const offsetOf = (i: number) => {
    let d = i - index;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  };

  return (
    <div
      ref={rootRef}
      className="relative w-full select-none"
      style={{ height: metrics.stageH + 96, perspective: 1400 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
        setHovered(true);
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        const end = e.changedTouches[0]?.clientX ?? null;
        if (start != null && end != null && Math.abs(end - start) > 40) {
          go(end < start ? 1 : -1);
        }
        touchX.current = null;
        setHovered(false);
      }}
    >
      <div
        className="relative mx-auto"
        style={{ height: metrics.stageH, transformStyle: "preserve-3d" }}
      >
        {items.map((item, i) => {
          const d = offsetOf(i);
          const abs = Math.abs(d);
          const hidden = abs > metrics.visible;
          const active = d === 0;

          return (
            <motion.div
              key={item.id}
              className="absolute left-1/2 top-0 will-change-transform"
              style={{
                width: metrics.cardW,
                height: metrics.stageH,
                marginLeft: -metrics.cardW / 2,
                pointerEvents: hidden ? "none" : "auto",
              }}
              animate={{
                x: d * metrics.spread,
                scale: active ? 1 : Math.max(0.72, 0.86 - (abs - 1) * 0.08),
                rotateY: d === 0 ? 0 : d > 0 ? -22 : 22,
                z: active ? 0 : -abs * 140,
                opacity: hidden ? 0 : active ? 1 : 0.55,
                filter: active ? "blur(0px)" : `blur(${Math.min(6, abs * 3)}px)`,
              }}
              transition={{ type: "spring", stiffness: 130, damping: 22, mass: 0.9 }}
              onClick={() => !active && setIndex(i)}
            >
              <motion.div
                animate={{ y: active && inView ? [0, -8, 0] : 0 }}
                transition={
                  active && inView
                    ? { duration: 6, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.4 }
                }

                className={`group relative h-full w-full overflow-hidden rounded-3xl border ${
                  active
                    ? "border-primary/40 shadow-[0_40px_100px_-30px_color-mix(in_oklab,var(--accent-gold)_35%,transparent)]"
                    : "border-border/60 shadow-[0_20px_40px_-20px_color-mix(in_oklab,var(--accent-gold)_22%,transparent)] cursor-pointer"
                } bg-card transition-shadow duration-300`}
              >
                <CardMedia item={item} active={active} playing={inView} muted={muted} />

                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "linear-gradient(to top, color-mix(in oklab, var(--foreground) 70%, transparent) 0%, color-mix(in oklab, var(--foreground) 10%, transparent) 55%, transparent 100%)" }}
                />

                {item.badge && (
                  <span className="absolute left-4 top-4 rounded-full border border-white/25 bg-foreground/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
                    {item.badge}
                  </span>
                )}

                {active && item.videoSrc && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMuted((m) => !m);
                    }}
                    aria-label={muted ? "Unmute video" : "Mute video"}
                    className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/20 text-white transition hover:bg-white/30"
                  >
                    {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                )}

                <div className="absolute inset-x-0 bottom-0 p-5">
                  {item.subtitle && (
                    <p className="text-[10px] uppercase tracking-widest text-white/70">
                      {item.subtitle}
                    </p>
                  )}
                  <h3 className="mt-1 font-display text-xl font-bold leading-tight text-white line-clamp-2">
                    {item.title}
                  </h3>

                  {active && item.ctaLabel && item.ctaLink && (
                    <div className="mt-3">
                      {item.ctaExternal ? (
                        <a
                          href={item.ctaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground transition-all hover:gap-2"
                        >
                          {item.ctaLabel} <ArrowUpRight size={13} />
                        </a>
                      ) : (
                        <Link
                          to={item.ctaLink}
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground transition-all hover:gap-2"
                        >
                          {item.ctaLabel} <ArrowUpRight size={13} />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to ${it.title}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-7 bg-primary" : "w-1.5 bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

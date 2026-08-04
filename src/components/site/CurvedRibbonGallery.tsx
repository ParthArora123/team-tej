import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Volume2, VolumeX } from "lucide-react";
import type { DeckItem } from "@/components/site/VideoDeck";
import { pauseHomepageVideo, playHomepageVideo } from "@/lib/home-video-playback";

const ROTATE_MS = 5000;
const RESUME_MS = 4500;
const SOUND_KEY = "ribbon-sound-on";
const EASE = [0.22, 1, 0.36, 1] as const;

type Stage = {
  /** horizontal gap between neighbouring cards, px */
  gap: number;
  /** vertical amplitude of the S-curve, px */
  amp: number;
  centerW: number;
  centerH: number;
  height: number;
  /** cards visible per side */
  side: number;
};

function computeStage(width: number): Stage {
  if (width && width < 640) {
    return { gap: 118, amp: 26, centerW: 208, centerH: 320, height: 430, side: 2 };
  }
  if (width && width < 1024) {
    return { gap: 190, amp: 40, centerW: 280, centerH: 400, height: 540, side: 2 };
  }
  return { gap: 268, amp: 56, centerW: 372, centerH: 512, height: 660, side: 3 };
}

function RibbonMedia({
  item,
  active,
  mount,
  preloadNext,
  soundOn,
  onSoundBlocked,
}: {
  item: DeckItem;
  active: boolean;
  mount: boolean;
  preloadNext: boolean;
  soundOn: boolean;
  onSoundBlocked: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(false), [item.video]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = !active || !soundOn;
  }, [active, soundOn]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) {
      v.muted = !soundOn;
      void playHomepageVideo(v).then(() => {
        if (!v.paused) return;
        v.muted = true;
        onSoundBlocked();
        void playHomepageVideo(v);
      });
    } else {
      pauseHomepageVideo(v);
    }
    return () => {
      if (v) pauseHomepageVideo(v);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, item.video]);

  return (
    <>
      {/* blurred fill so portrait clips never letterbox awkwardly */}
      <div
        aria-hidden
        className="absolute inset-0 scale-150 blur-2xl"
        style={
          item.poster
            ? { backgroundImage: `url(${item.poster})`, backgroundSize: "cover", backgroundPosition: "center" }
            : {
                background:
                  "linear-gradient(140deg, color-mix(in oklab, var(--primary) 40%, transparent), transparent 70%)",
              }
        }
      />
      {item.poster && (
        <img
          src={item.poster}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain"
          style={{ opacity: active && ready ? 0 : 1, transition: "opacity 400ms ease" }}
        />
      )}
      {item.video && mount && (
        <video
          ref={ref}
          src={item.video}
          poster={item.poster ?? undefined}
          playsInline
          loop
          preload={active ? "auto" : preloadNext ? "metadata" : "none"}
          disableRemotePlayback
          disablePictureInPicture
          onLoadedData={() => setReady(true)}
          onCanPlay={() => setReady(true)}
          className="absolute inset-0 h-full w-full transform-gpu object-contain"
        />
      )}
    </>
  );
}

/**
 * Curved Ribbon Gallery — clips flow along an S-shaped ribbon from right to
 * left, the centre one plays, everything else rests as a thumbnail. Pure GPU
 * transforms so the motion stays at 60fps.
 */
export function CurvedRibbonGallery({ items }: { items: DeckItem[] }) {
  const clips = useMemo(() => items.filter((i) => i.video || i.poster), [items]);
  const n = clips.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [width, setWidth] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countRef = useRef(n);
  countRef.current = n;
  const reduce = useReducedMotion();
  const stage = computeStage(width);

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem(SOUND_KEY) === "1") setSoundOn(true);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((s) => {
      const next = !s;
      try {
        sessionStorage.setItem(SOUND_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const handleSoundBlocked = useCallback(() => {
    setSoundOn(false);
    try {
      sessionStorage.setItem(SOUND_KEY, "0");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
      ro.observe(el);
      setWidth(el.getBoundingClientRect().width);
      return () => ro.disconnect();
    }
    setWidth(el.getBoundingClientRect().width);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // One timer, always stepping to the next clip and wrapping after the last.
  useEffect(() => {
    if (paused || !inView) return;
    const t = window.setInterval(() => {
      const total = countRef.current;
      if (total < 2) return;
      setIndex((i) => (i + 1) % total);
    }, ROTATE_MS);
    return () => window.clearInterval(t);
  }, [paused, inView]);

  const focus = useCallback((target: number) => {
    setPaused(true);
    setIndex(target);
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => setPaused(false), RESUME_MS);
  }, []);

  useEffect(
    () => () => {
      if (resumeRef.current) clearTimeout(resumeRef.current);
    },
    [],
  );

  useEffect(() => {
    setIndex((i) => (i < n ? i : 0));
  }, [n]);

  if (!n) return null;

  const active = clips[index];

  return (
    <div ref={rootRef} className="relative">
      {/* ambient stage lighting */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -inset-y-12 -z-10"
        style={{
          background:
            "radial-gradient(55% 60% at 50% 55%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 72%), radial-gradient(45% 45% at 12% 20%, color-mix(in oklab, var(--primary) 10%, transparent), transparent 70%)",
        }}
      />

      {/* the ribbon guide line */}
      <svg
        aria-hidden
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-40 w-full -translate-y-1/2 opacity-60"
      >
        <path
          d="M0,150 C240,40 400,40 600,100 C800,160 960,160 1200,50"
          fill="none"
          stroke="color-mix(in oklab, var(--primary) 32%, transparent)"
          strokeWidth="1.5"
        />
      </svg>

      <div
        className="relative w-full overflow-hidden"
        style={{ height: stage.height, perspective: 1500 }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {clips.map((item, i) => {
          let d = i - index;
          if (d > n / 2) d -= n;
          if (d < -n / 2) d += n;
          const abs = Math.abs(d);
          const hidden = abs > stage.side;
          const isActive = d === 0;

          // S-curve: horizontal spacing eases outward, vertical follows a sine wave.
          const x = Math.sign(d) * (stage.gap * (abs === 0 ? 0 : 0.82 + (abs - 1) * 0.78));
          const y = Math.sin((d / (stage.side + 1)) * Math.PI) * stage.amp + (isActive ? 0 : 14);
          const scale = isActive ? 1 : Math.max(0.42, 0.72 - (abs - 1) * 0.12);
          const w = stage.centerW;
          const h = stage.centerH;

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => (isActive ? undefined : focus(i))}
              aria-label={item.title}
              aria-current={isActive}
              initial={false}
              animate={{
                x,
                y,
                scale,
                rotate: reduce ? 0 : -d * 2.4,
                rotateY: reduce ? 0 : -d * 13,
                opacity: hidden ? 0 : isActive ? 1 : Math.max(0.35, 0.78 - (abs - 1) * 0.18),
                filter: isActive
                  ? "blur(0px) brightness(1)"
                  : `blur(${Math.min(3, abs * 1.1)}px) brightness(0.86)`,
                zIndex: 40 - abs,
              }}
              transition={{ duration: reduce ? 0.2 : 1.05, ease: EASE }}
              whileHover={hidden || isActive ? undefined : { scale: scale * 1.08, filter: "blur(0px) brightness(1.06)" }}
              className="group absolute left-1/2 top-1/2 overflow-hidden border backdrop-blur-md transform-gpu will-change-transform"
              style={{
                width: w,
                height: h,
                marginLeft: -w / 2,
                marginTop: -h / 2,
                borderRadius: 22,
                borderColor: isActive
                  ? "color-mix(in oklab, var(--primary) 42%, transparent)"
                  : "color-mix(in oklab, var(--foreground) 12%, transparent)",
                background: "color-mix(in oklab, var(--card) 55%, transparent)",
                pointerEvents: hidden ? "none" : "auto",
                cursor: isActive ? "default" : "pointer",
                boxShadow: isActive
                  ? "0 46px 100px -34px color-mix(in oklab, var(--primary) 62%, transparent), 0 0 0 1px color-mix(in oklab, var(--primary) 26%, transparent)"
                  : "0 30px 70px -34px color-mix(in oklab, var(--foreground) 45%, transparent)",
              }}
            >
              <RibbonMedia
                item={item}
                active={isActive && inView}
                mount={isActive || i === (index + 1) % n}
                preloadNext={i === (index + 1) % n}
                soundOn={soundOn}
                onSoundBlocked={handleSoundBlocked}
              />

              {/* glass reflection */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(150deg, color-mix(in oklab, var(--background) 40%, transparent) 0%, transparent 42%), linear-gradient(to top, color-mix(in oklab, var(--foreground) 66%, transparent), transparent 58%)",
                }}
              />

              <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ borderRadius: 22, boxShadow: "inset 0 1px 0 color-mix(in oklab, var(--background) 60%, transparent)" }}
              />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-left">
                {item.subtitle && (
                  <p className="text-[9px] uppercase tracking-[0.28em] text-primary-foreground/75">{item.subtitle}</p>
                )}
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-primary-foreground">{item.title}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {active?.video && (
        <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={toggleSound}
          aria-label={soundOn ? "Mute video" : "Unmute video"}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-foreground backdrop-blur transition-colors hover:border-primary hover:text-primary"
        >
          {soundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
          {soundOn ? "Sound on" : "Unmute"}
        </button>
        </div>
      )}

      {n > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {clips.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => focus(i)}
              aria-label={`Show ${item.title}`}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: i === index ? 26 : 8,
                background:
                  i === index ? "var(--primary)" : "color-mix(in oklab, var(--foreground) 22%, transparent)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CurvedRibbonGallery;

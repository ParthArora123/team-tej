import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Play, ChevronDown } from "lucide-react";
import { MagneticButton } from "@/components/site/MagneticButton";
import { MouseParallax } from "@/components/site/MouseParallax";

const isVideoUrl = (u?: string | null) =>
  !!u && /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u);

export type HeroMedia = {
  id?: string | null;
  image_url?: string | null;
  alt?: string | null;
};

const ROTATE_MS = 10000;

/** Preloads the next media item so transitions never show a black flash. */
function warm(src?: string | null) {
  if (!src || typeof window === "undefined") return;
  if (isVideoUrl(src)) {
    const v = document.createElement("video");
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;
    v.src = src;
    v.load();
  } else {
    const i = new Image();
    i.decoding = "async";
    i.src = src;
  }
}

function Layer({
  media,
  active,
  fallback,
  priority,
  onReady,
}: {
  media: HeroMedia;
  active: boolean;
  fallback: string;
  priority?: boolean;
  onReady?: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const src = media.image_url ?? fallback;

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) {
      const id = requestAnimationFrame(() => v.play().catch(() => {}));
      return () => cancelAnimationFrame(id);
    }
    try {
      v.pause();
    } catch {
      /* noop */
    }
  }, [active]);

  const common =
    "absolute inset-0 h-full w-full object-cover transform-gpu will-change-transform";

  if (isVideoUrl(src)) {
    if (!active) return null;
    return (
      <video
        ref={ref}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload={priority ? "auto" : "metadata"}
        poster={fallback}
        disableRemotePlayback
        disablePictureInPicture
        controls={false}
        onLoadedData={onReady}
        className={`${common} animate-[heroZoom_18s_ease-out_forwards]`}
      />
    );
  }

  return (
    <img
      src={src}
      alt={media.alt ?? ""}
      className={`${common} animate-[heroZoom_18s_ease-out_forwards]`}
      fetchPriority={priority ? "high" : "low"}
      decoding="async"
      draggable={false}
      onLoad={onReady}
    />
  );
}

export function CinematicHero({
  slides,
  portrait,
  badges,
  onReady,
}: {
  slides: HeroMedia[];
  portrait: string;
  badges: { value: string; label: string }[];
  onReady?: () => void;
}) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  const list = useMemo<HeroMedia[]>(
    () => (slides.length ? slides : [{ id: "fallback", image_url: null }]),
    [slides],
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Preload only the next item, right before the switch.
  useEffect(() => {
    if (list.length < 2) return;
    const t = setTimeout(
      () => warm(list[(i + 1) % list.length]?.image_url),
      Math.max(ROTATE_MS - 4000, 1000),
    );
    return () => clearTimeout(t);
  }, [i, list]);

  useEffect(() => {
    if (list.length < 2 || !visible || reduce) return;
    const t = setInterval(
      () => requestAnimationFrame(() => setI((v) => (v + 1) % list.length)),
      ROTATE_MS,
    );
    return () => clearInterval(t);
  }, [list.length, visible, reduce]);

  const current = list[i] ?? list[0];

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative h-[100svh] min-h-[560px] w-full overflow-hidden"
      style={{ background: "var(--surface)" }}
    >
      <style>{`
        @keyframes heroZoom { from { transform: scale(1.0); } to { transform: scale(1.12); } }
        @keyframes heroFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>

      {/* Rotating cinematic background */}
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={current?.id ?? `slide-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 0.9, 0.28, 1] }}
          className="absolute inset-0"
        >
          <Layer
            media={current}
            active
            priority={i === 0}
            fallback={portrait}
            onReady={onReady}
          />
        </motion.div>
      </AnimatePresence>

      {/* Cinematic grading */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(0 0 0 / 55%) 0%, oklch(0 0 0 / 25%) 35%, oklch(0 0 0 / 80%) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(70% 55% at 50% 45%, transparent 0%, oklch(0 0 0 / 65%) 100%)",
        }}
      />

      {/* Founder cut-out — stays put while backgrounds change.
          Skipped when the portrait is also the background (no CMS media yet),
          so the same photo is never stacked on itself. */}
      {slides.length > 0 && (
        <MouseParallax
          strength={10}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center"
        >
          <motion.img
            src={portrait}
            alt="Tejas D Dhoke"
            initial={{ opacity: 0, y: 40, scale: 1.04 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="h-[52svh] sm:h-[58svh] lg:h-[66svh] w-auto object-contain object-bottom drop-shadow-[0_30px_80px_rgba(0,0,0,0.75)]"
            style={{
              maskImage: "linear-gradient(180deg, black 68%, transparent 99%)",
              WebkitMaskImage:
                "linear-gradient(180deg, black 68%, transparent 99%)",
            }}
            draggable={false}
            fetchPriority="high"
            decoding="async"
          />
        </MouseParallax>
      )}

      {/* Copy */}
      <div className="relative z-20 h-full max-w-7xl mx-auto px-6 lg:px-10 flex flex-col items-center text-center pointer-events-none justify-start pt-[22svh] sm:pt-[20svh]">

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="text-[10px] sm:text-xs uppercase tracking-[0.45em] text-white/70"
        >
          Dance Educator • Performer • Choreographer
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 font-display font-bold uppercase leading-[0.9] text-white text-[clamp(2.4rem,9vw,7.5rem)] tracking-tight drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
        >
          Tejas D Dhoke
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-4 text-sm sm:text-lg text-white/80 max-w-xl"
        >
          Transforming passion into performance.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.8 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3 pointer-events-auto"
        >
          <MagneticButton>
            <a
              href="#workshops"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("workshops")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-primary-foreground text-[11px] font-bold uppercase tracking-[0.22em]"
              style={{
                background: "var(--gradient-primary)",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              Join Workshops
              <ArrowUpRight
                size={14}
                className="group-hover:rotate-45 transition-transform"
              />
            </a>
          </MagneticButton>
          <MagneticButton>
            <a
              href="#showcase"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("showcase")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white border border-white/25 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
            >
              <Play size={13} /> Watch Performances
            </a>
          </MagneticButton>
        </motion.div>
      </div>

      {/* Floating achievement badges */}
      <div
        aria-hidden={false}
        className="absolute inset-0 z-20 hidden lg:block pointer-events-none"
      >
        {badges.slice(0, 4).map((b, idx) => {
          const spots = [
            "left-[6%] top-[26%]",
            "right-[7%] top-[32%]",
            "left-[9%] bottom-[22%]",
            "right-[10%] bottom-[26%]",
          ];
          return (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + idx * 0.12, duration: 0.7 }}
              className={`absolute ${spots[idx]} rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl px-5 py-3 text-left shadow-[0_10px_40px_rgba(0,0,0,0.4)]`}
              style={{
                animation: `heroFloat ${7 + idx}s ease-in-out ${idx * 0.6}s infinite`,
              }}
            >
              <p className="font-display text-2xl font-bold text-white leading-none">
                {b.value}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/70">
                {b.label}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Slide indicators */}
      {list.length > 1 && (
        <div className="absolute bottom-6 right-6 z-30 flex gap-2">
          {list.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: idx === i ? 28 : 8,
                background:
                  idx === i
                    ? "var(--gradient-primary)"
                    : "color-mix(in oklab, white 40%, transparent)",
              }}
            />
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      <motion.div
        aria-hidden
        animate={{ y: [0, 8, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 text-white/70"
      >
        <span className="text-[9px] uppercase tracking-[0.35em]">Scroll</span>
        <ChevronDown size={16} />
      </motion.div>
    </section>
  );
}

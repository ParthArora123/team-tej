import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Play, ChevronDown } from "lucide-react";
import { MagneticButton } from "@/components/site/MagneticButton";
import { playHomepageVideo, pauseHomepageVideo } from "@/lib/home-video-playback";

export function CinematicHero({
  backgroundImage,
  badges,
  clips = [],
  onReady,
}: {
  backgroundImage: string;
  badges: { value: string; label: string }[];
  /** Optional cinematic clips montaged behind the hero (desktop only). */
  clips?: string[];
  onReady?: () => void;
}) {
  const reduce = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [clipIdx, setClipIdx] = useState(0);
  const [clipReady, setClipReady] = useState(false);
  // Heavy background video is desktop-only: phones keep the still portrait so
  // scrolling and touch stay at 60fps.
  const [cinemaOn, setCinemaOn] = useState(false);
  const activeClip = clips.length ? clips[clipIdx % clips.length] : null;

  useEffect(() => {
    if (reduce || clips.length === 0 || typeof window === "undefined") return;
    const wide = window.matchMedia("(min-width: 1024px)");
    const coarse = window.matchMedia("(pointer: coarse)");
    if (!wide.matches || coarse.matches) return;
    // Wait for the poster image so the LCP frame is never delayed by video.
    const t = setTimeout(() => setCinemaOn(true), 900);
    return () => clearTimeout(t);
  }, [reduce, clips.length]);

  // Montage: advance to the next clip on a slow cinematic cadence, and also
  // when the current clip ends (short clips shouldn't loop visibly).
  useEffect(() => {
    if (!cinemaOn || clips.length < 2) return;
    const t = setInterval(() => {
      setClipReady(false);
      setClipIdx((i) => (i + 1) % clips.length);
    }, 9000);
    return () => clearInterval(t);
  }, [cinemaOn, clips.length]);

  useEffect(() => {
    return () => {
      if (videoRef.current) pauseHomepageVideo(videoRef.current);
    };
  }, []);

  useEffect(() => {
    if (!backgroundImage) {
      setLoaded(true);
      onReady?.();
      return;
    }
    setFailed(false);
    const img = new Image();
    img.decoding = "async";
    img.src = backgroundImage;
    img.onload = () => {
      setLoaded(true);
      onReady?.();
    };
    img.onerror = () => {
      setFailed(true);
      setLoaded(true);
      onReady?.();
    };
    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true);
      onReady?.();
    }
  }, [backgroundImage, onReady]);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative h-[100svh] min-h-[560px] w-full overflow-hidden"
      style={{ background: "var(--surface)" }}
    >
      <style>{`
        @keyframes heroZoom { from { transform: scale(1.0); } to { transform: scale(1.12); } }
        @keyframes heroClipDrift { from { transform: scale(1.04); } to { transform: scale(1.14); } }
        @keyframes heroFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>

      {/* Static background — Tejas D Dhoke photo, full-bleed, single image */}
      <div
        className="absolute inset-0 w-full h-full transform-gpu will-change-transform"
        style={{
          animation: reduce ? "none" : "heroZoom 24s ease-out forwards",
          visibility: loaded ? "visible" : "hidden",
        }}
      >
        <img
          src={backgroundImage}
          alt="Tejas D Dhoke"
          className="absolute inset-0 h-full w-full object-cover object-top"
          fetchPriority="high"
          decoding="async"
          draggable={false}
          onLoad={() => {
            setLoaded(true);
            onReady?.();
          }}
        />
      </div>

      {/* Cinematic clip montage — crossfades over the portrait on desktop */}
      {cinemaOn && activeClip && (
        <video
          key={activeClip}
          ref={(node) => {
            videoRef.current = node;
            if (node) {
              node.muted = true;
              void playHomepageVideo(node);
            }
          }}
          src={activeClip}
          poster={backgroundImage}
          autoPlay
          muted
          loop={clips.length === 1}
          playsInline
          preload="auto"
          aria-hidden
          onCanPlay={() => setClipReady(true)}
          onEnded={() => {
            if (clips.length > 1) {
              setClipReady(false);
              setClipIdx((i) => (i + 1) % clips.length);
            }
          }}
          onError={() => {
            if (clips.length > 1) setClipIdx((i) => (i + 1) % clips.length);
          }}
          className="absolute inset-0 h-full w-full object-cover transform-gpu"
          style={{
            opacity: clipReady ? 1 : 0,
            transition: "opacity 1.4s ease",
            animation: reduce ? "none" : "heroClipDrift 14s ease-out forwards",
          }}
        />
      )}

      {/* Cinematic grading — stronger at bottom so text stays legible, clear at top for the portrait */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(0 0 0 / 25%) 0%, oklch(0 0 0 / 10%) 40%, oklch(0 0 0 / 55%) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 80%, oklch(0 0 0 / 60%) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-20 h-full max-w-7xl mx-auto px-6 lg:px-10 flex flex-col items-center text-center pointer-events-none justify-end pb-[12vh] sm:pb-[14vh]">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="text-[10px] sm:text-xs uppercase tracking-[0.45em] text-white/80"
        >
          Dance Educator • Performer • Choreographer
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 font-display font-bold uppercase leading-[0.92] text-white text-[clamp(2.2rem,8vw,6.5rem)] tracking-tight drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
        >
          Tejas D Dhoke
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-3 text-sm sm:text-lg text-white/85 max-w-xl"
        >
          Transforming passion into performance.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.8 }}
          className="mt-7 flex flex-wrap items-center justify-center gap-3 pointer-events-auto"
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
              Explore Workshops
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
            "left-[4%] top-[48%]",
            "right-[4%] top-[56%]",
            "left-[7%] bottom-[14%]",
            "right-[7%] bottom-[18%]",
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

      {/* Scroll indicator */}
      <motion.div
        aria-hidden
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 text-white/70"
      >
        <span className="text-[9px] uppercase tracking-[0.35em]">Scroll</span>
        <ChevronDown size={16} />
      </motion.div>
    </section>
  );
}

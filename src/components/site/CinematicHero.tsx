import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Play, ChevronDown } from "lucide-react";
import { MagneticButton } from "@/components/site/MagneticButton";

export function CinematicHero({
  backgroundImage,
  badges,
  onReady,
}: {
  backgroundImage: string;
  badges: { value: string; label: string }[];
  onReady?: () => void;
}) {
  const reduce = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!backgroundImage) {
      setLoaded(true);
      onReady?.();
      return;
    }
    const img = new Image();
    img.decoding = "async";
    img.src = backgroundImage;
    img.onload = () => {
      setLoaded(true);
      onReady?.();
    };
    img.onerror = () => {
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
        @keyframes heroFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>

      {/* Static background — Tejas D Dhoke photo, full-bleed, no cropping */}
      <div
        className="absolute inset-0 w-full h-full transform-gpu will-change-transform"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundPosition: "center top",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          animation: reduce ? "none" : "heroZoom 24s ease-out forwards",
          opacity: loaded ? 1 : 0,
          transition: "opacity 700ms ease-out",
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

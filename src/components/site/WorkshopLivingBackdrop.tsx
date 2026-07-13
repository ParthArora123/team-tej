import { useMemo, type CSSProperties } from "react";
import { motion, useScroll, useTransform } from "motion/react";

/**
 * Smooth, non-blinking premium backdrop for workshop pages.
 * - Uses transform-only animations (no opacity pulsing) to avoid flicker.
 * - Adds floating workshop-themed glyphs (music notes + dancer silhouettes).
 */
export function WorkshopLivingBackdrop() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], ["0vh", "-8vh"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0vh", "6vh"]);

  const particles = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        x: (i * 37.3) % 100,
        y: (i * 53.7) % 100,
        size: 2 + (i % 3),
        duration: 42 + (i % 6) * 6,
        delay: -(i * 2.1),
        driftX: (i % 2 ? 1 : -1) * (14 + (i % 5) * 4),
        driftY: -20 - (i % 5) * 5,
        opacity: 0.22 + (i % 4) * 0.05,
      })),
    []
  );

  const glyphs = useMemo(
    () => [
      { type: "note",    left: "8%",  top: "22%", size: 44, dur: 26, delay: 0,   opacity: 0.16 },
      { type: "note2",   left: "82%", top: "18%", size: 38, dur: 30, delay: -6,  opacity: 0.14 },
      { type: "dancer",  left: "14%", top: "62%", size: 130, dur: 34, delay: -3, opacity: 0.10 },
      { type: "dancer2", left: "72%", top: "58%", size: 140, dur: 38, delay: -9, opacity: 0.10 },
      { type: "note",    left: "48%", top: "10%", size: 32, dur: 28, delay: -12, opacity: 0.12 },
      { type: "note2",   left: "30%", top: "82%", size: 34, dur: 32, delay: -4,  opacity: 0.13 },
      { type: "dancer",  left: "56%", top: "78%", size: 110, dur: 40, delay: -14,opacity: 0.08 },
      { type: "note",    left: "92%", top: "72%", size: 30, dur: 36, delay: -2,  opacity: 0.13 },
    ],
    []
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ contain: "paint" }}>
      {/* Smooth ambient gradient washes (transform-only, no opacity pulses) */}
      <motion.div
        style={{ y: y1 }}
        className="absolute -left-[18%] top-[4%] h-[46rem] w-[46rem] rounded-full blur-3xl opacity-40 wlb2-drift-a will-change-transform"
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--primary)_65%,transparent),transparent_65%)]" />
      </motion.div>
      <motion.div
        style={{ y: y2 }}
        className="absolute -right-[14%] top-[38%] h-[52rem] w-[52rem] rounded-full blur-3xl opacity-35 wlb2-drift-b will-change-transform"
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--accent)_65%,transparent),transparent_68%)]" />
      </motion.div>

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px]" />

      {/* Floating light particles */}
      <div className="absolute inset-0">
        {particles.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-amber-200/80 shadow-[0_0_10px_rgba(255,215,140,0.35)] wlb2-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              "--dx": `${p.driftX}px`,
              "--dy": `${p.driftY}px`,
              "--dur": `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            } as CSSProperties}
          />
        ))}
      </div>

      {/* Workshop-themed glyphs */}
      <div className="absolute inset-0">
        {glyphs.map((g, i) => (
          <div
            key={i}
            className="absolute wlb2-glyph text-amber-300/80"
            style={{
              left: g.left,
              top: g.top,
              width: g.size,
              height: g.size,
              opacity: g.opacity,
              animationDuration: `${g.dur}s`,
              animationDelay: `${g.delay}s`,
            } as CSSProperties}
          >
            {g.type === "note" && <MusicNote />}
            {g.type === "note2" && <MusicNote variant="double" />}
            {g.type === "dancer" && <Dancer pose="a" />}
            {g.type === "dancer2" && <Dancer pose="b" />}
          </div>
        ))}
      </div>

      <style>{`
        .wlb2-drift-a { animation: wlb2-drift-a 60s ease-in-out infinite; }
        .wlb2-drift-b { animation: wlb2-drift-b 72s ease-in-out infinite; }
        @keyframes wlb2-drift-a {
          0%,100% { transform: translate3d(0,0,0) scale(1); }
          50%     { transform: translate3d(6vw, 3vh, 0) scale(1.06); }
        }
        @keyframes wlb2-drift-b {
          0%,100% { transform: translate3d(0,0,0) scale(1.02); }
          50%     { transform: translate3d(-5vw,-3vh,0) scale(0.98); }
        }
        .wlb2-particle {
          animation-name: wlb2-float;
          animation-duration: var(--dur);
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
          will-change: transform;
        }
        @keyframes wlb2-float {
          from { transform: translate3d(0,0,0); }
          to   { transform: translate3d(var(--dx), var(--dy), 0); }
        }
        .wlb2-glyph {
          animation-name: wlb2-glyph-float;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
          will-change: transform;
        }
        @keyframes wlb2-glyph-float {
          from { transform: translate3d(0, 0, 0) rotate(-3deg); }
          to   { transform: translate3d(10px, -18px, 0) rotate(3deg); }
        }
        @media (max-width: 768px) {
          .wlb2-glyph:nth-child(n+6) { display: none; }
          .wlb2-particle:nth-child(n+14) { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .wlb2-drift-a, .wlb2-drift-b, .wlb2-particle, .wlb2-glyph { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function MusicNote({ variant }: { variant?: "double" }) {
  if (variant === "double") {
    return (
      <svg viewBox="0 0 64 64" className="w-full h-full" fill="currentColor">
        <path d="M20 8v32a10 10 0 1 1-6-9V14l30-6v28a10 10 0 1 1-6-9V12L20 16V8z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="currentColor">
      <path d="M26 8v34a10 10 0 1 1-6-9V14l22-6v6L26 20V8z" />
    </svg>
  );
}

function Dancer({ pose }: { pose: "a" | "b" }) {
  if (pose === "a") {
    return (
      <svg viewBox="0 0 120 220" className="w-full h-full" fill="currentColor">
        <circle cx="62" cy="24" r="12" />
        <path d="M62 38 C 50 60, 44 78, 52 108 L 40 172 L 30 210 L 42 210 L 56 174 L 62 130 L 70 176 L 82 210 L 94 210 L 84 172 L 76 108 C 84 82, 82 62, 72 44 L 96 70 L 104 62 L 78 34 Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 220" className="w-full h-full" fill="currentColor">
      <circle cx="58" cy="22" r="12" />
      <path d="M58 36 C 46 54, 46 80, 56 104 L 42 168 L 28 210 L 42 210 L 58 172 L 62 128 L 68 172 L 84 210 L 98 210 L 86 168 L 74 106 C 84 82, 88 58, 80 40 L 60 22 L 22 42 L 26 52 L 58 40 Z" />
    </svg>
  );
}

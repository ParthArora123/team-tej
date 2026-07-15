import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

export function CursorGlow() {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 180, damping: 22, mass: 0.3 });
  const sy = useSpring(y, { stiffness: 180, damping: 22, mass: 0.3 });
  // Faster follower for the inner dot
  const dx = useSpring(x, { stiffness: 500, damping: 30, mass: 0.15 });
  const dy = useSpring(y, { stiffness: 500, damping: 30, mass: 0.15 });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setEnabled(true);
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);

  if (!enabled) return null;

  return (
    <>
      {/* Ambient spotlight */}
      <motion.div
        aria-hidden
        style={{ x: sx, y: sy }}
        className="pointer-events-none fixed top-0 left-0 z-[55] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
      >
        <div
          className="h-full w-full rounded-full opacity-45 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--primary) 70%, transparent) 0%, color-mix(in oklab, var(--accent-cyan) 30%, transparent) 40%, transparent 70%)",
          }}
        />
      </motion.div>
      {/* Sharp inner glow dot */}
      <motion.div
        aria-hidden
        style={{ x: dx, y: dy }}
        className="pointer-events-none fixed top-0 left-0 z-[56] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
      >
        <div
          className="h-full w-full rounded-full"
          style={{
            background: "var(--primary)",
            boxShadow:
              "0 0 20px color-mix(in oklab, var(--primary) 80%, transparent), 0 0 40px color-mix(in oklab, var(--accent-cyan) 60%, transparent)",
            opacity: 0.75,
          }}
        />
      </motion.div>
    </>
  );
}

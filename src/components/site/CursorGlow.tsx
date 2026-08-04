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
    if ((navigator.hardwareConcurrency ?? 8) <= 4) return;
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
      {/* Ambient spotlight — pre-rendered soft gradient (no runtime blur
          filter) so moving it is a pure compositor transform. */}
      <motion.div
        aria-hidden
        style={{
          x: sx,
          y: sy,
          willChange: "transform",
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--primary) 34%, transparent) 0%, color-mix(in oklab, var(--accent-cyan) 14%, transparent) 45%, transparent 70%)",
        }}
        className="pointer-events-none fixed top-0 left-0 z-[55] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-45 mix-blend-screen"
      />
      {/* Sharp inner glow dot */}
      <motion.div
        aria-hidden
        style={{ x: dx, y: dy, willChange: "transform" }}
        className="pointer-events-none fixed top-0 left-0 z-[56] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
      >
        <div
          className="h-full w-full rounded-full"
          style={{
            background: "var(--primary)",
            boxShadow:
              "0 0 20px color-mix(in oklab, var(--primary) 80%, transparent)",
            opacity: 0.75,
          }}
        />
      </motion.div>
    </>
  );
}

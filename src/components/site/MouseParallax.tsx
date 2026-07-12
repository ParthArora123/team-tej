import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, type ReactNode, type CSSProperties } from "react";

/**
 * MouseParallax — drifts children subtly based on cursor position relative to
 * the viewport center. Disabled on touch and when the user prefers reduced motion.
 * GPU-only (translate3d via motion values), 60fps.
 */
export function MouseParallax({
  children,
  strength = 12,
  className,
  style,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 60, damping: 20, mass: 0.6 });
  const x = useTransform(sx, (v) => v * strength);
  const y = useTransform(sy, (v) => v * strength);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(hover: none), (prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mx.set(nx);
      my.set(ny);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <motion.div style={{ x, y, ...style }} className={className}>
      {children}
    </motion.div>
  );
}

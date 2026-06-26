import { motion, useScroll, useTransform, useMotionValue, useSpring } from "motion/react";
import { useRef, type MouseEvent } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** strength of vertical parallax in % of container height */
  parallax?: number;
  /** enable subtle continuous ken-burns zoom + drift */
  kenBurns?: boolean;
  /** enable mouse tilt */
  tilt?: boolean;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  children?: React.ReactNode;
  overlay?: React.ReactNode;
};

export function MotionImage({
  src,
  alt,
  className = "",
  imgClassName = "",
  parallax = 12,
  kenBurns = true,
  tilt = true,
  width,
  height,
  loading = "lazy",
  children,
  overlay,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`-${parallax}%`, `${parallax}%`]);
  const scaleScroll = useTransform(scrollYProgress, [0, 0.5, 1], [1.05, 1.12, 1.05]);

  // tilt
  const rx = useSpring(useMotionValue(0), { stiffness: 120, damping: 14 });
  const ry = useSpring(useMotionValue(0), { stiffness: 120, damping: 14 });

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!tilt || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 8);
    rx.set(-py * 8);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      className={`relative overflow-hidden ${className}`}
    >
      <motion.div style={{ y, scale: scaleScroll }} className="absolute inset-0 will-change-transform">
        <motion.img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          animate={
            kenBurns
              ? { scale: [1, 1.08, 1.04, 1], x: ["0%", "-1.5%", "1%", "0%"], y: ["0%", "1%", "-1%", "0%"] }
              : undefined
          }
          transition={
            kenBurns
              ? { duration: 18, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
          className={`h-full w-full object-cover ${imgClassName}`}
        />
      </motion.div>

      {/* AI-style animated sheen sweep */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-overlay"
        style={{
          background:
            "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
          backgroundSize: "250% 250%",
        }}
        animate={{ backgroundPosition: ["120% 0%", "-20% 100%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* AI-style color-shift gradient */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-60"
        animate={{
          background: [
            "radial-gradient(60% 60% at 20% 30%, hsl(var(--primary)/0.35), transparent 60%)",
            "radial-gradient(60% 60% at 80% 70%, hsl(var(--primary)/0.35), transparent 60%)",
            "radial-gradient(60% 60% at 30% 80%, hsl(var(--primary)/0.35), transparent 60%)",
            "radial-gradient(60% 60% at 20% 30%, hsl(var(--primary)/0.35), transparent 60%)",
          ],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>\")",
        }}
      />
      {overlay}
      {children}
    </motion.div>
  );
}

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * PremiumAmbient — layered, GPU-friendly living background.
 * Aurora waves + floating gradient orbs + soft geometric shapes + particles.
 * Fixed, pointer-events-none, sits behind app content.
 */
export function PremiumAmbient() {
  const reduce = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const particleCount = isMobile ? 10 : 22;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Aurora sweep layer */}
      <div
        className="absolute inset-0 opacity-70 dark:opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 15% 10%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 60%)," +
            "radial-gradient(ellipse 70% 45% at 90% 20%, color-mix(in oklab, var(--accent-cyan) 22%, transparent), transparent 65%)," +
            "radial-gradient(ellipse 70% 55% at 50% 100%, color-mix(in oklab, var(--accent-pink) 16%, transparent), transparent 60%)",
        }}
      />

      {/* Animated aurora ribbon */}
      {!reduce && (
        <motion.div
          className="absolute -top-1/4 left-0 h-[80vh] w-[140vw] opacity-40 dark:opacity-55 blur-[80px]"
          style={{
            background:
              "conic-gradient(from 120deg at 50% 50%, transparent 0deg, color-mix(in oklab, var(--primary) 55%, transparent) 60deg, color-mix(in oklab, var(--accent-cyan) 55%, transparent) 140deg, color-mix(in oklab, var(--accent-pink) 45%, transparent) 220deg, transparent 320deg)",
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Floating gradient orbs */}
      <FloatingOrb
        className="left-[-8rem] top-[-6rem] h-[26rem] w-[26rem]"
        color="var(--primary)"
        duration={26}
        delay={0}
      />
      <FloatingOrb
        className="right-[-10rem] top-[30%] h-[30rem] w-[30rem]"
        color="var(--accent-cyan)"
        duration={32}
        delay={-6}
      />
      <FloatingOrb
        className="left-1/3 bottom-[-8rem] h-[24rem] w-[24rem]"
        color="var(--accent-pink)"
        duration={38}
        delay={-12}
      />

      {/* Soft floating rings (desktop only for perf) */}
      {!isMobile && !reduce && (
        <>
          <FloatingRing
            className="left-[12%] top-[20%] h-40 w-40"
            duration={18}
          />
          <FloatingRing
            className="right-[15%] top-[60%] h-56 w-56"
            duration={24}
            delay={-4}
          />
        </>
      )}

      {/* Particle dust */}
      {!reduce && <ParticleDust count={particleCount} />}

      {/* Noise overlay for cinematic grain */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}

function FloatingOrb({
  className,
  color,
  duration,
  delay = 0,
}: {
  className: string;
  color: string;
  duration: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-40 dark:opacity-55 ${className}`}
      style={{
        background: `radial-gradient(circle at 30% 30%, ${color}, transparent 65%)`,
        willChange: "transform",
      }}
      animate={{
        x: [0, 60, -40, 0],
        y: [0, -50, 40, 0],
        scale: [1, 1.15, 0.95, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

function FloatingRing({
  className,
  duration,
  delay = 0,
}: {
  className: string;
  duration: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={`absolute rounded-full border opacity-25 dark:opacity-30 ${className}`}
      style={{
        borderColor: "color-mix(in oklab, var(--primary) 45%, transparent)",
        borderWidth: "1.5px",
        boxShadow:
          "0 0 40px color-mix(in oklab, var(--primary) 25%, transparent), inset 0 0 30px color-mix(in oklab, var(--accent-cyan) 15%, transparent)",
      }}
      animate={{
        y: [0, -30, 0],
        rotate: [0, 180, 360],
        scale: [1, 1.08, 1],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function ParticleDust({ count }: { count: number }) {
  const [particles] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1.5,
      duration: Math.random() * 20 + 20,
      delay: -Math.random() * 20,
      xDrift: (Math.random() - 0.5) * 60,
    })),
  );

  return (
    <>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            background:
              "color-mix(in oklab, var(--primary) 55%, transparent)",
            boxShadow:
              "0 0 8px color-mix(in oklab, var(--primary) 60%, transparent)",
            willChange: "transform, opacity",
          }}
          animate={{
            y: [0, -120, 0],
            x: [0, p.xDrift, 0],
            opacity: [0, 0.9, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

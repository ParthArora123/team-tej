import { motion, useReducedMotion, useScroll, useTransform, useMotionValue, useSpring } from "motion/react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

/**
 * FloatingWorldScene — "The Floating World of Movement"
 * A single, scroll-driven cinematic backdrop that transitions from a
 * blue-hour sky (with volumetric clouds, god rays, birds and floating
 * architecture silhouettes) into a crystal / prism realm and finally
 * settles above a calm luxury ocean with caustics, ripples and fish.
 *
 * Non-interactive, fixed, sits behind all app content. Pure CSS + SVG +
 * Framer Motion — no WebGL — so it stays 60fps and cheap on mobile.
 * Respects prefers-reduced-motion and gracefully degrades on touch.
 */
export function FloatingWorldScene() {
  const reduce = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Treat small screens AND low-powered machines (few cores / little RAM,
    // e.g. older laptops and tablets) as "mobile" so they never pay for this
    // permanently-animating backdrop.
    const cores = navigator.hardwareConcurrency ?? 8;
    const mem = (navigator as any).deviceMemory ?? 8;
    const weak = cores <= 4 || mem <= 4;
    const mq = window.matchMedia("(max-width: 1024px), (hover: none)");
    const update = () => setIsMobile(weak || mq.matches);
    update();
    mq.addEventListener("change", update);
    // slight delay so it never fights hero LCP
    const t = setTimeout(() => setEnabled(true), 350);
    return () => {
      mq.removeEventListener("change", update);
      clearTimeout(t);
    };
  }, []);

  // Scroll-driven scene phasing: 0 = sky, 0.5 = crystal, 1 = ocean
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 60, damping: 24, mass: 0.4 });

  const skyOpacity = useTransform(smooth, [0, 0.35, 0.55], [1, 0.85, 0.25]);
  const crystalOpacity = useTransform(smooth, [0.25, 0.5, 0.75], [0, 1, 0.35]);
  const oceanOpacity = useTransform(smooth, [0.55, 0.8, 1], [0, 0.9, 1]);
  const cloudsY = useTransform(smooth, [0, 1], ["0%", "-30%"]);
  const horizonY = useTransform(smooth, [0, 1], ["8%", "-8%"]);
  const architectureY = useTransform(smooth, [0, 1], ["0%", "-12%"]);

  // (Cursor-driven spotlight removed for performance — see render below.)


  // Element counts kept deliberately low: every one of these is an infinitely
  // animating, blurred, composited layer.
  const birds = useMemo(
    () => Array.from({ length: 3 }, (_, i) => ({
      id: i,
      top: 12 + (i * 9) % 40,
      duration: 40 + (i % 4) * 8,
      delay: -i * 6,
      scale: 0.6 + (i % 3) * 0.25,
    })),
    []
  );

  const feathers = useMemo(
    () => Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: (i * 37) % 100,
      size: 4 + (i % 4) * 2,
      duration: 30 + (i % 6) * 6,
      delay: -i * 3,
      drift: (i % 2 ? 1 : -1) * (20 + (i % 5) * 8),
    })),
    []
  );

  const fish = useMemo(
    () => Array.from({ length: 3 }, (_, i) => ({
      id: i,
      top: 60 + (i * 7) % 30,
      duration: 24 + (i % 4) * 6,
      delay: -i * 4,
      dir: i % 2 ? 1 : -1,
    })),
    []
  );

  // This scene is a large, permanently-animating fixed backdrop. On phones and
  // small tablets it competes with video decoding for the compositor and makes
  // the page feel frozen, so we skip it entirely there (and on reduced motion).
  if (!enabled || isMobile || reduce) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ contain: "layout style" }}
    >
      {/* ================= SKY LAYER ================= */}
      <motion.div className="absolute inset-0" style={{ opacity: skyOpacity }}>
        {/* Blue-hour vertical gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg," +
              " color-mix(in oklab, var(--primary) 18%, #0b1024) 0%," +
              " color-mix(in oklab, var(--primary) 10%, #0e1430) 35%," +
              " color-mix(in oklab, #f5b76b 12%, #1a1a2e) 70%," +
              " color-mix(in oklab, #f5b76b 22%, #0a0a12) 100%)",
          }}
        />
        {/* Sunrise glow on horizon */}
        <motion.div
          style={{ y: horizonY }}
          className="absolute inset-x-0 bottom-[18%] h-[45vh]"
        >
          <div
            className="absolute inset-0 blur-3xl opacity-70"
            style={{
              background:
                "radial-gradient(60% 100% at 50% 100%, color-mix(in oklab, #ffb469 60%, transparent), transparent 70%)",
            }}
          />
        </motion.div>

        {/* God rays */}
        {!reduce && (
          <motion.div
            className="absolute -top-1/3 left-1/2 -translate-x-1/2 h-[180vh] w-[160vw] opacity-30 blur-2xl mix-blend-screen"
            style={{
              background:
                "conic-gradient(from 200deg at 50% 0%, transparent 0deg, color-mix(in oklab, #fff2c0 55%, transparent) 8deg, transparent 20deg, color-mix(in oklab, var(--primary) 45%, transparent) 32deg, transparent 44deg, color-mix(in oklab, #ffd08a 40%, transparent) 60deg, transparent 80deg)",
            }}
            animate={{ rotate: [0, 6, 0] }}
            transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Volumetric cloud layers (parallax) */}
        <motion.div style={{ y: cloudsY }} className="absolute inset-0">
          <CloudLayer top="12%" size={520} blur={40} opacity={0.55} duration={90} offset={-20} />
          <CloudLayer top="34%" size={640} blur={50} opacity={0.45} duration={140} offset={30} />
          <CloudLayer top="58%" size={780} blur={60} opacity={0.55} duration={200} offset={-10} tint="warm" />
          <CloudLayer top="72%" size={900} blur={70} opacity={0.6} duration={260} offset={20} tint="warm" />
        </motion.div>

        {/* Floating architecture silhouettes */}
        <motion.div style={{ y: architectureY }} className="absolute inset-x-0 bottom-[10%] h-[55vh]">
          <FloatingMonument left="8%" bottom="10%" scale={isMobile ? 0.7 : 1} delay={0} />
          <FloatingMonument left="62%" bottom="22%" scale={isMobile ? 0.55 : 0.85} delay={-3} variant="dome" />
          <FloatingMonument left="38%" bottom="6%" scale={isMobile ? 0.5 : 0.7} delay={-6} variant="bridge" />
        </motion.div>

        {/* Birds */}
        {!reduce && birds.map((b) => (
          <motion.div
            key={b.id}
            className="absolute"
            style={{ top: `${b.top}%`, left: "-8%", transform: `scale(${b.scale})` }}
            animate={{ x: ["0vw", "115vw"], y: [0, -20, 10, 0] }}
            transition={{
              x: { duration: b.duration, repeat: Infinity, ease: "linear", delay: b.delay },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <BirdSvg />
          </motion.div>
        ))}

        {/* Feathers / dust drifting up */}
        {!reduce && feathers.map((f) => (
          <motion.span
            key={f.id}
            className="absolute rounded-full bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.45)]"
            style={{
              left: `${f.left}%`,
              bottom: "-4%",
              width: f.size,
              height: f.size,
              opacity: 0.35,
              ["--drift" as any]: `${f.drift}px`,
            } as CSSProperties}
            animate={{
              y: ["0vh", "-110vh"],
              x: [0, f.drift, -f.drift * 0.5, 0],
              opacity: [0, 0.6, 0.3, 0],
            }}
            transition={{ duration: f.duration, delay: f.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </motion.div>

      {/* ================= CRYSTAL LAYER ================= */}
      <motion.div className="absolute inset-0" style={{ opacity: crystalOpacity }}>
        {/* prism wash */}
        <div
          className="absolute inset-0 mix-blend-screen"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 30%, color-mix(in oklab, var(--primary) 40%, transparent), transparent 70%)," +
              "radial-gradient(50% 45% at 80% 40%, color-mix(in oklab, #7dd3fc 55%, transparent), transparent 70%)," +
              "radial-gradient(55% 50% at 50% 80%, color-mix(in oklab, #c4b5fd 45%, transparent), transparent 70%)",
          }}
        />
        {/* Floating crystals */}
        <FloatingCrystal className="left-[10%] top-[22%] h-40 w-40" delay={0} />
        <FloatingCrystal className="right-[14%] top-[36%] h-56 w-56" delay={-4} tone="cyan" />
        <FloatingCrystal className="left-[46%] top-[54%] h-44 w-44" delay={-8} tone="violet" />
        {!isMobile && (
          <>
            <FloatingCrystal className="right-[28%] top-[70%] h-32 w-32" delay={-2} tone="gold" />
            <FloatingCrystal className="left-[24%] top-[68%] h-28 w-28" delay={-6} />
          </>
        )}
        {/* Transparent glass rings */}
        {!reduce && !isMobile && (
          <>
            <GlassRing className="left-[18%] top-[30%] h-56 w-56" duration={22} />
            <GlassRing className="right-[22%] top-[58%] h-72 w-72" duration={28} delay={-6} />
          </>
        )}
      </motion.div>

      {/* ================= OCEAN LAYER ================= */}
      <motion.div className="absolute inset-0" style={{ opacity: oceanOpacity }}>
        {/* Sky reflection above water */}
        <div
          className="absolute inset-x-0 top-0 h-[55%]"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, #1a2340 80%, #000) 0%, color-mix(in oklab, #2d4a7a 60%, #0a1024) 60%, color-mix(in oklab, #6fb7d6 40%, #0a1024) 100%)",
          }}
        />
        {/* Water body */}
        <div
          className="absolute inset-x-0 bottom-0 h-[55%] overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, #4aa4c4 55%, #0b1a26) 0%, color-mix(in oklab, #1a4a6e 70%, #04070f) 60%, #02040a 100%)",
          }}
        >
          {/* Caustic shimmer */}
          {!reduce && (
            <motion.div
              className="absolute inset-0 opacity-40 mix-blend-screen"
              style={{
                background:
                  "radial-gradient(60% 40% at 30% 20%, color-mix(in oklab, #a9e6ff 60%, transparent), transparent 70%)," +
                  "radial-gradient(50% 35% at 70% 60%, color-mix(in oklab, #ffe6a9 40%, transparent), transparent 70%)",
                filter: "blur(30px)",
              }}
              animate={{ backgroundPosition: ["0% 0%", "20% 10%", "0% 0%"] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          {/* Wave stripes */}
          {!reduce && (
            <motion.div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(180deg, transparent 0px, transparent 22px, rgba(255,255,255,0.08) 23px, transparent 26px)",
              }}
              animate={{ backgroundPositionY: [0, 40] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
          )}
          {/* Fish */}
          {!reduce && fish.map((f) => (
            <motion.div
              key={f.id}
              className="absolute"
              style={{
                top: `${f.top}%`,
                left: f.dir > 0 ? "-6%" : "106%",
                transform: `scaleX(${f.dir})`,
              }}
              animate={{ x: [0, f.dir * (window?.innerWidth || 800) * 1.2] }}
              transition={{ duration: f.duration, delay: f.delay, repeat: Infinity, ease: "linear" }}
            >
              <FishSvg />
            </motion.div>
          ))}
        </div>
        {/* Horizon glow */}
        <div
          className="absolute inset-x-0 top-[52%] h-16 blur-2xl opacity-70"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, #ffd08a 45%, transparent), transparent)",
          }}
        />
      </motion.div>

      {/* Cursor spotlight removed: repainting a full-viewport radial gradient
          on every mouse frame was the single biggest desktop jank source. */}

      {/* Cinematic vignette + grain */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}

function CloudLayer({
  top,
  size,
  blur,
  opacity,
  duration,
  offset,
  tint,
}: {
  top: string;
  size: number;
  blur: number;
  opacity: number;
  duration: number;
  offset: number;
  tint?: "warm";
}) {
  const color =
    tint === "warm"
      ? "color-mix(in oklab, #ffd8a8 45%, white)"
      : "color-mix(in oklab, #cad9ff 40%, white)";
  return (
    <motion.div
      className="absolute"
      style={{
        top,
        left: `${-20 + offset}%`,
        width: `${size}px`,
        height: `${size * 0.55}px`,
        filter: `blur(${blur}px)`,
        opacity,
        background: `radial-gradient(60% 60% at 40% 50%, ${color}, transparent 70%),` +
          `radial-gradient(45% 60% at 70% 55%, ${color}, transparent 75%)`,
      }}
      animate={{ x: ["0%", "40%", "0%"] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function FloatingMonument({
  left,
  bottom,
  scale = 1,
  delay = 0,
  variant = "temple",
}: {
  left: string;
  bottom: string;
  scale?: number;
  delay?: number;
  variant?: "temple" | "dome" | "bridge";
}) {
  return (
    <motion.div
      className="absolute origin-bottom"
      style={{ left, bottom, transform: `scale(${scale})` }}
      animate={{ y: [0, -14, 0] }}
      transition={{ duration: 12, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <div
        className="opacity-70"
        style={{
          filter:
            "drop-shadow(0 20px 40px color-mix(in oklab, var(--primary) 30%, transparent))",
        }}
      >
        {variant === "temple" && (
          <svg width="320" height="220" viewBox="0 0 320 220" fill="none">
            <defs>
              <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e8d9b8" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#3a3346" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path d="M40 200 L60 120 L100 90 L160 60 L220 90 L260 120 L280 200 Z" fill="url(#m1)" />
            <rect x="90" y="130" width="20" height="70" fill="#2b2436" opacity="0.7" />
            <rect x="140" y="120" width="20" height="80" fill="#2b2436" opacity="0.7" />
            <rect x="190" y="130" width="20" height="70" fill="#2b2436" opacity="0.7" />
            <circle cx="160" cy="60" r="8" fill="#ffd08a" />
          </svg>
        )}
        {variant === "dome" && (
          <svg width="260" height="200" viewBox="0 0 260 200" fill="none">
            <defs>
              <linearGradient id="m2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c9d8ff" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#2a2f4d" stopOpacity="0.55" />
              </linearGradient>
            </defs>
            <ellipse cx="130" cy="120" rx="110" ry="60" fill="url(#m2)" />
            <path d="M20 120 Q130 20 240 120 Z" fill="url(#m2)" opacity="0.9" />
            <rect x="60" y="120" width="140" height="60" fill="#1e2338" opacity="0.6" />
          </svg>
        )}
        {variant === "bridge" && (
          <svg width="360" height="120" viewBox="0 0 360 120" fill="none">
            <path d="M10 90 Q180 -20 350 90" stroke="#e8d9b8" strokeOpacity="0.7" strokeWidth="3" fill="none" />
            <path d="M10 100 L350 100" stroke="#c9b98a" strokeOpacity="0.5" strokeWidth="2" />
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={i} x1={30 + i * 27} y1={90} x2={30 + i * 27} y2={100} stroke="#c9b98a" strokeOpacity="0.5" />
            ))}
          </svg>
        )}
      </div>
    </motion.div>
  );
}

function FloatingCrystal({
  className,
  delay = 0,
  tone = "primary",
}: {
  className: string;
  delay?: number;
  tone?: "primary" | "cyan" | "violet" | "gold";
}) {
  const colors: Record<string, string> = {
    primary: "var(--primary)",
    cyan: "#7dd3fc",
    violet: "#c4b5fd",
    gold: "#ffd08a",
  };
  const c = colors[tone];
  return (
    <motion.div
      className={`absolute ${className}`}
      animate={{ y: [0, -18, 0], rotate: [0, 8, -6, 0] }}
      transition={{ duration: 14, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <div
        className="h-full w-full"
        style={{
          background: `linear-gradient(135deg, color-mix(in oklab, ${c} 55%, transparent), color-mix(in oklab, ${c} 15%, transparent) 60%, transparent)`,
          clipPath: "polygon(50% 0%, 90% 30%, 80% 100%, 20% 100%, 10% 30%)",
          filter: `drop-shadow(0 20px 40px color-mix(in oklab, ${c} 40%, transparent))`,
          backdropFilter: "blur(2px)",
        }}
      />
    </motion.div>
  );
}

function GlassRing({
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
      className={`absolute rounded-full border-2 ${className}`}
      style={{
        borderColor: "color-mix(in oklab, #a9e6ff 45%, transparent)",
        boxShadow:
          "0 0 60px color-mix(in oklab, #a9e6ff 30%, transparent), inset 0 0 40px color-mix(in oklab, #c4b5fd 25%, transparent)",
      }}
      animate={{ rotate: [0, 360], scale: [1, 1.08, 1] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function BirdSvg() {
  return (
    <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
      <path
        d="M1 6 Q4 1 7 5 Q9 7 11 5 Q13 1 16 5 Q18 7 21 4"
        stroke="rgba(255,255,255,0.65)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function FishSvg() {
  return (
    <svg width="28" height="14" viewBox="0 0 28 14" fill="none">
      <path
        d="M2 7 Q10 -1 20 7 Q10 15 2 7 Z"
        fill="rgba(200,230,255,0.55)"
      />
      <path d="M20 7 L27 3 L27 11 Z" fill="rgba(200,230,255,0.55)" />
      <circle cx="7" cy="6" r="0.8" fill="#0b1024" />
    </svg>
  );
}

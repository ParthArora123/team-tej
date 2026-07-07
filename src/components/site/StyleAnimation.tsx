import { motion } from "motion/react";

// Deterministic string hash → stable seed per style name.
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

type Variant = "waves" | "orbits" | "ribbons" | "pulse" | "shards" | "aurora";
const VARIANTS: Variant[] = ["waves", "orbits", "ribbons", "pulse", "shards", "aurora"];

// Curated overrides so common style names always get a fitting vibe.
const OVERRIDES: Record<string, { variant: Variant; hue: number; hue2: number }> = {
  "bollywood": { variant: "aurora", hue: 345, hue2: 48 },
  "hip-hop": { variant: "pulse", hue: 155, hue2: 205 },
  "hip hop": { variant: "pulse", hue: 155, hue2: 205 },
  "kathak": { variant: "orbits", hue: 28, hue2: 335 },
  "fusion": { variant: "waves", hue: 310, hue2: 175 },
  "semi-classical": { variant: "orbits", hue: 32, hue2: 350 }, // amber / rose — temple gold
  "semi classical": { variant: "orbits", hue: 32, hue2: 350 },
  "contemporary": { variant: "ribbons", hue: 200, hue2: 280 }, // cool blue → violet, lyrical flow
  "lyrical": { variant: "waves", hue: 190, hue2: 300 },
  "jazz": { variant: "shards", hue: 45, hue2: 15 }, // saxophone gold / burnt orange
  "classical": { variant: "orbits", hue: 25, hue2: 340 },
  "bharatanatyam": { variant: "pulse", hue: 15, hue2: 45 },
  "odissi": { variant: "waves", hue: 20, hue2: 340 },
  "folk": { variant: "shards", hue: 55, hue2: 10 },
  "krump": { variant: "shards", hue: 0, hue2: 280 },
  "popping": { variant: "pulse", hue: 130, hue2: 200 },
  "locking": { variant: "shards", hue: 50, hue2: 320 },
  "modern": { variant: "aurora", hue: 220, hue2: 300 },
  "afro": { variant: "pulse", hue: 25, hue2: 5 },
  "salsa": { variant: "ribbons", hue: 0, hue2: 40 },
  "waacking": { variant: "aurora", hue: 300, hue2: 200 },
  "house": { variant: "pulse", hue: 180, hue2: 260 },
};

export function StyleAnimation({ name }: { name: string }) {
  const key = name.trim().toLowerCase();
  const seed = hash(key);
  const override = OVERRIDES[key];
  const variant: Variant = override?.variant ?? VARIANTS[seed % VARIANTS.length];
  const hue = override?.hue ?? seed % 360;
  const hue2 = override?.hue2 ?? (hue + 60 + (seed % 120)) % 360;
  const c1 = `hsl(${hue} 85% 55%)`;
  const c2 = `hsl(${hue2} 85% 55%)`;
  const c3 = `hsl(${(hue + 180) % 360} 60% 20%)`;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: `radial-gradient(120% 90% at 30% 20%, ${c3}, #0a0a0a 70%)` }}
      aria-hidden
    >
      {variant === "waves" && (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 250" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`g-${seed}`} x1="0" x2="1">
              <stop offset="0%" stopColor={c1} stopOpacity="0.9" />
              <stop offset="100%" stopColor={c2} stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.path
              key={i}
              d={`M0 ${80 + i * 30} Q 50 ${40 + i * 30} 100 ${80 + i * 30} T 200 ${80 + i * 30}`}
              stroke={`url(#g-${seed})`}
              strokeWidth={1.4}
              fill="none"
              opacity={0.7 - i * 0.1}
              animate={{ d: [
                `M0 ${80 + i * 30} Q 50 ${40 + i * 30} 100 ${80 + i * 30} T 200 ${80 + i * 30}`,
                `M0 ${80 + i * 30} Q 50 ${120 + i * 30} 100 ${80 + i * 30} T 200 ${80 + i * 30}`,
                `M0 ${80 + i * 30} Q 50 ${40 + i * 30} 100 ${80 + i * 30} T 200 ${80 + i * 30}`,
              ] }}
              transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </svg>
      )}

      {variant === "orbits" && (
        <div className="absolute inset-0">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border"
              style={{
                left: "50%",
                top: "55%",
                width: `${120 + i * 60}px`,
                height: `${120 + i * 60}px`,
                marginLeft: `-${60 + i * 30}px`,
                marginTop: `-${60 + i * 30}px`,
                borderColor: i % 2 === 0 ? c1 : c2,
                opacity: 0.35,
              }}
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: 18 + i * 6, repeat: Infinity, ease: "linear" }}
            >
              <span
                className="absolute h-2 w-2 rounded-full"
                style={{ background: i % 2 === 0 ? c2 : c1, top: -4, left: "50%" }}
              />
            </motion.div>
          ))}
        </div>
      )}

      {variant === "ribbons" && (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 250" preserveAspectRatio="none">
          {[0, 1, 2].map((i) => (
            <motion.path
              key={i}
              d="M-20 200 C 40 120, 120 260, 220 100"
              stroke={i === 1 ? c2 : c1}
              strokeWidth={i === 1 ? 6 : 4}
              fill="none"
              strokeLinecap="round"
              opacity={0.55}
              animate={{ pathOffset: [0, 1], y: [0, -8 - i * 4, 0] }}
              transition={{ duration: 5 + i * 1.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ transform: `translateY(${i * 22}px)` }}
            />
          ))}
        </svg>
      )}

      {variant === "pulse" && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{
                width: 80,
                height: 80,
                background: `radial-gradient(circle, ${c1}, transparent 70%)`,
              }}
              animate={{ scale: [0.6, 2.4], opacity: [0.7, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.75, ease: "easeOut" }}
            />
          ))}
          <motion.span
            className="relative rounded-full"
            style={{ width: 90, height: 90, background: `radial-gradient(circle, ${c2}, ${c1})` }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      {variant === "shards" && (
        <div className="absolute inset-0">
          {Array.from({ length: 14 }).map((_, i) => {
            const rot = (seed + i * 37) % 360;
            const x = (seed * (i + 1)) % 100;
            const y = ((seed >> 3) * (i + 2)) % 100;
            return (
              <motion.span
                key={i}
                className="absolute origin-center"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: 2,
                  height: 60 + (i % 5) * 10,
                  background: i % 2 === 0 ? c1 : c2,
                  transform: `rotate(${rot}deg)`,
                  opacity: 0.7,
                }}
                animate={{ scaleY: [0.4, 1.1, 0.4], opacity: [0.2, 0.9, 0.2] }}
                transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: (i % 5) * 0.2, ease: "easeInOut" }}
              />
            );
          })}
        </div>
      )}

      {variant === "aurora" && (
        <>
          <motion.div
            className="absolute -inset-1/3 blur-3xl"
            style={{ background: `conic-gradient(from 0deg, ${c1}, ${c2}, ${c3}, ${c1})`, opacity: 0.55 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute -inset-1/4 blur-2xl"
            style={{ background: `radial-gradient(50% 50% at 60% 40%, ${c2}, transparent 70%)`, opacity: 0.5 }}
            animate={{ x: [0, 20, -10, 0], y: [0, -15, 10, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}
    </div>
  );
}

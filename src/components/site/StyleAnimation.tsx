import { motion } from "motion/react";

type DanceVariant = "semiClassical" | "hipHop" | "jazz" | "contemporary" | "fusion" | "bollywood" | "kathak";

const DANCE_VARIANTS: DanceVariant[] = [
  "semiClassical",
  "hipHop",
  "jazz",
  "contemporary",
  "fusion",
  "bollywood",
  "kathak",
];

const STYLE_MAP: Record<string, { variant: DanceVariant; hue: number; accent: number }> = {
  "semi-classical": { variant: "semiClassical", hue: 34, accent: 350 },
  "semi classical": { variant: "semiClassical", hue: 34, accent: 350 },
  semiclassical: { variant: "semiClassical", hue: 34, accent: 350 },
  "hip-hop": { variant: "hipHop", hue: 150, accent: 205 },
  "hip hop": { variant: "hipHop", hue: 150, accent: 205 },
  hiphop: { variant: "hipHop", hue: 150, accent: 205 },
  jazz: { variant: "jazz", hue: 44, accent: 14 },
  contemporary: { variant: "contemporary", hue: 198, accent: 282 },
  modern: { variant: "contemporary", hue: 210, accent: 288 },
  lyrical: { variant: "contemporary", hue: 190, accent: 300 },
  fusion: { variant: "fusion", hue: 314, accent: 170 },
  bollywood: { variant: "bollywood", hue: 338, accent: 48 },
  kathak: { variant: "kathak", hue: 28, accent: 330 },
  classical: { variant: "semiClassical", hue: 28, accent: 340 },
  bharatanatyam: { variant: "semiClassical", hue: 18, accent: 44 },
};

function hashName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return hash;
}

function normalize(name: string) {
  return name.trim().toLowerCase().replace(/[–—_]+/g, "-").replace(/\s+/g, " ");
}

function getConfig(name: string) {
  const key = normalize(name);
  const direct = STYLE_MAP[key];
  if (direct) return direct;

  const hash = hashName(key || "dance");
  return {
    variant: DANCE_VARIANTS[hash % DANCE_VARIANTS.length],
    hue: hash % 360,
    accent: (hash + 96) % 360,
  };
}

function DancerFigure({ variant, primary, accent }: { variant: DanceVariant; primary: string; accent: string }) {
  const bodyMotion = {
    semiClassical: { rotate: [-5, 5, -5], y: [0, -4, 0] },
    hipHop: { rotate: [-8, 8, -8], y: [2, -10, 2], scale: [1, 0.96, 1] },
    jazz: { rotate: [-3, 7, -3], y: [0, -6, 0] },
    contemporary: { rotate: [-14, 10, -14], x: [-8, 8, -8], y: [5, -8, 5] },
    fusion: { rotate: [-10, 12, -10], x: [-5, 6, -5], y: [0, -7, 0] },
    bollywood: { rotate: [-7, 7, -7], y: [0, -5, 0] },
    kathak: { rotate: [0, 360], y: [0, -3, 0] },
  }[variant];

  const armLeft = {
    semiClassical: "M95 96 C70 88, 58 72, 50 55",
    hipHop: "M96 96 C76 104, 66 112, 48 106",
    jazz: "M96 94 C74 74, 66 52, 58 32",
    contemporary: "M96 96 C68 92, 52 118, 34 142",
    fusion: "M96 96 C70 82, 56 66, 38 58",
    bollywood: "M96 94 C72 84, 62 64, 58 42",
    kathak: "M96 95 C74 84, 58 84, 42 96",
  }[variant];

  const armRight = {
    semiClassical: "M105 96 C130 88, 142 72, 150 55",
    hipHop: "M104 96 C126 92, 138 84, 154 66",
    jazz: "M104 94 C130 90, 148 78, 164 62",
    contemporary: "M104 96 C128 74, 142 54, 166 44",
    fusion: "M104 96 C128 110, 144 122, 166 118",
    bollywood: "M104 94 C130 84, 142 64, 146 42",
    kathak: "M104 95 C126 108, 142 108, 158 96",
  }[variant];

  const legLeft = {
    semiClassical: "M96 138 C84 162, 78 184, 68 212",
    hipHop: "M96 138 C82 158, 72 174, 54 190",
    jazz: "M96 138 C78 150, 60 154, 40 156",
    contemporary: "M96 138 C76 158, 62 184, 44 214",
    fusion: "M96 138 C82 162, 68 178, 56 202",
    bollywood: "M96 138 C84 160, 82 184, 70 210",
    kathak: "M96 138 C88 160, 86 184, 86 212",
  }[variant];

  const legRight = {
    semiClassical: "M104 138 C118 162, 124 184, 136 212",
    hipHop: "M104 138 C124 150, 140 166, 154 190",
    jazz: "M104 138 C118 162, 140 182, 160 208",
    contemporary: "M104 138 C124 148, 150 156, 178 166",
    fusion: "M104 138 C124 154, 140 176, 152 204",
    bollywood: "M104 138 C120 156, 132 180, 146 208",
    kathak: "M104 138 C114 160, 116 184, 116 212",
  }[variant];

  return (
    <motion.svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 200 250"
      preserveAspectRatio="xMidYMid meet"
      initial={false}
    >
      <motion.g
        animate={bodyMotion}
        transition={{ duration: variant === "kathak" ? 4.8 : 2.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 128px" }}
      >
        <motion.path
          d={armLeft}
          stroke={accent}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          animate={{ pathLength: [0.82, 1, 0.82] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d={armRight}
          stroke={accent}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          animate={{ pathLength: [1, 0.82, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <path d="M100 82 C92 104, 92 124, 96 142 C102 148, 110 146, 114 138 C112 116, 110 100, 104 82 Z" fill={primary} />
        <motion.circle
          cx="100"
          cy="61"
          r="15"
          fill={primary}
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <path d={legLeft} stroke={primary} strokeWidth="10" strokeLinecap="round" fill="none" />
        <path d={legRight} stroke={primary} strokeWidth="10" strokeLinecap="round" fill="none" />
      </motion.g>
    </motion.svg>
  );
}

function DanceMotionLines({ variant, primary, accent }: { variant: DanceVariant; primary: string; accent: string }) {
  const motionLines = {
    semiClassical: ["M48 58 C72 38, 128 38, 152 58", "M54 211 C78 226, 122 226, 146 211"],
    hipHop: ["M42 108 L78 108", "M122 72 L166 72", "M46 172 L84 172"],
    jazz: ["M34 155 C78 128, 116 98, 166 58", "M52 220 C94 202, 132 198, 170 210"],
    contemporary: ["M20 156 C62 78, 130 222, 186 92", "M34 198 C86 126, 128 168, 176 42"],
    fusion: ["M32 74 C86 34, 118 216, 172 176", "M28 190 C76 142, 126 110, 174 60"],
    bollywood: ["M50 44 C74 28, 126 28, 150 44", "M38 112 C70 92, 130 92, 162 112"],
    kathak: ["M45 125 C45 74, 155 74, 155 125 C155 176, 45 176, 45 125"],
  }[variant];

  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 250" preserveAspectRatio="none">
      {motionLines.map((d, index) => (
        <motion.path
          key={d}
          d={d}
          stroke={index % 2 === 0 ? primary : accent}
          strokeWidth={variant === "hipHop" ? 5 : 3}
          strokeLinecap="round"
          fill="none"
          opacity="0.45"
          animate={{ pathLength: [0.2, 1, 0.2], opacity: [0.18, 0.55, 0.18] }}
          transition={{ duration: 2.6 + index * 0.5, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}

export function StyleAnimation({ name }: { name: string }) {
  const { variant, hue, accent } = getConfig(name);
  const primary = `hsl(${hue} 88% 58%)`;
  const secondary = `hsl(${accent} 88% 58%)`;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)",
      }}
      aria-label={`${name} dance animation`}
    >
      <div
        className="absolute inset-x-6 bottom-8 h-10 rounded-[50%] blur-md"
        style={{ background: `linear-gradient(90deg, transparent, ${primary}, ${secondary}, transparent)`, opacity: 0.28 }}
      />
      <DanceMotionLines variant={variant} primary={primary} accent={secondary} />
      <DancerFigure variant={variant} primary={primary} accent={secondary} />
      <motion.div
        className="absolute inset-x-8 bottom-9 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${secondary}, transparent)` }}
        animate={{ scaleX: [0.7, 1, 0.7], opacity: [0.35, 0.8, 0.35] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
/**
 * StageAmbience — cinematic live-stage background.
 *
 * Layers (back → front), all GPU-accelerated (transform/opacity only):
 *   1. Deep gradient stage floor + haze
 *   2. Slow drifting volumetric light rays (SVG, screen blend)
 *   3. Two slow-moving stage spotlights (radial gradients, no blink)
 *   4. Layered atmospheric fog (large blurred blobs, very slow drift)
 *   5. Parallax dancer silhouettes (SVG, slow sway + drift)
 *   6. Rare drifting dust particles + horizontal light streaks
 *
 * Non-interactive, respects prefers-reduced-motion, continuous smooth motion
 * (no keyframe flashes, no opacity blinks).
 */
export function StageAmbience() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#05060a]"
    >
      {/* 1. Stage floor gradient + subtle haze */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 110%, rgba(30,20,60,0.55), transparent 55%), radial-gradient(ellipse at 50% -10%, rgba(10,10,20,0.9), transparent 60%), linear-gradient(to bottom, #05060a, #07080f 60%, #0a0910)",
        }}
      />

      {/* 2. Volumetric light rays (SVG, slow rotate) */}
      <svg
        className="absolute left-1/2 top-[-30%] h-[160%] w-[140%] -translate-x-1/2 opacity-[0.22] mix-blend-screen sa-rays"
        viewBox="0 0 800 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="ray" cx="50%" cy="0%" r="65%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
            <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ray2" cx="50%" cy="0%" r="65%">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.5" />
            <stop offset="60%" stopColor="hsl(var(--accent))" stopOpacity="0.04" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
          </radialGradient>
        </defs>
        {Array.from({ length: 7 }).map((_, i) => (
          <polygon
            key={i}
            points="400,0 380,800 420,800"
            fill={i % 2 ? "url(#ray2)" : "url(#ray)"}
            transform={`rotate(${(i - 3) * 14} 400 0)`}
          />
        ))}
      </svg>

      {/* 3. Slow moving stage spotlights (no blink) */}
      <div
        className="absolute -top-24 left-1/4 h-[70vh] w-[60vw] rounded-full blur-3xl mix-blend-screen sa-spot-a"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.35), hsl(var(--primary) / 0.08) 45%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-[10%] right-[5%] h-[65vh] w-[55vw] rounded-full blur-3xl mix-blend-screen sa-spot-b"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--accent) / 0.32), hsl(var(--accent) / 0.07) 45%, transparent 70%)",
        }}
      />

      {/* 4. Atmospheric fog / haze — very slow drift */}
      <div className="absolute inset-0 sa-fog-a">
        <div
          className="absolute -left-1/4 top-1/3 h-[60vh] w-[90vw] rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(circle, rgba(150,140,200,0.28), transparent 70%)" }}
        />
      </div>
      <div className="absolute inset-0 sa-fog-b">
        <div
          className="absolute right-[-20%] top-1/2 h-[55vh] w-[80vw] rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(circle, rgba(80,120,180,0.24), transparent 70%)" }}
        />
      </div>

      {/* 5. Parallax dancer silhouettes */}
      <DancerSilhouettes />

      {/* 6. Dust particles + horizontal streaks */}
      <div className="absolute inset-0 sa-dust">
        {Array.from({ length: 22 }).map((_, i) => {
          const left = (i * 173) % 100;
          const top = (i * 91) % 100;
          const dur = 22 + (i % 9) * 3;
          const delay = (i * 1.3) % 12;
          const size = 1 + (i % 3);
          return (
            <span
              key={i}
              className="sa-dust-p"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                animationDuration: `${dur}s`,
                animationDelay: `-${delay}s`,
              }}
            />
          );
        })}
        {Array.from({ length: 3 }).map((_, i) => (
          <span
            key={`s-${i}`}
            className="sa-streak"
            style={{
              top: `${20 + i * 25}%`,
              animationDuration: `${28 + i * 6}s`,
              animationDelay: `-${i * 9}s`,
            }}
          />
        ))}
      </div>

      {/* Subtle vignette to focus content */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <style>{`
        .sa-rays { animation: sa-rot 90s linear infinite; transform-origin: 50% 0%; will-change: transform; }
        @keyframes sa-rot { from { transform: translateX(-50%) rotate(0deg); } to { transform: translateX(-50%) rotate(360deg); } }

        .sa-spot-a { will-change: transform; animation: sa-spot-a 34s ease-in-out infinite; }
        .sa-spot-b { will-change: transform; animation: sa-spot-b 42s ease-in-out infinite; }
        @keyframes sa-spot-a {
          0%   { transform: translate3d(0,0,0) scale(1); }
          50%  { transform: translate3d(18vw,6vh,0) scale(1.15); }
          100% { transform: translate3d(0,0,0) scale(1); }
        }
        @keyframes sa-spot-b {
          0%   { transform: translate3d(0,0,0) scale(1); }
          50%  { transform: translate3d(-16vw,-4vh,0) scale(1.1); }
          100% { transform: translate3d(0,0,0) scale(1); }
        }

        .sa-fog-a { will-change: transform; animation: sa-fog-a 60s ease-in-out infinite; }
        .sa-fog-b { will-change: transform; animation: sa-fog-b 75s ease-in-out infinite; }
        @keyframes sa-fog-a {
          0%,100% { transform: translate3d(0,0,0); }
          50%     { transform: translate3d(6vw,-2vh,0); }
        }
        @keyframes sa-fog-b {
          0%,100% { transform: translate3d(0,0,0); }
          50%     { transform: translate3d(-5vw,3vh,0); }
        }

        .sa-dust { }
        .sa-dust-p {
          position: absolute;
          border-radius: 9999px;
          background: rgba(255,240,210,0.55);
          box-shadow: 0 0 6px rgba(255,230,190,0.4);
          will-change: transform, opacity;
          animation-name: sa-dust-float;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          opacity: 0;
        }
        @keyframes sa-dust-float {
          0%   { transform: translate3d(0,20px,0);   opacity: 0; }
          20%  { opacity: 0.7; }
          80%  { opacity: 0.5; }
          100% { transform: translate3d(30px,-120px,0); opacity: 0; }
        }
        .sa-streak {
          position: absolute;
          left: -20%;
          width: 40%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,220,180,0.35), transparent);
          filter: blur(1px);
          will-change: transform, opacity;
          animation-name: sa-streak-move;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          opacity: 0;
        }
        @keyframes sa-streak-move {
          0%   { transform: translate3d(0,0,0);       opacity: 0; }
          25%  { opacity: 0.9; }
          100% { transform: translate3d(320%,0,0);    opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sa-rays, .sa-spot-a, .sa-spot-b, .sa-fog-a, .sa-fog-b, .sa-dust-p, .sa-streak { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ---------- Dancer silhouettes ---------- */
function DancerSilhouettes() {
  // Pre-drawn silhouettes: three distinct poses (hip-hop, contemporary, freestyle)
  const dancers = [
    { pose: "hiphop", left: "8%", bottom: "6%", scale: 0.9, dur: 14, delay: 0, opacity: 0.16, depth: 1 },
    { pose: "contemporary", left: "46%", bottom: "4%", scale: 1.1, dur: 18, delay: -4, opacity: 0.13, depth: 2 },
    { pose: "freestyle", left: "78%", bottom: "8%", scale: 0.85, dur: 16, delay: -8, opacity: 0.15, depth: 1 },
    { pose: "contemporary", left: "22%", bottom: "10%", scale: 0.55, dur: 22, delay: -2, opacity: 0.08, depth: 3 },
    { pose: "hiphop", left: "62%", bottom: "12%", scale: 0.6, dur: 20, delay: -10, opacity: 0.09, depth: 3 },
  ];
  return (
    <div className="absolute inset-0">
      {dancers.map((d, i) => (
        <div
          key={i}
          className={`absolute sa-dancer sa-depth-${d.depth}`}
          style={{
            left: d.left,
            bottom: d.bottom,
            transform: `scale(${d.scale})`,
            opacity: d.opacity,
            animationDuration: `${d.dur}s`,
            animationDelay: `${d.delay}s`,
            filter: `blur(${d.depth === 3 ? 3 : d.depth === 2 ? 1.5 : 0.5}px)`,
          }}
        >
          <DancerSVG pose={d.pose as any} />
        </div>
      ))}
      <style>{`
        .sa-dancer {
          width: 180px;
          height: 320px;
          transform-origin: 50% 100%;
          will-change: transform, opacity;
          animation-name: sa-sway;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
          color: #ffffff;
        }
        @keyframes sa-sway {
          0%   { transform: translate3d(0,0,0) scale(var(--sc,1)) rotate(-1.2deg); }
          50%  { transform: translate3d(6px,-4px,0) scale(var(--sc,1)) rotate(0.6deg); }
          100% { transform: translate3d(-4px,-2px,0) scale(var(--sc,1)) rotate(-0.4deg); }
        }
        .sa-depth-1 { z-index: 3; }
        .sa-depth-2 { z-index: 2; }
        .sa-depth-3 { z-index: 1; }
        @media (prefers-reduced-motion: reduce) {
          .sa-dancer { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function DancerSVG({ pose }: { pose: "hiphop" | "contemporary" | "freestyle" }) {
  // Stylised silhouette figures. Filled with currentColor so opacity is controlled by parent.
  if (pose === "hiphop") {
    return (
      <svg viewBox="0 0 200 360" className="w-full h-full" fill="currentColor">
        <circle cx="100" cy="46" r="22" />
        <path d="M78 70 Q100 78 122 70 L138 150 Q140 170 130 180 L118 220 L128 300 L118 340 L104 340 L100 260 L92 340 L78 340 L86 260 L70 180 Q60 170 62 150 Z" />
        <path d="M62 155 L36 210 L28 270 L42 274 L52 220 L72 178 Z" />
        <path d="M138 155 L170 200 L182 258 L170 264 L156 214 L132 178 Z" />
      </svg>
    );
  }
  if (pose === "contemporary") {
    return (
      <svg viewBox="0 0 200 360" className="w-full h-full" fill="currentColor">
        <circle cx="90" cy="40" r="20" />
        <path d="M72 60 Q92 68 112 62 L128 140 L118 180 L138 260 L128 340 L114 340 L112 270 L96 220 L82 270 L84 340 L70 340 L70 260 L82 180 Z" />
        {/* raised extended arm */}
        <path d="M112 68 L170 20 L178 30 L120 82 Z" />
        {/* trailing arm */}
        <path d="M74 78 L40 150 L30 148 L60 70 Z" />
      </svg>
    );
  }
  // freestyle — mid-jump
  return (
    <svg viewBox="0 0 200 360" className="w-full h-full" fill="currentColor">
      <circle cx="104" cy="60" r="20" />
      <path d="M84 80 Q106 88 128 82 L142 160 Q136 190 118 200 L136 260 L126 320 L112 322 L108 260 L96 220 L82 260 L78 322 L64 320 L74 260 L60 200 Q54 190 62 160 Z" />
      {/* both arms up */}
      <path d="M128 86 L172 40 L182 50 L136 100 Z" />
      <path d="M84 86 L36 46 L28 58 L78 102 Z" />
      {/* one leg kicked out */}
      <path d="M112 280 L170 300 L172 314 L108 300 Z" />
    </svg>
  );
}

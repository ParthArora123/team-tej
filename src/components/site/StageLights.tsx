/**
 * StageLights — cinematic overlay for the homepage hero.
 * Animated spotlight beams, soft smoke/fog, and neon color pulses.
 * Non-interactive, respects reduced motion via CSS.
 */
export function StageLights() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Spotlight beams */}
      <div
        className="absolute -top-24 left-1/4 h-[120%] w-[40%] origin-top rotate-[15deg] blur-3xl opacity-40 animate-[beam-sweep_7s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--primary) / 0.55), transparent 70%)",
        }}
      />
      <div
        className="absolute -top-24 right-1/4 h-[120%] w-[40%] origin-top -rotate-[15deg] blur-3xl opacity-40 animate-[beam-sweep_9s_ease-in-out_infinite_reverse] motion-reduce:animate-none"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--accent) / 0.5), transparent 70%)",
        }}
      />

      {/* Neon color pulses */}
      <div className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl opacity-30 animate-[pulse-glow_5s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.6), transparent 70%)" }}
      />

      {/* Soft smoke/fog */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/70 via-background/20 to-transparent blur-2xl" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.5)_100%)]" />

      <style>{`
        @keyframes beam-sweep {
          0%, 100% { transform: rotate(15deg) translateX(0); opacity: 0.35; }
          50% { transform: rotate(20deg) translateX(30px); opacity: 0.55; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.2; transform: translate(-50%, 0) scale(1); }
          50% { opacity: 0.45; transform: translate(-50%, 0) scale(1.15); }
        }
      `}</style>
    </div>
  );
}

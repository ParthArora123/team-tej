/**
 * StageLights — cinematic overlay for the homepage hero.
 * Animated spotlight beams, soft smoke/fog, and neon color pulses.
 * Rendered above hero media using screen blend so beams stay visible
 * over bright imagery. Non-interactive, respects reduced motion via CSS.
 */
export function StageLights() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen"
    >
      {/* Spotlight beams */}
      <div
        className="absolute -top-24 left-1/4 h-[130%] w-[45%] origin-top rotate-[15deg] blur-2xl opacity-70 animate-[beam-sweep_7s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--primary) / 0.9), hsl(var(--primary) / 0.35) 40%, transparent 75%)",
        }}
      />
      <div
        className="absolute -top-24 right-1/4 h-[130%] w-[45%] origin-top -rotate-[15deg] blur-2xl opacity-70 animate-[beam-sweep-r_9s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--accent) / 0.9), hsl(var(--accent) / 0.35) 40%, transparent 75%)",
        }}
      />

      {/* Neon color pulse */}
      <div
        className="absolute top-1/3 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl opacity-60 animate-[pulse-glow_5s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.85), transparent 70%)",
        }}
      />

      {/* Soft smoke/fog at base (normal blend, so keep outside screen container) */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/60 via-background/15 to-transparent blur-2xl" />

      <style>{`
        @keyframes beam-sweep {
          0%, 100% { transform: rotate(12deg) translateX(0); opacity: 0.55; }
          50% { transform: rotate(20deg) translateX(30px); opacity: 0.85; }
        }
        @keyframes beam-sweep-r {
          0%, 100% { transform: rotate(-12deg) translateX(0); opacity: 0.55; }
          50% { transform: rotate(-20deg) translateX(-30px); opacity: 0.85; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.35; transform: translate(-50%, 0) scale(1); }
          50% { opacity: 0.7; transform: translate(-50%, 0) scale(1.2); }
        }
      `}</style>
    </div>
  );
}

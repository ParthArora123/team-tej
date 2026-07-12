/**
 * StageLights — cinematic spotlight beams for the hero carousel.
 * Two sweeping colored spotlights + a pulsing neon glow, rendered above
 * hero media using screen blend so beams punch through bright imagery.
 * Non-interactive; respects prefers-reduced-motion via CSS.
 */
export function StageLights() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Screen-blend beam layer so lights read over any image */}
      <div className="absolute inset-0 mix-blend-screen">
        {/* Left spotlight beam */}
        <div
          className="absolute -top-32 left-[18%] h-[140%] w-[38%] origin-top rotate-[14deg] blur-2xl opacity-90 animate-[beam-sweep-l_7s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{
            background:
              "linear-gradient(to bottom, hsl(var(--primary) / 0.95), hsl(var(--primary) / 0.5) 35%, hsl(var(--primary) / 0.15) 65%, transparent 85%)",
          }}
        />
        {/* Right spotlight beam */}
        <div
          className="absolute -top-32 right-[18%] h-[140%] w-[38%] origin-top -rotate-[14deg] blur-2xl opacity-90 animate-[beam-sweep-r_9s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{
            background:
              "linear-gradient(to bottom, hsl(var(--accent) / 0.95), hsl(var(--accent) / 0.5) 35%, hsl(var(--accent) / 0.15) 65%, transparent 85%)",
          }}
        />

        {/* Center hotspot / lens flare */}
        <div
          className="absolute top-[28%] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl opacity-70 animate-[stage-pulse_5s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.9), hsl(var(--primary) / 0.3) 45%, transparent 75%)",
          }}
        />
      </div>

      {/* Soft smoke/fog at the base — normal blend for depth */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/60 via-background/15 to-transparent blur-2xl" />

      <style>{`
        @keyframes beam-sweep-l {
          0%, 100% { transform: rotate(10deg) translateX(-10px); opacity: 0.7; }
          50%      { transform: rotate(20deg) translateX(30px);  opacity: 1; }
        }
        @keyframes beam-sweep-r {
          0%, 100% { transform: rotate(-10deg) translateX(10px);  opacity: 0.7; }
          50%      { transform: rotate(-20deg) translateX(-30px); opacity: 1; }
        }
        @keyframes stage-pulse {
          0%, 100% { opacity: 0.45; transform: translate(-50%, 0) scale(1); }
          50%      { opacity: 0.9;  transform: translate(-50%, 0) scale(1.25); }
        }
      `}</style>
    </div>
  );
}

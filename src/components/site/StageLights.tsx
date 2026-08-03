/**
 * StageLights — cinematic live spotlight beams for the hero carousel.
 * Multiple sweeping colored spotlights with continuous motion + pulsing
 * hotspot and drifting lens flares. Rendered above hero media with
 * screen blend so beams punch through bright imagery.
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
        {/* Left spotlight beam — wide sweep */}
        <div
          className="absolute -top-40 left-[18%] h-[150%] w-[36%] origin-top blur-2xl opacity-70 animate-[beam-sweep-l_18s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{
            background:
              "linear-gradient(to bottom, hsl(var(--primary) / 0.95), hsl(var(--primary) / 0.5) 35%, hsl(var(--primary) / 0.15) 65%, transparent 85%)",
          }}
        />
        {/* Right spotlight beam — opposing sweep */}
        <div
          className="absolute -top-40 right-[18%] h-[150%] w-[36%] origin-top blur-2xl opacity-70 animate-[beam-sweep-r_22s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{
            background:
              "linear-gradient(to bottom, hsl(var(--accent) / 0.95), hsl(var(--accent) / 0.5) 35%, hsl(var(--accent) / 0.15) 65%, transparent 85%)",
          }}
        />
        {/* Center accent beam — slow drift */}
        <div
          className="absolute -top-32 left-1/2 h-[140%] w-[26%] -translate-x-1/2 origin-top blur-3xl opacity-70 animate-[beam-sweep-c_26s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{
            background:
              "linear-gradient(to bottom, hsl(var(--primary) / 0.75), hsl(var(--accent) / 0.35) 45%, transparent 80%)",
          }}
        />

        {/* Center hotspot / lens flare */}
        <div
          className="absolute top-[28%] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl opacity-50 animate-[stage-pulse_14s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.9), hsl(var(--primary) / 0.3) 45%, transparent 75%)",
          }}
        />

        {/* Drifting side flare */}
        <div
          className="absolute top-[45%] left-[10%] h-64 w-64 rounded-full blur-3xl opacity-60 animate-[flare-drift_20s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--accent) / 0.8), transparent 70%)",
          }}
        />
      </div>

      {/* Soft smoke/fog at the base — normal blend for depth */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/60 via-background/15 to-transparent blur-2xl" />

      <style>{`
        @keyframes beam-sweep-l {
          0%   { transform: rotate(8deg)  translateX(-30px); }
          50%  { transform: rotate(20deg) translateX(40px); }
          100% { transform: rotate(8deg)  translateX(-30px); }
        }
        @keyframes beam-sweep-r {
          0%   { transform: rotate(-8deg)  translateX(30px); }
          50%  { transform: rotate(-20deg) translateX(-40px); }
          100% { transform: rotate(-8deg)  translateX(30px); }
        }
        @keyframes beam-sweep-c {
          0%   { transform: translateX(-50%) rotate(-6deg); }
          50%  { transform: translateX(-50%) rotate(6deg); }
          100% { transform: translateX(-50%) rotate(-6deg); }
        }
        @keyframes stage-pulse {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          50%      { transform: translate(-50%, 0) scale(1.12); }
        }
        @keyframes flare-drift {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(60px, -30px) scale(1.08); }
          100% { transform: translate(0, 0) scale(1); }
        }
      `}</style>
    </div>
  );
}

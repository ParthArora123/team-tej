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
      style={{ contain: "strict" }}
    >
      {/* Plain (non-blended) beam layer. mix-blend-mode forced a full-screen
          compositor readback on every animation frame — measured as the
          largest single FPS drain on the site — so the beams now paint
          normally with slightly higher opacity for the same look. */}
      <div className="absolute inset-0">
        {/* Left spotlight beam — wide sweep */}
        <div
          className="absolute -top-40 left-[18%] h-[150%] w-[36%] origin-top blur-2xl opacity-50 transform-gpu animate-[beam-sweep-l_18s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{
            background:
              "linear-gradient(to bottom, hsl(var(--primary) / 0.9), hsl(var(--primary) / 0.45) 35%, hsl(var(--primary) / 0.12) 65%, transparent 85%)",
          }}
        />
        {/* Right spotlight beam — opposing sweep */}
        <div
          className="absolute -top-40 right-[18%] h-[150%] w-[36%] origin-top blur-2xl opacity-50 transform-gpu animate-[beam-sweep-r_22s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{
            background:
              "linear-gradient(to bottom, hsl(var(--accent) / 0.9), hsl(var(--accent) / 0.45) 35%, hsl(var(--accent) / 0.12) 65%, transparent 85%)",
          }}
        />

        {/* Center hotspot / lens flare — static on touch devices */}
        <div
          className="hidden lg:block absolute top-[28%] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl opacity-40 transform-gpu animate-[stage-pulse_14s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.8), hsl(var(--primary) / 0.25) 45%, transparent 75%)",
          }}
        />
      </div>


      {/* Soft smoke/fog at the base — normal blend for depth */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/60 via-background/15 to-transparent" />

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

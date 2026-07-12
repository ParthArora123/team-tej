/**
 * StageLights — cinematic overlay for the homepage hero.
 * Pure CSS: animated spotlight beams, soft smoke/fog, and neon color pulses.
 * Non-interactive, respects reduced motion.
 */
export function StageLights() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />

      {/* Spotlight beams */}
      <div className="stage-beam stage-beam-a" />
      <div className="stage-beam stage-beam-b" />
      <div className="stage-beam stage-beam-c" />

      {/* Neon pulses */}
      <div className="absolute -top-24 -left-24 h-[46vmin] w-[46vmin] rounded-full blur-3xl opacity-40 animate-[stagePulse_7s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, #C7A34A 0%, transparent 60%)" }} />
      <div className="absolute -bottom-24 -right-24 h-[54vmin] w-[54vmin] rounded-full blur-3xl opacity-35 animate-[stagePulse_9s_ease-in-out_infinite_reverse]"
        style={{ background: "radial-gradient(circle, #7A3BFF 0%, transparent 60%)" }} />
      <div className="absolute top-1/3 right-1/4 h-[38vmin] w-[38vmin] rounded-full blur-3xl opacity-30 animate-[stagePulse_11s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 60%)" }} />

      {/* Smoke / fog */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-60 mix-blend-screen"
        style={{
          background:
            "radial-gradient(60% 100% at 30% 100%, rgba(199,163,74,0.18), transparent 70%), radial-gradient(60% 100% at 70% 100%, rgba(122,59,255,0.18), transparent 70%)",
        }}
      />
      <div className="absolute inset-0 opacity-[0.09] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.85'/></svg>\")",
        }}
      />

      <style>{`
        .stage-beam {
          position: absolute;
          top: -15%;
          width: 55vmax;
          height: 140vmax;
          transform-origin: top center;
          filter: blur(24px);
          opacity: 0.35;
          mix-blend-mode: screen;
          will-change: transform, opacity;
        }
        .stage-beam-a {
          left: 15%;
          background: linear-gradient(to bottom, rgba(199,163,74,0.55) 0%, rgba(199,163,74,0.10) 45%, transparent 75%);
          clip-path: polygon(48% 0, 52% 0, 100% 100%, 0 100%);
          animation: beamSway 9s ease-in-out infinite alternate;
        }
        .stage-beam-b {
          left: 45%;
          background: linear-gradient(to bottom, rgba(122,59,255,0.55) 0%, rgba(122,59,255,0.10) 45%, transparent 75%);
          clip-path: polygon(48% 0, 52% 0, 100% 100%, 0 100%);
          animation: beamSway2 11s ease-in-out infinite alternate;
        }
        .stage-beam-c {
          left: 70%;
          background: linear-gradient(to bottom, rgba(59,130,246,0.55) 0%, rgba(59,130,246,0.10) 45%, transparent 75%);
          clip-path: polygon(48% 0, 52% 0, 100% 100%, 0 100%);
          animation: beamSway3 13s ease-in-out infinite alternate;
        }
        @keyframes beamSway {
          0%   { transform: rotate(-14deg); opacity: 0.15; }
          50%  { transform: rotate(4deg);   opacity: 0.45; }
          100% { transform: rotate(-6deg);  opacity: 0.25; }
        }
        @keyframes beamSway2 {
          0%   { transform: rotate(10deg); opacity: 0.2; }
          50%  { transform: rotate(-8deg); opacity: 0.5; }
          100% { transform: rotate(2deg);  opacity: 0.3; }
        }
        @keyframes beamSway3 {
          0%   { transform: rotate(-4deg); opacity: 0.2; }
          50%  { transform: rotate(12deg); opacity: 0.5; }
          100% { transform: rotate(-2deg); opacity: 0.3; }
        }
        @keyframes stagePulse {
          0%,100% { transform: scale(1); opacity: 0.35; }
          50%     { transform: scale(1.15); opacity: 0.55; }
        }
        @media (prefers-reduced-motion: reduce) {
          .stage-beam, [class*="animate-[stagePulse"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

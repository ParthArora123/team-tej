/**
 * AuroraBackground — pure-CSS animated gradient beams for a premium ambient wash.
 * Sits behind everything (pointer-events-none, -z-20). SSR-safe.
 */
export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
      style={{ contain: "strict" }}
    >
      <div className="aurora aurora-a" />
      <div className="aurora aurora-b" />
      <div className="aurora aurora-c" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.8'/></svg>\")",
        }}
      />
      <style>{`
        .aurora {
          position: absolute;
          inset: -25%;
          filter: blur(80px);
          opacity: 0.55;
          will-change: transform;
        }
        .aurora-a {
          background: radial-gradient(closest-side, color-mix(in oklab, var(--primary) 70%, transparent), transparent 70%);
          animation: aurora-drift-a 22s ease-in-out infinite alternate;
        }
        .aurora-b {
          background: radial-gradient(closest-side, color-mix(in oklab, var(--primary) 50%, #ff5b1f), transparent 70%);
          animation: aurora-drift-b 28s ease-in-out infinite alternate;
          opacity: 0.35;
        }
        .aurora-c {
          background: radial-gradient(closest-side, color-mix(in oklab, var(--primary) 40%, #7a3bff), transparent 70%);
          animation: aurora-drift-c 34s ease-in-out infinite alternate;
          opacity: 0.28;
        }
        @keyframes aurora-drift-a {
          0%   { transform: translate3d(-10%, -8%, 0) scale(1); }
          50%  { transform: translate3d(15%,  6%, 0) scale(1.15); }
          100% { transform: translate3d(-5%, 12%, 0) scale(1.05); }
        }
        @keyframes aurora-drift-b {
          0%   { transform: translate3d(20%, 10%, 0) scale(1.1); }
          50%  { transform: translate3d(-12%, -6%, 0) scale(1); }
          100% { transform: translate3d(8%, 18%, 0) scale(1.2); }
        }
        @keyframes aurora-drift-c {
          0%   { transform: translate3d(0%, 20%, 0) scale(1); }
          50%  { transform: translate3d(18%, -4%, 0) scale(1.1); }
          100% { transform: translate3d(-15%, 8%, 0) scale(1.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          .aurora { animation: none; }
        }
      `}</style>
    </div>
  );
}

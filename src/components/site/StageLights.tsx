/**
 * StageLights — cinematic overlay for the homepage hero.
 * Pure CSS: animated spotlight beams, soft smoke/fog, and neon color pulses.
 * Non-interactive, respects reduced motion.
 */
export function StageLights() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Vignette only — static, no pulsing/blinking */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.5)_100%)]" />
    </div>
  );
}


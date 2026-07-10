import { Suspense, lazy, useEffect, useState } from "react";

const Scene = lazy(() => import("./FloatingShapes3D.scene"));

/**
 * FloatingShapes3D — subtle R3F ambient layer (intensity ~3/5).
 * Client-only, lazy-loaded, disabled on touch/reduced-motion/small screens.
 */
export function FloatingShapes3D() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce), (hover: none), (max-width: 768px)");
    if (mq.matches) return;
    // small idle delay so it doesn't fight the LCP
    const t = setTimeout(() => setEnabled(true), 600);
    return () => clearTimeout(t);
  }, []);
  if (!enabled) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-[5] opacity-70">
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </div>
  );
}

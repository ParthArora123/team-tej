import { useEffect, useState } from "react";

/**
 * "Lite mode" = phones, tablets, touch laptops, low-core machines and anyone
 * who asked for reduced motion. On those devices continuous JS-driven
 * animations (ken-burns zooms, parallax springs, tilt) are the main source of
 * dropped frames, so components use this to fall back to a static render.
 *
 * Always returns `false` during SSR and the first client render so hydration
 * stays stable; the real value lands in an effect.
 */
export function useLiteMode() {
  const [lite, setLite] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(
      "(max-width: 1024px), (hover: none), (pointer: coarse), (prefers-reduced-motion: reduce)",
    );
    const cores = navigator.hardwareConcurrency ?? 8;
    const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8;
    const weakDevice = cores <= 4 || mem <= 4;
    const update = () => setLite(weakDevice || mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return lite;
}

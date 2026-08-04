import { Children, isValidElement, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Turns its children into a one-section-at-a-time horizontal experience.
 * Each child becomes a full-viewport slide; fixed left/right arrows move
 * between them with a smooth slide + fade. Content taller than the viewport
 * scrolls vertically inside its own slide, so nothing is ever clipped.
 */
export default function HorizontalPager({ children }: { children: React.ReactNode }) {
  const slides = Children.toArray(children).filter(
    (c) => isValidElement(c) || (typeof c === "string" && c.trim() !== ""),
  );
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(
    (dir: number) => setIndex((i) => Math.min(count - 1, Math.max(0, i + dir))),
    [count],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /input|textarea|select/i.test(t.tagName)) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // Reset each slide's internal scroll when it becomes active.
  const trackRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = trackRef.current?.children[index] as HTMLElement | undefined;
    if (el) el.scrollTo({ top: 0, behavior: "smooth" });
  }, [index]);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: "100svh" }}
      onTouchStart={(e) => {
        const t = e.touches[0];
        touchStart.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const s = touchStart.current;
        if (!s) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - s.x;
        const dy = t.clientY - s.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
        touchStart.current = null;
      }}
    >
      <motion.div
        ref={trackRef}
        className="flex h-full w-full will-change-transform"
        animate={{ x: `-${index * 100}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 22, mass: 0.9 }}
      >
        {slides.map((child, i) => {
          // Virtualise: only the current slide and its immediate neighbours are
          // mounted. Off-screen sections would otherwise keep their videos,
          // carousels, timers and animations alive all at once — the main
          // cause of the freezing/stutter across devices.
          const active = i === index;
          const near = Math.abs(i - index) <= 1;
          return (
            <div
              key={i}
              className="h-full w-full shrink-0 grow-0 basis-full overflow-y-auto overflow-x-hidden overscroll-contain"
              aria-hidden={!active}
              inert={!active}
              style={{
                pointerEvents: active ? "auto" : "none",
                opacity: active ? 1 : 0.25,
                transition: "opacity .35s ease",
                contentVisibility: active ? "visible" : "auto",
                containIntrinsicSize: "100svh",
              } as React.CSSProperties}
            >
              {near ? (
                <div className="min-h-full flex flex-col justify-center py-6">{child}</div>
              ) : null}
            </div>
          );
        })}
      </motion.div>

      {/* Arrows */}
      <button
        type="button"
        aria-label="Previous section"
        onClick={() => go(-1)}
        disabled={index === 0}
        className="fixed left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50 h-11 w-11 sm:h-14 sm:w-14 grid place-items-center rounded-full border border-border bg-background/70 backdrop-blur-md text-foreground shadow-lg transition hover:scale-110 disabled:opacity-30 disabled:hover:scale-100"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
      <button
        type="button"
        aria-label="Next section"
        onClick={() => go(1)}
        disabled={index === count - 1}
        className="fixed right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 h-11 w-11 sm:h-14 sm:w-14 grid place-items-center rounded-full border border-border bg-background/70 backdrop-blur-md text-foreground shadow-lg transition hover:scale-110 disabled:opacity-30 disabled:hover:scale-100"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Progress dots */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-center gap-2 rounded-full border border-border bg-background/70 backdrop-blur-md px-3 py-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to section ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground"}`}
          />
        ))}
      </div>
    </div>
  );
}

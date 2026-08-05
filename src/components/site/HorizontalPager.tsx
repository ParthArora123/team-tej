import { Children, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Turns its children into a full-screen, one-section-at-a-time horizontal
 * experience. Each direct child becomes one slide. Content taller than the
 * viewport stays vertically scrollable inside its slide.
 */
export function HorizontalPager({ children }: { children: React.ReactNode }) {
  const slides = useMemo(() => Children.toArray(children).filter(Boolean), [children]);
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  const count = slides.length;
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(
    (delta: number) => {
      setState(([i]) => {
        const next = Math.min(count - 1, Math.max(0, i + delta));
        return next === i ? [i, 0] : [next, delta];
      });
    },
    [count],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  useEffect(() => {
    // Reset vertical scroll of the newly shown slide
    window.scrollTo({ top: 0 });
  }, [index]);

  const variants = {
    enter: (d: number) => ({ x: d >= 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d >= 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ minHeight: "100svh" }}
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
      <AnimatePresence initial={false} mode="wait" custom={dir}>
        <motion.div
          key={index}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.55 }}
          className="w-full"
          style={{ willChange: "transform, opacity" }}
        >
          {slides[index]}
        </motion.div>
      </AnimatePresence>

      {/* Fixed navigation arrows */}
      <button
        type="button"
        aria-label="Previous section"
        onClick={() => go(-1)}
        disabled={index === 0}
        className="fixed left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50 h-11 w-11 sm:h-14 sm:w-14 rounded-full border border-border bg-background/80 text-foreground shadow-lg flex items-center justify-center transition-opacity disabled:opacity-25 hover:bg-background"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
      <button
        type="button"
        aria-label="Next section"
        onClick={() => go(1)}
        disabled={index === count - 1}
        className="fixed right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 h-11 w-11 sm:h-14 sm:w-14 rounded-full border border-border bg-background/80 text-foreground shadow-lg flex items-center justify-center transition-opacity disabled:opacity-25 hover:bg-background"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Progress dots */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to section ${i + 1}`}
            onClick={() => setState(([cur]) => [i, i > cur ? 1 : -1])}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/40"}`}
          />
        ))}
      </div>
    </div>
  );
}

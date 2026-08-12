import { Children, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Turns its children into a full-screen, one-section-at-a-time horizontal
 * experience. Each direct child becomes one slide. Content taller than the
 * viewport stays vertically scrollable inside its slide.
 *
 * Performance notes:
 * - Visited slides stay mounted (hidden with `display:none`) so re-visiting a
 *   section costs nothing — no re-render of decks, no re-download of video.
 * - A slide is mounted hidden one frame BEFORE it animates in, so its mount
 *   cost never lands in the middle of the transition (that was the source of
 *   400-600ms long tasks on phones).
 * - The transition itself runs through the Web Animations API (transform +
 *   opacity only), so it is compositor-driven instead of a per-frame JS spring.
 */
export function HorizontalPager({ children }: { children: React.ReactNode }) {
  const slides = useMemo(() => Children.toArray(children).filter(Boolean), [children]);
  const count = slides.length;

  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState<number[]>([0]);
  const pending = useRef<{ next: number; dir: number } | null>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const [nav, setNav] = useState(0);

  const navigate = useCallback(
    (target: number, dir: number) => {
      const next = Math.min(count - 1, Math.max(0, target));
      if (next === index) return;
      pending.current = { next, dir };
      setMounted((m) => (m.includes(next) ? m : [...m, next]));
      setNav((n) => n + 1);
    },
    [count, index],
  );

  const go = useCallback((delta: number) => navigate(index + delta, delta >= 0 ? 1 : -1), [navigate, index]);
  const jumpTo = useCallback((target: number) => navigate(target, target > index ? 1 : -1), [navigate, index]);

  const [animating, setAnimating] = useState(false);
  // Bumped on every scene change to replay the cinematic grade sweep.
  const [grade, setGrade] = useState(0);

  // Commit the pending slide one frame after it has been mounted (hidden), so
  // the mount cost never lands inside the transition.
  useEffect(() => {
    const p = pending.current;
    if (!p || !mounted.includes(p.next)) return;
    const id = requestAnimationFrame(() => {
      pending.current = null;
      setIndex(p.next);
      requestAnimationFrame(() => {
        const el = slideRefs.current[p.next];
        if (!el || typeof el.animate !== "function") return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        setAnimating(true);
        setGrade((g) => g + 1);
        // Cinematic scene change: the incoming screen slides in from the
        // travel direction with a slight depth push, easing out slowly so the
        // story "cuts" instead of snapping.
        const anim = el.animate(
          [
            {
              transform: `translate3d(${p.dir >= 0 ? 70 : -70}%,0,0) scale(0.965)`,
              opacity: 0,
            },
            { transform: "translate3d(0,0,0) scale(1)", opacity: 1 },
          ],
          { duration: 720, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        );
        // Drop the promoted layer as soon as the transition is over — a
        // permanent `will-change` keeps a viewport-sized texture alive.
        anim.finished.then(() => setAnimating(false)).catch(() => setAnimating(false));
      });
    });
    return () => cancelAnimationFrame(id);
  }, [mounted, nav]);

  // Pre-warm ONLY the next slide while the browser is idle. Warming every
  // remaining chapter mounted the whole site into one DOM (~3k nodes), which
  // made every style recalculation and scroll frame far more expensive.
  const mountedRef = useRef(mounted);
  mountedRef.current = mounted;
  useEffect(() => {
    if (typeof window === "undefined") return;
    const next = index + 1;
    if (next >= count || mountedRef.current.includes(next)) return;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const useIdle = typeof w.requestIdleCallback === "function";
    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      setMounted((m) => (m.includes(next) ? m : [...m, next]));
    };
    const handle = useIdle ? w.requestIdleCallback!(warm, { timeout: 4000 }) : window.setTimeout(warm, 1200);
    return () => {
      cancelled = true;
      if (useIdle) w.cancelIdleCallback?.(handle);
      else clearTimeout(handle);
    };
  }, [count, index, mounted]);






  // Reset vertical scroll + stop media in the slide we just left.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    slideRefs.current.forEach((el, i) => {
      if (!el || i === index) return;
      el.querySelectorAll("video").forEach((v) => {
        if (!v.paused) v.pause();
      });
    });
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // Lets any CTA on a slide jump to the slide that owns a given element id:
  //   window.dispatchEvent(new CustomEvent("pager:goto", { detail: { id: "workshops" } }))
  // Works even if the target slide is not mounted yet — slides pre-warm by
  // index, so we fall back to mounting everything and retrying next frame.
  useEffect(() => {
    const onGoto = (e: Event) => {
      const id = (e as CustomEvent<{ id?: string }>).detail?.id;
      if (!id) return;
      const findSlide = () =>
        slideRefs.current.findIndex((el) => !!el && (el.id === id || !!el.querySelector(`#${CSS.escape(id)}`)));
      const target = findSlide();
      if (target >= 0) {
        if (target === index) {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          jumpTo(target);
          window.setTimeout(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 600);
        }
        return;
      }
      // Not mounted yet: mount all slides, then retry once.
      setMounted(Array.from({ length: count }, (_, i) => i));
      window.setTimeout(() => {
        const t = findSlide();
        if (t >= 0) jumpTo(t);
      }, 120);
    };
    window.addEventListener("pager:goto", onGoto as EventListener);
    return () => window.removeEventListener("pager:goto", onGoto as EventListener);
  }, [count, index, jumpTo]);

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
      {slides.map((slide, i) => {
        if (!mounted.includes(i)) return null;
        const active = i === index;
        return (
          <div
            key={i}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            data-pager-slide={active ? "active" : "hidden"}

            className="w-full"
            aria-hidden={!active}
            style={
              active
                ? animating
                  ? { willChange: "transform, opacity" }
                  : undefined
                : { display: "none", contentVisibility: "hidden" }
            }

          >
            {slide}
          </div>
        );
      })}

      {/* Scene-change grade — brief cinematic dim that ties screens together */}
      {grade > 0 && <div key={grade} aria-hidden className="pager-grade pager-grade-on" />}

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
            onClick={() => jumpTo(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/40"}`}
          />
        ))}
      </div>
    </div>
  );
}

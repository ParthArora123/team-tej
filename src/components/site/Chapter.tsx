import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Chapter — a full-screen cinematic "chapter" wrapper.
 *
 * Each homepage screen is one chapter. When the chapter becomes visible
 * (either by scrolling into view or by the horizontal pager revealing it),
 * its content plays a single GPU-only entrance (transform + opacity).
 *
 * Performance notes:
 * - No scroll listeners, no per-frame JS. Visibility is detected once with
 *   IntersectionObserver and the animation runs as a compositor-friendly
 *   CSS animation.
 * - Reveal state is latched, so re-visiting a chapter never re-animates
 *   (and never re-paints the whole screen).
 */
export function Chapter({
  index,
  total,
  kicker,
  children,
  bleed = false,
  className = "",
}: {
  index: number;
  total: number;
  kicker?: string;
  children: ReactNode;
  /** Full-bleed chapters (e.g. the hero) skip padding + chapter chrome. */
  bleed?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (seen) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  const [done, setDone] = useState(false);
  const state = `${seen ? "chapter-in" : ""} ${done ? "chapter-done" : ""}`;

  return (
    <section
      ref={ref}
      data-chapter={index}
      className={`chapter relative w-full ${bleed ? "" : "flex flex-col justify-center py-14 lg:py-16"} ${className}`}
      style={{ minHeight: "100svh" }}
    >
      {!bleed && kicker && (
        <div
          className={`chapter-rail relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-10 mb-6 flex items-center gap-4 ${state}`}
        >
          <span className="font-display text-xs tabular-nums tracking-[0.35em] text-primary">
            {String(index).padStart(2, "0")}
            <span className="text-muted-foreground/60"> / {String(total).padStart(2, "0")}</span>
          </span>
          <span
            aria-hidden
            className="h-px flex-1 origin-left"
            style={{ background: "linear-gradient(90deg, var(--primary), transparent)" }}
          />
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{kicker}</span>
        </div>
      )}

      <div
        className={`chapter-body chapter-stagger relative ${state}`}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) setDone(true);
        }}
      >
        {children}
      </div>
    </section>
  );
}


import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type DeckVariant = "stack" | "fan" | "rise" | "shuffle";

export type StackedDeckItem = {
  id: string;
  render: (state: { front: boolean; active: boolean; depth: number }) => ReactNode;
};

const EASE = [0.16, 1, 0.3, 1] as const;
const VISIBLE = 5;

/** Uniform rotation cadence across every deck on the site (calm, non-flickery). */
export const DECK_ROTATE_MS = 11000;

/** One shared scrim tone for every media card — brand ink, never pure black. */
export const DECK_SCRIM =
  "linear-gradient(180deg, transparent 28%, color-mix(in oklab, var(--foreground) 78%, var(--primary) 22%) 100%)";


/**
 * Shared 3D stacked-card deck — the signature interaction of the site.
 * Same physics + timing everywhere; `variant` only changes how the
 * cards behind the front one are laid out so no two sections feel identical.
 */
export function StackedDeck({
  items,
  variant = "stack",
  className = "",
  cardClassName = "",
  autoAdvanceMs = DECK_ROTATE_MS,
  showControls = true,
}: {
  items: StackedDeckItem[];
  variant?: DeckVariant;
  className?: string;
  cardClassName?: string;
  autoAdvanceMs?: number;
  showControls?: boolean;
}) {
  const n = items.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setIndex(0), [n]);

  const next = useCallback(() => setIndex((i) => (i + 1) % Math.max(n, 1)), [n]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + Math.max(n, 1)) % Math.max(n, 1)), [n]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!autoAdvanceMs || paused || !inView || n < 2 || reduce) return;
    const t = setInterval(next, autoAdvanceMs);
    return () => clearInterval(t);
  }, [autoAdvanceMs, paused, inView, n, next, reduce]);

  const layout = useMemo(() => makeLayout(variant), [variant]);

  if (n === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <div
        ref={ref}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="relative h-full w-full select-none"
        style={{ perspective: 1600 }}
      >
        {items.map((it, i) => {
          const depth = (i - index + n) % n;
          const visible = depth < VISIBLE;
          const front = depth === 0;
          const justLeft = n > 1 && depth === n - 1;
          // Keep the departing card visible while it settles behind the pack.
          // Fading it to zero made media-heavy decks visibly flash on rotation.
          const t = justLeft ? layout(VISIBLE - 1) : layout(depth);
          return (
            <motion.div
              key={it.id}
              drag={front && n > 1 ? "x" : false}
              dragElastic={0.16}
              dragMomentum={false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -70 || info.velocity.x < -450) next();
                else if (info.offset.x > 70 || info.velocity.x > 450) prev();
              }}
              onClick={() => {
                if (!front && visible) setIndex(i);
              }}
              animate={{
                x: t.x,
                y: t.y,
                scale: t.scale,
                rotate: t.rotate,
                rotateY: t.rotateY,
                zIndex: 40 - depth,
              }}
              transition={{ duration: reduce ? 0 : 1.05, ease: EASE }}


              className={`absolute inset-0 transform-gpu will-change-transform ${
                front ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
              } ${cardClassName}`}
              style={{
                pointerEvents: visible ? "auto" : "none",
                transformStyle: "preserve-3d",
                visibility: visible || justLeft ? "visible" : "hidden",
                opacity: 1,
              }}
            >
              {it.render({ front, active: front && inView, depth })}
            </motion.div>
          );
        })}
      </div>

      {showControls && n > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous card"
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card/70 backdrop-blur transition-colors hover:border-primary hover:text-primary"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5">
            {items.slice(0, 8).map((it, i) => (
              <button
                key={it.id}
                type="button"
                aria-label={`Go to card ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === index % Math.min(n, 8) ? "w-6 bg-primary" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={next}
            aria-label="Next card"
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card/70 backdrop-blur transition-colors hover:border-primary hover:text-primary"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function makeLayout(variant: DeckVariant) {
  // A real pack of cards: tight, even offsets so the cards behind peek out
  // like the edges of a deck instead of drifting far apart.
  return (d: number) => {
    const opacity = 1;
    switch (variant) {
      case "fan":
        return { x: d * 10, y: d * 6, scale: 1 - d * 0.035, rotate: d * 2.2, rotateY: 0, opacity };
      case "rise":
        return { x: 0, y: d * -9, scale: 1 - d * 0.035, rotate: d * -1.2, rotateY: 0, opacity };
      case "shuffle":
        return {
          x: d % 2 === 0 ? d * -8 : d * 8,
          y: d * 8,
          scale: 1 - d * 0.035,
          rotate: d % 2 === 0 ? -d * 1.6 : d * 1.6,
          rotateY: 0,
          opacity,
        };
      default:
        return { x: d * 6, y: d * 9, scale: 1 - d * 0.035, rotate: d * 1.4, rotateY: 0, opacity };
    }
  };
}

/** Shared card shell so every deck shares the same depth/shadow language. */
export function DeckShell({
  children,
  className = "",
  dark,
}: {
  children: ReactNode;
  className?: string;
  /** Kept for API compatibility — every card now uses the same uniform surface. */
  dark?: boolean;
}) {
  void dark;
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-[1.75rem] border border-border bg-card ${className}`}
      style={{
        boxShadow:
          "0 30px 80px -24px color-mix(in oklab, var(--foreground) 30%, transparent), 0 0 0 1px color-mix(in oklab, var(--foreground) 5%, transparent) inset",
      }}
    >
      {children}
    </div>
  );
}


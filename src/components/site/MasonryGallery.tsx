import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { X } from "lucide-react";

type GalleryItem = { id?: string | number; image_url?: string | null; caption?: string | null };

/**
 * Editorial masonry gallery — CSS columns keep the layout cheap (no JS
 * measuring, no layout shift) while each frame gets a soft zoom on hover and
 * a cinematic lightbox on click.
 */
export function MasonryGallery({ items }: { items: GalleryItem[] }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<GalleryItem | null>(null);
  const frames = items.filter((g) => !!g.image_url);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  if (!frames.length) return null;

  return (
    <>
      <div className="columns-2 lg:columns-3 gap-4 lg:gap-5 [column-fill:_balance]">
        {frames.map((g, i) => (
          <motion.figure
            key={g.id ?? i}
            initial={reduce ? false : { opacity: 0, y: 28 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: (i % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setActive(g)}
            className="group premium-card relative mb-4 lg:mb-5 break-inside-avoid overflow-hidden rounded-2xl cursor-zoom-in"
          >
            <img
              src={g.image_url!}
              alt={g.caption ?? "Gallery frame"}
              loading="lazy"
              decoding="async"
              className="w-full h-auto block transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: "linear-gradient(180deg, transparent 40%, color-mix(in oklab, var(--foreground) 72%, transparent) 100%)" }}
            />
            {g.caption && (
              <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <span className="text-xs uppercase tracking-widest text-white/95 line-clamp-2">
                  {g.caption}
                </span>
              </figcaption>
            )}
          </motion.figure>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setActive(null)}
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[70] grid place-items-center p-4 sm:p-10"
            style={{ background: "color-mix(in oklab, var(--foreground) 88%, transparent)" }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setActive(null)}
              className="absolute top-5 right-5 h-10 w-10 grid place-items-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 transition"
            >
              <X size={18} />
            </button>
            <motion.img
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              src={active.image_url!}
              alt={active.caption ?? "Gallery frame"}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[86vh] max-w-full rounded-2xl object-contain shadow-[0_40px_120px_-40px_color-mix(in_oklab,var(--df-4)_60%,transparent)]"
            />
            {active.caption && (
              <p className="absolute bottom-6 inset-x-0 text-center text-xs uppercase tracking-[0.25em] text-white/75 px-6">
                {active.caption}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Play, X, Maximize2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export type CollageItem = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  video?: string | null;
  poster?: string | null;
};

const CYCLE_MS = 5000;

const DESKTOP_SLOTS = [
  "col-span-3 row-span-4",
  "col-span-3 row-span-2",
  "col-span-2 row-span-4",
  "col-span-1 row-span-2",
  "col-span-3 row-span-2",
];

const MOBILE_SLOTS = ["col-span-4 row-span-3", "col-span-2 row-span-2", "col-span-2 row-span-2"];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function Layer({ item, play }: { item: CollageItem; play: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (play) {
      try {
        v.currentTime = 0;
      } catch {
        /* ignore */
      }
      void v.play().catch(() => undefined);
    } else {
      v.pause();
    }
  }, [play, item.video]);

  return (
    <>
      {item.poster && (
        <img
          src={item.poster}
          alt={item.title ?? ""}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[50%_28%]"
        />
      )}
      {item.video && (
        <video
          ref={ref}
          src={item.video}
          poster={item.poster ?? undefined}
          muted
          loop
          playsInline
          preload={play ? "auto" : "metadata"}
          disableRemotePlayback
          disablePictureInPicture
          className="absolute inset-0 h-full w-full object-cover object-[50%_28%]"
        />
      )}
      {!item.video && !item.poster && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--primary) 45%, transparent), transparent 70%)",
          }}
        />
      )}
    </>
  );
}

function Slot({
  item,
  className,
  reduced,
  active,
  onOpen,
}: {
  item: CollageItem;
  className: string;
  reduced: boolean;
  active: boolean;
  onOpen: (item: CollageItem) => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(item)}
      aria-label={item.title ?? "Play video"}
      animate={
        reduced
          ? { opacity: active ? 1 : 0.75 }
          : { scale: active ? 1.03 : 0.985, opacity: active ? 1 : 0.55 }
      }
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      style={{ zIndex: active ? 2 : 1 }}
      className={`group relative overflow-hidden rounded-[1.25rem] bg-muted text-left transform-gpu ${className}`}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={item.id}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.08 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.2 : 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 will-change-[opacity,transform]"
        >
          <Layer item={item} play={active} />
        </motion.div>
      </AnimatePresence>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: active ? 0.85 : 1,
          background:
            "linear-gradient(180deg, transparent 45%, color-mix(in oklab, var(--foreground) 72%, var(--primary) 28%) 100%)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[1.25rem] transition-opacity duration-500"
        style={{
          opacity: active ? 1 : 0,
          boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--primary) 55%, transparent)",
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
        {item.subtitle && (
          <p className="text-[9px] uppercase tracking-[0.3em] text-white/65">{item.subtitle}</p>
        )}
        {item.title && (
          <p className="mt-1 text-sm font-medium text-white line-clamp-2">{item.title}</p>
        )}
      </div>

      <span className="pointer-events-none absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/25 bg-white/10 text-white opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
        <Maximize2 size={13} />
      </span>
    </motion.button>
  );
}


function Lightbox({ item, onClose }: { item: CollageItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] grid place-items-center bg-black/92 p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 text-white"
      >
        <X size={18} />
      </button>
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl overflow-hidden rounded-2xl"
      >
        {item.video ? (
          <video
            src={item.video}
            poster={item.poster ?? undefined}
            controls
            autoPlay
            loop
            playsInline
            className="h-full max-h-[80vh] w-full bg-black object-contain"
          />
        ) : item.poster ? (
          <img src={item.poster} alt={item.title ?? ""} className="max-h-[80vh] w-full object-contain" />
        ) : null}
      </motion.div>
    </motion.div>
  );
}

/**
 * Editorial video collage: several videos on screen at once, one swaps
 * every 5 seconds with a cinematic crossfade + drift zoom.
 */
export function VideoCollage({ items }: { items: CollageItem[] }) {
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const layout = isMobile ? MOBILE_SLOTS : DESKTOP_SLOTS;
  const slotCount = Math.min(layout.length, items.length);

  const [assign, setAssign] = useState<number[]>(() =>
    Array.from({ length: layout.length }, (_, i) => i),
  );
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [open, setOpen] = useState<CollageItem | null>(null);
  const cursor = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cursor.current = slotCount;
    setActive(0);
    setAssign(Array.from({ length: layout.length }, (_, i) => i % Math.max(items.length, 1)));
  }, [items, slotCount, layout.length]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Next item that will be swapped in — preloaded ahead of the transition.
  const nextIndex = items.length ? cursor.current % items.length : 0;

  // One frame at a time: it pops forward, plays its clip, then after 5s the
  // spotlight moves to the next frame (which gets a fresh clip when available).
  useEffect(() => {
    if (paused || !inView || slotCount === 0) return;
    const t = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % slotCount;
        if (items.length > slotCount) {
          setAssign((a) => {
            const copy = [...a];
            copy[next] = cursor.current % items.length;
            cursor.current += 1;
            return copy;
          });
        }
        return next;
      });
    }, CYCLE_MS);
    return () => clearInterval(t);
  }, [paused, inView, items.length, slotCount]);


  const onOpen = useCallback((item: CollageItem) => setOpen(item), []);

  const preload = useMemo(() => items[nextIndex], [items, nextIndex]);

  if (!items.length) return null;

  return (
    <div
      ref={wrapRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10"
    >
      <div
        className={
          isMobile
            ? "grid grid-cols-4 auto-rows-[86px] gap-2.5"
            : "grid grid-cols-6 grid-rows-6 gap-3 h-[660px] lg:h-[720px] [grid-auto-flow:dense]"
        }
      >
        {layout.slice(0, slotCount).map((cls, i) => {
          const item = items[assign[i] % items.length];
          if (!item) return null;
          return <Slot key={i} item={item} className={cls} reduced={reduced} onOpen={onOpen} />;
        })}
      </div>

      {/* invisible preloader for the upcoming clip */}
      {preload?.video && (
        <video
          key={preload.id}
          src={preload.video}
          muted
          playsInline
          preload="auto"
          aria-hidden
          tabIndex={-1}
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
      )}

      <p className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        <Play size={10} /> Tap any frame for the full clip
      </p>

      <AnimatePresence>{open && <Lightbox item={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </div>
  );
}

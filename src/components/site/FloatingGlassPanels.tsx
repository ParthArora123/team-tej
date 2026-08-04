import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Play } from "lucide-react";
import type { DeckItem } from "@/components/site/VideoDeck";
import { pauseHomepageVideo, playHomepageVideo } from "@/lib/home-video-playback";

const ROTATE_MS = 5000;

/** Organic, layered composition — percentages of the stage box. */
type Slot = { x: number; y: number; w: number; h: number; drift: number; delay: number };

const SLOTS: Slot[] = [
  { x: 2, y: 12, w: 30, h: 46, drift: 8, delay: 0 },
  { x: 34, y: 2, w: 34, h: 62, drift: 11, delay: 0.6 },
  { x: 70, y: 16, w: 28, h: 44, drift: 7, delay: 1.2 },
  { x: 6, y: 60, w: 27, h: 36, drift: 9, delay: 0.9 },
  { x: 38, y: 66, w: 26, h: 32, drift: 6, delay: 1.6 },
  { x: 68, y: 62, w: 29, h: 36, drift: 10, delay: 0.3 },
];

function PanelMedia({ item, active }: { item: DeckItem; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(false), [item.video]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) {
      const id = requestAnimationFrame(() => void playHomepageVideo(v));
      return () => cancelAnimationFrame(id);
    }
    pauseHomepageVideo(v);
    return () => pauseHomepageVideo(v);
  }, [active]);

  return (
    <div className="absolute inset-0 bg-muted">
      {item.poster && (
        <img
          src={item.poster}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-125 object-cover blur-xl opacity-100"
        />
      )}
      {item.poster && (
        <img
          src={item.poster}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain bg-transparent"
        />
      )}
      {item.video && active && (
        <video
          ref={ref}
          src={item.video}
          poster={item.poster ?? undefined}
          muted
          loop
          playsInline
          preload="metadata"
          disableRemotePlayback
          disablePictureInPicture
          onLoadedData={() => setReady(true)}
          onCanPlay={() => setReady(true)}
          className="absolute inset-0 h-full w-full object-contain"
          style={{ visibility: ready ? "visible" : "hidden" }}
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, color-mix(in oklab, var(--foreground) 62%, transparent), transparent 62%)" }}
      />
    </div>
  );
}

function Panel({
  item,
  slot,
  active,
  onSelect,
  onHover,
}: {
  item: DeckItem;
  slot: Slot;
  active: boolean;
  onSelect: () => void;
  onHover: (v: boolean) => void;
}) {
  const scale = active ? 1.14 : 1;

  const body = (
    <motion.div
      animate={{ y: [0, -slot.drift, 0] }}
      transition={{ duration: 7 + slot.drift * 0.25, repeat: Infinity, ease: "easeInOut", delay: slot.delay }}
      className="h-full w-full will-change-transform"
    >
      <motion.div
        animate={{ scale }}
        whileHover={{ scale: scale * 1.05, y: -8 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="group relative h-full w-full overflow-hidden rounded-[22px] border backdrop-blur-xl transition-[box-shadow,filter] duration-500"
        style={{
          borderColor: "color-mix(in oklab, var(--foreground) 12%, transparent)",
          background: "color-mix(in oklab, var(--card) 55%, transparent)",
          boxShadow: active
            ? "0 30px 80px -30px color-mix(in oklab, var(--primary) 65%, transparent), 0 0 0 1px color-mix(in oklab, var(--primary) 28%, transparent)"
            : "0 24px 60px -32px color-mix(in oklab, var(--foreground) 45%, transparent)",
          zIndex: active ? 20 : 10,
        }}
      >
        <PanelMedia item={item} active={active} />

        {/* glass reflection */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60 group-hover:opacity-90 transition-opacity duration-500"
          style={{
            background:
              "linear-gradient(120deg, color-mix(in oklab, var(--background) 55%, transparent) 0%, transparent 38%, transparent 62%, color-mix(in oklab, var(--background) 22%, transparent) 100%)",
            mixBlendMode: "screen",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[22px]"
          style={{ boxShadow: "inset 0 1px 0 color-mix(in oklab, var(--background) 65%, transparent)" }}
        />

        {/* play affordance */}
        {item.video && (
          <span className="pointer-events-none absolute inset-0 hidden place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:grid">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-primary-foreground/30 bg-primary/85 text-primary-foreground backdrop-blur-md">
              <Play size={16} className="translate-x-[1px]" fill="currentColor" />
            </span>
          </span>
        )}

        {/* minimal content */}
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <p className="text-[9px] uppercase tracking-[0.22em] text-primary-foreground/80">
            {item.subtitle ?? "Showcase"}
          </p>
          <p className="mt-1 line-clamp-2 text-xs sm:text-sm font-semibold text-primary-foreground">
            {item.title}
          </p>
          <p className="mt-1 max-h-0 overflow-hidden text-[10px] text-primary-foreground/70 opacity-0 transition-all duration-500 group-hover:max-h-10 group-hover:opacity-100">
            {item.video ? "Tap to watch the full clip" : "Moment from the floor"}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );

  const common = {
    className: "absolute block",
    style: {
      left: `${slot.x}%`,
      top: `${slot.y}%`,
      width: `${slot.w}%`,
      height: `${slot.h}%`,
      zIndex: active ? 20 : 10,
    } as const,
    onMouseEnter: () => onHover(true),
    onMouseLeave: () => onHover(false),
    onFocus: () => onHover(true),
    onBlur: () => onHover(false),
    onClick: onSelect,
  };

  return item.href ? (
    <a {...common} href={item.href} target="_blank" rel="noreferrer" aria-label={item.title}>
      {body}
    </a>
  ) : (
    <button {...common} type="button" aria-label={item.title}>
      {body}
    </button>
  );
}

export function FloatingGlassPanels({ items }: { items: DeckItem[] }) {
  const panels = useMemo(() => items.slice(0, SLOTS.length), [items]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || panels.length < 2) return;
    const t = setInterval(() => setActive((i) => (i + 1) % panels.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [paused, panels.length]);

  if (!panels.length) return null;

  return (
    <div className="relative">
      {/* ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -inset-y-16 -z-10"
        style={{
          background:
            "radial-gradient(60% 55% at 30% 25%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 70%), radial-gradient(55% 50% at 78% 75%, color-mix(in oklab, var(--accent, var(--primary)) 14%, transparent), transparent 72%)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-primary/25"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%` }}
            animate={{ y: [0, -24, 0], opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 9 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.7 }}
          />
        ))}
      </div>

      {/* Desktop / tablet: organic floating composition */}
      <div
        className="relative hidden h-[560px] w-full sm:block lg:h-[640px]"
        onMouseLeave={() => setPaused(false)}
      >
        {panels.map((it, i) => (
          <div key={it.id} className={i >= 4 ? "hidden lg:block" : "contents lg:contents"}>
            <Panel
              item={it}
              slot={SLOTS[i]}
              active={i === active}
              onSelect={() => setActive(i)}
              onHover={(v) => setPaused(v)}
            />
          </div>
        ))}
      </div>

      {/* Mobile: gently overlapping vertical stack */}
      <div className="sm:hidden space-y-[-24px]">
        {panels.map((it, i) => (
          <div
            key={it.id}
            className="relative h-[300px]"
            style={{ zIndex: i === active ? 20 : 10, paddingInline: i % 2 ? "0 12px" : "12px 0" }}
          >
            <Panel
              item={it}
              slot={{ x: 0, y: 0, w: 100, h: 100, drift: 5, delay: i * 0.4 }}
              active={i === active}
              onSelect={() => setActive(i)}
              onHover={() => {}}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default FloatingGlassPanels;

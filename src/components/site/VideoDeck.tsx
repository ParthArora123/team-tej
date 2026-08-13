import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { DECK_SCRIM, DECK_ROTATE_MS } from "@/components/site/StackedDeck";
import { pauseHomepageVideo, playHomepageVideo } from "@/lib/home-video-playback";

export type DeckItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  video?: string | null;
  poster?: string | null;
  href?: string | null;
};

const ROTATE_MS = DECK_ROTATE_MS;

function DeckMedia({ item, front, near = false }: { item: DeckItem; front: boolean; near?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(false), [item.video]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (front) {
      const id = requestAnimationFrame(() => void playHomepageVideo(v));
      return () => cancelAnimationFrame(id);
    }
    pauseHomepageVideo(v);
    return () => pauseHomepageVideo(v);
  }, [front]);

  return (
    <div className="absolute inset-0 bg-muted">
      {item.poster && (
        <img
          src={item.poster}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl"
        />
      )}
      {item.poster && (
        <img
          src={item.poster}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain"
        />
      )}
      {(front || near) && item.video && (
      <video
        ref={ref}
        src={item.video}
        poster={item.poster ?? undefined}
        muted
        loop
        playsInline
        preload={front || near ? "metadata" : "none"}
        disableRemotePlayback
        disablePictureInPicture
        onLoadedData={() => setReady(true)}
        onCanPlay={() => setReady(true)}
        className="absolute inset-0 h-full w-full object-contain"
        style={{ visibility: front && ready ? "visible" : "hidden" }}
      />
      )}

      {!item.poster && !item.video && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--primary) 45%, transparent), transparent 70%)",
          }}
        />
      )}
    </div>
  );
}

/**
 * 3D stacked deck of viral dance videos.
 * Auto-advances every 10s, pauses on hover, click brings a card to the front.
 */
export function VideoDeck({ items }: { items: DeckItem[] }) {
  const [order, setOrder] = useState<DeckItem[]>(items.slice(0, 7));
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOrder(items.slice(0, 7)), [items]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.2,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !inView || order.length < 2) return;
    const t = setInterval(
      () => setOrder((o) => [...o.slice(1), o[0]]),
      ROTATE_MS,
    );
    return () => clearInterval(t);
  }, [paused, inView, order.length]);

  if (order.length === 0) return null;

  const bringToFront = (id: string) =>
    setOrder((o) => {
      const idx = o.findIndex((x) => x.id === id);
      if (idx <= 0) return o;
      return [...o.slice(idx), ...o.slice(0, idx)];
    });

  return (
    <div className="mx-auto w-full max-w-[520px] sm:max-w-[680px]">
    <div
      ref={ref}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={() => setPaused(true)}
      onPointerUp={() => setPaused(false)}
      onPointerCancel={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      className="relative h-[560px] sm:h-[720px] w-full"
      style={{ perspective: 1400 }}
    >
      {order.map((it, depth) => {
        const front = depth === 0;
        const visible = depth < 3;
        const justLeft = order.length > 1 && depth === order.length - 1;
        return (
          <motion.button
            key={it.id}
            type="button"
            drag={front && order.length > 1 ? "x" : false}
            dragElastic={0.16}
            dragMomentum={false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.x) > 70 || Math.abs(info.velocity.x) > 450) {
                setOrder((o) => (info.offset.x < 0 ? [...o.slice(1), o[0]] : [o[o.length - 1], ...o.slice(0, -1)]));
              }
            }}
            onClick={() => (front && it.href ? window.open(it.href, "_blank") : bringToFront(it.id))}
            aria-label={it.title}
            animate={{
              y: justLeft ? 4 * -9 : depth * -9,
              x: justLeft ? 4 * 6 : depth * 6,
              scale: justLeft ? 0.9 : 1 - depth * 0.035,
              rotate: justLeft ? 0 : depth * 1.4,
              zIndex: 20 - depth,
            }}
            transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}


            className="absolute inset-0 origin-bottom overflow-hidden rounded-[1.75rem] border border-border bg-card text-left transform-gpu will-change-transform"
            style={{
              boxShadow:
                "0 30px 80px -24px color-mix(in oklab, var(--foreground) 30%, transparent), 0 0 0 1px color-mix(in oklab, var(--foreground) 5%, transparent) inset",
              pointerEvents: visible ? "auto" : "none",
              visibility: visible || justLeft ? "visible" : "hidden",
              opacity: 1,
            }}
          >
            <DeckMedia item={it} front={front && inView} near={inView && depth === 1} />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: DECK_SCRIM }}
            />

            <div className="absolute inset-x-0 bottom-0 p-6">
              {it.subtitle && (
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/65">
                  {it.subtitle}
                </p>
              )}
              <p className="mt-1.5 font-display text-2xl font-bold text-white leading-tight line-clamp-2">
                {it.title}
              </p>
              {front && (
                <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white">
                  <Play size={11} /> Now playing
                </span>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>

    {order.length > 1 && (
      <div aria-hidden className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-border/70">
        <div
          key={`${order[0]?.id}-${inView}`}
          className="h-full w-full origin-left rounded-full bg-primary"
          style={{
            animation: `deck-progress ${ROTATE_MS}ms linear forwards`,
            animationPlayState: paused || !inView ? "paused" : "running",
          }}
        />
      </div>
    )}
    </div>
  );
}


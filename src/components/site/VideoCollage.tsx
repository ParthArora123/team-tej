import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Play, X, Maximize2, Volume2, VolumeX } from "lucide-react";

export type CollageItem = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  video?: string | null;
  poster?: string | null;
};

/** Fallback duration for slides that have no playable video. */
const STILL_MS = 6000;
const VIDEO_ROTATE_MS = 10000;
const SOUND_KEY = "feed-sound-on";

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

function Layer({
  item,
  play,
  soundOn,
  onEnded,
  onPlaybackError,
  onSoundBlocked,
}: {
  item: CollageItem;
  play: boolean;
  soundOn: boolean;
  onEnded: () => void;
  onPlaybackError: () => void;
  onSoundBlocked: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  // Apply mute state without remounting the element (no flicker / reload).
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = !play || !soundOn;
  }, [play, soundOn]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (play) {
      try {
        v.currentTime = 0;
      } catch {
        /* ignore */
      }
      v.muted = !soundOn;
      v.play().catch(() => {
        // Autoplay with sound blocked → fall back to muted playback.
        v.muted = true;
        onSoundBlocked();
        void v.play().catch(() => undefined);
      });
    } else {
      v.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play, item.video]);

  return (
    <>
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
          alt={item.title ?? ""}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain"
        />
      )}
      {item.video && (
        <video
          ref={ref}
          src={item.video}
          poster={item.poster ?? undefined}
          playsInline
          loop
          preload={play ? "auto" : "metadata"}
          onEnded={onEnded}
          onError={onPlaybackError}
          disableRemotePlayback
          disablePictureInPicture
          className="absolute inset-0 h-full w-full object-contain"
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

function Lightbox({
  item,
  onClose,
  muted = false,
}: {
  item: CollageItem;
  onClose: () => void;
  muted?: boolean;
}) {
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
            key={item.id}
            src={item.video}
            poster={item.poster ?? undefined}
            controls
            autoPlay
            loop
            muted={muted}
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
 * Editorial video collage. Videos play in a fixed sequence (1 → 2 → 3 … → 1),
 * each one plays to the end before the spotlight moves on. Sound starts muted
 * and the user's unmute choice is remembered for the session.
 */
export function VideoCollage({ items }: { items: CollageItem[] }) {
  // When videos exist, keep still images out of the playback queue so every
  // uploaded clip is reached in an uninterrupted 1 → 2 → 3 sequence.
  // NOTE: key off item ids so a re-created `items` array from the parent does
  // not reset the sequence back to the first clip on every render.
  const itemsKey = items.map((i) => i.id).join("|");
  const playlist = useMemo(() => {
    const videos = items.filter((item) => Boolean(item.video));
    return videos.length ? videos : items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);
  const reduced = useReducedMotion();

  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [open, setOpen] = useState<CollageItem | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem(SOUND_KEY) === "1") setSoundOn(true);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((s) => {
      const next = !s;
      try {
        sessionStorage.setItem(SOUND_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const handleSoundBlocked = useCallback(() => {
    setSoundOn(false);
    try {
      sessionStorage.setItem(SOUND_KEY, "0");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setStep(0);
  }, [itemsKey]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const total = playlist.length;
  const activeIndex = total ? step % total : 0;
  const activeItem = playlist[activeIndex];
  const preload = total ? playlist[(activeIndex + 1) % total] : undefined;

  const advance = useCallback(() => setStep((p) => p + 1), []);

  // Fixed clock so a malformed or endless clip can never stall the sequence.
  useEffect(() => {
    if (paused || !inView || !total) return;
    const t = setTimeout(advance, activeItem?.video ? VIDEO_ROTATE_MS : STILL_MS);
    return () => clearTimeout(t);
  }, [paused, inView, total, activeItem, advance]);

  const onOpen = useCallback((item: CollageItem) => setOpen(item), []);

  if (!total || !activeItem) return null;

  return (
    <div ref={wrapRef} className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10">
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="relative h-[62vh] min-h-[360px] w-full overflow-hidden rounded-[1.5rem] bg-black lg:h-[78vh]"
      >
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.2 : 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <Layer
              item={activeItem}
              play={inView && !paused}
              soundOn={soundOn}
              onEnded={advance}
              onPlaybackError={advance}
              onSoundBlocked={handleSoundBlocked}
            />
          </motion.div>
        </AnimatePresence>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
          style={{
            background:
              "linear-gradient(180deg, transparent, color-mix(in oklab, var(--foreground) 78%, var(--primary) 22%))",
          }}
        />

        <button
          type="button"
          onClick={() => onOpen(activeItem)}
          aria-label={activeItem.title ?? "Open full clip"}
          className="absolute inset-0 z-[1]"
        >
          <span className="sr-only">{activeItem.title ?? "Open full clip"}</span>
        </button>

        {activeItem.video && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSound();
            }}
            aria-label={soundOn ? "Mute videos" : "Unmute videos"}
            className="absolute left-4 top-4 z-[3] grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
          >
            {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        )}

        <span className="pointer-events-none absolute right-4 top-4 z-[2] grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur">
          <Maximize2 size={14} />
        </span>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] p-5">
          {activeItem.subtitle && (
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">
              {activeItem.subtitle}
            </p>
          )}
          {activeItem.title && (
            <p className="mt-1 text-base font-medium text-white line-clamp-2">{activeItem.title}</p>
          )}
        </div>
      </div>

      {total > 1 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {playlist.map((it, i) => (
            <button
              key={it.id}
              type="button"
              onClick={() => setStep(i)}
              aria-label={it.title ?? `Clip ${i + 1}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === activeIndex ? 34 : 14,
                background:
                  i === activeIndex
                    ? "var(--primary)"
                    : "color-mix(in oklab, var(--foreground) 25%, transparent)",
              }}
            />
          ))}
        </div>
      )}

      {/* invisible preloader for the upcoming clip */}
      {preload?.video && preload.id !== activeItem.id && (
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
        <Play size={10} /> Tap the frame for the full clip
      </p>

      <AnimatePresence>
        {open && <Lightbox item={open} onClose={() => setOpen(null)} muted={!soundOn} />}
      </AnimatePresence>
    </div>
  );
}

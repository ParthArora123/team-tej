import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Maximize2, Volume2, VolumeX } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export type CollageItem = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  video?: string | null;
  poster?: string | null;
};

const ROTATE_MS = 5000;
const RESUME_MS = 4000;
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

/** Media fill: blurred backdrop + contained frame so nothing is cropped. */
function Media({
  item,
  active,
  preloadNext,
  soundOn,
  onSoundBlocked,
}: {
  item: CollageItem;
  active: boolean;
  preloadNext: boolean;
  soundOn: boolean;
  onSoundBlocked: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = !active || !soundOn;
  }, [active, soundOn]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) {
      v.currentTime = 0;
      v.muted = !soundOn;
      v.play().catch(() => {
        v.muted = true;
        onSoundBlocked();
        void v.play().catch(() => undefined);
      });
    } else {
      v.pause();
      v.currentTime = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, item.video]);

  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 scale-150 blur-2xl"
        style={
          item.poster
            ? { backgroundImage: `url(${item.poster})`, backgroundSize: "cover", backgroundPosition: "center" }
            : {
                background:
                  "linear-gradient(135deg, color-mix(in oklab, var(--primary) 45%, transparent), transparent 70%)",
              }
        }
      />
      {item.poster && (
        <img
          src={item.poster}
          alt={item.title ?? ""}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain"
          style={{ opacity: active && ready ? 0 : 1, transition: "opacity 400ms ease" }}
        />
      )}
      {item.video && (
        <video
          ref={ref}
          src={item.video}
          poster={item.poster ?? undefined}
          playsInline
          loop
          preload={active ? "auto" : preloadNext ? "metadata" : "none"}
          disableRemotePlayback
          disablePictureInPicture
          onLoadedData={() => setReady(true)}
          onCanPlay={() => setReady(true)}
          className="absolute inset-0 h-full w-full object-contain transform-gpu"
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
 * Premium 3D circular orbit gallery. The active clip sits centre stage and
 * plays; the rest orbit around it on an elliptical path with depth blur.
 * Auto-rotates every 5s, pauses on hover, supports drag/swipe.
 */
export function VideoCollage({ items }: { items: CollageItem[] }) {
  const playlistKey = items.map((item) => `${item.id}:${item.video ?? ""}`).join("|");
  const playlist = useMemo(() => {
    const videos = items.filter((i) => Boolean(i.video));
    return videos.length ? videos : items;
    // The key keeps the playlist stable when a parent recreates an equivalent items array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistKey]);

  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [open, setOpen] = useState<CollageItem | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setIndex((current) => (current < playlist.length ? current : 0));
  }, [playlistKey, playlist.length]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Auto-advance: one single interval, always stepping to the *next* clip and
  // wrapping only after the very last one — for any number of clips.
  const countRef = useRef(playlist.length);
  countRef.current = playlist.length;

  useEffect(() => {
    if (paused || !inView) return;
    const interval = window.setInterval(() => {
      const total = countRef.current;
      if (total < 2) return;
      setIndex((current) => (current + 1) % total);
    }, ROTATE_MS);
    return () => window.clearInterval(interval);
  }, [paused, inView]);

  // Manual interaction pauses auto-rotation, then resumes.
  const nudge = useCallback((dir: number) => {
    setPaused(true);
    setIndex((i) => {
      const total = countRef.current || 1;
      return (i + dir + total) % total;
    });
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => setPaused(false), RESUME_MS);
  }, []);

  const focus = useCallback((target: number) => {
    setPaused(true);
    setIndex(target);
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => setPaused(false), RESUME_MS);
  }, []);

  useEffect(() => () => {
    if (resumeRef.current) clearTimeout(resumeRef.current);
  }, []);

  // Track the stage width so the orbit scales on tablet as well as phone/desktop.
  const [stageW, setStageW] = useState(0);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setStageW(e.contentRect.width));
    ro.observe(el);
    setStageW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  if (!playlist.length) return null;

  const n = playlist.length;
  const active = playlist[index];
  const width = stageW || (isMobile ? 380 : 1200);
  const tablet = !isMobile && width < 1024;

  const radiusX = isMobile ? 132 : tablet ? 300 : 420;
  const radiusY = isMobile ? 40 : tablet ? 74 : 96;
  const centerW = isMobile ? Math.min(320, width - 40) : tablet ? 380 : 500;
  const centerH = isMobile ? 500 : tablet ? 540 : 700;
  const orbitW = isMobile ? 108 : tablet ? 150 : 200;
  const orbitH = isMobile ? 180 : tablet ? 225 : 300;
  const maxVisible = isMobile ? 3 : tablet ? 3 : 5;
  const stageH = isMobile ? 600 : tablet ? 660 : 820;


  return (
    <div ref={wrapRef} className="relative mx-auto w-full max-w-7xl px-2 sm:px-6 lg:px-10">
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="relative mx-auto flex items-center justify-center"
        style={{ height: isMobile ? 600 : 820, perspective: 1400 }}
      >
        {/* ambient stage lighting */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 45% at 50% 55%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 70%)",
          }}
        />

        {/* drag / swipe surface */}
        <motion.div
          drag={n > 1 ? "x" : false}
          dragElastic={0.12}
          dragMomentum={false}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 400) {
              nudge(info.offset.x < 0 ? 1 : -1);
            }
          }}
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {playlist.map((item, i) => {
            const offset = ((i - index + n) % n);
            const rel = offset > n / 2 ? offset - n : offset; // -k … +k
            const isActive = rel === 0;
            const hidden = Math.abs(rel) > Math.floor(maxVisible / 2);
            const angle = (rel / Math.max(n, 3)) * Math.PI * 2;
            const x = Math.sin(angle) * radiusX;
            const y = -Math.cos(angle) * radiusY + (isActive ? 0 : radiusY);
            const depth = Math.cos(angle);
            const scale = isActive ? 1 : 0.82 - Math.abs(rel) * 0.05;
            const w = isActive ? centerW : orbitW;
            const h = isActive ? centerH : orbitH;

            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => (isActive ? setOpen(item) : focus(i))}
                aria-label={item.title ?? "Play video"}
                initial={false}
                animate={{
                  x,
                  y,
                  scale,
                  rotateY: reduced ? 0 : -rel * 16,
                  opacity: hidden ? 0 : isActive ? 1 : 0.82 - Math.abs(rel) * 0.12,
                  filter: isActive ? "blur(0px) brightness(1)" : `blur(${Math.abs(rel) * 1.2}px) brightness(0.85)`,
                  zIndex: 30 + Math.round(depth * 10) + (isActive ? 20 : 0),
                }}
                transition={{ duration: reduced ? 0.2 : 0.95, ease: [0.16, 1, 0.3, 1] }}
                whileHover={isActive || hidden ? undefined : { scale: scale * 1.07, filter: "blur(0px) brightness(1.05)" }}
                className="group absolute left-1/2 top-1/2 overflow-hidden rounded-[20px] border border-white/20 bg-card/40 backdrop-blur-sm transform-gpu will-change-transform"
                style={{
                  width: w,
                  height: h,
                  marginLeft: -w / 2,
                  marginTop: -h / 2,
                  pointerEvents: hidden ? "none" : "auto",
                  boxShadow: isActive
                    ? "0 40px 90px -30px color-mix(in oklab, var(--primary) 55%, transparent), 0 0 0 1px color-mix(in oklab, var(--primary) 35%, transparent)"
                    : "0 22px 50px -26px color-mix(in oklab, var(--foreground) 45%, transparent)",
                }}
              >
                <Media
                  item={item}
                  active={isActive && inView}
                  preloadNext={i === (index + 1) % n}
                  soundOn={soundOn}
                  onSoundBlocked={handleSoundBlocked}
                />

                {/* glass reflection */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(160deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 45%), linear-gradient(180deg, transparent 55%, color-mix(in oklab, var(--foreground) 70%, transparent) 100%)",
                  }}
                />

                {isActive && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-left">
                    {item.subtitle && (
                      <p className="text-[9px] uppercase tracking-[0.3em] text-white/70">{item.subtitle}</p>
                    )}
                    {item.title && (
                      <p className="mt-1 text-sm font-medium text-white line-clamp-2">{item.title}</p>
                    )}
                  </div>
                )}

                {isActive && (
                  <span className="pointer-events-none absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/25 bg-white/10 text-white opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
                    <Maximize2 size={13} />
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* sound toggle */}
        {active?.video && (
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundOn ? "Mute videos" : "Unmute videos"}
            className="absolute bottom-2 left-1/2 z-[80] -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-white backdrop-blur transition-colors hover:bg-black/60"
          >
            {soundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
            {soundOn ? "Sound on" : "Unmute"}
          </button>
        )}
      </div>

      {/* orbit position dots */}
      {n > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {playlist.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => focus(i)}
              aria-label={`Show clip ${i + 1}`}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: i === index ? 26 : 8,
                background:
                  i === index
                    ? "var(--primary)"
                    : "color-mix(in oklab, var(--foreground) 22%, transparent)",
              }}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {open && <Lightbox item={open} onClose={() => setOpen(null)} muted={!soundOn} />}
      </AnimatePresence>
    </div>
  );
}

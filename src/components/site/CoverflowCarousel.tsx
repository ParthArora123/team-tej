import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Volume2, VolumeX } from "lucide-react";
import { pauseHomepageVideo, playHomepageVideo } from "@/lib/home-video-playback";

export type CoverflowItem = {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  videoSrc?: string | null;
  embedSrc?: string | null;
  poster?: string | null;
  ctaLabel?: string | null;
  ctaLink?: string | null;
  ctaExternal?: boolean;
};

function MuteToggle({ muted, onClick }: { muted: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={muted ? "Unmute video" : "Mute video"}
      className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
    >
      {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
    </button>
  );
}

const GridVideoCard = memo(function GridVideoCard({ item }: { item: CoverflowItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35, rootMargin: "0px 0px -10% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (inView) {
      v.muted = muted;
      void playHomepageVideo(v);
    } else {
      pauseHomepageVideo(v);
    }
    return () => { if (v) pauseHomepageVideo(v); };
  }, [inView]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    if (inView && !muted) v.play().catch(() => {});
  }, [muted, inView]);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const renderMedia = () => {
    // YouTube / embed — only mount iframe when in view to avoid background decoding.
    if (item.embedSrc) {
      return (
        <>
          {item.poster && !inView && (
            <img
              src={item.poster}
              alt={item.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-contain"
            />
          )}
          {inView && (
            <iframe
              src={`${item.embedSrc}?autoplay=1&mute=1&playsinline=1&rel=0&loop=1`}
              title={item.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          )}
        </>
      );
    }

    if (item.videoSrc) {
      return (
        <>
          {item.poster && (
            <img
              src={item.poster}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-125 object-cover blur-xl"
            />
          )}
          {item.poster && (
            <img
              src={item.poster}
              alt={item.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-contain"
              style={{ opacity: ready ? 0 : 1, transition: "opacity 300ms ease" }}
            />
          )}
          <video
            ref={videoRef}
            src={item.videoSrc}
            poster={item.poster ?? undefined}
            muted
            loop
            playsInline
            preload="metadata"
            disableRemotePlayback
            disablePictureInPicture
            onCanPlay={() => setReady(true)}
            className="absolute inset-0 h-full w-full object-contain bg-transparent"
            style={{ opacity: ready ? 1 : 0, transition: "opacity 300ms ease" }}
          />
        </>
      );
    }

    if (item.poster) {
      return (
        <>
          <img
            src={item.poster}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-125 object-cover blur-xl"
          />
          <img
            src={item.poster}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-contain"
          />
        </>
      );
    }

    return <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/40" />;
  };

  return (
    <div
      ref={rootRef}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-18px_color-mix(in_oklab,var(--foreground)_16%,transparent)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {renderMedia()}

        {item.badge && (
          <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
            {item.badge}
          </span>
        )}

        {item.videoSrc && <MuteToggle muted={muted} onClick={toggleMute} />}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {item.subtitle && (
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{item.subtitle}</p>
        )}
        <h3 className="mt-1 font-display text-lg sm:text-xl font-bold leading-tight line-clamp-2">{item.title}</h3>

        {item.ctaLabel && item.ctaLink && (
          <div className="mt-auto pt-4">
            {item.ctaExternal ? (
              <a
                href={item.ctaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground transition-all hover:gap-2"
              >
                {item.ctaLabel} <ArrowUpRight size={13} />
              </a>
            ) : (
              <Link
                to={item.ctaLink}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground transition-all hover:gap-2"
              >
                {item.ctaLabel} <ArrowUpRight size={13} />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Responsive video grid for the "Most Viral Choreographies" section.
 * Desktop: 3 columns, Tablet: 2 columns, Mobile: 1 column.
 * Videos are muted and only autoplay when visible; they pause when leaving the viewport.
 */
export function CoverflowCarousel({
  items,
}: {
  items: CoverflowItem[];
  interval?: number;
}) {
  const count = items.length;
  if (count === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((it) => (
        <GridVideoCard key={it.id} item={it} />
      ))}
    </div>
  );
}

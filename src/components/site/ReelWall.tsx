import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

import { DECK_SCRIM } from "@/components/site/StackedDeck";
export type Reel = {
  id: string;
  title?: string | null;
  video?: string | null;
  poster?: string | null;
  href?: string | null;
};

function ReelCard({ reel }: { reel: Reel }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (hover) v.play().catch(() => {});
    else {
      try {
        v.pause();
        v.currentTime = 0;
      } catch {
        /* noop */
      }
    }
  }, [hover]);

  const body = (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative aspect-[9/16] w-[180px] sm:w-[220px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40 transition-transform duration-500 hover:scale-[1.04] transform-gpu"
    >
      {reel.poster && (
        <img
          src={reel.poster}
          alt={reel.title ?? ""}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {reel.video && (
        <video
          ref={ref}
          src={hover ? reel.video : undefined}
          muted
          loop
          playsInline
          preload="none"
          disableRemotePlayback
          disablePictureInPicture
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${hover ? "opacity-100" : "opacity-0"}`}
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            DECK_SCRIM,
        }}
      />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/85">
          <Play size={10} /> Reel
        </span>
        {reel.title && (
          <p className="mt-1 text-xs font-medium text-white line-clamp-2">
            {reel.title}
          </p>
        )}
      </div>
    </div>
  );

  return reel.href ? (
    <a href={reel.href} target="_blank" rel="noopener noreferrer">
      {body}
    </a>
  ) : (
    body
  );
}

/** Infinite, hover-pausing marquee of vertical reels. */
export function ReelWall({ reels }: { reels: Reel[] }) {
  if (reels.length === 0) return null;
  const loop = [...reels, ...reels];

  return (
    <div className="relative overflow-hidden py-2 group/wall">
      <style>{`
        @keyframes reelMarquee { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
        @media (prefers-reduced-motion: reduce) { .reel-track { animation: none !important; } }
      `}</style>
      <div
        className="reel-track flex gap-4 w-max will-change-transform group-hover/wall:[animation-play-state:paused]"
        style={{
          animation: `reelMarquee ${Math.max(reels.length * 6, 30)}s linear infinite`,
        }}
      >
        {loop.map((r, i) => (
          <ReelCard key={`${r.id}-${i}`} reel={r} />
        ))}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-24"
        style={{
          background: "linear-gradient(90deg, var(--background), transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-24"
        style={{
          background: "linear-gradient(270deg, var(--background), transparent)",
        }}
      />
    </div>
  );
}

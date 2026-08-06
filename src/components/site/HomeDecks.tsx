import { Link } from "@tanstack/react-router";
import { Calendar, MapPin, ArrowUpRight, Play } from "lucide-react";
import { StackedDeck, DeckShell, type StackedDeckItem } from "@/components/site/StackedDeck";
import { useEffect, useRef, useState } from "react";
import { pauseHomepageVideo, playHomepageVideo } from "@/lib/home-video-playback";

function ReelVideo({ src, poster, active, title }: { src: string; poster?: string | null; active: boolean; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (active) void playHomepageVideo(video);
    else pauseHomepageVideo(video);
    return () => pauseHomepageVideo(video);
  }, [active]);

  return (
    <>
      {poster && (
        <img src={poster} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl" />
      )}
      {poster && <img src={poster} alt={title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain" />}
      <video
        ref={ref}
        src={src}
        poster={poster ?? undefined}
        muted
        loop
        playsInline
        preload={active ? "metadata" : "none"}
        onCanPlay={() => setReady(true)}
        className="absolute inset-0 h-full w-full object-contain"
        style={{ visibility: active && ready ? "visible" : "hidden" }}
      />
    </>
  );
}

/* ------------------------------ WORKSHOPS ------------------------------ */

function WorkshopCard({ w, onRegister }: { w: any; onRegister: (w: any) => void }) {
  const hasImage = !!w.banner_url;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-18px_color-mix(in_oklab,var(--foreground)_16%,transparent)]">
      {/* Media — fixed, medium aspect ratio */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {hasImage ? (
          <img
            src={w.banner_url}
            alt={w.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover lg:object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in oklab, var(--primary) 45%, transparent), transparent 70%)",
            }}
          />
        )}
        {w.category && (
          <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-foreground/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
            {w.category}
          </span>
        )}
      </div>

      {/* Content — compact, balanced padding */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-display text-lg sm:text-xl font-bold leading-tight line-clamp-2">{w.name}</h3>

        <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
          {w.event_date && (
            <p className="flex items-center gap-1.5">
              <Calendar size={12} />
              {new Date(w.event_date).toDateString()}
              {w.event_time ? ` · ${w.event_time}` : ""}
            </p>
          )}
          {w.venue && (
            <p className="flex items-center gap-1.5">
              <MapPin size={12} /> {w.venue}
            </p>
          )}
        </div>

        <div className="mt-auto pt-4 flex items-end justify-between gap-3">
          <p className="font-display text-xl font-bold">₹{Number(w.price_inr).toLocaleString("en-IN")}</p>
          <div className="flex items-center gap-2">
            <Link
              to="/workshops/$id"
              params={{ id: w.id }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider transition-all hover:gap-2"
            >
              Details <ArrowUpRight size={13} />
            </Link>
            <button
              type="button"
              onClick={() => onRegister(w)}
              className="inline-flex items-center rounded-full bg-primary px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground transition-all hover:opacity-90"
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export function WorkshopDeck({ workshops }: { workshops: any[] }) {
  if (!workshops.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {workshops.map((w) => (
        <WorkshopCard key={w.id} w={w} />
      ))}
    </div>
  );
}

/* -------------------------------- REELS -------------------------------- */

export type ReelCard = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  video?: string | null;
  poster?: string | null;
  href?: string | null;
};

export function ReelDeck({ reels }: { reels: ReelCard[] }) {
  if (!reels.length) return null;

  const cards: StackedDeckItem[] = reels.slice(0, 10).map((r) => ({
    id: r.id,
    render: ({ front, active }) => (
      <DeckShell dark className="text-white">
        {r.video ? (
          <ReelVideo src={r.video} poster={r.poster} active={active} title={r.title ?? "Reel"} />
        ) : r.poster ? (
          <>
            <div aria-hidden className="absolute inset-0 scale-150 blur-2xl" style={{ backgroundImage: `url(${r.poster})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <img src={r.poster} alt={r.title ?? "Reel"} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in oklab, var(--primary) 45%, transparent), transparent 70%)",
            }}
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, transparent 40%, color-mix(in oklab, var(--foreground) 80%, var(--primary) 20%) 100%)" }}
        />
        <div className="absolute inset-x-0 bottom-0 p-6">
          {r.subtitle && <p className="text-[10px] uppercase tracking-[0.3em] text-white/65">{r.subtitle}</p>}
          {r.title && <p className="mt-1.5 font-display text-xl font-bold leading-tight line-clamp-2">{r.title}</p>}
          {front && (
            <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] backdrop-blur">
              <Play size={11} /> Now playing
            </span>
          )}
        </div>
      </DeckShell>
    ),
  }));

  return (
    <StackedDeck
      items={cards}
      variant="fan"
      className="mx-auto h-[600px] w-full max-w-[400px] sm:h-[720px] sm:max-w-[460px]"
    />
  );
}

/* ------------------------------- GALLERY ------------------------------- */

export function GalleryDeck({ items }: { items: any[] }) {
  if (!items.length) return null;

  const cards: StackedDeckItem[] = items.slice(0, 12).map((g) => ({
    id: g.id,
    render: () => (
      <DeckShell dark className="text-white">
        {g.image_url && (
          <img
            src={g.image_url}
            alt={g.caption ?? ""}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover lg:object-contain"
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, transparent 45%, color-mix(in oklab, var(--foreground) 78%, var(--primary) 22%) 100%)" }}
        />
        {g.caption && (
          <figcaption className="absolute inset-x-0 bottom-0 p-6">
            <span className="inline-block rounded-full border border-white/15 bg-[color-mix(in_oklab,var(--foreground)_45%,transparent)] px-3 py-1.5 text-[11px] uppercase tracking-widest backdrop-blur">
              {g.caption}
            </span>
          </figcaption>
        )}
      </DeckShell>
    ),
  }));

  return (
    <StackedDeck
      items={cards}
      variant="shuffle"
      className="mx-auto h-[500px] w-full max-w-[680px] sm:h-[620px]"
    />
  );
}

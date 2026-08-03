import { Link } from "@tanstack/react-router";
import { Calendar, MapPin, ArrowUpRight, Play } from "lucide-react";
import { StackedDeck, DeckShell, type StackedDeckItem } from "@/components/site/StackedDeck";

/* ------------------------------ WORKSHOPS ------------------------------ */

export function WorkshopDeck({ workshops }: { workshops: any[] }) {
  if (!workshops.length) return null;

  const cards: StackedDeckItem[] = workshops.map((w) => ({
    id: w.id,
    render: ({ front }) => (
      <DeckShell dark className="flex flex-col text-white">
        <div className="absolute inset-0 bg-muted">
          {w.banner_url ? (
            <img
              src={w.banner_url}
              alt={w.name}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in oklab, var(--primary) 45%, transparent), transparent 70%)",
              }}
            />
          )}
        </div>
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, transparent 25%, color-mix(in oklab, var(--foreground) 82%, var(--primary) 18%) 100%)" }}
        />
        <div className="absolute inset-x-0 bottom-0 p-7">
          {w.category && (
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">{w.category}</p>
          )}
          <p className="mt-1.5 font-display text-2xl lg:text-3xl font-bold leading-tight line-clamp-2">{w.name}</p>
          <div className="mt-3 space-y-1 text-xs text-white/75">
            {w.event_date && (
              <p className="flex items-center gap-2">
                <Calendar size={12} />
                {new Date(w.event_date).toDateString()}
                {w.event_time ? ` · ${w.event_time}` : ""}
              </p>
            )}
            {w.venue && (
              <p className="flex items-center gap-2">
                <MapPin size={12} /> {w.venue}
              </p>
            )}
          </div>
          <div className="mt-5 flex items-end justify-between gap-4">
            <p className="font-display text-2xl">₹{Number(w.price_inr).toLocaleString("en-IN")}</p>
            {front && (
              <Link
                to="/workshops/$id"
                params={{ id: w.id }}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur transition-all hover:gap-2.5"
              >
                Details <ArrowUpRight size={13} />
              </Link>
            )}
          </div>
        </div>
      </DeckShell>
    ),
  }));

  return (
    <StackedDeck
      items={cards}
      variant="stack"
      
      className="mx-auto h-[460px] w-full max-w-[440px] sm:h-[520px]"
    />
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
        {r.video && active ? (
          <video
            src={r.video}
            poster={r.poster ?? undefined}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : r.poster ? (
          <img src={r.poster} alt={r.title ?? "Reel"} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
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
      
      className="mx-auto h-[460px] w-full max-w-[320px] sm:h-[560px] sm:max-w-[360px]"
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
            className="absolute inset-0 h-full w-full object-cover"
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
      
      className="mx-auto h-[400px] w-full max-w-[540px] sm:h-[480px]"
    />
  );
}

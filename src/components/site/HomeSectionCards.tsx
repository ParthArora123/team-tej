import { ArrowUpRight, MapPin, Trophy, Play } from "lucide-react";
import { StackedDeck, DeckShell, type StackedDeckItem } from "@/components/site/StackedDeck";

export type HomeCard = {
  id: string;
  title: string;
  description?: string | null;
  event_name?: string | null;
  location?: string | null;
  achievement?: string | null;
  media_kind?: string | null;
  media_url?: string | null;
  poster_url?: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
};

function Media({ c, front }: { c: HomeCard; front: boolean }) {
  if (!c.media_url) {
    return (
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--primary) 35%, transparent), transparent 70%)",
        }}
      />
    );
  }
  if (c.media_kind === "video" && front) {
    return (
      <video
        src={c.media_url}
        poster={c.poster_url ?? undefined}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  return (
    <img
      src={c.media_kind === "video" ? (c.poster_url ?? c.media_url) : c.media_url}
      alt={c.title}
      loading="lazy"
      decoding="async"
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

function Cta({ c, tone = "light" }: { c: HomeCard; tone?: "light" | "dark" }) {
  if (!c.cta_link) return null;
  const external = /^https?:\/\//i.test(c.cta_link);
  return (
    <a
      href={c.cta_link}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={(e) => e.stopPropagation()}
      className={`mt-4 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:gap-2.5 ${
        tone === "dark"
          ? "border-white/25 bg-white/10 text-white backdrop-blur"
          : "border-primary/40 text-primary hover:bg-primary/10"
      }`}
    >
      {c.cta_text || "Learn more"} <ArrowUpRight size={13} />
    </a>
  );
}

export function FeaturedPerformances({ rows }: { rows: HomeCard[] }) {
  if (!rows.length) return null;

  const cards: StackedDeckItem[] = rows.map((c) => ({
    id: c.id,
    render: ({ front, active }) => (
      <DeckShell dark className="text-white">
        <Media c={c} front={active} />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, transparent 30%, color-mix(in oklab, var(--foreground) 82%, var(--primary) 18%) 100%)" }}
        />
        <div className="absolute inset-x-0 bottom-0 p-7">
          {c.event_name && (
            <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-white/70">
              <Play size={11} /> {c.event_name}
            </p>
          )}
          <h3 className="mt-2 font-display text-2xl lg:text-3xl font-bold leading-tight text-white line-clamp-2">
            {c.title}
          </h3>
          {c.location && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/75">
              <MapPin size={13} /> {c.location}
            </p>
          )}
          {c.achievement && (
            <p className="mt-2 inline-flex items-start gap-2 text-sm leading-relaxed text-white/75 line-clamp-2">
              <Trophy size={14} className="mt-0.5 shrink-0 text-primary" /> {c.achievement}
            </p>
          )}
          <Cta c={c} tone="dark" />
        </div>
      </DeckShell>
    ),
  }));

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-border">
      <div className="grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Featured Performances</p>
          <h2 className="mt-3 font-display text-4xl lg:text-6xl font-bold leading-[1.02] text-balance">
            Moments on <span className="italic font-light">the big stage.</span>
          </h2>
          <p className="mt-5 max-w-lg text-muted-foreground">
            Stages, shows and milestones from Tejas's journey — dealt out like a deck.
            Drag the top card away, or tap one behind to pull it forward.
          </p>
        </div>
        <StackedDeck
          items={cards}
          variant="shuffle"
          
          className="mx-auto h-[420px] w-full max-w-[460px] sm:h-[480px]"
        />
      </div>
    </section>
  );
}

export function SignatureProgramsGrid({ rows }: { rows: HomeCard[] }) {
  if (!rows.length) return null;

  const cards: StackedDeckItem[] = rows.map((c) => ({
    id: c.id,
    render: ({ front, active }) => (
      <DeckShell className="flex flex-col">
        <div className="relative h-[58%] overflow-hidden bg-muted">
          <Media c={c} front={active} />
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h3 className="font-display text-2xl font-bold leading-tight">{c.title}</h3>
          {c.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">{c.description}</p>
          )}
          <div className="mt-auto">
            <Cta c={c} />
          </div>
        </div>
      </DeckShell>
    ),
  }));

  return (
    <StackedDeck
      items={cards}
      variant="rise"
      
      className="mx-auto h-[480px] w-full max-w-[440px]"
    />
  );
}

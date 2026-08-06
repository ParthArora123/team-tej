import { StackedDeck, DeckShell, type StackedDeckItem } from "@/components/site/StackedDeck";
import { StyleAnimation } from "@/components/site/StyleAnimation";

export type StyleCard = {
  name: string;
  tagline?: string | null;
  image_url?: string | null;
  video_url?: string | null;
};

function Media({ s, active }: { s: StyleCard; active: boolean }) {
  if (s.video_url && active) {
    return (
      <>
        {s.image_url && (
          <img
            src={s.image_url}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl opacity-80"
          />
        )}
        <video
          src={s.video_url}
          poster={s.image_url ?? undefined}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-contain"
        />
      </>
    );
  }
  if (s.image_url) {
    return (
      <img
        src={s.image_url}
        alt={s.name}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-contain"
      />
    );
  }
  return <StyleAnimation name={s.name} active={active} />;
}

/**
 * "Styles on the floor" — the original animated dance-style deck.
 * Falls back to the built-in per-style motion animations when a style
 * has no uploaded media.
 */
export function StylesDeck({ styles }: { styles: StyleCard[] }) {
  const cards: StackedDeckItem[] = styles.map((s) => ({
    id: s.name,
    render: ({ active }) => (
      <DeckShell dark className="text-white">
        <Media s={s} active={active} />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 30%, color-mix(in oklab, var(--foreground) 82%, var(--primary) 18%) 100%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 p-7">
          <p className="font-display text-3xl font-bold text-white">{s.name}</p>
          {s.tagline && <p className="mt-2 text-sm text-white/75">{s.tagline}</p>}
        </div>
      </DeckShell>
    ),
  }));

  return (
    <StackedDeck
      items={cards}
      variant="stack"
      className="mx-auto h-[300px] w-full max-w-[330px] sm:h-[420px] sm:max-w-[400px]"
    />
  );
}

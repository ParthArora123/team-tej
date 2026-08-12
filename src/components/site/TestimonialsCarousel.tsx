import { Quote, Star } from "lucide-react";
import { StackedDeck, DeckShell, type StackedDeckItem } from "@/components/site/StackedDeck";

export type Testimonial = {
  id?: string;
  name: string;
  role?: string | null;
  quote?: string;
  story?: string | null;
  rating?: number | null;
  avatar?: string | null;
  avatar_url?: string | null;
};

/**
 * Student stories as a 3D stacked deck — drag, swipe or tap a card behind
 * to bring it forward. Same deck language as the rest of the homepage.
 */
export function TestimonialsCarousel({ items }: { items?: Testimonial[] }) {
  const list = items ?? [];

  if (list.length === 0) {
    return (
      <section className="max-w-6xl mx-auto px-6 lg:px-10 py-24">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-widest text-primary">Voices</p>
          <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold text-balance">What movers say.</h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Be the first to share your experience — submit feedback from your dashboard.
          </p>
        </div>
      </section>
    );
  }

  const cards: StackedDeckItem[] = list.map((t, i) => ({
    id: t.id ?? `t-${i}`,
    render: () => {
      const quote = t.quote ?? t.story ?? "";
      const avatar = t.avatar ?? t.avatar_url ?? null;
      const rating = t.rating ?? 0;
      return (
        <DeckShell className="flex items-center px-7 py-10 lg:px-14">
          <Quote aria-hidden className="absolute top-6 left-6 h-10 w-10 text-primary/30" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(60% 60% at 15% 10%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 70%)",
            }}
          />
          <blockquote className="relative w-full text-center">
            {rating > 0 && (
              <div className="mb-4 flex justify-center gap-1" aria-label={`${rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={16} className={s < rating ? "fill-primary text-primary" : "text-muted-foreground/40"} />
                ))}
              </div>
            )}
            <p className="font-display text-xl lg:text-3xl leading-snug text-balance line-clamp-6">“{quote}”</p>
            <footer className="mt-6 flex items-center justify-center gap-3">
              <div
                className="h-12 w-12 overflow-hidden rounded-full grid place-items-center font-display font-bold text-primary-foreground shadow-lg"
                style={{ background: "linear-gradient(135deg, var(--primary), #7A3BFF)" }}
              >
                {avatar ? (
                  <img src={avatar} alt={t.name} loading="lazy" decoding="async" className="h-full w-full rounded-full object-cover" />
                ) : (
                  t.name.charAt(0)
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{t.name}</p>
                {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
              </div>
            </footer>
          </blockquote>
        </DeckShell>
      );
    },
  }));

  return (
    <section className="max-w-6xl mx-auto px-6 lg:px-10 py-24">
      <div className="mb-12 text-center">
        <p className="text-xs uppercase tracking-widest text-primary">Voices</p>
        <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold text-balance">What movers say.</h2>
        <p className="mt-4 text-sm text-muted-foreground">Swipe or drag a card — the deck keeps its own rhythm.</p>
      </div>

      <StackedDeck
        items={cards}
        variant="fan"
        
        className="mx-auto h-[360px] w-full max-w-2xl sm:h-[340px]"
      />
    </section>
  );
}

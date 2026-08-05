import { Link } from "@tanstack/react-router";
import { Calendar, MapPin, ArrowUpRight } from "lucide-react";

/**
 * Hero side rails — the storytelling columns that flank the hero portrait:
 * the founder's Belief / Vision / Mission on the left, and the next studio day
 * + upcoming tour on the right. Styling reuses the existing card tokens, so
 * the visual design is unchanged; only the page structure moves.
 */

export function BeliefRail({ founder }: { founder: any | null }) {
  const cards = [
    {
      kicker: "Philosophy",
      title: "Belief",
      body:
        founder?.belief ||
        founder?.philosophy ||
        "Beyond the steps and choreography, dance is a spark that makes us feel alive.",
    },
    {
      kicker: "Purpose",
      title: "Vision",
      body:
        founder?.vision ||
        "To create a space where everyone — from absolute beginners to artists — can say, \u201cI belong here.\u201d",
    },
    {
      kicker: "Our Mission",
      title: "Movement that Transforms",
      body:
        founder?.mission ||
        founder?.intro ||
        "Build dancers with craft, confidence and character — on every stage, in every city.",
    },
  ];

  return (
    <div className="space-y-3">
      {cards.map((c) => (
        <div key={c.title} className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">{c.kicker}</p>
          <p className="mt-1.5 font-display text-lg font-bold leading-tight">{c.title}</p>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-5">
            {c.body}
          </p>
        </div>
      ))}
    </div>
  );
}

export function TourRail({ workshops }: { workshops: any[] }) {
  const list = (workshops || []).slice(0, 4);
  const next = list[0];
  const rest = list.slice(1);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Next studio day</p>
        {next ? (
          <>
            <p className="mt-1.5 font-display text-lg font-bold leading-tight line-clamp-2">{next.name}</p>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              {next.event_date && (
                <p className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {new Date(next.event_date).toDateString()}
                  {next.event_time ? ` · ${next.event_time}` : ""}
                </p>
              )}
              {next.venue && (
                <p className="flex items-center gap-1.5">
                  <MapPin size={12} /> {next.venue}
                </p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              {next.price_inr != null && (
                <p className="font-display text-lg font-bold">
                  ₹{Number(next.price_inr).toLocaleString("en-IN")}
                </p>
              )}
              <Link
                to="/workshops/$id"
                params={{ id: next.id }}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground transition-all hover:gap-2.5"
              >
                Register <ArrowUpRight size={12} />
              </Link>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">New dates drop every month — check back soon.</p>
        )}
      </div>

      {rest.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Upcoming tour</p>
          <ul className="mt-3 space-y-3">
            {rest.map((w: any) => (
              <li key={w.id}>
                <Link to="/workshops/$id" params={{ id: w.id }} className="group block">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                      {w.venue || w.name}
                    </p>
                    {w.event_date && (
                      <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {new Date(w.event_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">{w.name}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import { Sparkles, Music2, Target, Users2 } from "lucide-react";

/**
 * Mindset & Movement — the "how we teach" chapter: a three-step ribbon, a
 * guiding quote, and the four pillars of the method. Uses the existing card
 * and type tokens so the visual design is unchanged.
 */
export function MindsetSection() {
  const steps = ["Come move with us", "Come express with us", "Come grow with us"];

  const pillars = [
    { icon: Target, title: "Technique", desc: "Mastering posture, footwork, core balance and body mechanics for effortless execution." },
    { icon: Sparkles, title: "Expression", desc: "Connecting emotion to motion — bringing authenticity and storytelling to every choreography." },
    { icon: Music2, title: "Musicality", desc: "Deepening rhythm control, tempo changes and beat timing across diverse global sounds." },
    { icon: Users2, title: "Stage Presence", desc: "Building commanding charisma, spatial control and authentic connection with audiences." },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10 lg:py-14">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">How we teach</p>
        <h2 className="mt-3 font-display text-3xl lg:text-5xl font-bold text-balance leading-[1.02]">
          Mindset & <span className="italic font-light">Movement.</span>
        </h2>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          A four-pillar learning system designed to help absolute beginners and seasoned dancers express, grow and feel alive.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card/60 p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <p className="text-sm">
                <span className="font-display text-xs tabular-nums tracking-[0.25em] text-primary mr-2">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-semibold">{s}</span>
              </p>
              {i < steps.length - 1 && <span aria-hidden className="text-muted-foreground/50">→</span>}
            </div>
          ))}
        </div>
        <p className="mt-5 text-center font-display text-base lg:text-xl font-medium text-balance">
          “You do not have to be perfect. You do not have to be trained. You do not have to know everything. You just have to begin.”
        </p>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {pillars.map((p, i) => (
          <div key={p.title} className="rounded-2xl border border-border bg-card p-5 lg:p-6">
            <div className="h-10 w-10 rounded-xl df-gradient-bg text-white flex items-center justify-center">
              <p.icon size={18} />
            </div>
            <p className="mt-4 font-display text-lg font-bold">
              {i + 1}. {p.title}
            </p>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

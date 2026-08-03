import { motion } from "motion/react";
import { ArrowUpRight, MapPin, Trophy, Play } from "lucide-react";
import { TiltCard } from "@/components/site/TiltCard";

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

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as any } },
};

function Media({ c, ratio }: { c: HomeCard; ratio: string }) {
  if (!c.media_url) return null;
  return (
    <div className={`${ratio} overflow-hidden bg-muted relative`}>
      {c.media_kind === "video" ? (
        <video
          src={c.media_url}
          poster={c.poster_url ?? undefined}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          className="w-full h-full object-cover"
        />
      ) : (
        <img src={c.media_url} alt={c.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
      )}
    </div>
  );
}

function Cta({ c, className }: { c: HomeCard; className?: string }) {
  if (!c.cta_link) return null;
  const external = /^https?:\/\//i.test(c.cta_link);
  return (
    <a
      href={c.cta_link}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={className ?? "mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary hover:gap-2.5 transition-all"}
    >
      {c.cta_text || "Learn more"} <ArrowUpRight size={14} />
    </a>
  );
}

export function FeaturedPerformances({ rows }: { rows: HomeCard[] }) {
  if (!rows.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-border">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Featured Performances</p>
          <h2 className="mt-3 font-display text-4xl lg:text-6xl font-bold leading-[1.02] text-balance">
            Moments on <span className="italic font-light">the big stage.</span>
          </h2>
        </div>
        <p className="hidden md:block text-xs uppercase tracking-widest text-muted-foreground max-w-xs text-right">
          Stages, shows and milestones from Tejas's journey.
        </p>
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {rows.map((c) => (
          <motion.div key={c.id} variants={item}>
            <TiltCard className="h-full">
              <article className="group h-full rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/60 transition-colors">
                <Media c={c} ratio="aspect-[4/3]" />
                <div className="p-6">
                  {c.event_name && (
                    <p className="text-[11px] uppercase tracking-[0.18em] text-primary inline-flex items-center gap-1.5">
                      <Play size={11} /> {c.event_name}
                    </p>
                  )}
                  <h3 className="mt-2 font-display text-2xl font-bold leading-tight">{c.title}</h3>
                  {c.location && (
                    <p className="mt-2 text-sm text-muted-foreground inline-flex items-center gap-1.5">
                      <MapPin size={13} /> {c.location}
                    </p>
                  )}
                  {c.achievement && (
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed inline-flex items-start gap-2">
                      <Trophy size={14} className="mt-0.5 text-primary shrink-0" /> {c.achievement}
                    </p>
                  )}
                  <Cta c={c} />
                </div>
              </article>
            </TiltCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

export function SignatureProgramsGrid({ rows }: { rows: HomeCard[] }) {
  if (!rows.length) return null;
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {rows.map((c) => (
        <motion.div key={c.id} variants={item}>
          <article className="group h-full flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-primary transition-colors">
            <Media c={c} ratio="aspect-[16/10]" />
            <div className="p-6 flex flex-col flex-1">
              <h3 className="font-display text-xl font-bold">{c.title}</h3>
              {c.description && (
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.description}</p>
              )}
              <div className="mt-auto">
                <Cta c={c} />
              </div>
            </div>
          </article>
        </motion.div>
      ))}
    </motion.div>
  );
}

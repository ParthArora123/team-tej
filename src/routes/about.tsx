import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import aboutImg from "@/assets/about.jpg";
import { MotionImage } from "@/components/site/MotionImage";
import { listPublicTeamProfiles } from "@/lib/team.functions";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Tejas Dhoke" },
      {
        name: "description",
        content:
          "The story behind Tejas Dhoke — a fusion dance company training movers and choreographing India's most expressive stages.",
      },
      { property: "og:title", content: "About — Tejas Dhoke" },
      {
        property: "og:description",
        content: "Meet the company, the craft, and the people behind Tejas Dhoke.",
      },
      { property: "og:image", content: "/og-about.jpg" },
    ],
  }),
  component: About,
});

const values = [
  { title: "Discipline", body: "Every form starts with foundation. We drill until it's muscle memory." },
  { title: "Fusion", body: "Classical, contemporary, urban — borders are where the best work happens." },
  { title: "Stage-first", body: "We train for performance, not just for class. Every batch performs." },
];

type TeamMember = {
  id: string;
  name: string;
  designation?: string | null;
  short_description?: string | null;
  biography?: string | null;
  photo_url?: string | null;
  experience?: string | null;
  dance_styles?: string[] | null;
  achievements?: string[] | null;
};

function About() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [selected, setSelected] = useState<TeamMember | null>(null);

  useEffect(() => {
    const load = () => listPublicTeamProfiles()
      .then((rows: any) => setTeam(rows ?? []))
      .catch(() => setTeam([]));
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);


  return (
    <>
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <p className="text-xs uppercase tracking-widest text-primary">About</p>
          <h1 className="mt-3 font-display text-5xl lg:text-7xl font-bold leading-[1.05] text-balance max-w-4xl">
            Twelve years of teaching India to move differently.
          </h1>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-5 gap-12 pb-24">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="lg:col-span-2 aspect-[4/5] rounded-2xl border border-border overflow-hidden">
          <MotionImage src={aboutImg} alt="Founder of Tejas Dhoke" width={1200} height={1400} className="h-full w-full" />
        </motion.div>
        <div className="lg:col-span-3 space-y-6 text-lg leading-relaxed text-muted-foreground">
          <p>
            Tejas Dhoke began in a borrowed studio in 2013 with six dancers and one stubborn belief — that Indian dance
            shouldn't have to pick a lane. Today it's a full company of performers, choreographers and students
            working across film, festivals and live productions.
          </p>
          <p>
            Our fusion approach pulls from Kathak's footwork, contemporary's release, Bollywood's expression, and
            hip-hop's groove. The result isn't a style — it's a vocabulary.
          </p>
          <p>We train roughly 300 students a year across five batches, and our performance wing has toured 12 cities.</p>
        </div>
      </section>

      {/* VALUES */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16 border-t border-border">
        <p className="text-xs uppercase tracking-widest text-primary">What we stand on</p>
        <div className="mt-10 grid md:grid-cols-3 gap-8">
          {values.map((v, i) => (
            <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl border border-border bg-card hover:border-primary transition-colors">
              <p className="font-display text-3xl font-bold">{v.title}</p>
              <p className="mt-3 text-muted-foreground">{v.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TEAM — dynamic profiles from database */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Faculty</p>
            <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold">The people on the floor.</h2>
          </div>
        </div>
        {team.length === 0 ? (
          <p className="text-muted-foreground">Profiles will be added soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((m, i) => (
              <motion.button
                key={m.id}
                type="button"
                onClick={() => setSelected(m)}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
                <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-secondary border border-border flex items-center justify-center text-7xl font-display font-bold text-primary group-hover:scale-[1.02] transition-transform">
                  {m.photo_url ? (
                    <img src={m.photo_url} alt={m.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span>{m.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <p className="mt-4 font-display text-xl font-semibold">{m.name}</p>
                {m.designation && <p className="text-sm text-muted-foreground">{m.designation}</p>}
              </motion.button>
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl">
              <button onClick={() => setSelected(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-background/60 hover:bg-muted z-10">
                <X size={18} />
              </button>
              <div className="grid md:grid-cols-2">
                <div className="aspect-[4/5] md:aspect-auto bg-gradient-to-br from-muted to-secondary flex items-center justify-center text-8xl font-display font-bold text-primary">
                  {selected.photo_url ? (
                    <img src={selected.photo_url} alt={selected.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{selected.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="p-6 sm:p-8">
                  <p className="text-xs uppercase tracking-widest text-primary">Profile</p>
                  <h3 className="mt-1 font-display text-3xl font-bold">{selected.name}</h3>
                  {selected.designation && <p className="text-sm text-muted-foreground mt-1">{selected.designation}</p>}
                  {selected.experience && <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">Experience · {selected.experience}</p>}
                  {selected.short_description && <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{selected.short_description}</p>}
                  {selected.biography && (
                    <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">{selected.biography}</p>
                  )}
                  {selected.dance_styles && selected.dance_styles.length > 0 && (
                    <div className="mt-5">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Styles</p>
                      <div className="flex flex-wrap gap-2">
                        {selected.dance_styles.map((s) => (
                          <span key={s} className="px-2.5 py-1 rounded-full text-[11px] border border-border bg-background/40">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selected.achievements && selected.achievements.length > 0 && (
                    <div className="mt-5">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Achievements</p>
                      <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                        {selected.achievements.map((a) => <li key={a}>{a}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import aboutImg from "@/assets/about.jpg";
import { MotionImage } from "@/components/site/MotionImage";


export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Team Tej" },
      {
        name: "description",
        content:
          "The story behind Team Tej — a fusion dance company training movers and choreographing India's most expressive stages.",
      },
      { property: "og:title", content: "About — Team Tej" },
      {
        property: "og:description",
        content: "Meet the company, the craft, and the people behind Team Tej.",
      },
      { property: "og:image", content: "/og-about.jpg" },
    ],
  }),
  component: About,
});

const team = [
  { name: "Tej Sharma", role: "Founder · Artistic Director", initial: "T" },
  { name: "Ria Kapoor", role: "Senior Choreographer", initial: "R" },
  { name: "Aman Verma", role: "Head of Hip-Hop", initial: "A" },
  { name: "Niharika Das", role: "Classical & Kathak Lead", initial: "N" },
];

const values = [
  { title: "Discipline", body: "Every form starts with foundation. We drill until it's muscle memory." },
  { title: "Fusion", body: "Classical, contemporary, urban — borders are where the best work happens." },
  { title: "Stage-first", body: "We train for performance, not just for class. Every batch performs." },
];



function About() {
  return (
    <>
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs uppercase tracking-widest text-primary">About</p>
          <h1 className="mt-3 font-display text-5xl lg:text-7xl font-bold leading-[1.05] text-balance max-w-4xl">
            Twelve years of teaching India to move differently.
          </h1>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-5 gap-12 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="lg:col-span-2 aspect-[4/5] rounded-2xl border border-border overflow-hidden"
        >
          <MotionImage
            src={aboutImg}
            alt="Founder of Team Tej"
            width={1200}
            height={1400}
            className="h-full w-full"
          />
        </motion.div>


        <div className="lg:col-span-3 space-y-6 text-lg leading-relaxed text-muted-foreground">
          <p>
            Team Tej began in a borrowed studio in 2013 with six dancers and one
            stubborn belief — that Indian dance shouldn't have to pick a lane.
            Today it's a full company of performers, choreographers and
            students working across film, festivals and live productions.
          </p>
          <p>
            Our fusion approach pulls from Kathak's footwork, contemporary's
            release, Bollywood's expression, and hip-hop's groove. The result
            isn't a style — it's a vocabulary.
          </p>
          <p>
            We train roughly 300 students a year across five batches, and our
            performance wing has toured 12 cities.
          </p>
        </div>
      </section>

      {/* VALUES */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16 border-t border-border">
        <p className="text-xs uppercase tracking-widest text-primary">What we stand on</p>
        <div className="mt-10 grid md:grid-cols-3 gap-8">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl border border-border bg-card hover:border-primary transition-colors"
            >
              <p className="font-display text-3xl font-bold">{v.title}</p>
              <p className="mt-3 text-muted-foreground">{v.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Faculty</p>
            <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold">The people on the floor.</h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-muted to-secondary border border-border flex items-center justify-center text-7xl font-display font-bold text-primary group-hover:scale-[1.02] transition-transform">
                {m.initial}
              </div>
              <p className="mt-4 font-display text-xl font-semibold">{m.name}</p>
              <p className="text-sm text-muted-foreground">{m.role}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}

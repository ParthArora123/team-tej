import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import classesImg from "@/assets/classes.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Team Tej — Fusion Dance Company" },
      {
        name: "description",
        content:
          "A fusion dance company shaping India's next generation of performers. Train, perform, transform.",
      },
      { property: "og:title", content: "Team Tej — Fusion Dance Company" },
      {
        property: "og:description",
        content: "Train, perform, transform with Team Tej.",
      },
    ],
  }),
  component: Index,
});

const stats = [
  { value: "12+", label: "Years on stage" },
  { value: "300+", label: "Dancers trained" },
  { value: "40+", label: "Live productions" },
];

function Index() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Team Tej dancers in performance"
            width={1600}
            height={1200}
            className="h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-32 pb-40 lg:pt-48 lg:pb-56">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background/50 backdrop-blur text-xs uppercase tracking-widest text-muted-foreground">
              <Sparkles size={12} className="text-primary" />
              Fusion Dance Company · Est. 2013
            </div>
            <h1 className="mt-6 font-display font-bold text-5xl sm:text-6xl lg:text-8xl leading-[0.95] text-balance">
              Movement,{" "}
              <span className="italic font-light">unscripted.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Team Tej is a fusion dance company blending classical roots with
              contemporary, hip-hop and Bollywood — built for dancers who want
              to move with intention.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/classes"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
              >
                Explore classes
                <ArrowUpRight
                  size={18}
                  className="group-hover:rotate-45 transition-transform"
                />
              </Link>
              <Link
                to="/events"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:border-primary hover:text-primary transition"
              >
                Upcoming shows
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Marquee */}
        <div className="relative border-y border-border bg-background/60 backdrop-blur overflow-hidden">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="flex gap-12 py-4 whitespace-nowrap text-sm uppercase tracking-[0.3em] text-muted-foreground"
          >
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-12 shrink-0">
                <span>Fusion</span><span className="text-primary">◆</span>
                <span>Contemporary</span><span className="text-primary">◆</span>
                <span>Bollywood</span><span className="text-primary">◆</span>
                <span>Hip-Hop</span><span className="text-primary">◆</span>
                <span>Kathak</span><span className="text-primary">◆</span>
                <span>Choreography</span><span className="text-primary">◆</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="grid sm:grid-cols-3 gap-10">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="border-t border-border pt-6"
            >
              <p className="font-display text-5xl lg:text-6xl font-bold text-primary">
                {s.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground uppercase tracking-widest">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SPLIT FEATURE */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-xs uppercase tracking-widest text-primary">
              Our craft
            </p>
            <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold leading-tight text-balance">
              We train movers, not just dancers.
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Every Team Tej class is built around a fusion philosophy — strong
              technique, emotional storytelling, and the freedom to break form.
              From first-time learners to performance-track artists, our
              programs scale with you.
            </p>
            <Link
              to="/about"
              className="mt-8 inline-flex items-center gap-2 text-primary hover:gap-3 transition-all"
            >
              The Team Tej story <ArrowUpRight size={16} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border"
          >
            <img
              src={classesImg}
              alt="Studio rehearsal"
              loading="lazy"
              width={1400}
              height={1000}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6">
              <p className="text-xs uppercase tracking-widest text-primary">Studio</p>
              <p className="font-display text-2xl font-bold">Where it begins</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-border p-12 lg:p-20 text-center"
          style={{ background: "var(--gradient-warm)" }}
        >
          <h2 className="font-display text-4xl lg:text-6xl font-bold text-primary-foreground text-balance">
            Ready to move?
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
            New batch starts the first week of every month. Find a class that
            fits your energy.
          </p>
          <Link
            to="/classes"
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-background text-foreground font-medium hover:scale-105 transition"
          >
            Browse classes <ArrowUpRight size={18} />
          </Link>
        </motion.div>
      </section>
    </>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowUpRight, Sparkles, Calendar } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import classesImg from "@/assets/classes.jpg";
import aboutImg from "@/assets/about.jpg";
import { MotionImage } from "@/components/site/MotionImage";


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

const team = [
  { name: "Tej Sharma", role: "Founder · Artistic Director", initial: "T", bio: "Twelve years on stage. Trained at NIPA & Rambert." },
  { name: "Ria Kapoor", role: "Senior Choreographer", initial: "R", bio: "Resident choreographer for fusion and contemporary." },
  { name: "Aman Verma", role: "Head of Hip-Hop", initial: "A", bio: "Industry choreographer. Reels, films, live tours." },
  { name: "Niharika Das", role: "Classical & Kathak Lead", initial: "N", bio: "Kathak Visharad. Bridges classical into fusion form." },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

function Index() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroProgress, [0, 1], ["0%", "30%"]);
  const heroScale = useTransform(heroProgress, [0, 1], [1, 1.15]);
  const heroOpacity = useTransform(heroProgress, [0, 1], [1, 0.2]);

  return (
    <>
      {/* HERO */}
      <section ref={heroRef} className="relative overflow-hidden">
        <motion.div
          style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
          className="absolute inset-0"
        >
          <img
            src={heroImg}
            alt="Team Tej dancers in performance"
            width={1600}
            height={1200}
            className="h-full w-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        </motion.div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-32 pb-40 lg:pt-48 lg:pb-56">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="max-w-3xl"
          >
            <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background/50 backdrop-blur text-xs uppercase tracking-widest text-muted-foreground">
              <Sparkles size={12} className="text-primary" />
              Fusion Dance Company · Est. 2013
            </motion.div>

            <motion.h1
              variants={item}
              className="mt-6 font-display font-bold text-5xl sm:text-6xl lg:text-8xl leading-[0.95] text-balance"
            >
              Movement,{" "}
              <span className="italic font-light">unscripted.</span>
            </motion.h1>

            <motion.p variants={item} className="mt-6 text-lg text-muted-foreground max-w-xl">
              Team Tej is a fusion dance company blending classical roots with
              contemporary, hip-hop and Bollywood — built for dancers who want
              to move with intention.
            </motion.p>

            <motion.div variants={item} className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/classes"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
              >
                Explore classes
                <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform" />
              </Link>
              <Link
                to="/workshops"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:border-primary hover:text-primary transition"
              >
                Register for workshops
              </Link>
            </motion.div>
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
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid sm:grid-cols-3 gap-10"
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={item} className="border-t border-border pt-6">
              <p className="font-display text-5xl lg:text-6xl font-bold text-primary">{s.value}</p>
              <p className="mt-2 text-sm text-muted-foreground uppercase tracking-widest">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
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
            <p className="text-xs uppercase tracking-widest text-primary">Our craft</p>
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
            className="relative aspect-[4/5] rounded-2xl border border-border overflow-hidden"
          >
            <MotionImage
              src={classesImg}
              alt="Studio rehearsal"
              width={1400}
              height={1000}
              className="absolute inset-0 h-full w-full"
              overlay={<div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />}
            >
              <div className="absolute bottom-6 left-6 z-10">
                <p className="text-xs uppercase tracking-widest text-primary">Studio</p>
                <p className="font-display text-2xl font-bold">Where it begins</p>
              </div>
            </MotionImage>
          </motion.div>

        </div>
      </section>

      {/* TEAM */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-border">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Meet the team</p>
            <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold text-balance">
              The people on the floor.
            </h2>
          </div>
          <Link to="/about" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition">
            See full faculty <ArrowUpRight size={14} />
          </Link>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {team.map((m) => (
            <motion.div
              key={m.name}
              variants={item}
              whileHover={{ y: -6 }}
              className="group p-6 rounded-2xl border border-border bg-card hover:border-primary transition-colors"
            >
              <div className="aspect-[4/5] rounded-xl bg-gradient-to-br from-muted to-secondary flex items-center justify-center text-7xl font-display font-bold text-primary group-hover:scale-105 transition-transform duration-500">
                {m.initial}
              </div>
              <p className="mt-5 font-display text-xl font-bold">{m.name}</p>
              <p className="text-xs uppercase tracking-widest text-primary mt-1">{m.role}</p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{m.bio}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* WORKSHOPS TEASER */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative aspect-[5/4] rounded-2xl border border-border overflow-hidden order-2 lg:order-1"
          >
            <MotionImage
              src={aboutImg}
              alt="Workshop"
              width={1200}
              height={1400}
              className="absolute inset-0 h-full w-full"
              overlay={<div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />}
            >
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between z-10">
                <div>
                  <p className="text-xs uppercase tracking-widest text-primary">Next up</p>
                  <p className="font-display text-2xl font-bold">Crosswinds Intensive</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  24 seats
                </span>
              </div>
            </MotionImage>
          </motion.div>


          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="order-1 lg:order-2"
          >
            <p className="text-xs uppercase tracking-widest text-primary inline-flex items-center gap-1.5">
              <Calendar size={12} /> Workshops
            </p>
            <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold leading-tight text-balance">
              Short bursts. Big leaps.
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              One-off intensives with visiting choreographers. Limited seats,
              high intensity, instant UPI registration. Built for dancers who
              want a focused dose without a full batch commitment.
            </p>
            <Link
              to="/workshops"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
            >
              Register for a workshop <ArrowUpRight size={18} />
            </Link>
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
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -top-32 -right-32 h-96 w-96 rounded-full border border-primary-foreground/20"
          />
          <h2 className="relative font-display text-4xl lg:text-6xl font-bold text-primary-foreground text-balance">
            Ready to move?
          </h2>
          <p className="relative mt-4 text-primary-foreground/80 max-w-xl mx-auto">
            New batches start the first week of every month. Workshops drop monthly.
          </p>
          <div className="relative mt-8 flex flex-wrap gap-3 justify-center">
            <Link
              to="/classes"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-background text-foreground font-medium hover:scale-105 transition"
            >
              Browse classes <ArrowUpRight size={18} />
            </Link>
            <Link
              to="/workshops"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 transition"
            >
              Workshops
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { listPublicTeamProfiles } from "@/lib/team.functions";
import { listPrograms } from "@/lib/catalog.functions";
import { listPublicCelebrities, listPublicBrands, listPublicGlobe } from "@/lib/content.functions";
import { listHeroSlides, getFeaturedExperience, listGalleryItems } from "@/lib/cms.functions";
import { useServerFn } from "@tanstack/react-start";

import { ArrowUpRight, Sparkles, Calendar, MapPin } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import classesImg from "@/assets/classes.jpg";
// aboutImg no longer used on homepage after workshops teaser was replaced with dynamic grid
import styleFusion from "@/assets/style-fusion.jpg";
import styleHipHop from "@/assets/style-hiphop.jpg";
import styleKathak from "@/assets/style-kathak.jpg";
import styleBollywood from "@/assets/style-bollywood.jpg";
import styleFusionVid from "@/assets/style-fusion.mp4.asset.json";
import styleHipHopVid from "@/assets/style-hiphop.mp4.asset.json";
import styleKathakVid from "@/assets/style-kathak.mp4.asset.json";
import styleBollywoodVid from "@/assets/style-bollywood.mp4.asset.json";
import { MotionImage } from "@/components/site/MotionImage";

const styles = [
  { name: "Fusion", tagline: "Our signature blend.", img: styleFusion, video: styleFusionVid.url },
  { name: "Hip-Hop", tagline: "Bounce, groove, attitude.", img: styleHipHop, video: styleHipHopVid.url },
  { name: "Kathak", tagline: "Tatkar and storytelling.", img: styleKathak, video: styleKathakVid.url },
  { name: "Bollywood", tagline: "Built for the camera.", img: styleBollywood, video: styleBollywoodVid.url },
];


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tejas D Dhoke — Fusion Dance Company" },
      {
        name: "description",
        content:
          "A fusion dance company shaping India's next generation of performers. Train, perform, transform.",
      },
      { property: "og:title", content: "Tejas D Dhoke — Fusion Dance Company" },
      {
        property: "og:description",
        content: "Train, perform, transform with Tejas D Dhoke.",
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

type TeamMember = {
  id: string;
  name: string;
  designation?: string | null;
  short_description?: string | null;
  photo_url?: string | null;
};


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

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [celebrities, setCelebrities] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [globe, setGlobe] = useState<any[]>([]);
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any | null>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const fetchPrograms = useServerFn(listPrograms);
  useEffect(() => {
    const load = () => {
      listPublicTeamProfiles().then((rows: any) => setTeam(rows ?? [])).catch(() => setTeam([]));
      fetchPrograms({ data: { kind: "workshop" } })
        .then((rows: any) => setWorkshops((rows ?? []).slice(0, 6)))
        .catch(() => setWorkshops([]));
      listPublicCelebrities().then((r: any) => setCelebrities(r ?? [])).catch(() => setCelebrities([]));
      listPublicBrands().then((r: any) => setBrands(r ?? [])).catch(() => setBrands([]));
      listPublicGlobe().then((r: any) => setGlobe(r ?? [])).catch(() => setGlobe([]));
      listHeroSlides().then((r: any) => setHeroSlides(r ?? [])).catch(() => setHeroSlides([]));
      getFeaturedExperience().then((r: any) => setFeatured(r)).catch(() => setFeatured(null));
      listGalleryItems().then((r: any) => setGallery(r ?? [])).catch(() => setGallery([]));
    };
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    if (heroSlides.length < 2) return;
    const t = setInterval(() => setSlideIdx((i) => (i + 1) % heroSlides.length), 5000);
    return () => clearInterval(t);
  }, [heroSlides.length]);




  return (
    <>
      {/* HERO */}
      <section ref={heroRef} className="relative overflow-hidden">
        <motion.div
          style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
          className="absolute inset-0"
        >
          {heroSlides.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.img
                key={heroSlides[slideIdx]?.id}
                src={heroSlides[slideIdx]?.image_url}
                alt={heroSlides[slideIdx]?.alt ?? "Hero"}
                initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="h-full w-full object-cover absolute inset-0"
              />
            </AnimatePresence>
          ) : (
            <img
              src={heroImg}
              alt="Tejas D Dhoke dancers in performance"
              width={1600}
              height={1200}
              className="h-full w-full object-cover opacity-55"
            />
          )}
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
              className="mt-6 font-display font-bold text-5xl sm:text-6xl lg:text-7xl leading-[0.95] text-balance"
            >
              Live Movement Experiences with{" "}
              <span className="italic font-light">Tejas D Dhoke.</span>
            </motion.h1>

            <motion.p variants={item} className="mt-6 text-lg text-muted-foreground max-w-xl">
              Workshops, Dance Experiences, Nritya Sadhana, and Online Training—created to help you express, grow, and feel alive through movement.
            </motion.p>

            <motion.div variants={item} className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/workshops"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
              >
                Register for workshops
                <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform" />
              </Link>
              <Link
                to="/nritya-sadhana"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:border-primary hover:text-primary transition"
              >
                Explore classes
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

      {/* FEATURED EXPERIENCE */}
      {featured && (
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl border border-border bg-card"
          >
            <div className="grid lg:grid-cols-2">
              <div className="relative aspect-[4/3] lg:aspect-auto bg-muted">
                {featured.banner_url && (
                  <img src={featured.banner_url} alt={featured.title} className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent lg:hidden" />
              </div>
              <div className="p-8 lg:p-12">
                <p className="text-xs uppercase tracking-widest text-primary inline-flex items-center gap-1.5">
                  <Sparkles size={12} /> Featured experience
                </p>
                <h2 className="mt-3 font-display text-3xl lg:text-4xl font-bold leading-tight">{featured.title}</h2>
                {(featured.city || featured.start_date) && (
                  <p className="mt-2 text-sm text-muted-foreground inline-flex items-center gap-2">
                    {featured.city && <><MapPin size={12} /> {featured.city}</>}
                    {featured.start_date && <><Calendar size={12} /> {new Date(featured.start_date).toDateString()}{featured.end_date ? ` – ${new Date(featured.end_date).toDateString()}` : ""}</>}
                  </p>
                )}
                {featured.description && <p className="mt-4 text-muted-foreground leading-relaxed whitespace-pre-line">{featured.description}</p>}
                {Array.isArray(featured.day_schedule) && featured.day_schedule.length > 0 && (
                  <div className="mt-6 space-y-2">
                    {featured.day_schedule.map((d: any, i: number) => (
                      <div key={i} className="border-l-2 border-primary/50 pl-3">
                        <p className="text-xs uppercase tracking-widest text-primary">{d.day}</p>
                        <p className="text-sm text-muted-foreground">{d.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                {featured.cta_text && featured.cta_link && (
                  <a href={featured.cta_link}
                    className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition">
                    {featured.cta_text} <ArrowUpRight size={18} />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </section>
      )}



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
              Every Tejas D Dhoke class is built around a fusion philosophy — strong
              technique, emotional storytelling, and the freedom to break form.
              From first-time learners to performance-track artists, our
              programs scale with you.
            </p>
            <Link
              to="/about"
              className="mt-8 inline-flex items-center gap-2 text-primary hover:gap-3 transition-all"
            >
              The Tejas D Dhoke story <ArrowUpRight size={16} />
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

        {/* Mobile: horizontal snap carousel */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="md:hidden -mx-6 px-6 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-pl-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {team.map((m) => (
            <motion.div
              key={m.id}
              variants={item}
              className="snap-start shrink-0 w-[78%] p-6 rounded-2xl border border-border bg-card"
            >
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-gradient-to-br from-muted to-secondary">
                {m.photo_url ? (
                  <img src={m.photo_url} alt={m.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-7xl font-display font-bold text-primary">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <p className="mt-5 font-display text-xl font-bold">{m.name}</p>
              {m.designation && <p className="text-xs uppercase tracking-widest text-primary mt-1">{m.designation}</p>}
              {m.short_description && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{m.short_description}</p>}
            </motion.div>
          ))}
        </motion.div>

        {/* Desktop: grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="hidden md:grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {team.map((m) => (
            <motion.div
              key={m.id}
              variants={item}
              whileHover={{ y: -6 }}
              className="group p-6 rounded-2xl border border-border bg-card hover:border-primary transition-colors"
            >
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-gradient-to-br from-muted to-secondary">
                {m.photo_url ? (
                  <img src={m.photo_url} alt={m.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-7xl font-display font-bold text-primary group-hover:scale-105 transition-transform duration-500">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <p className="mt-5 font-display text-xl font-bold">{m.name}</p>
              {m.designation && <p className="text-xs uppercase tracking-widest text-primary mt-1">{m.designation}</p>}
              {m.short_description && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{m.short_description}</p>}
            </motion.div>
          ))}
        </motion.div>


      </section>

      {/* DANCE STYLES */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-border">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-widest text-primary">What we teach</p>
          <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold text-balance max-w-2xl">
            Styles on the floor.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl">
            Four core vocabularies. They cross, collide, and become the Tejas D Dhoke fusion.
          </p>
        </div>

        {/* Mobile: snap carousel */}
        <div className="md:hidden -mx-6 px-6 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-pl-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {styles.map((s) => (
            <article
              key={s.name}
              className="snap-start shrink-0 w-[78%] relative aspect-[4/5] rounded-2xl overflow-hidden border border-border group"
            >
              <video
                src={s.video}
                poster={s.img}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-60" style={{ background: "radial-gradient(60% 60% at 30% 40%, hsl(var(--primary)/0.35), transparent 60%)" }} />
              <div className="pointer-events-none absolute -top-1/2 -left-1/2 h-[200%] w-[200%] mix-blend-overlay opacity-40 animate-[spin_18s_linear_infinite]" style={{ background: "conic-gradient(from 0deg, transparent 60%, rgba(255,255,255,0.15) 75%, transparent 90%)" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 z-10">
                <p className="font-display text-2xl font-bold">{s.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.tagline}</p>
              </div>
            </article>
          ))}
        </div>

        {/* Desktop: grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="hidden md:grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {styles.map((s) => (
            <motion.article
              key={s.name}
              variants={item}
              whileHover={{ y: -6 }}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-border hover:border-primary transition-colors"
            >
              <video
                src={s.video}
                poster={s.img}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-60" style={{ background: "radial-gradient(60% 60% at 30% 40%, hsl(var(--primary)/0.35), transparent 60%)" }} />
              <div className="pointer-events-none absolute -top-1/2 -left-1/2 h-[200%] w-[200%] mix-blend-overlay opacity-40 animate-[spin_22s_linear_infinite]" style={{ background: "conic-gradient(from 0deg, transparent 60%, rgba(255,255,255,0.15) 75%, transparent 90%)" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 z-10">
                <p className="font-display text-2xl font-bold">{s.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.tagline}</p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* WORKSHOPS — dynamic */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary inline-flex items-center gap-1.5">
              <Calendar size={12} /> Workshops
            </p>
            <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold leading-tight text-balance">
              Short bursts. Big leaps.
            </h2>
          </div>
          <Link to="/workshops" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition">
            See all workshops <ArrowUpRight size={14} />
          </Link>
        </div>

        {workshops.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl py-16 text-center text-muted-foreground">
            <p className="font-display text-2xl">Coming Soon</p>
            <p className="mt-2 text-sm">New workshops drop every month — check back soon.</p>
          </div>
        ) : (
          <>
            {/* Mobile: horizontal snap carousel */}
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
              className="md:hidden -mx-6 px-6 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-pl-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {workshops.map((w) => (
                <motion.article key={w.id} variants={item}
                  className="snap-start shrink-0 w-[82%] rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
                  <div className="w-full overflow-hidden bg-muted">
                    {w.banner_url ? (
                      <img src={w.banner_url} alt={w.name} loading="lazy" className="w-full h-auto object-contain" />
                    ) : (
                      <div className="aspect-[16/10] w-full bg-gradient-to-br from-primary/20 to-secondary/40" />
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    {w.category && <p className="text-[10px] uppercase tracking-widest text-primary">{w.category}</p>}
                    <p className="mt-1 font-display text-xl font-bold">{w.name}</p>
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {w.event_date && <p className="flex items-center gap-2"><Calendar size={12} />{new Date(w.event_date).toDateString()}{w.event_time ? ` · ${w.event_time}` : ""}</p>}
                      {w.venue && <p className="flex items-center gap-2"><MapPin size={12} />{w.venue}</p>}
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <p className="font-display text-xl">₹{Number(w.price_inr).toLocaleString("en-IN")}</p>
                      <Link to="/workshops" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Register</Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>

            {/* Desktop: grid */}
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
              className="hidden md:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {workshops.map((w) => (
                <motion.article key={w.id} variants={item}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary transition-colors flex flex-col">
                  <div className="w-full overflow-hidden bg-muted">
                    {w.banner_url ? (
                      <img src={w.banner_url} alt={w.name} loading="lazy" className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="aspect-[16/10] w-full bg-gradient-to-br from-primary/20 to-secondary/40" />
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    {w.category && <p className="text-[10px] uppercase tracking-widest text-primary">{w.category}</p>}
                    <p className="mt-1 font-display text-xl font-bold">{w.name}</p>
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {w.event_date && <p className="flex items-center gap-2"><Calendar size={12} />{new Date(w.event_date).toDateString()}{w.event_time ? ` · ${w.event_time}` : ""}</p>}
                      {w.venue && <p className="flex items-center gap-2"><MapPin size={12} />{w.venue}</p>}
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <p className="font-display text-xl">₹{Number(w.price_inr).toLocaleString("en-IN")}</p>
                      <Link to="/workshops" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Register</Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </>
        )}

      </section>

      {/* GALLERY */}
      {gallery.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-border">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-widest text-primary">Moments</p>
            <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold text-balance">From the floor.</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {gallery.map((g, i) => (
              <motion.figure
                key={g.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.05 }}
                className={`relative overflow-hidden rounded-2xl border border-border bg-muted ${i % 5 === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"}`}
              >
                {g.image_url && <img src={g.image_url} alt={g.caption ?? ""} loading="lazy" className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500" />}
                {g.caption && (
                  <figcaption className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/80 to-transparent text-xs">{g.caption}</figcaption>
                )}
              </motion.figure>
            ))}
          </div>
        </section>
      )}

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
              to="/nritya-sadhana"
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

      {/* Celebrities · Brands · India to the Globe — dynamic */}
      <section className="relative px-6 lg:px-10 max-w-7xl mx-auto py-24 space-y-20">
        {celebrities.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Celebrities we've worked with</p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold mt-2">On stage with the best</h2>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {celebrities.map((c) => (
                <div key={c.id} className="aspect-square rounded-2xl bg-card border border-border overflow-hidden flex flex-col items-center justify-end text-center hover:border-primary transition">
                  {c.photo_url ? (
                    <img src={c.photo_url} alt={c.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  ) : null}
                  <div className={`relative w-full p-3 ${c.photo_url ? "bg-gradient-to-t from-background/90 to-transparent" : ""}`}>
                    <p className="font-display text-sm">{c.name}</p>
                    {c.role && <p className="text-[10px] text-muted-foreground">{c.role}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {brands.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Brands we've worked with</p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold mt-2">Trusted partners</h2>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {brands.map((b) => (
                <div key={b.id} className="h-20 rounded-xl bg-muted border border-border flex items-center justify-center font-display text-lg tracking-wide hover:text-primary transition overflow-hidden p-3">
                  {b.logo_url ? <img src={b.logo_url} alt={b.name} loading="lazy" className="max-h-full max-w-full object-contain" /> : <span>{b.name}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {globe.length > 0 && (() => {
          const conducted = globe.filter((g) => g.status === "conducted");
          const upcoming = globe.filter((g) => g.status === "upcoming");
          const countries = Array.from(new Set(globe.map((g) => g.country))).length;
          return (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-card to-background border border-border p-10 lg:p-16">
              <p className="text-xs uppercase tracking-widest text-primary">India to the globe</p>
              <h2 className="font-display text-4xl lg:text-5xl font-bold mt-2 max-w-3xl">Carrying our story across the world</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl">Tejas D Dhoke has performed and taught on stages across {countries} {countries === 1 ? "country" : "countries"}.</p>
              {conducted.length > 0 && (
                <div className="mt-8">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">Conducted</p>
                  <div className="flex flex-wrap gap-2">
                    {conducted.map((g) => (
                      <span key={g.id} className="px-3 py-1.5 rounded-full text-xs border border-border bg-background/40">{g.city}, {g.country}</span>
                    ))}
                  </div>
                </div>
              )}
              {upcoming.length > 0 && (
                <div className="mt-6">
                  <p className="text-[11px] uppercase tracking-widest text-primary mb-3">Upcoming</p>
                  <div className="flex flex-wrap gap-2">
                    {upcoming.map((g) => (
                      <span key={g.id} className="px-3 py-1.5 rounded-full text-xs border border-primary/40 bg-primary/10 text-primary">
                        {g.city}, {g.country}{g.event_date ? ` · ${new Date(g.event_date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </section>

    </>
  );
}

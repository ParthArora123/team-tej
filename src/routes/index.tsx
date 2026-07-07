import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { listPrograms } from "@/lib/catalog.functions";
import { listPublicCelebrities, listPublicBrands, listPublicGlobe } from "@/lib/content.functions";
import { listHeroSlides, getFeaturedExperience, listGalleryItems } from "@/lib/cms.functions";
import { listDanceStyles, getSiteContent } from "@/lib/site-content.functions";
import { listChoreographies } from "@/lib/choreographies.functions";
import { useServerFn } from "@tanstack/react-start";

import { ArrowUpRight, Sparkles, Calendar, MapPin, Play, Instagram, Youtube, Facebook, Twitter, Linkedin } from "lucide-react";

import heroImg from "@/assets/hero.jpg";
import classesImg from "@/assets/classes.jpg";
// aboutImg no longer used on homepage after workshops teaser was replaced with dynamic grid
import { MotionImage } from "@/components/site/MotionImage";
import { StyleAnimation } from "@/components/site/StyleAnimation";


const defaultStyles = [
  { name: "Fusion", tagline: "Our signature blend." },
  { name: "Hip-Hop", tagline: "Bounce, groove, attitude." },
  { name: "Jazz", tagline: "Sharp lines, rhythm, and stage energy." },
  { name: "Contemporary", tagline: "Fluid, expressive, lyrical movement." },
  { name: "Semi-Classical", tagline: "Grace, mudras, and rooted expression." },
  { name: "Kathak", tagline: "Tatkar and storytelling." },
  { name: "Bollywood", tagline: "Built for the camera." },
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

type Choreo = {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  video_url?: string | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
  uploaded_at: string;
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

  const [workshops, setWorkshops] = useState<any[]>([]);
  const [celebrities, setCelebrities] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [globe, setGlobe] = useState<any[]>([]);
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any | null>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [danceStyles, setDanceStyles] = useState<any[] | null>(null);
  const [choreos, setChoreos] = useState<Choreo[]>([]);
  const [founder, setFounder] = useState<any | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const fetchPrograms = useServerFn(listPrograms);
  useEffect(() => {
    const load = () => {
      fetchPrograms({ data: { kind: "workshop" } })
        .then((rows: any) => setWorkshops((rows ?? []).slice(0, 6)))
        .catch(() => setWorkshops([]));
      listPublicCelebrities().then((r: any) => setCelebrities(r ?? [])).catch(() => setCelebrities([]));
      listPublicBrands().then((r: any) => setBrands(r ?? [])).catch(() => setBrands([]));
      listPublicGlobe().then((r: any) => setGlobe(r ?? [])).catch(() => setGlobe([]));
      listHeroSlides().then((r: any) => setHeroSlides(r ?? [])).catch(() => setHeroSlides([]));
      getFeaturedExperience().then((r: any) => setFeatured(r)).catch(() => setFeatured(null));
      listGalleryItems().then((r: any) => setGallery(r ?? [])).catch(() => setGallery([]));
      listDanceStyles().then((r: any) => setDanceStyles(r ?? [])).catch(() => setDanceStyles([]));
      listChoreographies().then((r: any) => setChoreos(r ?? [])).catch(() => setChoreos([]));
      getSiteContent({ data: { key: "founder" } }).then((r: any) => setFounder(r)).catch(() => setFounder(null));
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
        {/* Mobile: image sits at top in its own aspect box so it's fully visible */}
        <div className="lg:hidden relative w-full aspect-[4/5] bg-background overflow-hidden">
          {heroSlides.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.img
                key={heroSlides[slideIdx]?.id}
                src={heroSlides[slideIdx]?.image_url}
                alt={heroSlides[slideIdx]?.alt ?? "Hero"}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="h-full w-full object-contain absolute inset-0"
              />
            </AnimatePresence>
          ) : (
            <img
              src={heroImg}
              alt="Tejas D Dhoke dancers in performance"
              className="h-full w-full object-contain"
            />
          )}
        </div>

        {/* Desktop: parallax image behind text */}
        <motion.div
          style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
          className="absolute inset-0 hidden lg:block"
        >
          {heroSlides.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.img
                key={heroSlides[slideIdx]?.id}
                src={heroSlides[slideIdx]?.image_url}
                alt={heroSlides[slideIdx]?.alt ?? "Hero"}
                initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="h-full w-full object-contain absolute inset-0"
              />
            </AnimatePresence>
          ) : (
            <img
              src={heroImg}
              alt="Tejas D Dhoke dancers in performance"
              width={1600}
              height={1200}
              className="h-full w-full object-contain opacity-55"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        </motion.div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-10 lg:pt-28 lg:pb-32">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="max-w-2xl"
          >
            <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background/50 backdrop-blur text-[10px] uppercase tracking-widest text-muted-foreground">
              <Sparkles size={12} className="text-primary" />
              Fusion Dance Company · Est. 2013
            </motion.div>

            <motion.h1
              variants={item}
              className="mt-4 font-display font-bold text-xl sm:text-2xl lg:text-4xl leading-tight text-balance"
            >
              Live Movement Experiences with{" "}
              <span className="italic font-light">Tejas D Dhoke.</span>
            </motion.h1>

            <motion.p variants={item} className="mt-2 text-xs sm:text-sm lg:text-base text-muted-foreground max-w-xl">
              Workshops, Dance Experiences, Nritya Sadhana, and Online Training—created to help you express, grow, and feel alive through movement.
            </motion.p>

            <motion.div variants={item} className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/workshops"
                className="group inline-flex items-center gap-2 px-5 py-2.5 lg:px-6 lg:py-3 rounded-full bg-primary text-primary-foreground text-sm lg:text-base font-medium hover:opacity-90 transition"
              >
                Register for workshops
                <ArrowUpRight size={16} className="group-hover:rotate-45 transition-transform" />
              </Link>
              <Link
                to="/nritya-sadhana"
                className="inline-flex items-center gap-2 px-5 py-2.5 lg:px-6 lg:py-3 rounded-full border border-border text-sm lg:text-base hover:border-primary hover:text-primary transition"
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

      {/* WORKSHOPS — dynamic (primary CTA — placed directly after hero) */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-8 lg:pt-24 lg:pb-12">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary inline-flex items-center gap-1.5">
              <Calendar size={12} /> Upcoming Workshops
            </p>
            <h2 className="mt-3 font-display text-4xl lg:text-6xl font-bold leading-[1.02] text-balance">
              Register. Show up. Transform.
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl">
              Live intensives with Tejas D Dhoke — seats fill fast. Grab yours before they're gone.
            </p>
          </div>
          <Link to="/workshops" className="inline-flex items-center gap-2 text-sm text-primary hover:gap-3 transition-all">
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

      {/* FOUNDER */}
      <FounderSection founder={founder} />

      {/* LATEST CHOREOGRAPHIES */}
      <LatestChoreographies items={choreos} />


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

        {(() => {
          // Admin-managed styles are the source of truth. When none exist yet
          // (fresh install), fall back to the built-in defaults so the section
          // never renders empty.
          type RenderStyle = { name: string; tagline: string; image_url?: string | null; video_url?: string | null };
          const backend: RenderStyle[] = (danceStyles ?? []).map((s: any) => ({
            name: String(s.name ?? "Dance Style").trim() || "Dance Style",
            tagline: s.tagline ?? "",
            image_url: s.image_url ?? null,
            video_url: s.video_url ?? null,
          }));
          const stylesToRender: RenderStyle[] = backend.length > 0 ? backend : defaultStyles;

          const StyleMedia = ({ s }: { s: RenderStyle }) => {
            if (s.video_url) {
              return (
                <video src={s.video_url} poster={s.image_url ?? undefined} muted loop playsInline autoPlay
                  className="absolute inset-0 h-full w-full object-cover" />
              );
            }
            if (s.image_url) {
              return <img src={s.image_url} alt={s.name} className="absolute inset-0 h-full w-full object-cover" />;
            }
            return <StyleAnimation name={s.name} />;
          };

          return (
            <>
              {/* Mobile: snap carousel */}
              <div className="md:hidden -mx-6 px-6 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-pl-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {stylesToRender.map((s) => (
                  <article key={s.name}
                    className="snap-start shrink-0 w-[78%] relative aspect-[4/5] rounded-2xl overflow-hidden border border-border group">
                    <StyleMedia s={s} />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5 z-10">
                      <p className="font-display text-2xl font-bold">{s.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.tagline}</p>
                    </div>
                  </article>
                ))}
              </div>

              {/* Desktop: grid */}
              <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
                className="hidden md:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stylesToRender.map((s) => (
                  <motion.article key={s.name} variants={item} whileHover={{ y: -6 }}
                    className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-border hover:border-primary transition-colors">
                    <StyleMedia s={s} />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5 z-10">
                      <p className="font-display text-2xl font-bold">{s.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.tagline}</p>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            </>
          );
        })()}


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
          const continents = Array.from(new Set(globe.map((g) => countryToContinent(g.country)).filter(Boolean))).length;
          return (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-card to-background border border-border p-10 lg:p-16">
              <p className="text-xs uppercase tracking-widest text-primary">India to the globe</p>
              <h2 className="font-display text-4xl lg:text-5xl font-bold mt-2 max-w-3xl">Carrying our story across the world</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl">Tejas D Dhoke has performed and taught on stages across {continents} {continents === 1 ? "continent" : "continents"}.</p>
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

function countryToContinent(country: string): string | null {
  const c = (country || "").trim().toLowerCase();
  const map: Record<string, string> = {
    india: "Asia", "sri lanka": "Asia", nepal: "Asia", bhutan: "Asia", bangladesh: "Asia", pakistan: "Asia",
    china: "Asia", japan: "Asia", "south korea": "Asia", korea: "Asia", singapore: "Asia", malaysia: "Asia",
    thailand: "Asia", indonesia: "Asia", vietnam: "Asia", philippines: "Asia", "hong kong": "Asia", taiwan: "Asia",
    uae: "Asia", "united arab emirates": "Asia", "saudi arabia": "Asia", qatar: "Asia", bahrain: "Asia",
    kuwait: "Asia", oman: "Asia", israel: "Asia", turkey: "Asia",
    uk: "Europe", "united kingdom": "Europe", england: "Europe", scotland: "Europe", ireland: "Europe",
    france: "Europe", germany: "Europe", spain: "Europe", italy: "Europe", portugal: "Europe",
    netherlands: "Europe", belgium: "Europe", switzerland: "Europe", austria: "Europe", sweden: "Europe",
    norway: "Europe", denmark: "Europe", finland: "Europe", poland: "Europe", greece: "Europe",
    "czech republic": "Europe", hungary: "Europe", romania: "Europe", russia: "Europe",
    usa: "North America", "united states": "North America", "united states of america": "North America",
    "u.s.a.": "North America", "u.s.": "North America", america: "North America",
    canada: "North America", mexico: "North America",
    brazil: "South America", argentina: "South America", chile: "South America", colombia: "South America",
    peru: "South America",
    "south africa": "Africa", nigeria: "Africa", kenya: "Africa", egypt: "Africa", morocco: "Africa",
    ghana: "Africa", tanzania: "Africa", uganda: "Africa", mauritius: "Africa",
  };
  return map[c] ?? null;
}

function youtubeEmbed(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/embed/")) return url;
      if (u.pathname.startsWith("/shorts/")) return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
    }
  } catch {}
  return null;
}

function ChoreoCard({ c }: { c: Choreo }) {
  const [playing, setPlaying] = useState(false);
  const embed = youtubeEmbed(c.youtube_url);
  const hasVideo = !!(c.video_url || embed);

  return (
    <motion.article variants={item}
      className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary transition-colors flex flex-col">
      <div className="relative aspect-video bg-black overflow-hidden">
        {playing && embed ? (
          <iframe src={`${embed}?autoplay=1`} title={c.title}
            allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
            className="absolute inset-0 w-full h-full" />
        ) : playing && c.video_url ? (
          <video src={c.video_url} controls autoPlay className="absolute inset-0 w-full h-full object-contain" />
        ) : (
          <>
            {c.thumbnail_url ? (
              <img src={c.thumbnail_url} alt={c.title} loading="lazy"
                className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
            ) : c.video_url ? (
              <video src={c.video_url} muted loop playsInline
                className="absolute inset-0 w-full h-full object-contain" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/40" />
            )}
            {hasVideo && (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={`Play ${c.title}`}
                className="absolute inset-0 grid place-items-center bg-black/20 hover:bg-black/40 transition-colors">
                <span className="h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play size={22} className="translate-x-0.5" />
                </span>
              </button>
            )}
          </>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <p className="font-display text-lg font-bold leading-snug">{c.title}</p>
        {c.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{c.description}</p>}
        <p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">
          {new Date(c.uploaded_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </p>
        {c.instagram_url && (
          <a
            href={c.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-[#f09433] via-[#e6683c] via-40% via-[#dc2743] via-60% via-[#cc2366] to-[#bc1888] text-white hover:opacity-90 transition-opacity self-start"
          >
            <Instagram size={16} /> Watch on Instagram
          </a>
        )}
      </div>
    </motion.article>
  );
}

function LatestChoreographies({ items }: { items: Choreo[] }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-border">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary inline-flex items-center gap-1.5">
            <Sparkles size={12} /> Fresh from the floor
          </p>
          <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold text-balance">
            Latest Choreographies by <span className="italic font-light">Tejas D Dhoke</span>
          </h2>
        </div>
      </div>

      {/* Mobile: snap carousel */}
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
        className="md:hidden -mx-6 px-6 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-pl-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((c) => (
          <div key={c.id} className="snap-start shrink-0 w-[86%]">
            <ChoreoCard c={c} />
          </div>
        ))}
      </motion.div>

      {/* Desktop: grid */}
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
        className="hidden md:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((c) => <ChoreoCard key={c.id} c={c} />)}
      </motion.div>
    </section>
  );
}

function FounderSection({ founder }: { founder: any | null }) {
  const [open, setOpen] = useState(false);
  const name = founder?.name || "Tejas D Dhoke";
  const title = founder?.title || "Founder";
  const intro = founder?.intro || "";
  const image = founder?.image_url || "";
  const biography = founder?.biography || "";
  const achievements: string[] = Array.isArray(founder?.achievements) ? founder.achievements : [];
  const vision = founder?.vision || "";
  const mission = founder?.mission || "";
  const socials = founder?.socials || {};
  const ctaText = founder?.cta_text || "Register for Workshops";
  const ctaLink = founder?.cta_link || "/workshops";

  const hasMore = Boolean(biography || achievements.length || vision || mission);

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-border">
      <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-start">
        {/* Portrait */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-2"
        >
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/40 border border-border">
            {image ? (
              <img
                src={image}
                alt={name}
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-8xl font-display font-bold text-primary">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-background/95 via-background/60 to-transparent">
              <p className="text-xs uppercase tracking-widest text-primary">{title}</p>
              <p className="font-display text-2xl font-bold mt-1">{name}</p>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-3 space-y-6"
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">{title}</p>
            <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold text-balance leading-[1.05]">
              Meet <span className="italic font-light">{name}.</span>
            </h2>
            {intro && <p className="mt-4 text-lg text-muted-foreground max-w-2xl">{intro}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {hasMore && (
              <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:border-primary hover:text-primary font-medium transition"
              >
                Know more <ArrowUpRight size={18} />
              </button>
            )}
            {ctaText && ctaLink && (
              ctaLink.startsWith("/") ? (
                <Link to={ctaLink} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition">
                  {ctaText} <ArrowUpRight size={18} />
                </Link>
              ) : (
                <a href={ctaLink} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition">
                  {ctaText} <ArrowUpRight size={18} />
                </a>
              )
            )}
          </div>

          {/* Socials stay on homepage */}
          <div className="flex items-center gap-2 pt-1">
            {socials.instagram && (
              <a href={socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="p-2.5 rounded-full border border-border hover:border-primary hover:text-primary transition">
                <Instagram size={16} />
              </a>
            )}
            {socials.youtube && (
              <a href={socials.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                className="p-2.5 rounded-full border border-border hover:border-primary hover:text-primary transition">
                <Youtube size={16} />
              </a>
            )}
          </div>
        </motion.div>
      </div>

      {/* Full biography modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-8 lg:p-10 shadow-2xl"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 h-9 w-9 grid place-items-center rounded-full border border-border hover:border-primary hover:text-primary transition"
                aria-label="Close"
              >
                ✕
              </button>

              <p className="text-xs uppercase tracking-widest text-primary">{title}</p>
              <h3 className="mt-2 font-display text-3xl lg:text-4xl font-bold">{name}</h3>

              {biography && (
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-widest text-primary mb-2">About</p>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{biography}</p>
                </div>
              )}

              {achievements.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-widest text-primary mb-3">Dance journey & achievements</p>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {achievements.map((a, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <Sparkles size={14} className="text-primary shrink-0 mt-0.5" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(vision || mission) && (
                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  {vision && (
                    <div className="rounded-2xl border border-border bg-background p-5">
                      <p className="text-xs uppercase tracking-widest text-primary">Vision</p>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{vision}</p>
                    </div>
                  )}
                  {mission && (
                    <div className="rounded-2xl border border-border bg-background p-5">
                      <p className="text-xs uppercase tracking-widest text-primary">Mission</p>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{mission}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}


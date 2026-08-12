import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Sparkles, Award, Users, Clapperboard, GraduationCap, Globe2 } from "lucide-react";
import cidTejas from "@/assets/cid-tejas-2024.jpg.asset.json";
import cidDancefit from "@/assets/cid-dancefit-2024.jpg.asset.json";
import nsdcTrainer from "@/assets/nsdc-master-trainer.jpg.asset.json";
import aboutImg from "@/assets/founder.jpg";
import { MotionImage } from "@/components/site/MotionImage";
import { useServerFn } from "@tanstack/react-start";
import { cachedCall } from "@/lib/public-data-cache";
import { getSiteContent } from "@/lib/site-content.functions";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Tejas D Dhoke" },
      {
        name: "description",
        content:
          "The story behind Tejas D Dhoke — a fusion dance company training movers and choreographing India's most expressive stages.",
      },
      { property: "og:title", content: "About — Tejas D Dhoke" },
      {
        property: "og:description",
        content: "Meet the company, the craft, and the people behind Tejas D Dhoke.",
      },
      { property: "og:image", content: "/og-founder.jpg" },
    ],
  }),
  component: About,
});

const defaultValues = [
  { title: "Discipline", body: "Every form starts with foundation. We drill until it's muscle memory." },
  { title: "Fusion", body: "Classical, contemporary, urban — borders are where the best work happens." },
  { title: "Stage-first", body: "We train for performance, not just for class. Every batch performs." },
];

const KNOWN_FOR: { title: string; body: string; icon: typeof Sparkles }[] = [
  {
    title: "Celebrity choreographer",
    body: "High-energy signature choreography for artists, films and brand productions.",
    icon: Clapperboard,
  },
  {
    title: "Certified master trainer",
    body: "NSDC / Skill India certified Master Trainer for the Dance Teacher qualification.",
    icon: GraduationCap,
  },
  {
    title: "Dance educator",
    body: "Thousands of students trained through workshops, intensives and online programs.",
    icon: Users,
  },
  {
    title: "Founder — DanceFit",
    body: "Built a studio and community where beginners and pros train side by side.",
    icon: Sparkles,
  },
  {
    title: "International member",
    body: "Registered member of the International Dance Council CID, UNESCO Paris.",
    icon: Globe2,
  },
  {
    title: "Masterclasses worldwide",
    body: "Hundreds of masterclasses across cities and continents, on stage and online.",
    icon: Award,
  },
];

const CERTIFICATES: { src: string; alt: string; title: string; meta: string }[] = [
  {
    src: nsdcTrainer.url,
    alt: "Skill India NSDC Certified Master Trainer certificate for Tejas Dinesh Dhoke",
    title: "Certified Master Trainer",
    meta: "Skill India / NSDC — Dance Teacher (MES/Q1505) v2.0 · NSQF Level 6",
  },
  {
    src: cidTejas.url,
    alt: "International Dance Council CID membership confirmation for Tejas Dinesh Dhoke",
    title: "CID Member — Tejas Dinesh Dhoke",
    meta: "International Dance Council CID, UNESCO Paris · Reg. 39651 (2024)",
  },
  {
    src: cidDancefit.url,
    alt: "International Dance Council CID membership confirmation for DanceFit",
    title: "CID Member — DanceFit",
    meta: "International Dance Council CID, UNESCO Paris · Reg. 39652 (2024)",
  },
];

function About() {
  const loadContent = useServerFn(getSiteContent);
  const [content, setContent] = useState<any>({
    eyebrow: "About",
    headline: "Twelve years of teaching India to move differently.",
    paragraphs: [
      "Tejas D Dhoke began in a borrowed studio in 2013 with six dancers and one stubborn belief — that Indian dance shouldn't have to pick a lane. Today it's a full company of performers, choreographers and students working across film, festivals and live productions.",
      "Our fusion approach pulls from Kathak's footwork, contemporary's release, Bollywood's expression, and hip-hop's groove. The result isn't a style — it's a vocabulary.",
      "We train roughly 300 students a year across five batches, and our performance wing has toured 12 cities.",
    ],
    values_title: "What we stand on",
    values: defaultValues,
  });

  useEffect(() => {
    cachedCall("siteContent:about", () => loadContent({ data: { key: "about" } })).then((v: any) => v && setContent((c: any) => ({ ...c, ...v }))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const valueIcons = [Sparkles, Award, Users];

  return (
    <>
      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-28 pb-16">
        <div
          aria-hidden
          className="absolute -top-10 left-1/2 -translate-x-1/2 h-[420px] w-[820px] max-w-full rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ background: "var(--gradient-aurora, var(--gradient-primary))" }}
        />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative"
        >
          <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-primary">
            <span aria-hidden className="h-px w-8 bg-primary/60" />
            {content.eyebrow}
          </p>
          <h1 className="mt-5 font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.02] text-balance max-w-4xl">
            {content.headline}
          </h1>
        </motion.div>
      </section>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-5 gap-10 lg:gap-16 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          className="lg:col-span-2"
        >
          <div className="relative rounded-3xl overflow-hidden border-gradient">
            <div className="aspect-[4/5]">
              <MotionImage src={aboutImg} alt="Founder of Tejas D Dhoke" width={1200} height={1400} className="h-full w-full" />
            </div>
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(180deg, transparent 60%, color-mix(in oklab, var(--background) 70%, transparent))" }}
            />
          </div>
        </motion.div>
        <div className="lg:col-span-3 space-y-6 text-[17px] lg:text-lg leading-relaxed text-muted-foreground">
          {(content.paragraphs ?? []).map((p: string, i: number) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="whitespace-pre-line"
            >
              {p}
            </motion.p>
          ))}
        </div>
      </section>

      {/* Values */}
      {(content.values ?? []).length > 0 && (
        <section className="relative border-t border-border/60">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Principles</p>
                <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold">
                  {content.values_title}
                </h2>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {content.values.map((v: { title: string; body: string }, i: number) => {
                const Icon = valueIcons[i % valueIcons.length];
                return (
                  <motion.div
                    key={`${v.title}-${i}`}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.08, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                    className="group relative p-8 rounded-2xl glass-card hover-lift"
                  >
                    <div
                      aria-hidden
                      className="absolute -top-px left-6 right-6 h-px opacity-70"
                      style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }}
                    />
                    <div className="flex items-center justify-center h-11 w-11 rounded-xl mb-6"
                      style={{ background: "color-mix(in oklab, var(--primary) 14%, transparent)", color: "var(--primary)" }}>
                      <Icon size={18} />
                    </div>
                    <p className="font-display text-2xl lg:text-3xl font-bold">{v.title}</p>
                    <p className="mt-3 text-muted-foreground leading-relaxed whitespace-pre-line">{v.body}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Known for */}
      <section className="relative border-t border-border/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Recognition</p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold">What he is known for</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
            Tejas Dinesh Dhoke is a celebrity choreographer, dance educator and founder of DanceFit —
            recognised for making high-energy choreography learnable for everyone.
          </p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {KNOWN_FOR.map((k, i) => (
              <motion.div
                key={k.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.06, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                className="p-7 rounded-2xl glass-card hover-lift"
              >
                <div
                  className="flex items-center justify-center h-11 w-11 rounded-xl mb-5"
                  style={{ background: "color-mix(in oklab, var(--primary) 14%, transparent)", color: "var(--primary)" }}
                >
                  <k.icon size={18} />
                </div>
                <p className="font-display text-xl font-bold">{k.title}</p>
                <p className="mt-2 text-muted-foreground leading-relaxed">{k.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="relative border-t border-border/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Credentials</p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold">Certifications &amp; memberships</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {CERTIFICATES.map((c, i) => (
              <motion.figure
                key={c.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.08, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                className="rounded-2xl glass-card hover-lift overflow-hidden"
              >
                <div className="aspect-[4/3] bg-muted/40 flex items-center justify-center p-3">
                  <img
                    src={c.src}
                    alt={c.alt}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                </div>
                <figcaption className="p-6 border-t border-border/60">
                  <p className="font-display text-lg font-bold">{c.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{c.meta}</p>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

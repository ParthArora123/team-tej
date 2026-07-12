import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  Sparkles, Music, HeartHandshake, Flame, PartyPopper, Award, Play,
  Clock, Infinity as InfinityIcon, GraduationCap, Smartphone, Video, User,
  CheckCircle2, XCircle, ArrowRight, Star, Trophy,
} from "lucide-react";
import { Reveal, SplitText } from "@/components/site/Reveal";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import { listZeroToHeroMedia } from "@/lib/zero-to-hero.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/zero-to-hero")({
  component: ZeroToHeroPage,
  head: () => ({
    meta: [
      { title: "Zero to Hero · Tejas D Dhoke — Beginner Dance Confidence Program" },
      {
        name: "description",
        content:
          "India's beginner dance confidence program. Learn dance from absolute zero and become the hero version of yourself — designed by Tejas D Dhoke.",
      },
      { property: "og:title", content: "Zero to Hero · Tejas D Dhoke" },
      {
        property: "og:description",
        content:
          "The dance confidence journey. Move naturally, learn the Alphabeats system, and dance in real life.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const feelings = [
  "I wish I could dance.",
  "I have no rhythm.",
  "Everyone else learns faster than me.",
  "I feel awkward at weddings.",
  "I always stand on the side while everyone else dances.",
  "Dance looks amazing… but I don't know where to begin.",
];

const forYou = [
  "You've never danced before.",
  "You think you have two left feet.",
  "You're nervous dancing in front of people.",
  "You struggle with rhythm.",
  "You avoid dance floors.",
  "You want to dance at weddings.",
  "You want to surprise your friends.",
  "You want to learn for fitness.",
  "You simply want to enjoy movement.",
];

const stages = [
  {
    n: "01",
    chapter: "Beginner",
    title: "Move Naturally",
    icon: Sparkles,
    body: "Understand how your body moves. Break stiffness. Become comfortable moving.",
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=70",
    accent: "from-amber-300 via-primary to-fuchsia-400",
  },
  {
    n: "02",
    chapter: "Practice",
    title: "Build Your Dance Alphabet",
    icon: Music,
    body: "Learn our Alphabeats System. Simple movements anyone can remember — always know what to do on the dance floor.",
    image: "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?auto=format&fit=crop&w=1200&q=70",
    accent: "from-primary via-violet-400 to-fuchsia-500",
  },
  {
    n: "03",
    chapter: "Growth",
    title: "Understand Music",
    icon: HeartHandshake,
    body: "Beat, rhythm, timing, musicality. Dance WITH the music, not against it.",
    image: "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=1200&q=70",
    accent: "from-fuchsia-400 via-primary to-amber-300",
  },
  {
    n: "04",
    chapter: "Performance",
    title: "Dance with Confidence",
    icon: Flame,
    body: "Expression, body language, presence, energy. Stop looking awkward — start looking natural.",
    image: "https://images.unsplash.com/photo-1519925610903-381054cc2a1c?auto=format&fit=crop&w=1200&q=70",
    accent: "from-amber-400 via-rose-400 to-fuchsia-500",
  },
  {
    n: "05",
    chapter: "Hero",
    title: "Dance in Real Life",
    icon: PartyPopper,
    body: "Wedding dancing, party dancing, social dancing, freestyle, simple choreography.",
    image: "https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=1200&q=70",
    accent: "from-primary via-amber-300 to-emerald-300",
  },
];

const inside = [
  "24 Structured Lessons", "Beginner Roadmap", "Alphabeats Movement Library",
  "Dance Fitness Sessions", "Rhythm Training", "Expression Training",
  "Choreography Lessons", "Final Hero Performance", "Certificate of Completion",
];

const features = [
  { icon: Smartphone, label: "Completely Online" },
  { icon: Video, label: "Professionally Recorded" },
  { icon: Clock, label: "Learn Anytime" },
  { icon: InfinityIcon, label: "Lifetime Access" },
  { icon: GraduationCap, label: "Certificate Included" },
  { icon: User, label: "Designed by Tejas D Dhoke" },
];

const faqs = [
  ["I've never danced before.", "Perfect — that's exactly who this course is made for."],
  ["I'm over 30. Can I join?", "Absolutely. There is no age limit."],
  ["I'm not flexible.", "You don't need to be."],
  ["Is this only for men?", "No — the course is designed for everyone."],
  ["How long is the course?", "Learn at your own pace."],
  ["Will I receive a certificate?", "Yes, after successfully completing the course."],
  ["Will this help me dance at weddings?", "Absolutely. One complete section focuses on social dancing."],
  ["What if I'm shy?", "Most students start exactly there. Confidence is something you'll build throughout the course."],
];

function ZeroToHeroPage() {
  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden pt-28 pb-24 px-6 lg:px-10">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/25 blur-[140px]" />
          <div className="absolute top-40 right-0 h-[420px] w-[420px] rounded-full bg-fuchsia-500/20 blur-[140px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,transparent,hsl(var(--background)))]" />
        </div>

        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.25em] text-primary">
            <Sparkles size={12} /> India's Beginner Dance Confidence Program
          </motion.div>

          <h1 className="mt-6 font-display text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight">
            <span className="block bg-gradient-to-r from-primary via-amber-300 to-fuchsia-400 bg-clip-text text-transparent">
              <SplitText text="ZERO TO HERO" />
            </span>
          </h1>

          <div className="mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground">
            <p>Learn Dance from Absolute Zero.</p>
            <p className="mt-1 text-foreground">Become the hero version of yourself.</p>
          </div>

          <div className="mt-9 flex flex-wrap gap-3">
            <a href="https://studio.dancefit.in/l/41aa93491f" target="_blank" rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold shadow-[0_8px_40px_-8px] shadow-primary/60 hover:scale-[1.02] transition">
              Enrol Now <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
            </a>
            <a href="#method"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-border bg-card/60 backdrop-blur hover:border-primary/40 transition">
              <Play size={14} /> Learn More
            </a>
          </div>

          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
            {[
              ["10+", "Years teaching"], ["Millions", "Dancers reached"],
              ["24", "Structured lessons"], ["100%", "Beginner-first"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur p-4">
                <p className="font-display text-2xl font-bold">{n}</p>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEELINGS */}
      <Section eyebrow="Have you ever felt…" title="You're not alone.">
        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          {feelings.map((f, i) => (
            <Reveal key={f} delay={i * 0.04}>
              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card/60 p-4">
                <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-primary/15 grid place-items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                <p className="text-sm sm:text-base">"{f}"</p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-lg text-muted-foreground">
          If even one of these sounds familiar…{" "}
          <span className="text-foreground">you're exactly who this course was built for.</span>
        </p>
      </Section>

      {/* PROBLEM */}
      <Section eyebrow="The biggest problem with dance today" title="Most classes don't teach beginners. They teach choreography.">
        <div className="mt-8 grid md:grid-cols-2 gap-6 text-muted-foreground">
          <div className="space-y-3">
            <p>They assume you already know:</p>
            <ul className="space-y-2">
              {["How to move", "How to stay on beat", "How to learn steps", "How to feel confident"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6">
            <p className="text-foreground">But what if you've never danced before?</p>
            <p className="mt-2">Where do you start?</p>
            <p className="mt-4 text-foreground">That's the gap we've seen for the last 10 years — and exactly why Zero to Hero exists.</p>
          </div>
        </div>
      </Section>

      {/* INTRO CARD */}
      <section className="px-6 lg:px-10 py-16">
        <div className="max-w-5xl mx-auto rounded-3xl border border-border/70 bg-gradient-to-br from-primary/15 via-card to-fuchsia-500/10 p-8 sm:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(circle,black,transparent_70%)]">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,hsl(var(--primary)/.2)_49%,hsl(var(--primary)/.2)_51%,transparent_52%)] bg-[length:24px_24px]" />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Introducing</p>
          <h2 className="mt-3 font-display text-4xl sm:text-6xl font-black">ZERO TO HERO</h2>
          <p className="mt-2 font-display italic text-xl sm:text-2xl text-muted-foreground">The Dance Confidence Journey</p>
          <p className="mt-6 max-w-2xl mx-auto text-muted-foreground">
            A complete beginner-friendly system that teaches dance the way it should have always been taught —
            not by throwing choreography at you, but by building confidence, one step at a time.
          </p>
        </div>
      </section>

      {/* FOR YOU + DO NOT NEED */}
      <Section eyebrow="This course is for you if…" title="Beginner-first. Always.">
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border/70 bg-card/60 p-6">
            <p className="text-xs uppercase tracking-widest text-primary">Made for you</p>
            <ul className="mt-4 space-y-3">
              {forYou.map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/60 p-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">You do NOT need</p>
            <ul className="mt-4 space-y-3">
              {["Talent", "Previous experience", "Flexibility", "Dance background"].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <XCircle size={18} className="text-destructive shrink-0 mt-0.5" />
                  <span className="text-sm">{t}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-foreground">Just the willingness to begin.</p>
          </div>
        </div>
      </Section>

      {/* STAGES / WHAT YOU'LL LEARN — timeline */}
      <Section eyebrow="What you'll learn" title="Five stages. One transformation.">
        <div className="mt-10 relative">
          <div className="absolute left-6 top-2 bottom-2 w-px bg-gradient-to-b from-primary via-primary/40 to-transparent hidden sm:block" />
          <div className="space-y-5">
            {stages.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.06}>
                <div className="relative sm:pl-16 rounded-2xl border border-border/70 bg-card/60 p-6">
                  <div className="hidden sm:grid absolute left-2 top-6 h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {s.n}
                  </div>
                  <div className="flex items-start gap-3">
                    <s.icon size={22} className="text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-widest text-primary sm:hidden">Stage {s.n}</p>
                      <h3 className="font-display text-2xl font-bold">{s.title}</h3>
                      <p className="mt-2 text-muted-foreground">{s.body}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* INSIDE THE COURSE */}
      <Section eyebrow="Inside the course" title="Everything you get.">
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {inside.map((t, i) => (
            <Reveal key={t} delay={i * 0.04}>
              <div className="group h-full rounded-2xl border border-border/70 bg-card/60 p-5 hover:border-primary/50 hover:-translate-y-1 transition">
                <div className="flex items-center gap-3">
                  <span className="h-9 w-9 grid place-items-center rounded-xl bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                    <CheckCircle2 size={18} />
                  </span>
                  <p className="font-medium">{t}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* METHOD */}
      <section id="method" className="px-6 lg:px-10 py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">The Zero to Hero method</p>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl font-black">Not choreography. Confidence.</h2>

          <div className="mt-10 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Old way</p>
              <ol className="mt-3 space-y-2 text-muted-foreground">
                <li>Choreography</li>
                <li className="text-primary/60">↓</li>
                <li>Copy</li>
                <li className="text-primary/60">↓</li>
                <li>Forget</li>
              </ol>
            </div>
            <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 to-fuchsia-500/10 p-6">
              <p className="text-xs uppercase tracking-widest text-primary">Our way</p>
              <ol className="mt-3 space-y-2">
                {["Movement", "Rhythm", "Confidence", "Expression", "Dance"].map((s, i, a) => (
                  <li key={s} className="flex flex-col">
                    <span className="font-display text-xl">{s}</span>
                    {i < a.length - 1 && <span className="text-primary/70">↓</span>}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <p className="mt-6 text-muted-foreground">This is why beginners improve faster.</p>
        </div>
      </section>

      {/* WHY DIFFERENT */}
      <Section eyebrow="Why this course is different" title="Most courses teach dancers. We teach beginners.">
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {[
            ["Confidence", "We don't expect it. We build it."],
            ["Rhythm", "We don't expect it. We teach it."],
            ["Talent", "We don't expect it. We develop it."],
          ].map(([h, b]) => (
            <div key={h} className="rounded-2xl border border-border/70 bg-card/60 p-6">
              <p className="font-display text-2xl">{h}</p>
              <p className="mt-2 text-sm text-muted-foreground">{b}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* COURSE FEATURES */}
      <Section eyebrow="Course features" title="Premium. Online. Yours forever.">
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.label} className="group rounded-2xl border border-border/70 bg-card/60 p-6 hover:border-primary/50 transition">
              <f.icon size={22} className="text-primary" />
              <p className="mt-4 font-medium">{f.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* MENTOR */}
      <section className="px-6 lg:px-10 py-20">
        <div className="max-w-5xl mx-auto rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-primary/10 p-8 sm:p-12 overflow-hidden relative">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="grid md:grid-cols-[240px_1fr] gap-8 items-start relative">
            <div className="mx-auto md:mx-0">
              <div className="h-56 w-56 rounded-3xl bg-gradient-to-br from-primary/40 via-fuchsia-500/30 to-transparent p-1">
                <div className="h-full w-full rounded-[22px] bg-card grid place-items-center">
                  <User size={80} className="text-primary/60" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 justify-center md:justify-start">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-primary text-primary" />)}
                <span className="text-xs text-muted-foreground ml-1">Trusted by millions</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Meet your mentor</p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl font-black">Tejas D Dhoke</h2>
              <p className="mt-1 text-muted-foreground">Founder — DanceFit Studio</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {["Choreographer", "Educator", "Performer", "Movement Coach"].map((t) => (
                  <span key={t} className="text-[11px] uppercase tracking-widest px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary">
                    {t}
                  </span>
                ))}
              </div>

              <p className="mt-6 text-muted-foreground">
                Millions of dancers reached through DanceFit. For over a decade I've taught children, adults,
                professionals, actors, corporate teams, and complete beginners.
              </p>
              <p className="mt-3 text-foreground">
                One thing became clear — people don't fail because they can't dance. They fail because nobody teaches them where to begin.
              </p>
              <p className="mt-3 text-muted-foreground italic">
                "Zero to Hero is the course I wish every beginner had."
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
                {[
                  [Trophy, "10+ yrs teaching"],
                  [Sparkles, "Millions reached"],
                  [Award, "Certified system"],
                ].map(([I, l], idx) => (
                  <div key={idx} className="rounded-xl border border-border/60 bg-background/40 p-3 text-center">
                    <I size={16} className="text-primary mx-auto" />
                    <p className="mt-2 text-[11px] text-muted-foreground leading-tight">{l as string}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MEDIA GALLERY (admin-managed) */}
      <ZeroToHeroGallery />

      {/* FAQ */}
      <Section eyebrow="Frequently asked questions" title="Everything you were wondering.">
        <Accordion type="single" collapsible className="mt-8 rounded-2xl border border-border/70 bg-card/60 px-6">
          {faqs.map(([q, a]) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="text-left font-display text-lg">{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      {/* PROMISE */}
      <section className="px-6 lg:px-10 py-16">
        <div className="max-w-4xl mx-auto rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/20 via-card to-fuchsia-500/10 p-10 sm:p-14 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">The Zero to Hero promise</p>
          <p className="mt-5 font-display text-2xl sm:text-3xl leading-snug">
            "If you complete every lesson, do every practice session, and honestly follow the system —
            you will become a significantly more confident dancer than when you started."
          </p>
        </div>
      </section>

      {/* IMAGINE */}
      <section className="px-6 lg:px-10 py-16 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-fuchsia-500/10" />
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Imagine…</p>
          <div className="mt-6 space-y-3 font-display text-3xl sm:text-4xl">
            <p>The next wedding.</p>
            <p>The next celebration.</p>
            <p>The next party.</p>
          </div>
          <p className="mt-8 text-muted-foreground text-lg">
            Instead of standing on the side… <span className="text-foreground">you're the one enjoying the music.</span>
          </p>
          <p className="mt-2 text-muted-foreground">
            Not because you suddenly became talented — because you finally learned how to dance.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 lg:px-10 pb-24">
        <div className="max-w-5xl mx-auto rounded-3xl border border-border/70 bg-gradient-to-br from-primary/25 via-card to-fuchsia-500/15 p-10 sm:p-14 text-center relative overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-primary/40 blur-3xl" />
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Ready to begin?</p>
          <h2 className="mt-3 font-display text-5xl sm:text-7xl font-black">ZERO TO HERO</h2>
          <p className="mt-2 font-display italic text-xl text-muted-foreground">The Dance Confidence Journey</p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            {["Beginner Friendly", "Learn at Your Own Pace", "Online Recorded Program", "Certificate Included"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-background/40">
                <CheckCircle2 size={12} className="text-primary" /> {t}
              </span>
            ))}
          </div>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/40 text-primary text-xs uppercase tracking-widest">
            🎉 Launch offer · first seats at a special price
          </div>

          <div className="mt-10">
            <a href="https://studio.dancefit.in/l/41aa93491f" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-[0_12px_50px_-8px] shadow-primary/60 hover:scale-[1.03] transition">
              ENROL NOW <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function ZeroToHeroGallery() {
  const load = useServerFn(listZeroToHeroMedia);
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { load().then((r: any) => setItems(r ?? [])).catch(() => {}); }, []);
  if (!items.length) return null;
  return (
    <Section eyebrow="In motion" title="Zero to Hero — moments.">
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {items.map((m, i) => (
          <Reveal key={m.id} delay={Math.min(i * 0.04, 0.4)}>
            <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card aspect-[4/5]">
              {m.media_kind === "video" ? (
                <video src={m.media_url} poster={m.poster_url ?? undefined}
                  autoPlay muted loop playsInline preload="metadata"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <img src={m.media_url} alt={m.caption ?? ""} loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              )}
              {m.caption && (
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-xs sm:text-sm text-white/95">{m.caption}</p>
                </div>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="px-6 lg:px-10 py-20">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl font-black leading-tight">{title}</h2>
        </Reveal>
        {children}
      </div>
    </section>
  );
}

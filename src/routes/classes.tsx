import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { Clock, Users, Zap } from "lucide-react";
import { EnrollDialog, type EnrollClass } from "@/components/site/EnrollDialog";
import fusionVid from "@/assets/style-fusion.mp4.asset.json";
import hiphopVid from "@/assets/style-hiphop.mp4.asset.json";
import kathakVid from "@/assets/style-kathak.mp4.asset.json";
import bollywoodVid from "@/assets/style-bollywood.mp4.asset.json";
import fusionImg from "@/assets/style-fusion.jpg";
import hiphopImg from "@/assets/style-hiphop.jpg";
import kathakImg from "@/assets/style-kathak.jpg";
import bollywoodImg from "@/assets/style-bollywood.jpg";

const media = {
  fusion: { video: fusionVid.url, poster: fusionImg },
  hiphop: { video: hiphopVid.url, poster: hiphopImg },
  kathak: { video: kathakVid.url, poster: kathakImg },
  bollywood: { video: bollywoodVid.url, poster: bollywoodImg },
} as const;

export const Route = createFileRoute("/classes")({
  head: () => ({
    meta: [
      { title: "Classes & Workshops — Team Tej" },
      {
        name: "description",
        content:
          "Fusion, contemporary, Bollywood and hip-hop classes for every level. Enroll via UPI in seconds.",
      },
      { property: "og:title", content: "Classes & Workshops — Team Tej" },
      {
        property: "og:description",
        content: "Find a class that fits your level — Team Tej batches start every month.",
      },
    ],
  }),
  component: Classes,
});

const classes: (EnrollClass & {
  level: "Beginner" | "Intermediate" | "Advanced";
  schedule: string;
  description: string;
  style: keyof typeof media;
})[] = [
  {
    name: "Fusion Foundation",
    level: "Beginner",
    duration: "8 weeks · 2× / week",
    schedule: "Mon & Wed · 7:00 PM",
    description:
      "Build core fusion vocabulary — Kathak footwork, contemporary release and grooves.",
    price: 4500,
    style: "fusion",
  },
  {
    name: "Bollywood Stage",
    level: "Intermediate",
    duration: "6 weeks · 2× / week",
    schedule: "Tue & Thu · 8:00 PM",
    description:
      "High-energy choreographies built for the stage. Expect performance-ready combos every week.",
    price: 3800,
    style: "bollywood",
  },
  {
    name: "Hip-Hop Intensive",
    level: "Intermediate",
    duration: "4 weeks · 3× / week",
    schedule: "Mon, Wed, Fri · 9:00 PM",
    description:
      "Bounce, isolation, freestyle — taught by working choreographers from the industry.",
    price: 4200,
    style: "hiphop",
  },
  {
    name: "Contemporary Lab",
    level: "Advanced",
    duration: "10 weeks · 2× / week",
    schedule: "Wed & Sat · 6:30 PM",
    description:
      "An exploration-led batch for dancers ready to develop original movement.",
    price: 6000,
    style: "fusion",
  },
  {
    name: "Kathak × Modern",
    level: "Intermediate",
    duration: "8 weeks · 2× / week",
    schedule: "Tue & Sat · 5:30 PM",
    description:
      "Classical structure meets contemporary phrasing. Build expressive, hybrid pieces.",
    price: 5200,
    style: "kathak",
  },
  {
    name: "Weekend Workshop",
    level: "Beginner",
    duration: "2 days · drop-in",
    schedule: "Last weekend of every month",
    description:
      "A guest-led intensive built for first-time dancers and returning movers.",
    price: 1500,
    style: "fusion",
  },
];

const levelColor: Record<string, string> = {
  Beginner: "bg-primary/15 text-primary",
  Intermediate: "bg-foreground/10 text-foreground",
  Advanced: "bg-destructive/15 text-destructive",
};

function Classes() {
  const [selected, setSelected] = useState<EnrollClass | null>(null);

  return (
    <>
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs uppercase tracking-widest text-primary">Classes & Workshops</p>
          <h1 className="mt-3 font-display text-5xl lg:text-7xl font-bold leading-[1.05] text-balance max-w-4xl">
            Find your batch.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            New cycles begin the first week of every month. Pay in seconds via
            UPI — we'll confirm your spot within 12 hours.
          </p>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((c, i) => (
            <motion.article
              key={c.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="group relative flex flex-col p-7 rounded-2xl border border-border bg-card hover:border-primary transition-colors"
            >
              <div className="relative -mx-7 -mt-7 mb-5 h-44 overflow-hidden rounded-t-2xl">
                <video
                  src={media[c.style].video}
                  poster={media[c.style].poster}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 mix-blend-overlay"
                  style={{
                    background:
                      "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
                    backgroundSize: "250% 250%",
                  }}
                  animate={{ backgroundPosition: ["120% 0%", "-20% 100%"] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full ${levelColor[c.level]}`}
                >
                  {c.level}
                </span>
                <span className="font-display text-2xl font-bold text-primary">
                  ₹{c.price.toLocaleString("en-IN")}
                </span>
              </div>

              <h3 className="mt-5 font-display text-2xl font-bold">{c.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {c.description}
              </p>

              <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-primary" /> {c.duration}
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-primary" /> {c.schedule}
                </div>
              </div>

              <button
                onClick={() =>
                  setSelected({
                    name: c.name,
                    price: c.price,
                    duration: c.duration,
                  })
                }
                className="mt-7 inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition group-hover:gap-3"
              >
                <Zap size={16} /> Enroll now
              </button>
            </motion.article>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-2xl border border-border bg-card">
          <p className="text-xs uppercase tracking-widest text-primary">How payment works</p>
          <ol className="mt-4 grid md:grid-cols-3 gap-6 text-sm">
            <li>
              <span className="font-display text-3xl font-bold text-primary">01</span>
              <p className="mt-2">Pick a class and tap "Enroll now".</p>
            </li>
            <li>
              <span className="font-display text-3xl font-bold text-primary">02</span>
              <p className="mt-2">Scan the UPI QR with any payment app — GPay, PhonePe, Paytm.</p>
            </li>
            <li>
              <span className="font-display text-3xl font-bold text-primary">03</span>
              <p className="mt-2">Confirm payment. We'll lock your seat within 12 hours.</p>
            </li>
          </ol>
        </div>
      </section>

      <EnrollDialog klass={selected} onClose={() => setSelected(null)} />
    </>
  );
}

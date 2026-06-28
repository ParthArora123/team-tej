import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { Calendar, MapPin, Users, Sparkles } from "lucide-react";
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

export const Route = createFileRoute("/workshops")({
  head: () => ({
    meta: [
      { title: "Workshops — Team Tej" },
      {
        name: "description",
        content:
          "Limited-seat fusion dance workshops led by Team Tej and visiting choreographers. Register via UPI.",
      },
      { property: "og:title", content: "Workshops — Team Tej" },
      {
        property: "og:description",
        content: "Intensive workshops with guest choreographers — register now.",
      },
    ],
  }),
  component: Workshops,
});

const workshops: (EnrollClass & {
  date: string;
  location: string;
  spots: number;
  guest: string;
  tagline: string;
  style: keyof typeof media;
})[] = [
  {
    name: "Crosswinds · Contemporary Intensive",
    tagline: "Two days of release, breath and floor work.",
    date: "16–17 Aug 2026",
    location: "Team Tej Studio, Mumbai",
    spots: 24,
    guest: "Guest: Maya D'Souza (Berlin)",
    duration: "2 days · 6 hrs / day",
    price: 3500,
    style: "fusion",
  },
  {
    name: "Reels & Rhythm · Bollywood Camera Class",
    tagline: "Build a 60-second piece designed for the lens.",
    date: "06 Sep 2026",
    location: "Team Tej Studio, Mumbai",
    spots: 18,
    guest: "Led by Aman Verma",
    duration: "1 day · 5 hrs",
    price: 1800,
    style: "bollywood",
  },
  {
    name: "Footwork Lab · Kathak × Hip-Hop",
    tagline: "Where tatkar meets bounce.",
    date: "27–28 Sep 2026",
    location: "Studio Annexe, Bandra",
    spots: 20,
    guest: "Niharika Das & Aman Verma",
    duration: "2 days · 4 hrs / day",
    price: 2800,
    style: "kathak",
  },
  {
    name: "Stage Lab · Performance Weekend",
    tagline: "From rehearsal to stage in 48 hours.",
    date: "18–20 Oct 2026",
    location: "Team Tej Studio + Black Box",
    spots: 30,
    guest: "Direction: Tej Sharma",
    duration: "3 days · 6 hrs / day",
    price: 4800,
    style: "bollywood",
  },
];

function Workshops() {
  const [selected, setSelected] = useState<EnrollClass | null>(null);

  return (
    <>
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs uppercase tracking-widest text-primary">Workshops</p>
          <h1 className="mt-3 font-display text-5xl lg:text-7xl font-bold leading-[1.05] text-balance max-w-4xl">
            Short bursts.<br />Big leaps.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            One-off intensives with visiting choreographers and senior Team Tej
            faculty. Seats are limited. Pay via UPI to lock yours.
          </p>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-24 space-y-6">
        {workshops.map((w, i) => (
          <motion.article
            key={w.name}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className="group relative grid lg:grid-cols-12 gap-6 lg:gap-10 p-7 lg:p-10 rounded-2xl border border-border bg-card hover:border-primary transition-colors"
          >
            <div className="lg:col-span-2">
              <p className="font-display text-3xl lg:text-4xl font-bold text-primary leading-none">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                {w.spots} seats
              </p>
            </div>

            <div className="lg:col-span-6">
              <h3 className="font-display text-2xl lg:text-3xl font-bold">
                {w.name}
              </h3>
              <p className="mt-2 text-muted-foreground">{w.tagline}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary">
                <Sparkles size={12} /> {w.guest}
              </p>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar size={14} className="text-primary" /> {w.date}
              </span>
              <span className="flex items-center gap-2">
                <MapPin size={14} className="text-primary" /> {w.location}
              </span>
              <span className="flex items-center gap-2">
                <Users size={14} className="text-primary" /> {w.duration}
              </span>
            </div>

            <div className="lg:col-span-2 flex flex-col items-start lg:items-end justify-between gap-4">
              <span className="font-display text-3xl font-bold text-primary">
                ₹{w.price.toLocaleString("en-IN")}
              </span>
              <button
                onClick={() =>
                  setSelected({
                    name: w.name,
                    price: w.price,
                    duration: w.duration,
                  })
                }
                className="w-full lg:w-auto px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
              >
                Register
              </button>
            </div>
          </motion.article>
        ))}
      </section>

      <EnrollDialog klass={selected} onClose={() => setSelected(null)} />
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Calendar, MapPin, ArrowUpRight } from "lucide-react";
import eventsImg from "@/assets/events.jpg";
import heroImg from "@/assets/hero.jpg";
import classesImg from "@/assets/classes.jpg";
import aboutImg from "@/assets/about.jpg";
import { MotionImage } from "@/components/site/MotionImage";


export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events & Gallery — Team Tej" },
      {
        name: "description",
        content:
          "Upcoming Team Tej performances and a gallery of past shows from across India.",
      },
      { property: "og:title", content: "Events & Gallery — Team Tej" },
      {
        property: "og:description",
        content: "Catch Team Tej live — and revisit the stages we've already lit up.",
      },
      { property: "og:image", content: eventsImg },
    ],
  }),
  component: Events,
});

const upcoming = [
  {
    title: "FUSE · Annual Showcase",
    date: "12 Dec 2026",
    location: "NCPA, Mumbai",
    blurb: "Our flagship show — 80 dancers, one night, six original works.",
  },
  {
    title: "Studio Night · Open Floor",
    date: "08 Aug 2026",
    location: "Team Tej Studio, Bandra",
    blurb: "An intimate evening of work-in-progress pieces by our advanced batch.",
  },
  {
    title: "Crosswinds Tour · Bengaluru",
    date: "20 Sep 2026",
    location: "Ranga Shankara, Bengaluru",
    blurb: "Touring our 2025 production across South India.",
  },
];

const gallery = [heroImg, classesImg, aboutImg, eventsImg, heroImg, classesImg];

function Events() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <MotionImage
            src={eventsImg}
            alt="Stage performance"
            width={1400}
            height={1000}
            parallax={18}
            imgClassName="opacity-40"
            className="h-full w-full"
            overlay={<div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/50" />}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-xs uppercase tracking-widest text-primary">Events & Gallery</p>
            <h1 className="mt-3 font-display text-5xl lg:text-7xl font-bold leading-[1.05] text-balance max-w-4xl">
              Live work.<br />Loud stages.
            </h1>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <p className="text-xs uppercase tracking-widest text-primary">Upcoming</p>
        <h2 className="mt-2 font-display text-4xl font-bold">Catch us live</h2>

        <div className="mt-10 divide-y divide-border border-y border-border">
          {upcoming.map((e, i) => (
            <motion.div
              key={e.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group py-8 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10 hover:bg-card/40 transition-colors px-2"
            >
              <div className="lg:w-1/3">
                <p className="font-display text-2xl lg:text-3xl font-bold group-hover:text-primary transition-colors">
                  {e.title}
                </p>
              </div>
              <div className="lg:w-1/3 flex flex-col gap-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><Calendar size={14} className="text-primary" />{e.date}</span>
                <span className="flex items-center gap-2"><MapPin size={14} className="text-primary" />{e.location}</span>
              </div>
              <p className="lg:w-1/3 text-sm text-muted-foreground">{e.blurb}</p>
              <ArrowUpRight className="hidden lg:block text-muted-foreground group-hover:text-primary group-hover:rotate-45 transition-all" />
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <p className="text-xs uppercase tracking-widest text-primary">Gallery</p>
        <h2 className="mt-2 font-display text-4xl font-bold">From the stage</h2>

        <div className="mt-10 grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {gallery.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.6 }}
              whileHover={{ y: -6 }}
              className={`overflow-hidden rounded-2xl border border-border ${i % 5 === 0 ? "aspect-[4/5]" : "aspect-square"}`}
            >
              <MotionImage
                src={src}
                alt={`Team Tej gallery ${i + 1}`}
                parallax={8}
                className="h-full w-full"
              />
            </motion.div>
          ))}

        </div>
      </section>
    </>
  );
}

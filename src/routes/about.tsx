import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import aboutImg from "@/assets/about.jpg";
import { MotionImage } from "@/components/site/MotionImage";
import { useServerFn } from "@tanstack/react-start";
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
      { property: "og:image", content: "/og-about.jpg" },
    ],
  }),
  component: About,
});

const defaultValues = [
  { title: "Discipline", body: "Every form starts with foundation. We drill until it's muscle memory." },
  { title: "Fusion", body: "Classical, contemporary, urban — borders are where the best work happens." },
  { title: "Stage-first", body: "We train for performance, not just for class. Every batch performs." },
];

type TeamMember = {
  id: string;
  name: string;
  designation?: string | null;
  short_description?: string | null;
  biography?: string | null;
  photo_url?: string | null;
  experience?: string | null;
  dance_styles?: string[] | null;
  achievements?: string[] | null;
};

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
  const [founder, setFounder] = useState<any | null>(null);
  const [contact, setContact] = useState<any>({ phone: "+91 98765 43210", whatsapp: "+91 98765 43210" });
  const [waMessage, setWaMessage] = useState("");


  useEffect(() => {
    loadContent({ data: { key: "about" } }).then((v: any) => v && setContent((c: any) => ({ ...c, ...v }))).catch(() => {});
    loadContent({ data: { key: "founder" } }).then((v: any) => v && setFounder(v)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);




  return (
    <>
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <p className="text-xs uppercase tracking-widest text-primary">{content.eyebrow}</p>
          <h1 className="mt-3 font-display text-5xl lg:text-7xl font-bold leading-[1.05] text-balance max-w-4xl">
            {content.headline}
          </h1>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-5 gap-12 pb-24">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="lg:col-span-2 aspect-[4/5] rounded-2xl border border-border overflow-hidden">
          <MotionImage src={aboutImg} alt="Founder of Tejas D Dhoke" width={1200} height={1400} className="h-full w-full" />
        </motion.div>
        <div className="lg:col-span-3 space-y-6 text-lg leading-relaxed text-muted-foreground">
          {(content.paragraphs ?? []).map((p: string, i: number) => (
            <p key={i} className="whitespace-pre-line">{p}</p>
          ))}
        </div>
      </section>

      {/* VALUES */}
      {(content.values ?? []).length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16 border-t border-border">
          <p className="text-xs uppercase tracking-widest text-primary">{content.values_title}</p>
          <div className="mt-10 grid md:grid-cols-3 gap-8">
            {content.values.map((v: { title: string; body: string }, i: number) => (
              <motion.div key={`${v.title}-${i}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl border border-border bg-card hover:border-primary transition-colors">
                <p className="font-display text-3xl font-bold">{v.title}</p>
                <p className="mt-3 text-muted-foreground whitespace-pre-line">{v.body}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* FOUNDER */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-border">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-primary">Founder</p>
          <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold">The vision behind the company.</h2>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-5 gap-10 items-center">
          <div className="md:col-span-2 aspect-[4/5] rounded-2xl overflow-hidden border border-border bg-muted">
            {founder?.image_url ? (
              <img
                src={founder.image_url}
                alt={founder?.name || "Tejas D Dhoke — Founder"}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <MotionImage src={aboutImg} alt="Tejas D Dhoke — Founder" width={1200} height={1400} className="h-full w-full" />
            )}
          </div>
          <div className="md:col-span-3">
            <p className="font-display text-3xl lg:text-4xl font-bold">{founder?.name || "Tejas D Dhoke"}</p>
            <p className="text-sm text-muted-foreground mt-1">{founder?.title || "Founder & Creative Director"}</p>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
              {founder?.intro || founder?.biography ||
                "Tejas leads the company's choreography, curriculum and creative direction — building a fusion vocabulary that borrows from Kathak, contemporary, Bollywood and hip-hop. His work spans film, festivals and live productions across India."}
            </p>
          </div>
        </motion.div>
      </section>

    </>
  );
}

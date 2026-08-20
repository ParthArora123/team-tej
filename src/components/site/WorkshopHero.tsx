import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { listWorkshopHeroSlides } from "@/lib/workshop-hero.functions";
import { MagneticButton } from "@/components/site/MagneticButton";
import { ViewportVideo } from "@/components/site/ViewportVideo";

type Slide = {
  id: string;
  media_kind: "image" | "video" | "gif";
  media_url: string | null;
  poster_url: string | null;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  cta_text: string | null;
  cta_link: string | null;
};

export function WorkshopHero() {
  const fetchSlides = useServerFn(listWorkshopHeroSlides);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [i, setI] = useState(0);

  useEffect(() => {
    fetchSlides().then((rows: any[]) => setSlides(rows.filter((r) => r.media_url) as Slide[])).catch(() => {});
  }, []);

  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (slides.length < 2 || reduced) return;
    const id = setInterval(() => setI((v) => (v + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [slides.length, reduced]);

  if (slides.length === 0) return null;
  const s = slides[i];

  const go = (d: 1 | -1) => setI((v) => (v + d + slides.length) % slides.length);
  const ctaIsInternal = s.cta_link && s.cta_link.startsWith("/");

  return (
    <section className="relative w-full h-[70vh] min-h-[420px] max-h-[720px] overflow-hidden rounded-b-3xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={s.id}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          {s.media_kind === "video"
            ? <ViewportVideo
                key={s.media_url ?? ""}
                src={s.media_url ?? ""}
                poster={s.poster_url ?? undefined}
                autoPlay muted loop playsInline
                preload="metadata"
                className="w-full h-full object-contain"
              />
            : <>
                <img
                  src={s.media_url ?? undefined}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-60"
                />
                <motion.img
                  src={s.media_url ?? undefined}
                  alt={s.title ?? ""}
                  initial={{ scale: 1.02 }} animate={{ scale: 1 }} transition={{ duration: 8, ease: "linear" }}
                  className="absolute inset-0 h-full w-full object-contain"
                  loading="eager"
                />
              </>}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 h-full flex items-end pb-12 px-6 lg:px-10 max-w-6xl mx-auto">
        <div className="max-w-2xl">
          {s.subtitle && <p className="text-xs uppercase tracking-widest text-primary mb-2">{s.subtitle}</p>}
          {s.title && (
            <motion.h2 key={`t-${s.id}`} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground drop-shadow-md">
              {s.title}
            </motion.h2>
          )}
          {s.description && (
            <motion.p key={`d-${s.id}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
              className="mt-3 text-sm sm:text-base text-foreground/80 max-w-xl">{s.description}</motion.p>
          )}
          {s.cta_text && s.cta_link && (
            <div className="mt-5">
              <MagneticButton>
                <a href={s.cta_link} target={ctaIsInternal ? undefined : "_blank"} rel={ctaIsInternal ? undefined : "noopener noreferrer"}
                  className="inline-block px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {s.cta_text}
                </a>
              </MagneticButton>
            </div>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button aria-label="Previous slide" onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background/60 border border-border backdrop-blur hover:bg-background">
            <ChevronLeft size={18} />
          </button>
          <button aria-label="Next slide" onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background/60 border border-border backdrop-blur hover:bg-background">
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {slides.map((_, idx) => (
              <button key={idx} onClick={() => setI(idx)} aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-primary" : "w-3 bg-foreground/30"}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

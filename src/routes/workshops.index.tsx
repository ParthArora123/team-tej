import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Calendar, MapPin, User, Users, Clock, Sparkles, Ticket } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { cachedCall, invalidateCachedCall } from "@/lib/public-data-cache";
import { CardSkeleton } from "@/components/site/Skeletons";
import { listPrograms } from "@/lib/catalog.functions";
import { EnrollDialog, type EnrollClass } from "@/components/site/EnrollDialog";

import { WorkshopHero } from "@/components/site/WorkshopHero";
import { WorkshopGallery } from "@/components/site/WorkshopGallery";
import { TiltCard } from "@/components/site/TiltCard";
import { Reveal } from "@/components/site/Reveal";
import { WorkshopLivingBackdrop } from "@/components/site/WorkshopLivingBackdrop";

export const Route = createFileRoute("/workshops/")({ component: WorkshopsPage });

function WorkshopBanner({ r }: { r: any }) {
  if (r.banner_video_url) {
    return (
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-black">
        {r.banner_url && (
          <img src={r.banner_url} alt="" aria-hidden className="blur-backdrop-wide opacity-70" />
        )}
        <video
          src={r.banner_video_url}
          poster={r.banner_url ?? undefined}
          autoPlay muted loop playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-contain"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>
    );
  }
  if (r.banner_gif_url) {
    return (
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-black">
        <img src={r.banner_gif_url} alt={r.name} loading="lazy" decoding="async"
          className="w-full h-full object-cover lg:object-contain object-top transition-transform duration-[1200ms] group-hover:scale-[1.03]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>
    );
  }
  if (r.banner_url) {
    return (
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-black">
        <img src={r.banner_url} alt={r.name} loading="lazy" decoding="async"
          className="w-full h-full object-cover lg:object-contain object-top transition-transform duration-[1200ms] group-hover:scale-[1.03]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full aspect-[4/5] bg-gradient-to-br from-primary/30 via-background to-accent/20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_30%_30%,color-mix(in_oklab,var(--primary)_60%,transparent),transparent_60%)]" />
      <Sparkles className="absolute right-6 top-6 text-primary/60" />
    </div>
  );
}

/** Animated ambient background: floating light orbs + soft grid + parallax gradient. */

function WorkshopsPage() {
  const fetchPrograms = useServerFn(listPrograms);
  const [rows, setRows] = useState<any[]>([]);
  const [sel, setSel] = useState<EnrollClass | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = () => {
    cachedCall("programs:workshop", () => fetchPrograms({ data: { kind: "workshop" } }))
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoaded(true));
  };
  useEffect(() => {
    load();
    // Refocus should show live seat counts, so bypass the cache here.
    const onFocus = () => {
      invalidateCachedCall("programs:workshop");
      load();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return (
    <div className="relative min-h-screen pb-24">
      <WorkshopLivingBackdrop />

      {/* Cinematic hero */}
      <section className="relative">
        <WorkshopHero />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
      </section>

      <div className="pt-14 px-6 lg:px-10 max-w-6xl mx-auto">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-md">
            <Sparkles size={12} className="text-primary" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary">Workshops · Live Sessions</span>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className="font-display text-5xl md:text-6xl font-bold mt-4 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
            Register for a workshop
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">
            Browse upcoming intensives and register for a workshop.
          </p>
        </Reveal>


        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {!loaded && rows.length === 0 &&
            Array.from({ length: 6 }, (_, i) => <CardSkeleton key={`sk-${i}`} />)}
          {rows.map((r, i) => {
            const seatsLeft = r.capacity != null ? Math.max(0, r.capacity - (r.seats_taken ?? 0)) : null;
            const full = seatsLeft === 0;
            const silverPrice = r.silver_seat_price ?? 1000;
            const scarcity = seatsLeft != null && seatsLeft <= 5 && !full;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                <TiltCard className="group relative rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl overflow-hidden shadow-[0_30px_80px_-40px_color-mix(in_oklab,var(--accent-gold)_35%,transparent)] hover:shadow-[0_40px_120px_-30px_color-mix(in_oklab,var(--accent-gold)_30%,transparent)] transition-shadow duration-500 h-full flex flex-col">
                  <Link to="/workshops/$id" params={{ id: r.id }} className="relative block">
                    <WorkshopBanner r={r} />
                    {scarcity && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                        className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/90 backdrop-blur text-white text-[10px] uppercase tracking-wider font-semibold shadow-lg"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        Only {seatsLeft} left
                      </motion.div>
                    )}
                    {full && (
                      <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-foreground/70 backdrop-blur text-white text-[10px] uppercase tracking-wider">Sold out</div>
                    )}
                    {r.category && (
                      <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white text-[10px] uppercase tracking-widest">
                        {r.category}
                      </div>
                    )}
                  </Link>

                  <div className="p-6 flex-1 flex flex-col">
                    <Link to="/workshops/$id" params={{ id: r.id }} className="font-display text-2xl font-bold hover:text-primary transition-colors">
                      {r.name}
                    </Link>
                    {r.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{r.description}</p>}

                    <div className="mt-4 grid grid-cols-1 gap-1.5 text-xs text-muted-foreground">
                      {r.event_date && <p className="flex items-center gap-2"><Calendar size={12} className="text-primary"/>{new Date(r.event_date).toDateString()} {r.event_time && `· ${r.event_time}`}</p>}
                      {r.venue && <p className="flex items-center gap-2"><MapPin size={12} className="text-primary"/>{r.venue}</p>}
                      {r.instructor && <p className="flex items-center gap-2"><User size={12} className="text-primary"/>{r.instructor}</p>}
                      {r.duration && <p className="flex items-center gap-2"><Clock size={12} className="text-primary"/>{r.duration}</p>}
                      {seatsLeft != null && <p className="flex items-center gap-2"><Users size={12} className="text-primary"/>{seatsLeft} of {r.capacity} seats left</p>}
                    </div>

                    <WorkshopGallery programId={r.id} />

                    {r.silver_seat_enabled && (
                      <div className="mt-4 rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-3 backdrop-blur">
                        <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                          <Ticket size={12} /> Silver Seat (+₹{silverPrice.toLocaleString("en-IN")})
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                          A professionally shot & edited solo dance video, ready for your socials or portfolio.
                        </p>
                      </div>
                    )}

                    <div className="mt-auto pt-5 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">From</p>
                        <p className="font-display text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          ₹{r.price_inr.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <Link to="/workshops/$id" params={{ id: r.id }}
                        className="px-5 py-2.5 rounded-xl border border-border/70 text-sm hover:bg-muted/60 backdrop-blur transition-colors">
                        Details
                      </Link>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
          {rows.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-border/60 bg-card/30 backdrop-blur p-16 text-center">
              <Sparkles className="mx-auto text-primary/60 mb-3" />
              <p className="text-muted-foreground">No workshops published yet — check back soon.</p>
            </div>
          )}
        </div>

        <EnrollDialog klass={sel} onClose={() => setSel(null)} />
      </div>
    </div>
  );
}

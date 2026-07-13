import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import {
  Calendar, MapPin, User, Users, Clock, ChevronDown, Sparkles, Flame, Star,
  Phone, MessageCircle, Share2, Heart, Navigation, ArrowLeft, CheckCircle2, Package,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getProgram } from "@/lib/catalog.functions";
import { listWorkshopMedia } from "@/lib/workshop-media.functions";
import { EnrollDialog, type EnrollClass } from "@/components/site/EnrollDialog";
import { MouseParallax } from "@/components/site/MouseParallax";
import { MagneticButton } from "@/components/site/MagneticButton";
import { TiltCard } from "@/components/site/TiltCard";
import { AnimatedCounter } from "@/components/site/AnimatedCounter";

export const Route = createFileRoute("/workshops/$id")({
  component: WorkshopDetailPage,
  loader: async ({ params, context }: any) => {
    try {
      const p = await getProgram({ data: { id: params.id } });
      return { program: p };
    } catch {
      return { program: null };
    }
  },
});

type Media = {
  id: string;
  media_kind: "image" | "video" | "gif";
  media_url: string | null;
  poster_url: string | null;
  caption: string | null;
};

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const diff = Math.max(0, target.getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, done: diff === 0 };
}

function WorkshopDetailPage() {
  const { program: initialProgram } = (Route.useLoaderData?.() as any) ?? {};
  const params = Route.useParams();
  const router = useRouter();
  const fetchProgram = useServerFn(getProgram);
  const fetchMedia = useServerFn(listWorkshopMedia);

  const [program, setProgram] = useState<any>(initialProgram ?? null);
  const [media, setMedia] = useState<Media[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [sel, setSel] = useState<EnrollClass | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!initialProgram) fetchProgram({ data: { id: params.id } }).then(setProgram).catch(() => {});
    fetchMedia({ data: { programId: params.id } }).then((r: any[]) => setMedia(r as Media[])).catch(() => {});
    try { setSaved(localStorage.getItem(`fav:${params.id}`) === "1"); } catch {}
  }, [params.id]);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const scaleBg = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const fadeHero = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const galleryItems: Media[] = useMemo(() => {
    const arr: Media[] = [];
    if (program?.banner_video_url) arr.push({ id: "b-v", media_kind: "video", media_url: program.banner_video_url, poster_url: program.banner_url ?? null, caption: null });
    if (program?.banner_gif_url) arr.push({ id: "b-g", media_kind: "gif", media_url: program.banner_gif_url, poster_url: null, caption: null });
    if (program?.banner_url && !program?.banner_video_url) arr.push({ id: "b-i", media_kind: "image", media_url: program.banner_url, poster_url: null, caption: null });
    return [...arr, ...media];
  }, [program, media]);

  const heroMedia = galleryItems[heroIdx] ?? null;

  const eventDateObj = useMemo(() => {
    if (!program?.event_date) return null;
    const d = new Date(`${program.event_date}T${program.event_time ?? "10:00"}:00`);
    return isNaN(d.getTime()) ? null : d;
  }, [program]);
  const countdown = useCountdown(eventDateObj);

  const seatsLeft = program?.capacity != null ? Math.max(0, program.capacity - (program.seats_taken ?? 0)) : null;
  const full = seatsLeft === 0;
  const silverPrice = program?.silver_seat_price ?? 1000;

  const badges = useMemo(() => {
    const out: { label: string; icon: any; tone: string }[] = [];
    if (seatsLeft != null && program?.capacity && seatsLeft <= Math.max(3, Math.floor(program.capacity * 0.2))) {
      out.push({ label: "Filling Fast", icon: Flame, tone: "bg-orange-500/15 text-orange-500 border-orange-500/30" });
    }
    if (program?.created_at && Date.now() - new Date(program.created_at).getTime() < 1000 * 60 * 60 * 24 * 14) {
      out.push({ label: "New Batch", icon: Sparkles, tone: "bg-primary/15 text-primary border-primary/30" });
    }
    if (program?.capacity && (program.seats_taken ?? 0) / program.capacity > 0.6) {
      out.push({ label: "Trending", icon: Star, tone: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" });
    }
    return out;
  }, [program, seatsLeft]);

  const whatsappNumber = "919999999999"; // TODO: replace with real number if configured
  const waMessage = program?.name
    ? `Hi, I'm interested in the ${program.name} workshop. Please share the available batches and booking details.`
    : "";
  const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waMessage)}`;
  const callLink = `tel:+${whatsappNumber}`;
  const mapsEmbed = program?.venue
    ? `https://www.google.com/maps?q=${encodeURIComponent(program.venue)}&output=embed`
    : null;
  const mapsNav = program?.venue
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(program.venue)}`
    : null;

  const toggleSave = () => {
    setSaved((v) => {
      const nv = !v;
      try { localStorage.setItem(`fav:${params.id}`, nv ? "1" : "0"); } catch {}
      return nv;
    });
  };
  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: program?.name, text: program?.description ?? "", url });
      else { await navigator.clipboard.writeText(url); alert("Link copied"); }
    } catch {}
  };
  const bookNow = () => {
    if (!program || full) return;
    setSel({ id: program.id, name: program.name, price: program.price_inr, duration: program.duration ?? "", silverSeatEnabled: !!program.silver_seat_enabled, silverSeatPrice: silverPrice });
  };
  const scrollToNext = () => {
    document.getElementById("overview")?.scrollIntoView({ behavior: "smooth" });
  };

  if (!program) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="text-center">
          <p className="text-muted-foreground">Workshop not found or no longer available.</p>
          <Link to="/workshops" className="mt-4 inline-block text-primary underline">Back to workshops</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 md:pb-16">
      {/* ==================== 1. HERO ==================== */}
      <section ref={heroRef} className="relative w-full h-[100svh] min-h-[560px] overflow-hidden">
        <motion.div style={{ y: yBg, scale: scaleBg }} className="absolute inset-0 will-change-transform">
          {heroMedia?.media_kind === "video" ? (
            <video
              key={heroMedia.media_url ?? ""}
              src={heroMedia.media_url ?? undefined}
              poster={heroMedia.poster_url ?? undefined}
              autoPlay muted loop playsInline preload="metadata"
              className="w-full h-full object-cover"
            />
          ) : heroMedia?.media_url ? (
            <img src={heroMedia.media_url} alt={program.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-background" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />
        </motion.div>

        <motion.div style={{ opacity: fadeHero }} className="relative z-10 h-full flex flex-col justify-end px-6 lg:px-12 max-w-6xl mx-auto pb-24">
          <Link to="/workshops" className="inline-flex items-center gap-1.5 text-xs text-foreground/80 hover:text-primary mb-6 w-fit">
            <ArrowLeft size={14} /> All workshops
          </Link>
          <MouseParallax strength={8}>
            <div className="flex flex-wrap gap-2 mb-4">
              {badges.map((b) => (
                <span key={b.label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] border ${b.tone}`}>
                  <b.icon size={12} /> {b.label}
                </span>
              ))}
              {program.category && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] border border-border bg-background/40 backdrop-blur">
                  {program.category}
                </span>
              )}
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground drop-shadow-lg"
            >
              {program.name}
            </motion.h1>
            {program.description && (
              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}
                className="mt-4 text-base sm:text-lg text-foreground/85 max-w-2xl line-clamp-3"
              >
                {program.description}
              </motion.p>
            )}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <MagneticButton>
                <button onClick={bookNow} disabled={full}
                  className="px-7 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg disabled:opacity-50">
                  {full ? "Sold Out" : `Book Now · ₹${program.price_inr.toLocaleString("en-IN")}`}
                </button>
              </MagneticButton>
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border bg-background/40 backdrop-blur text-sm hover:bg-background">
                <MessageCircle size={16} /> WhatsApp
              </a>
            </motion.div>
          </MouseParallax>
        </motion.div>

        <motion.button
          onClick={scrollToNext} aria-label="Scroll to overview"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-foreground/70 hover:text-primary"
        >
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
          <motion.span animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
            <ChevronDown size={20} />
          </motion.span>
        </motion.button>
      </section>

      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* ==================== 2. OVERVIEW ==================== */}
        <section id="overview" className="pt-16 lg:pt-24 grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {galleryItems.length > 0 && (
              <div>
                <div className="relative rounded-2xl overflow-hidden bg-muted aspect-video">
                  {heroMedia?.media_kind === "video" ? (
                    <video src={heroMedia.media_url ?? undefined} poster={heroMedia.poster_url ?? undefined} controls playsInline className="w-full h-full object-contain bg-black" />
                  ) : heroMedia?.media_url ? (
                    <img src={heroMedia.media_url} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                {galleryItems.length > 1 && (
                  <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto pb-1 snap-x">
                    {galleryItems.map((m, i) => (
                      <button key={m.id} onClick={() => setHeroIdx(i)}
                        className={`relative shrink-0 h-16 w-24 rounded-md overflow-hidden bg-muted snap-start border-2 transition ${i === heroIdx ? "border-primary" : "border-transparent"}`}>
                        {m.media_kind === "video" ? (
                          <video src={m.media_url ?? undefined} poster={m.poster_url ?? undefined} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                        ) : (
                          <img src={m.media_url ?? ""} alt="" loading="lazy" className="w-full h-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="text-xs uppercase tracking-widest text-primary">About the workshop</p>
              <h2 className="font-display text-3xl lg:text-4xl font-bold mt-2">What you'll experience</h2>
              {program.description && (
                <p className="mt-4 text-muted-foreground leading-relaxed whitespace-pre-line">{program.description}</p>
              )}

              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                {program.duration && <InfoTile icon={Clock} label="Duration" value={program.duration} />}
                {program.category && <InfoTile icon={Sparkles} label="Skill level" value={program.category} />}
                <InfoTile icon={Users} label="Age group" value="14 years & above" />
                {program.style && <InfoTile icon={Star} label="Style" value={program.style} />}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="text-xs uppercase tracking-widest text-primary">Learning outcomes</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {["Master choreography from start to finish", "Sharpen technique, musicality & expression", "Build stage presence and confidence", "Perform the final piece with the group"].map((t) => (
                    <li key={t} className="flex gap-2"><CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" /><span>{t}</span></li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="text-xs uppercase tracking-widest text-primary">What to bring</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {["Comfortable dance-ready clothing", "Clean indoor shoes / sneakers", "Water bottle & small towel", "A whole lot of energy"].map((t) => (
                    <li key={t} className="flex gap-2"><Package size={16} className="text-primary shrink-0 mt-0.5" /><span>{t}</span></li>
                  ))}
                </ul>
              </div>
            </div>

            {program.instructor && (
              <TiltCard className="rounded-2xl">
                <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 flex items-center gap-5">
                  <div className="h-16 w-16 rounded-full bg-primary/20 grid place-items-center shrink-0">
                    <User size={26} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-primary">Instructor</p>
                    <p className="font-display text-2xl font-bold mt-0.5">{program.instructor}</p>
                    <p className="text-xs text-muted-foreground mt-1">Leading this workshop personally.</p>
                  </div>
                </div>
              </TiltCard>
            )}
          </div>

          {/* ==================== 3. LIVE FEATURES (side rail on desktop) ==================== */}
          <aside className="lg:sticky lg:top-24 h-fit space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="font-display text-3xl">₹{program.price_inr.toLocaleString("en-IN")}</p>
              {program.silver_seat_enabled && (
                <p className="text-xs text-primary mt-1">+ ₹{silverPrice.toLocaleString("en-IN")} Silver Seat option</p>
              )}
              <div className="mt-4 space-y-2 text-sm">
                {program.event_date && (
                  <p className="flex items-center gap-2 text-muted-foreground"><Calendar size={14} className="text-primary" />{new Date(program.event_date).toDateString()}{program.event_time && ` · ${program.event_time}`}</p>
                )}
                {program.venue && <p className="flex items-center gap-2 text-muted-foreground"><MapPin size={14} className="text-primary" />{program.venue}</p>}
                {seatsLeft != null && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Users size={14} className="text-primary" />
                    <AnimatedCounter value={seatsLeft} /> of {program.capacity} seats left
                  </p>
                )}
              </div>

              {countdown && !countdown.done && (
                <div className="mt-5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Starts in</p>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {[
                      { l: "Days", v: countdown.d },
                      { l: "Hrs", v: countdown.h },
                      { l: "Min", v: countdown.m },
                      { l: "Sec", v: countdown.s },
                    ].map((c) => (
                      <div key={c.l} className="rounded-lg bg-muted p-2 text-center">
                        <p className="font-display text-xl tabular-nums">{String(c.v).padStart(2, "0")}</p>
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{c.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={bookNow} disabled={full}
                className="mt-6 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                {full ? "Sold Out" : "Book Now"}
              </button>
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="mt-2 w-full inline-flex justify-center items-center gap-2 px-4 py-3 rounded-lg border border-border text-sm hover:bg-muted">
                <MessageCircle size={14} /> Chat on WhatsApp
              </a>
            </div>
          </aside>
        </section>

        {/* ==================== 5. LOCATION ==================== */}
        {program.venue && (
          <section className="mt-20">
            <p className="text-xs uppercase tracking-widest text-primary">Location</p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold mt-2">Where it happens</h2>
            <div className="mt-6 grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-border aspect-[16/10] bg-muted">
                {mapsEmbed && (
                  <iframe title="Venue map" src={mapsEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full border-0" allowFullScreen />
                )}
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Venue</p>
                <p className="font-display text-xl mt-1">{program.venue}</p>
                {program.city && <p className="text-sm text-muted-foreground mt-1">{program.city}</p>}
                <p className="text-xs text-muted-foreground mt-4">Look for the nearest metro / main-road landmark; the studio entrance is signposted.</p>
                {mapsNav && (
                  <a href={mapsNav} target="_blank" rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                    <Navigation size={14} /> Get Directions
                  </a>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ==================== 4. STICKY ACTION PANEL ==================== */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 md:bottom-6">
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-background/90 backdrop-blur-xl shadow-xl p-1.5">
          <button onClick={bookNow} disabled={full}
            className="px-4 md:px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs md:text-sm font-semibold disabled:opacity-50">
            {full ? "Sold Out" : "Book Now"}
          </button>
          <a href={waLink} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
            className="p-2.5 rounded-full hover:bg-muted"><MessageCircle size={16} /></a>
          <a href={callLink} aria-label="Call" className="p-2.5 rounded-full hover:bg-muted"><Phone size={16} /></a>
          <button onClick={share} aria-label="Share" className="p-2.5 rounded-full hover:bg-muted"><Share2 size={16} /></button>
          <button onClick={toggleSave} aria-label="Save" className="p-2.5 rounded-full hover:bg-muted">
            <Heart size={16} className={saved ? "fill-primary text-primary" : ""} />
          </button>
        </div>
      </div>

      <EnrollDialog klass={sel} onClose={() => setSel(null)} />
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center shrink-0">
        <Icon size={16} className="text-primary" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

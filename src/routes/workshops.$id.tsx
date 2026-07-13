import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import {
  Calendar, MapPin, Clock, ChevronDown, Sparkles,
  ArrowLeft, CheckCircle2, Package,
  Ticket, PlayCircle,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getProgram } from "@/lib/catalog.functions";
import { listWorkshopMedia } from "@/lib/workshop-media.functions";
import { EnrollDialog, type EnrollClass } from "@/components/site/EnrollDialog";
import { MagneticButton } from "@/components/site/MagneticButton";
import { AnimatedCounter } from "@/components/site/AnimatedCounter";

export const Route = createFileRoute("/workshops/$id")({
  component: WorkshopDetailPage,
  loader: async ({ params }: any) => {
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

/* ---------- Ambient premium live backdrop ---------- */
function GoldParticles() {
  const dots = useMemo(
    () =>
      Array.from({ length: 70 }).map((_, i) => ({
        x: (i * 137.5) % 100,
        y: (i * 53.3) % 100,
        s: (i % 4) + 1,
        d: 6 + (i % 7),
        delay: (i % 10) * 0.4,
        o: 0.18 + ((i % 6) / 10),
      })),
    []
  );
  const sparks = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        left: (i * 73) % 100,
        delay: (i % 7) * 1.1,
        dur: 7 + (i % 5),
        drift: (i % 2 ? 1 : -1) * (20 + (i % 4) * 10),
      })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050301]">
      {/* radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,169,76,0.10),transparent_70%)]" />
      {/* faint grid */}
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#d4a94c_1px,transparent_1px),linear-gradient(to_bottom,#d4a94c_1px,transparent_1px)] [background-size:80px_80px]" />

      {/* aurora blobs — slow drifting gold/amber glow */}
      <motion.div
        className="absolute -top-32 -left-24 h-[45rem] w-[45rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle at 30% 30%, rgba(212,169,76,0.28), transparent 60%)" }}
        animate={{ x: [0, 80, -20, 0], y: [0, 40, -30, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -right-24 h-[50rem] w-[50rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle at 60% 60%, rgba(184,134,11,0.25), transparent 65%)" }}
        animate={{ x: [0, -60, 30, 0], y: [0, -30, 40, 0], scale: [1, 1.15, 0.9, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,215,120,0.14), transparent 70%)" }}
        animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* diagonal light sweep */}
      <motion.div
        className="absolute -inset-x-1/2 top-0 h-full"
        style={{
          background:
            "linear-gradient(115deg, transparent 40%, rgba(255,220,150,0.06) 50%, transparent 60%)",
        }}
        animate={{ x: ["-30%", "30%", "-30%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* soft scanline shimmer */}
      <motion.div
        className="absolute inset-x-0 h-24"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(255,215,140,0.06), transparent)",
        }}
        animate={{ y: ["-10%", "110%"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />

      {/* floating particles */}
      {dots.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-amber-300 shadow-[0_0_6px_rgba(255,200,120,0.7)]"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, opacity: p.o }}
          animate={{ y: [0, -22, 0], opacity: [p.o * 0.35, p.o, p.o * 0.35] }}
          transition={{ duration: p.d, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}

      {/* rising ember sparks */}
      {sparks.map((s, i) => (
        <motion.span
          key={`sp-${i}`}
          className="absolute bottom-0 h-1 w-1 rounded-full bg-amber-200 shadow-[0_0_8px_rgba(255,210,140,0.9)]"
          style={{ left: `${s.left}%` }}
          animate={{ y: [0, -700], x: [0, s.drift, 0], opacity: [0, 1, 0] }}
          transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: "easeOut" }}
        />
      ))}

      {/* subtle grain */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
        }}
      />
    </div>
  );
}

/* ---------- Gold stage ambience: rays, spotlights, drifting dancer silhouettes ---------- */
function GoldStageAmbience() {
  const dancers = [
    { pose: "hiphop",       left: "6%",  bottom: "4%",  scale: 0.95, dur: 16, delay: 0,  opacity: 0.10, blur: 0.5 },
    { pose: "contemporary", left: "44%", bottom: "2%",  scale: 1.15, dur: 20, delay: -5, opacity: 0.09, blur: 1 },
    { pose: "freestyle",    left: "78%", bottom: "6%",  scale: 0.9,  dur: 18, delay: -9, opacity: 0.10, blur: 0.5 },
    { pose: "contemporary", left: "22%", bottom: "10%", scale: 0.55, dur: 24, delay: -3, opacity: 0.06, blur: 3 },
    { pose: "hiphop",       left: "62%", bottom: "12%", scale: 0.6,  dur: 22, delay: -11,opacity: 0.06, blur: 3 },
  ];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Volumetric gold light rays — slow rotate */}
      <svg
        className="absolute left-1/2 top-[-30%] h-[160%] w-[140%] -translate-x-1/2 opacity-[0.18] mix-blend-screen gsa-rays"
        viewBox="0 0 800 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="gsa-ray" cx="50%" cy="0%" r="65%">
            <stop offset="0%" stopColor="#f5c76a" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#d4a94c" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#d4a94c" stopOpacity="0" />
          </radialGradient>
        </defs>
        {Array.from({ length: 7 }).map((_, i) => (
          <polygon
            key={i}
            points="400,0 378,800 422,800"
            fill="url(#gsa-ray)"
            transform={`rotate(${(i - 3) * 13} 400 0)`}
          />
        ))}
      </svg>

      {/* Two elegant moving spotlights (no blink) */}
      <div
        className="absolute -top-20 left-[15%] h-[70vh] w-[55vw] rounded-full blur-3xl mix-blend-screen gsa-spot-a"
        style={{ background: "radial-gradient(circle, rgba(245,199,106,0.28), rgba(212,169,76,0.06) 45%, transparent 70%)" }}
      />
      <div
        className="absolute top-[8%] right-[8%] h-[65vh] w-[50vw] rounded-full blur-3xl mix-blend-screen gsa-spot-b"
        style={{ background: "radial-gradient(circle, rgba(255,220,140,0.22), rgba(184,134,11,0.05) 45%, transparent 70%)" }}
      />

      {/* Soft atmospheric fog */}
      <div className="absolute inset-0 gsa-fog">
        <div
          className="absolute left-[-15%] top-[45%] h-[55vh] w-[85vw] rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(circle, rgba(200,160,90,0.20), transparent 70%)" }}
        />
      </div>

      {/* Parallax dancer silhouettes at stage floor */}
      <div className="absolute inset-x-0 bottom-0 h-[85vh]">
        {dancers.map((d, i) => (
          <div
            key={i}
            className="absolute gsa-dancer"
            style={{
              left: d.left,
              bottom: d.bottom,
              transform: `scale(${d.scale})`,
              opacity: d.opacity,
              animationDuration: `${d.dur}s`,
              animationDelay: `${d.delay}s`,
              filter: `blur(${d.blur}px)`,
              color: "#f5c76a",
            }}
          >
            <GoldDancerSVG pose={d.pose as any} />
          </div>
        ))}
      </div>

      {/* Stage floor gradient for grounding */}
      <div className="absolute inset-x-0 bottom-0 h-[45vh] bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

      <style>{`
        .gsa-rays { animation: gsa-rot 120s linear infinite; transform-origin: 50% 0%; will-change: transform; }
        @keyframes gsa-rot { from { transform: translateX(-50%) rotate(0deg); } to { transform: translateX(-50%) rotate(360deg); } }

        .gsa-spot-a { will-change: transform; animation: gsa-spot-a 38s ease-in-out infinite; }
        .gsa-spot-b { will-change: transform; animation: gsa-spot-b 46s ease-in-out infinite; }
        @keyframes gsa-spot-a {
          0%,100% { transform: translate3d(0,0,0) scale(1); }
          50%     { transform: translate3d(16vw,5vh,0) scale(1.15); }
        }
        @keyframes gsa-spot-b {
          0%,100% { transform: translate3d(0,0,0) scale(1); }
          50%     { transform: translate3d(-14vw,-4vh,0) scale(1.1); }
        }

        .gsa-fog { will-change: transform; animation: gsa-fog 70s ease-in-out infinite; }
        @keyframes gsa-fog {
          0%,100% { transform: translate3d(0,0,0); }
          50%     { transform: translate3d(5vw,-2vh,0); }
        }

        .gsa-dancer {
          width: 170px;
          height: 300px;
          transform-origin: 50% 100%;
          will-change: transform, opacity;
          animation-name: gsa-sway;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }
        @keyframes gsa-sway {
          0%   { transform: translate3d(0,0,0) rotate(-1.2deg); }
          50%  { transform: translate3d(5px,-4px,0) rotate(0.6deg); }
          100% { transform: translate3d(-4px,-2px,0) rotate(-0.4deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .gsa-rays, .gsa-spot-a, .gsa-spot-b, .gsa-fog, .gsa-dancer { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function GoldDancerSVG({ pose }: { pose: "hiphop" | "contemporary" | "freestyle" }) {
  if (pose === "hiphop") {
    return (
      <svg viewBox="0 0 200 360" className="w-full h-full" fill="currentColor">
        <circle cx="100" cy="46" r="22" />
        <path d="M78 70 Q100 78 122 70 L138 150 Q140 170 130 180 L118 220 L128 300 L118 340 L104 340 L100 260 L92 340 L78 340 L86 260 L70 180 Q60 170 62 150 Z" />
        <path d="M62 155 L36 210 L28 270 L42 274 L52 220 L72 178 Z" />
        <path d="M138 155 L170 200 L182 258 L170 264 L156 214 L132 178 Z" />
      </svg>
    );
  }
  if (pose === "contemporary") {
    return (
      <svg viewBox="0 0 200 360" className="w-full h-full" fill="currentColor">
        <circle cx="90" cy="40" r="20" />
        <path d="M72 60 Q92 68 112 62 L128 140 L118 180 L138 260 L128 340 L114 340 L112 270 L96 220 L82 270 L84 340 L70 340 L70 260 L82 180 Z" />
        <path d="M112 68 L170 20 L178 30 L120 82 Z" />
        <path d="M74 78 L40 150 L30 148 L60 70 Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 360" className="w-full h-full" fill="currentColor">
      <circle cx="104" cy="60" r="20" />
      <path d="M84 80 Q106 88 128 82 L142 160 Q136 190 118 200 L136 260 L126 320 L112 322 L108 260 L96 220 L82 260 L78 322 L64 320 L74 260 L60 200 Q54 190 62 160 Z" />
      <path d="M128 86 L172 40 L182 50 L136 100 Z" />
      <path d="M84 86 L36 46 L28 58 L78 102 Z" />
      <path d="M112 280 L170 300 L172 314 L108 300 Z" />
    </svg>
  );
}



/* ---------- Section label + serif heading (Manthan style) ---------- */
function SectionHeader({ eyebrow, title, center = true }: { eyebrow: string; title: string; center?: boolean }) {
  return (
    <div className={center ? "text-center" : ""}>
      <p className="text-[11px] tracking-[0.35em] uppercase text-amber-400/90">{eyebrow}</p>
      <h2
        className="mt-3 font-serif text-4xl md:text-5xl lg:text-6xl font-semibold bg-gradient-to-b from-amber-200 via-amber-300 to-amber-500 bg-clip-text text-transparent"
        style={{ fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}
      >
        {title}
      </h2>
      <div className={`mt-4 h-px w-24 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent ${center ? "mx-auto" : ""}`} />
    </div>
  );
}

function WorkshopDetailPage() {
  const { program: initialProgram } = (Route.useLoaderData?.() as any) ?? {};
  const params = Route.useParams();
  const fetchProgram = useServerFn(getProgram);
  const fetchMedia = useServerFn(listWorkshopMedia);

  const [program, setProgram] = useState<any>(initialProgram ?? null);
  const [media, setMedia] = useState<Media[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [sel, setSel] = useState<EnrollClass | null>(null);

  useEffect(() => {
    if (!initialProgram) fetchProgram({ data: { id: params.id } }).then(setProgram).catch(() => {});
    fetchMedia({ data: { programId: params.id } }).then((r: any[]) => setMedia(r as Media[])).catch(() => {});
  }, [params.id]);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const fadeHero = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  const galleryItems: Media[] = useMemo(() => {
    if (!program) return media;
    const arr: Media[] = [];
    if (program.banner_video_url) arr.push({ id: "b-v", media_kind: "video", media_url: program.banner_video_url, poster_url: program.banner_url ?? null, caption: null });
    if (program.banner_gif_url) arr.push({ id: "b-g", media_kind: "gif", media_url: program.banner_gif_url, poster_url: null, caption: null });
    if (program.banner_url && !program.banner_video_url) arr.push({ id: "b-i", media_kind: "image", media_url: program.banner_url, poster_url: null, caption: null });
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

  const mapsEmbed = program?.venue ? `https://www.google.com/maps?q=${encodeURIComponent(program.venue)}&output=embed` : null;

  const bookNow = () => {
    if (!program || full) return;
    setSel({ id: program.id, name: program.name, price: program.price_inr, duration: program.duration ?? "", silverSeatEnabled: !!program.silver_seat_enabled, silverSeatPrice: silverPrice });
  };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  if (!program) {
    return (
      <div className="min-h-screen grid place-items-center px-6 bg-[#050301] text-amber-100">
        <div className="text-center">
          <p className="text-amber-100/60">Workshop not found or no longer available.</p>
          <Link to="/workshops" className="mt-4 inline-block text-amber-400 underline">Back to workshops</Link>
        </div>
      </div>
    );
  }

  const timelineSteps = [
    { n: "01", t: "Choose Workshop", d: "Pick your batch & session" },
    { n: "02", t: "Register", d: "Fill your details securely" },
    { n: "03", t: "Payment QR", d: "Scan the UPI QR shown" },
    { n: "04", t: "Upload Proof", d: "Attach payment screenshot" },
    { n: "05", t: "Verification", d: "Team confirms your transfer" },
    { n: "06", t: "Confirmed", d: "Ticket lands in your dashboard" },
  ];

  return (
    <div className="relative min-h-screen pb-40 md:pb-24 text-amber-50 selection:bg-amber-400/30">
      <GoldParticles />
      <GoldStageAmbience />


      {/* ==================== HERO ==================== */}
      <section ref={heroRef} className="relative w-full min-h-[100svh] overflow-hidden">
        {/* poster background parallax (blurred) */}
        <motion.div style={{ y: yBg }} className="absolute inset-0 will-change-transform">
          {heroMedia?.media_url ? (
            heroMedia.media_kind === "video" ? (
              <video src={heroMedia.media_url} poster={heroMedia.poster_url ?? undefined}
                autoPlay muted loop playsInline preload="metadata"
                className="w-full h-full object-cover opacity-30 blur-2xl scale-110" />
            ) : (
              <img src={heroMedia.media_url} alt="" className="w-full h-full object-cover opacity-30 blur-2xl scale-110" />
            )
          ) : null}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,169,76,0.18),transparent_60%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050301]/70 via-[#050301]/60 to-[#050301]" />
        </motion.div>

        <motion.div style={{ opacity: fadeHero }}
          className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT column */}
          <div>
            <Link to="/workshops" className="inline-flex items-center gap-1.5 text-xs text-amber-200/70 hover:text-amber-300 mb-8 w-fit">
              <ArrowLeft size={14} /> All workshops
            </Link>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/40 bg-amber-500/5 backdrop-blur">
              <Sparkles size={12} className="text-amber-400" />
              <span className="text-[10px] tracking-[0.3em] uppercase text-amber-300">
                {program.category ?? "Featured Workshop"}
              </span>
            </motion.div>

            <p className="mt-6 text-xs tracking-[0.35em] uppercase text-amber-200/80">Presented by Team Tej</p>

            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
              className="mt-3 font-serif text-6xl sm:text-7xl lg:text-8xl font-semibold leading-[0.95] bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(212,169,76,0.25)]"
              style={{ fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}
            >
              {program.name}
            </motion.h1>

            {program.style && (
              <p className="mt-4 font-serif italic text-2xl text-amber-100/85"
                 style={{ fontFamily: '"Cormorant Garamond",Georgia,serif' }}>
                The {program.style} Experience
              </p>
            )}

            <div className="mt-6 h-px w-32 bg-gradient-to-r from-amber-400/70 to-transparent" />

            {program.instructor && (
              <p className="mt-6 text-sm tracking-[0.2em] uppercase text-amber-100/70">
                Guided by <span className="text-amber-300 font-semibold">{program.instructor}</span>
              </p>
            )}

            {program.description && (
              <p className="mt-6 text-base sm:text-lg text-amber-50/70 max-w-xl leading-relaxed line-clamp-4">
                {program.description}
              </p>
            )}

          </div>

          {/* RIGHT column — poster card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, rotateY: -8 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-md aspect-[4/5] [perspective:1400px]"
          >
            {/* gold glow */}
            <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(212,169,76,0.35),transparent_65%)] blur-2xl" />
            <div className="relative h-full w-full rounded-[1.5rem] overflow-hidden border border-amber-400/40 shadow-[0_40px_100px_-30px_rgba(212,169,76,0.5)] bg-black">
              {heroMedia?.media_kind === "video" && heroMedia.media_url ? (
                <video src={heroMedia.media_url} poster={heroMedia.poster_url ?? undefined}
                  autoPlay muted loop playsInline preload="metadata"
                  className="w-full h-full object-cover" />
              ) : heroMedia?.media_url ? (
                <img src={heroMedia.media_url} alt={program.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center bg-gradient-to-br from-amber-900/40 to-black">
                  <Sparkles className="text-amber-400/60" size={48} />
                </div>
              )}
              {/* corner ornament */}
              <div className="pointer-events-none absolute top-4 left-4 w-10 h-10 border-t border-l border-amber-300/70 rounded-tl-lg" />
              <div className="pointer-events-none absolute top-4 right-4 w-10 h-10 border-t border-r border-amber-300/70 rounded-tr-lg" />
              <div className="pointer-events-none absolute bottom-4 left-4 w-10 h-10 border-b border-l border-amber-300/70 rounded-bl-lg" />
              <div className="pointer-events-none absolute bottom-4 right-4 w-10 h-10 border-b border-r border-amber-300/70 rounded-br-lg" />
              {/* bottom label */}
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <p className="text-[10px] tracking-[0.3em] uppercase text-amber-300">Team Tej Presents</p>
                <p className="font-serif text-xl text-amber-100 mt-1" style={{ fontFamily: '"Cormorant Garamond",serif' }}>
                  {program.name}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <button onClick={() => scrollTo("countdown")} aria-label="Scroll down"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-amber-200/70 hover:text-amber-300">
          <span className="text-[9px] tracking-[0.35em] uppercase">Scroll Down</span>
          <motion.span animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
            <ChevronDown size={18} />
          </motion.span>
        </button>
      </section>

      {/* ==================== COUNTDOWN ==================== */}
      {countdown && !countdown.done && (
        <section id="countdown" className="relative py-14 border-y border-amber-400/15 bg-black/40 backdrop-blur">
          <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-6">
            <p className="text-[11px] tracking-[0.4em] uppercase text-amber-400">Divine Alignment In</p>
            <div className="grid grid-cols-4 gap-3 sm:gap-8">
              {[
                { l: "Days", v: countdown.d },
                { l: "Hours", v: countdown.h },
                { l: "Mins", v: countdown.m },
                { l: "Secs", v: countdown.s },
              ].map((c, i) => (
                <div key={c.l} className="text-center">
                  <div className="relative">
                    <p className="font-serif text-4xl sm:text-6xl font-semibold text-amber-200 tabular-nums drop-shadow-[0_4px_20px_rgba(212,169,76,0.4)]"
                       style={{ fontFamily: '"Cormorant Garamond",serif' }}>
                      {String(c.v).padStart(2, "0")}
                    </p>
                    {i < 3 && <span className="hidden sm:block absolute -right-5 top-1/2 -translate-y-1/2 text-amber-400/50 text-4xl">:</span>}
                  </div>
                  <p className="mt-1 text-[10px] tracking-[0.3em] uppercase text-amber-100/50">{c.l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== GATHERING DETAILS ==================== */}
      <section className="relative py-24">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader eyebrow="Event Logistics" title="Gathering Details" />
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                label: "Event Date",
                main: program.event_date ? new Date(program.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "long" }) : "TBA",
                sub: program.duration ? program.duration : "One transformative session",
              },
              {
                icon: Clock,
                label: "Event Hours",
                main: program.event_time ?? "TBA",
                sub: "Doors open 30 mins prior",
              },
              {
                icon: MapPin,
                label: "Gathering Venue",
                main: program.venue ?? "Announced soon",
                sub: program.city ?? "India",
              },
            ].map((c, i) => (
              <motion.div key={c.label}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative rounded-2xl border border-amber-400/25 bg-gradient-to-b from-amber-950/20 to-black/60 backdrop-blur p-8 text-center overflow-hidden hover:border-amber-400/60 hover:shadow-[0_20px_60px_-20px_rgba(212,169,76,0.4)] transition-all">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,169,76,0.15),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <c.icon className="mx-auto text-amber-400" size={28} />
                <p className="mt-4 text-[11px] tracking-[0.3em] uppercase text-amber-400">{c.label}</p>
                <p className="mt-3 font-serif text-2xl text-amber-100" style={{ fontFamily: '"Cormorant Garamond",serif' }}>{c.main}</p>
                <p className="mt-2 text-xs text-amber-100/50">{c.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== ABOUT ==================== */}
      <section id="about" className="relative py-24">
        <div className="max-w-4xl mx-auto px-6">
          <SectionHeader eyebrow="The Sacred Philosophy" title={`About ${program.name}`} />
          <motion.blockquote
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-12 font-serif italic text-xl md:text-2xl leading-relaxed text-amber-50/90 text-center"
            style={{ fontFamily: '"Cormorant Garamond",Georgia,serif' }}
          >
            "{program.description ?? `Join us for ${program.name}. A curated movement experience presented by Team Tej${program.instructor ? ` and guided by ${program.instructor}` : ""} — an opportunity to expand craft, expression and presence.`}"
          </motion.blockquote>

          {program.venue && (
            <p className="mt-10 text-center text-sm tracking-[0.3em] uppercase text-amber-400">
              Happening in {program.city ?? program.venue.split(",")[0]}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-amber-100/70 text-sm">
            {["Devotion", "Expression", "Alignment"].map((w, i, a) => (
              <span key={w} className="flex items-center gap-3">
                <span className="text-amber-400">✔</span> {w}
                {i < a.length - 1 && <span className="text-amber-400/40 ml-6">|</span>}
              </span>
            ))}
          </div>

          <div className="mt-14 grid sm:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-amber-400/20 bg-black/40 backdrop-blur p-6">
              <p className="text-[11px] tracking-[0.3em] uppercase text-amber-400">Learning Outcomes</p>
              <ul className="mt-4 space-y-3 text-sm text-amber-50/85">
                {["Master choreography from start to finish", "Sharpen technique, musicality & expression", "Build stage presence & confidence", "Perform the final piece with the group"].map((t) => (
                  <li key={t} className="flex gap-2"><CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" /><span>{t}</span></li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-black/40 backdrop-blur p-6">
              <p className="text-[11px] tracking-[0.3em] uppercase text-amber-400">What to Bring</p>
              <ul className="mt-4 space-y-3 text-sm text-amber-50/85">
                {["Comfortable dance-ready clothing", "Clean indoor shoes / sneakers", "Water bottle & small towel", "A whole lot of energy"].map((t) => (
                  <li key={t} className="flex gap-2"><Package size={16} className="text-amber-400 shrink-0 mt-0.5" /><span>{t}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== GALLERY ==================== */}
      {galleryItems.length > 0 && (
        <section className="relative py-24">
          <div className="max-w-6xl mx-auto px-6">
            <SectionHeader eyebrow="Moments" title="The Experience" />
            <div className="mt-12 relative rounded-3xl overflow-hidden border border-amber-400/30 aspect-video bg-black shadow-[0_30px_80px_-30px_rgba(212,169,76,0.4)]">
              {heroMedia?.media_kind === "video" ? (
                <video key={heroMedia.media_url ?? ""} src={heroMedia.media_url ?? undefined} poster={heroMedia.poster_url ?? undefined}
                       controls playsInline className="w-full h-full object-contain bg-black" />
              ) : heroMedia?.media_url ? (
                <img src={heroMedia.media_url} alt="" className="w-full h-full object-cover" />
              ) : null}
            </div>
            {galleryItems.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2 snap-x">
                {galleryItems.map((m, i) => (
                  <button key={m.id} onClick={() => setHeroIdx(i)}
                    className={`relative shrink-0 h-20 w-32 rounded-lg overflow-hidden bg-black snap-start border-2 transition ${i === heroIdx ? "border-amber-400 shadow-[0_0_20px_rgba(212,169,76,0.5)]" : "border-amber-400/10 hover:border-amber-400/40"}`}>
                    {m.media_kind === "video" ? (
                      <>
                        <video src={m.media_url ?? undefined} poster={m.poster_url ?? undefined} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                        <PlayCircle className="absolute inset-0 m-auto text-amber-300/90" size={22} />
                      </>
                    ) : (
                      <img src={m.media_url ?? ""} alt="" loading="lazy" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ==================== REGISTRATION FEE ==================== */}
      <section className="relative py-24">
        <div className="max-w-3xl mx-auto px-6">
          <SectionHeader eyebrow="Clear & Simple" title="Registration Fee" />

          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="relative mt-14 mx-auto max-w-md"
          >
            {/* glow */}
            <div className="absolute -inset-6 rounded-3xl bg-[radial-gradient(ellipse_at_center,rgba(212,169,76,0.35),transparent_70%)] blur-2xl" />
            <div className="relative rounded-3xl border border-amber-400/60 bg-gradient-to-b from-amber-950/40 to-black/80 backdrop-blur-xl p-10 text-center shadow-[0_30px_80px_-20px_rgba(212,169,76,0.5)]">
              {/* BEST ribbon */}
              <div className="absolute -top-3 -right-3 rotate-12 px-3 py-1 rounded-md bg-gradient-to-b from-amber-300 to-amber-500 text-black text-[10px] font-black tracking-widest shadow-lg">
                BEST
              </div>
              <p className="text-[11px] tracking-[0.35em] uppercase text-amber-400">Complete Access Pass</p>
              <div className="mt-6 flex items-baseline justify-center gap-1">
                <span className="text-amber-300 text-2xl">₹</span>
                <span className="font-serif text-7xl font-semibold text-amber-100 drop-shadow-[0_6px_30px_rgba(212,169,76,0.5)]"
                      style={{ fontFamily: '"Cormorant Garamond",serif' }}>
                  {program.price_inr.toLocaleString("en-IN")}
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-100/50">all inclusive single fee</p>

              <div className="my-6 h-px w-24 mx-auto bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

              <ul className="space-y-3 text-left text-sm text-amber-50/90 max-w-xs mx-auto">
                {[
                  program.duration ? `${program.duration} Immersive Session` : "Full Immersive Workshop",
                  program.instructor ? `Guided by ${program.instructor}` : "Guided Live Sessions",
                  "Complete Movement Experience",
                  "Post-event Community Connection",
                ].map((t) => (
                  <li key={t} className="flex gap-3"><span className="text-amber-400">✔</span>{t}</li>
                ))}
              </ul>

              {program.silver_seat_enabled && (
                <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-500/5 p-4 text-left">
                  <p className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                    <Ticket size={14} /> Silver Seat Add-on (+ ₹{silverPrice.toLocaleString("en-IN")})
                  </p>
                  <p className="mt-1 text-[11px] text-amber-100/60 leading-relaxed">
                    A professionally shot & edited solo dance video — ready for socials & portfolio.
                  </p>
                </div>
              )}


              {seatsLeft != null && (
                <p className="mt-4 text-[11px] uppercase tracking-widest text-amber-200/70">
                  <AnimatedCounter value={seatsLeft} /> of {program.capacity} seats remaining
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== TIMELINE ==================== */}
      <section className="relative py-24">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader eyebrow="How It Works" title="Registration Timeline" />
          <div className="mt-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {timelineSteps.map((s, i) => (
              <motion.div key={s.n}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="group relative rounded-2xl border border-amber-400/20 bg-black/40 backdrop-blur p-5 text-center hover:border-amber-400/60 hover:-translate-y-1 transition-all">
                <p className="font-serif text-4xl text-amber-300/90" style={{ fontFamily: '"Cormorant Garamond",serif' }}>
                  Step {s.n}
                </p>
                <p className="mt-3 text-[10px] tracking-[0.25em] uppercase text-amber-400">{s.t}</p>
                <p className="mt-2 text-xs text-amber-100/60 leading-relaxed">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== LOCATION ==================== */}
      {program.venue && (
        <section className="relative py-24">
          <div className="max-w-6xl mx-auto px-6">
            <SectionHeader eyebrow="Reach The Studio" title="Location & Directions" />
            <div className="mt-14 grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-3xl overflow-hidden border border-amber-400/30 aspect-[16/10] bg-black shadow-[0_30px_80px_-30px_rgba(212,169,76,0.4)]">
                {mapsEmbed && (
                  <iframe title="Venue map" src={mapsEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full border-0 grayscale-[40%] contrast-125" allowFullScreen />
                )}
              </div>
              <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-b from-amber-950/30 to-black/70 backdrop-blur p-8 flex flex-col">
                <MapPin className="text-amber-400" size={22} />
                <p className="mt-3 text-[11px] tracking-[0.3em] uppercase text-amber-400">Venue</p>
                <p className="mt-2 font-serif text-2xl text-amber-100" style={{ fontFamily: '"Cormorant Garamond",serif' }}>
                  {program.venue}
                </p>
                {program.city && <p className="text-sm text-amber-100/60 mt-1">{program.city}</p>}
                <p className="text-xs text-amber-100/50 mt-4 leading-relaxed">
                  Entrance is signposted. Please arrive 15 mins before start time.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ==================== SUPPORT ==================== */}
      <section className="relative py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[11px] tracking-[0.35em] uppercase text-amber-400">Need Help?</p>
          <h2 className="mt-3 font-serif text-4xl text-amber-100" style={{ fontFamily: '"Cormorant Garamond",serif' }}>Contact Support</h2>
          <p className="mt-4 text-amber-100/60 text-sm">
            Questions about payment, venue, dates or booking confirmation? Reach out — we're happy to help.
          </p>
        </div>
      </section>

      {/* ==================== STICKY BOOK NOW ==================== */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 md:bottom-6">
        <button onClick={bookNow} disabled={full}
          className="px-6 md:px-8 py-3 rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 text-black text-xs md:text-sm font-black tracking-widest uppercase shadow-[0_20px_60px_-10px_rgba(212,169,76,0.5)] disabled:opacity-40">
          {full ? "Sold Out" : "Book Now"}
        </button>
      </div>

      <EnrollDialog klass={sel} onClose={() => setSel(null)} />
    </div>
  );
}

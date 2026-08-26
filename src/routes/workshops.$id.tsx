import { createFileRoute, Link } from "@tanstack/react-router";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import {
  Calendar, MapPin, Clock, ChevronDown, Sparkles,
  ArrowLeft,
  Ticket, PlayCircle, User,
  Mail, Phone, MessageCircle,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getProgram } from "@/lib/catalog.functions";
import { listWorkshopMedia } from "@/lib/workshop-media.functions";
import { getSiteContent } from "@/lib/site-content.functions";
import { EnrollDialog, type EnrollClass } from "@/components/site/EnrollDialog";
import { getProgramPricing, type ProgramPricing } from "@/lib/pricing-tiers.functions";
import { AnimatedCounter } from "@/components/site/AnimatedCounter";
import { ViewportVideo } from "@/components/site/ViewportVideo";

const SITE_URL = "https://tejasdhoke.com";

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
  head: ({ params, loaderData }: any) => {
    const p = loaderData?.program ?? null;
    const url = `${SITE_URL}/workshops/${params.id}`;
    if (!p) {
      return {
        meta: [{ title: "Workshop — Tejas Dhoke" }],
        links: [{ rel: "canonical", href: url }],
      };
    }
    const title = `${p.name} — Dance Workshop by Tejas Dhoke`;
    const place = [p.venue, p.city].filter(Boolean).join(", ");
    const description =
      (p.description as string | null)?.trim() ||
      `Join ${p.name}, a dance workshop by Tejas Dhoke${place ? ` in ${place}` : ""}. Book your seat online.`;
    const image: string | null = p.banner_url ?? null;

    const event: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: p.name,
      description,
      url,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      organizer: { "@type": "Person", name: "Tejas Dhoke", url: `${SITE_URL}/` },
      performer: { "@type": "Person", name: "Tejas Dhoke" },
    };
    if (p.event_date) {
      event.startDate = p.event_time ? `${p.event_date}T${String(p.event_time).slice(0, 8)}` : p.event_date;
    }
    if (place) {
      event.location = {
        "@type": "Place",
        name: p.venue || place,
        address: { "@type": "PostalAddress", addressLocality: p.city || undefined },
      };
    }
    if (image) event.image = image;
    if (typeof p.price_inr === "number") {
      event.offers = {
        "@type": "Offer",
        price: String(p.price_inr),
        priceCurrency: "INR",
        url,
        availability:
          typeof p.capacity === "number" && typeof p.seats_taken === "number" && p.seats_taken >= p.capacity
            ? "https://schema.org/SoldOut"
            : "https://schema.org/InStock",
      };
    }

    return {
      meta: [
        { title },
        { name: "description", content: description.slice(0, 300) },
        { property: "og:title", content: title },
        { property: "og:description", content: description.slice(0, 300) },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description.slice(0, 300) },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: p.event_date ? [{ type: "application/ld+json", children: JSON.stringify(event) }] : [],
    };
  },
});


type Media = {
  id: string;
  media_kind: "image" | "video" | "gif";
  media_url: string | null;
  poster_url: string | null;
  caption: string | null;
};

function DanceMotionCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const dancers = [
      { x: 0.15, y: 0.7, s: 1.22, speed: 0.62, phase: 0.2, alpha: 0.72 },
      { x: 0.43, y: 0.64, s: 1.48, speed: 0.5, phase: 2.1, alpha: 0.58 },
      { x: 0.75, y: 0.7, s: 1.18, speed: 0.58, phase: 4.2, alpha: 0.64 },
      { x: 0.28, y: 0.8, s: 0.86, speed: 0.46, phase: 5.4, alpha: 0.38 },
      { x: 0.62, y: 0.79, s: 0.9, speed: 0.54, phase: 3.5, alpha: 0.38 },
    ];
    const particles = Array.from({ length: 72 }).map((_, i) => ({
      x: ((i * 37) % 100) / 100,
      y: ((i * 61) % 100) / 100,
      r: 0.8 + (i % 4) * 0.45,
      speed: 0.08 + (i % 7) * 0.018,
      sway: 10 + (i % 6) * 7,
      phase: i * 0.83,
      alpha: 0.18 + (i % 5) * 0.035,
    }));

    const drawDancer = (cx: number, baseY: number, scale: number, t: number, alpha: number) => {
      const sway = Math.sin(t) * 8 * scale;
      const lift = Math.sin(t * 1.6) * 5 * scale;
      const torso = 72 * scale;
      const leg = 74 * scale;
      const head = 13 * scale;
      const shoulderY = baseY - leg - torso + lift;
      const hipY = baseY - leg + lift;
      const neckX = cx + sway;
      const armA = Math.sin(t + 0.7);
      const armB = Math.sin(t + 2.4);
      const legA = Math.sin(t + 1.1);
      const legB = Math.sin(t + 3.0);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(208,211,214,0.62)";
      ctx.shadowBlur = 18 * scale;
      ctx.strokeStyle = "rgba(243,242,238,0.9)";
      ctx.fillStyle = "rgba(243,242,238,0.84)";
      ctx.lineWidth = 8 * scale;

      ctx.beginPath();
      ctx.arc(neckX, shoulderY - 26 * scale, head, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(neckX, shoulderY - 8 * scale);
      ctx.quadraticCurveTo(cx - sway * 0.35, shoulderY + 32 * scale, cx, hipY);
      ctx.stroke();

      ctx.lineWidth = 6 * scale;
      ctx.beginPath();
      ctx.moveTo(neckX - 8 * scale, shoulderY + 6 * scale);
      ctx.quadraticCurveTo(cx - 46 * scale, shoulderY - (24 + armA * 28) * scale, cx - (82 + armA * 10) * scale, shoulderY + (8 + armB * 12) * scale);
      ctx.moveTo(neckX + 8 * scale, shoulderY + 6 * scale);
      ctx.quadraticCurveTo(cx + 44 * scale, shoulderY - (12 + armB * 30) * scale, cx + (80 + armB * 12) * scale, shoulderY + (12 - armA * 10) * scale);
      ctx.stroke();

      ctx.lineWidth = 7 * scale;
      ctx.beginPath();
      ctx.moveTo(cx, hipY);
      ctx.quadraticCurveTo(cx - (24 + legA * 14) * scale, hipY + 36 * scale, cx - (44 + legA * 22) * scale, baseY);
      ctx.moveTo(cx, hipY);
      ctx.quadraticCurveTo(cx + (24 + legB * 14) * scale, hipY + 34 * scale, cx + (42 + legB * 20) * scale, baseY - Math.abs(legA) * 10 * scale);
      ctx.stroke();
      ctx.restore();
    };

    const render = (time: number) => {
      const t = time * 0.001;
      ctx.clearRect(0, 0, width, height);

      const base = ctx.createLinearGradient(0, 0, width, height);
      base.addColorStop(0, "rgba(18,18,18,0.72)");
      base.addColorStop(0.5, "rgba(18,18,18,0.58)");
      base.addColorStop(1, "rgba(18,18,18,0.8)");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      const rayShift = Math.sin(t * 0.12) * width * 0.08;
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.translate(width * (0.18 + i * 0.16) + rayShift, -height * 0.08);
        ctx.rotate((-18 + i * 9 + Math.sin(t * 0.08 + i) * 3) * Math.PI / 180);
        const ray = ctx.createLinearGradient(0, 0, 0, height * 1.2);
        ray.addColorStop(0, "rgba(231,223,206,0.24)");
        ray.addColorStop(0.62, "rgba(231,223,206,0.09)");
        ray.addColorStop(1, "rgba(231,223,206,0)");
        ctx.fillStyle = ray;
        ctx.beginPath();
        ctx.moveTo(-width * 0.035, 0);
        ctx.lineTo(width * 0.035, 0);
        ctx.lineTo(width * 0.16, height * 1.22);
        ctx.lineTo(-width * 0.16, height * 1.22);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      particles.forEach((p) => {
        const py = ((p.y * height - (t * p.speed * height * 0.22)) % (height + 80) + height + 80) % (height + 80) - 40;
        const px = p.x * width + Math.sin(t * 0.45 + p.phase) * p.sway;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = "rgba(208,211,214,0.82)";
        ctx.shadowColor = "rgba(231,223,206,0.55)";
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      dancers.forEach((d) => drawDancer(width * d.x, height * d.y, d.s * Math.min(width / 1280, 1.05), t * d.speed + d.phase, d.alpha));

      const vignette = ctx.createRadialGradient(width * 0.5, height * 0.42, height * 0.18, width * 0.5, height * 0.52, height * 0.76);
      vignette.addColorStop(0, "rgba(18,18,18,0.02)");
      vignette.addColorStop(0.72, "rgba(18,18,18,0.22)");
      vignette.addColorStop(1, "rgba(18,18,18,0.52)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full transform-gpu" />;
}

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

function formatTime(time: string | null | undefined): string | null {
  const raw = String(time ?? "").trim();
  if (!raw) return null;

  // Already has a meridiem, e.g. "3:00 PM" / "3 pm"
  const withMeridiem = raw.match(/^(\d{1,2})(?::(\d{1,2}))?\s*([AaPp])\.?[Mm]\.?$/);
  if (withMeridiem) {
    const h = Number(withMeridiem[1]) % 12 || 12;
    const m = String(Number(withMeridiem[2] ?? 0)).padStart(2, "0");
    return `${h}:${m} ${withMeridiem[3].toUpperCase()}M`;
  }

  // 24h forms: "15:00", "15:00:00", "1500", "15"
  const hm = raw.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/) ?? raw.match(/^(\d{2})(\d{2})$/) ?? raw.match(/^(\d{1,2})$/);
  if (!hm) return raw;
  const h24 = Number(hm[1]);
  const min = Number(hm[2] ?? 0);
  if (!Number.isFinite(h24) || h24 > 23 || !Number.isFinite(min) || min > 59) return raw;
  const period = h24 >= 12 ? "PM" : "AM";
  const hour = h24 % 12 || 12;
  return `${hour}:${String(min).padStart(2, "0")} ${period}`;
}

function formatDuration(duration: string | null | undefined): string | null {
  const raw = String(duration ?? "").trim();
  if (!raw) return null;
  // Bare number like "3" -> "3 hrs"; "3hr" -> "3 hrs"
  const n = raw.match(/^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)?$/i);
  if (n) {
    const v = Number(n[1]);
    return `${n[1]} ${v === 1 ? "hr" : "hrs"}`;
  }
  return raw;
}


/* ---------- Workshop detail backdrop: stable, premium floating layer ---------- */
function WorkshopLiveBackdrop({ media }: { media: Media | null }) {
  const { scrollYProgress } = useScroll();
  const mediaY = useTransform(scrollYProgress, [0, 1], ["0vh", "-6vh"]);

  const particles = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        x: (i * 37.3) % 100,
        y: (i * 53.7) % 100,
        size: 2 + (i % 3),
        duration: 42 + (i % 6) * 6,
        delay: -(i * 2.1),
        driftX: (i % 2 ? 1 : -1) * (14 + (i % 5) * 4),
        driftY: -20 - (i % 5) * 5,
        opacity: 0.22 + (i % 4) * 0.05,
      })),
    []
  );

  const glyphs = useMemo(
    () => [
      { type: "note",    left: "8%",  top: "22%", size: 44, dur: 26, delay: 0,   opacity: 0.16 },
      { type: "note2",   left: "82%", top: "18%", size: 38, dur: 30, delay: -6,  opacity: 0.14 },
      { type: "dancer",  left: "14%", top: "62%", size: 130, dur: 34, delay: -3, opacity: 0.10 },
      { type: "dancer2", left: "72%", top: "58%", size: 140, dur: 38, delay: -9, opacity: 0.10 },
      { type: "note",    left: "48%", top: "12%", size: 32, dur: 28, delay: -12, opacity: 0.12 },
      { type: "note2",   left: "30%", top: "78%", size: 34, dur: 32, delay: -4,  opacity: 0.13 },
      { type: "dancer",  left: "56%", top: "72%", size: 110, dur: 40, delay: -14,opacity: 0.08 },
      { type: "note",    left: "90%", top: "70%", size: 30, dur: 36, delay: -2,  opacity: 0.13 },
    ],
    []
  );

  return (
    <div
      aria-hidden
      className="workshop-live-backdrop pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background"
      style={{ contain: "layout style" }}
    >
      <motion.div style={{ y: mediaY }} className="absolute -inset-[6%] will-change-transform transform-gpu">
        {media?.media_kind === "video" && media.poster_url ? (
          <img
            src={media.poster_url}
            alt=""
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover opacity-[0.38]"
          />
        ) : media?.media_kind === "video" ? (
          <div className="h-full w-full bg-jet opacity-[0.38]" />
        ) : media?.media_url ? (
          <img
            src={media.media_url}
            alt=""
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover opacity-[0.34]"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_50%_36%,rgba(231,223,206,0.22),transparent_58%),linear-gradient(135deg,rgba(18,18,18,0.68),rgba(18,18,18,0.92)_58%,rgba(208,211,214,0.38))]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/40 to-background/78" />
      </motion.div>

      <div className="absolute -left-[18%] top-[6%] h-[46rem] w-[46rem] rounded-full opacity-40 blur-3xl wlb-drift-a"
        style={{ background: "radial-gradient(circle, rgba(231,223,206,0.35), transparent 68%)" }} />
      <div className="absolute -right-[14%] bottom-[4%] h-[52rem] w-[52rem] rounded-full opacity-35 blur-3xl wlb-drift-b"
        style={{ background: "radial-gradient(circle, rgba(208,211,214,0.42), transparent 70%)" }} />

      <div className="absolute inset-0">
        {particles.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-primary shadow-[0_0_10px_rgba(231,223,206,0.45)] wlb-particle"
            style={
              {
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                opacity: p.opacity,
                "--dx": `${p.driftX}px`,
                "--dy": `${p.driftY}px`,
                "--dur": `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="absolute inset-0">
        {glyphs.map((g, i) => (
          <div
            key={i}
            className="absolute wlb-glyph text-primary/80"
            style={
              {
                left: g.left,
                top: g.top,
                width: g.size,
                height: g.size,
                opacity: g.opacity,
                animationDuration: `${g.dur}s`,
                animationDelay: `${g.delay}s`,
              } as CSSProperties
            }
          >
            {g.type === "note" && <MusicNoteGlyph />}
            {g.type === "note2" && <MusicNoteGlyph variant="double" />}
            {g.type === "dancer" && <DancerSilhouette pose="a" />}
            {g.type === "dancer2" && <DancerSilhouette pose="b" />}
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[42vh] bg-gradient-to-t from-jet/55 via-black/15 to-transparent" />

      <style>{`
        .wlb-drift-a { animation: wlb-drift-a 60s ease-in-out infinite; will-change: transform; }
        .wlb-drift-b { animation: wlb-drift-b 72s ease-in-out infinite; will-change: transform; }
        @keyframes wlb-drift-a {
          0%,100% { transform: translate3d(0,0,0) scale(1); }
          50%     { transform: translate3d(6vw, 3vh, 0) scale(1.06); }
        }
        @keyframes wlb-drift-b {
          0%,100% { transform: translate3d(0,0,0) scale(1.02); }
          50%     { transform: translate3d(-5vw,-3vh,0) scale(0.98); }
        }

        .wlb-particle {
          animation-name: wlb-float;
          animation-duration: var(--dur);
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
          will-change: transform;
        }
        @keyframes wlb-float {
          from { transform: translate3d(0,0,0); }
          to   { transform: translate3d(var(--dx), var(--dy), 0); }
        }

        .wlb-glyph {
          animation-name: wlb-glyph-float;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
          will-change: transform;
        }
        @keyframes wlb-glyph-float {
          from { transform: translate3d(0, 0, 0) rotate(-3deg); }
          to   { transform: translate3d(10px, -18px, 0) rotate(3deg); }
        }

        @media (max-width: 768px) {
          .wlb-glyph:nth-child(n+6) { display: none; }
          .wlb-particle:nth-child(n+14) { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .wlb-drift-a, .wlb-drift-b, .wlb-particle, .wlb-glyph { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function MusicNoteGlyph({ variant }: { variant?: "double" }) {
  if (variant === "double") {
    return (
      <svg viewBox="0 0 64 64" className="w-full h-full" fill="currentColor">
        <path d="M20 8v32a10 10 0 1 1-6-9V14l30-6v28a10 10 0 1 1-6-9V12L20 16V8z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="currentColor">
      <path d="M26 8v34a10 10 0 1 1-6-9V14l22-6v6L26 20V8z" />
    </svg>
  );
}

function DancerSilhouette({ pose }: { pose: "a" | "b" }) {
  if (pose === "a") {
    return (
      <svg viewBox="0 0 120 220" className="w-full h-full" fill="currentColor">
        <circle cx="62" cy="24" r="12" />
        <path d="M62 38 C 50 60, 44 78, 52 108 L 40 172 L 30 210 L 42 210 L 56 174 L 62 130 L 70 176 L 82 210 L 94 210 L 84 172 L 76 108 C 84 82, 82 62, 72 44 L 96 70 L 104 62 L 78 34 Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 220" className="w-full h-full" fill="currentColor">
      <circle cx="58" cy="22" r="12" />
      <path d="M58 36 C 46 54, 46 80, 56 104 L 42 168 L 28 210 L 42 210 L 58 172 L 62 128 L 68 172 L 84 210 L 98 210 L 86 168 L 74 106 C 84 82, 88 58, 80 40 L 60 22 L 22 42 L 26 52 L 58 40 Z" />
      </svg>
  );
}






/* ---------- Section label + serif heading (Manthan style) ---------- */
function SectionHeader({ eyebrow, title, center = true }: { eyebrow: string; title: string; center?: boolean }) {
  return (
    <div className={center ? "text-center" : ""}>
      <p className="text-[11px] tracking-[0.35em] uppercase text-primary/90">{eyebrow}</p>
      <h2
        className="mt-3 font-display text-[clamp(1.75rem,4.5vw,3rem)] font-semibold text-foreground"
        style={{ fontFamily: '"Archivo Black","Archivo",system-ui,sans-serif' }}
      >
        {title}
      </h2>
      <div className={`mt-4 h-px w-24 bg-gradient-to-r from-transparent via-primary/70 to-transparent ${center ? "mx-auto" : ""}`} />
    </div>
  );
}

function WorkshopDetailPage() {
  const { program: initialProgram } = (Route.useLoaderData?.() as any) ?? {};
  const params = Route.useParams();
  const fetchProgram = useServerFn(getProgram);
  const fetchMedia = useServerFn(listWorkshopMedia);
  const fetchSiteContent = useServerFn(getSiteContent);
  const fetchPricing = useServerFn(getProgramPricing);

  const [program, setProgram] = useState<any>(initialProgram ?? null);
  const [pricing, setPricing] = useState<ProgramPricing | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [sel, setSel] = useState<EnrollClass | null>(null);
  const [contactInfo, setContactInfo] = useState({
    email: "hello@teamtej.com", phone: "+91 98765 43210", whatsapp: "+91 98765 43210",
    address: "12 Linking Road, Bandra West, Mumbai 400050",
  });

  useEffect(() => {
    if (!initialProgram) fetchProgram({ data: { id: params.id } }).then(setProgram).catch(() => {});
    fetchPricing({ data: { programId: params.id } }).then((r: any) => setPricing(r)).catch(() => {});
    fetchMedia({ data: { programId: params.id } }).then((r: any[]) => setMedia(r as Media[])).catch(() => {});
    fetchSiteContent({ data: { key: "contact" } }).then((v: any) => v && setContactInfo((prev) => ({ ...prev, ...v }))).catch(() => {});
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
  const rawSessions: { time: string; name: string }[] = Array.isArray((program as any)?.session_schedule)
    ? ((program as any).session_schedule as any[])
        .map((s) => ({ time: formatTime(String(s?.time ?? "")) ?? "", name: String(s?.name ?? "") }))
        .filter((s) => s.time || s.name)
    : [];


  const eventDateObj = useMemo(() => {
    if (!program?.event_date) return null;
    const d = new Date(`${program.event_date}T${program.event_time ?? "10:00"}:00`);
    return isNaN(d.getTime()) ? null : d;
  }, [program]);
  const countdown = useCountdown(eventDateObj);

  // Past or unpublished workshops return null from the loader — show a calm
  // unavailable state instead of crashing the page.
  if (!program) {
    return (
      <main className="min-h-[70vh] grid place-items-center px-6 pt-28 pb-20 text-center">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Workshop</p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl tracking-tight text-foreground">
            This workshop is no longer available
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            This workshop has already taken place or has been unpublished. Take a look at our upcoming workshops instead.
          </p>
          <Link
            to="/workshops"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <ArrowLeft size={15} /> View Workshops
          </Link>
        </div>
      </main>
    );
  }

  const seatsLeft = program?.capacity != null ? Math.max(0, program.capacity - (program.seats_taken ?? 0)) : null;
  const full = seatsLeft === 0;
  const silverPrice = program?.silver_seat_price ?? 1000;

  const allowSingle = (program as any).allow_single !== false;
  const allowBoth = !!(program as any).allow_both;
  const tier = pricing?.current ?? null;
  const baseSinglePrice = program?.price_inr ?? 0;
  const baseBothPrice = allowBoth ? ((program as any).both_price ?? baseSinglePrice) : 0;
  const singlePrice = tier ? Number(tier.price_inr) : baseSinglePrice;
  const bothPrice = allowBoth
    ? (tier?.both_price != null ? Number(tier.both_price) : baseBothPrice)
    : 0;
  const w1Name = (program as any).workshop1_name || "Workshop 1";
  const w2Name = (program as any).workshop2_name || "Workshop 2";

  const formattedEventTime = formatTime(program?.event_time);

  // Sessions come from the admin Class / Session Schedule. When that list is
  // empty, fall back to the configured workshop names / program name with the
  // workshop's own start time — still fully dynamic, nothing hardcoded.
  const sessions: { time: string; name: string }[] = rawSessions.length
    ? rawSessions
    : (allowBoth && ((program as any).workshop1_name || (program as any).workshop2_name)
        ? [
            (program as any).workshop1_name ? { name: w1Name, time: formattedEventTime ?? "" } : null,
            (program as any).workshop2_name ? { name: w2Name, time: formattedEventTime ?? "" } : null,
          ].filter(Boolean) as { time: string; name: string }[]
        : formattedEventTime
          ? [{ name: program.name, time: formattedEventTime }]
          : []);



  const mapsEmbed = program?.venue ? `https://www.google.com/maps?q=${encodeURIComponent(program.venue)}&output=embed` : null;

  const enrollKlass: EnrollClass | null = program ? {
    id: program.id, name: program.name, price: singlePrice, duration: program.duration ?? "",
    silverSeatEnabled: !!program.silver_seat_enabled, silverSeatPrice: silverPrice,
    allowSingle: (program as any).allow_single !== false, allowBoth: !!(program as any).allow_both,
    bothPrice: allowBoth ? bothPrice : null,
    workshop1Name: (program as any).workshop1_name ?? null,
    workshop2Name: (program as any).workshop2_name ?? null,
    eventTime: formattedEventTime ?? sessions[0]?.time ?? null,
  } : null;

  const scrollToRegister = () => {
    const el = document.getElementById("register");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.remove("register-flash");
    void el.offsetWidth;
    el.classList.add("register-flash");
  };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });


  if (!program) {
    return (
      <div className="min-h-screen grid place-items-center px-6 bg-background text-primary">
        <div className="text-center">
          <p className="text-primary/60">Workshop not found or no longer available.</p>
          <Link to="/workshops" className="mt-4 inline-block text-primary underline">Back to workshops</Link>
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
    <div className="workshop-detail-page relative isolate min-h-screen pb-40 md:pb-24 text-primary selection:bg-primary/30">
      <WorkshopLiveBackdrop media={heroMedia} />


      {/* ==================== HERO ==================== */}
      <section ref={heroRef} className="relative w-full min-h-[76svh] md:min-h-[100svh] overflow-hidden">
        <motion.div style={{ y: yBg }} className="absolute inset-0 will-change-transform transform-gpu">
          {heroMedia?.media_url ? (
            heroMedia.media_kind === "video" && heroMedia.poster_url ? (
              <img src={heroMedia.poster_url} alt="" loading="eager" decoding="async"
                className="w-full h-full object-cover opacity-[0.18] scale-105 transform-gpu" />
            ) : heroMedia.media_kind === "video" ? (
              <div className="w-full h-full bg-jet opacity-[0.18]" />
            ) : (
              <img src={heroMedia.media_url} alt="" loading="eager" fetchPriority="high" className="w-full h-full object-cover opacity-[0.16] scale-105 transform-gpu" />
            )
          ) : null}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(231,223,206,0.12),transparent_62%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/34 via-background/18 to-background/42" />
        </motion.div>

        <motion.div style={{ opacity: fadeHero }}
          className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-12 pt-24 pb-14 md:pt-28 md:pb-24 grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          <div className="min-w-0">
            <Link to="/workshops" className="inline-flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary mb-8 w-fit">
              <ArrowLeft size={14} /> All workshops
            </Link>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/40 bg-surface/55 shadow-[0_10px_30px_-20px_rgba(208,211,214,0.55)]">
              <Sparkles size={12} className="text-primary" />
              <span className="text-[10px] tracking-[0.3em] uppercase text-primary">
                {program.category ?? "Featured Workshop"}
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}
              className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-primary/50 bg-gradient-to-r from-primary/15 to-primary/8 px-4 py-2 shadow-[0_0_40px_-12px_rgba(231,223,206,0.45)] backdrop-blur-md">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary">
                <User size={14} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-primary/80 leading-none">Guided by</p>
                <p className="mt-0.5 font-display text-sm sm:text-base font-semibold text-primary leading-none"
                   style={{ fontFamily: '"Archivo Black","Archivo",system-ui,sans-serif' }}>
                  Tejas D. Dhoke
                </p>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
              className="mt-4 md:mt-5 font-display text-[clamp(2rem,5.6vw,4rem)] font-semibold leading-[1.0] text-foreground break-words"
              style={{ fontFamily: '"Archivo Black","Archivo",system-ui,sans-serif' }}
            >
              {program.name}
            </motion.h1>

            {program.style && (
              <p className="mt-3 font-display italic text-[clamp(1rem,2.4vw,1.5rem)] text-primary/85"
                 style={{ fontFamily: '"Archivo Black","Archivo",system-ui,sans-serif' }}>
                The {program.style} Experience
              </p>
            )}

            <div className="mt-6 h-px w-32 bg-gradient-to-r from-primary/70 to-transparent" />

            {program.description && (
              <p className="mt-6 text-[clamp(0.875rem,1.5vw,1.0625rem)] text-primary/70 max-w-xl leading-relaxed line-clamp-4">
                {program.description}
              </p>
            )}

            {sessions.length > 0 && (
              <div className="mt-6 grid w-full max-w-xl gap-2.5 sm:flex sm:flex-wrap">
                {sessions.map((s, i) => (
                  <div
                    key={`hero-session-${i}`}
                    className="grid min-h-11 w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 rounded-lg border border-primary/40 bg-surface/70 px-3 py-2 text-xs text-primary backdrop-blur-md sm:inline-flex sm:min-h-0 sm:w-auto sm:rounded-full sm:px-4"
                  >
                    <Clock size={12} className="shrink-0 text-primary" />
                    <span className="min-w-0 break-words font-semibold">{s.name || `Session ${i + 1}`}</span>
                    <span className="text-primary/50">—</span>
                    <span className="shrink-0 whitespace-nowrap font-semibold tabular-nums">{s.time || "TBA"}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={scrollToRegister}
                disabled={full}
                className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-b from-primary via-primary to-accent text-primary-foreground text-sm font-black tracking-widest uppercase shadow-[0_20px_60px_-10px_rgba(231,223,206,0.6)] hover:scale-[1.03] transition-transform disabled:opacity-40 disabled:hover:scale-100"
              >
                <Sparkles size={16} />
                {full ? "Sold Out" : "Register Now"}
              </button>
              <button
                onClick={() => scrollTo("countdown")}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-primary/40 text-primary text-xs font-semibold tracking-widest uppercase hover:bg-primary/10 transition-colors"
              >
                View Details
              </button>
            </div>

          </div>


          <motion.div
            initial={{ opacity: 0, scale: 0.94, rotateY: -8 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-[300px] sm:max-w-md aspect-[4/5] [perspective:1400px]"
          >
            <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(231,223,206,0.35),transparent_65%)] blur-2xl" />
            <div className="relative h-full w-full rounded-[1.5rem] overflow-hidden border border-primary/40 shadow-[0_40px_100px_-30px_rgba(231,223,206,0.5)] bg-jet">
              {heroMedia?.media_kind === "video" && heroMedia.media_url ? (
                <ViewportVideo src={heroMedia.media_url} poster={heroMedia.poster_url ?? undefined}
                  autoPlay muted loop playsInline preload="metadata"
                  className="w-full h-full object-contain" />
              ) : heroMedia?.media_url ? (
                <img src={heroMedia.media_url} alt={program.name} fetchPriority="high" decoding="async" className="w-full h-full object-cover lg:object-contain" />
              ) : (
                <div className="w-full h-full grid place-items-center bg-gradient-to-br from-accent/40 to-black">
                  <Sparkles className="text-primary/60" size={48} />
                </div>
              )}
              <div className="pointer-events-none absolute top-4 left-4 w-10 h-10 border-t border-l border-primary/70 rounded-tl-lg" />
              <div className="pointer-events-none absolute top-4 right-4 w-10 h-10 border-t border-r border-primary/70 rounded-tr-lg" />
              <div className="pointer-events-none absolute bottom-4 left-4 w-10 h-10 border-b border-l border-primary/70 rounded-bl-lg" />
              <div className="pointer-events-none absolute bottom-4 right-4 w-10 h-10 border-b border-r border-primary/70 rounded-br-lg" />
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-jet/90 via-black/50 to-transparent">
                <p className="text-[10px] tracking-[0.3em] uppercase text-primary">Tejas D Dhoke Presents</p>
                <p className="font-display text-[clamp(1rem,2vw,1.25rem)] text-primary mt-1" style={{ fontFamily: '"Archivo Black","Archivo",system-ui,sans-serif' }}>
                  {program.name}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <button onClick={() => scrollTo("countdown")} aria-label="Scroll down"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-primary/70 hover:text-primary">
          <span className="text-[9px] tracking-[0.35em] uppercase">Scroll Down</span>
          <motion.span animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
            <ChevronDown size={18} />
          </motion.span>
        </button>
      </section>

      {countdown && !countdown.done && (
        <section id="countdown" className="relative py-14 border-y border-primary/15 bg-jet/48">
          <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-6">
            <p className="text-[11px] tracking-[0.4em] uppercase text-primary">The Workshop Starts In</p>
            <div className="grid grid-cols-4 gap-3 sm:gap-8">
              {[
                { l: "Days", v: countdown.d },
                { l: "Hours", v: countdown.h },
                { l: "Mins", v: countdown.m },
                { l: "Secs", v: countdown.s },
              ].map((c, i) => (
                <div key={c.l} className="text-center">
                  <div className="relative">
                    <p className="font-display text-[clamp(1.75rem,5vw,3rem)] font-semibold text-primary tabular-nums drop-shadow-[0_4px_20px_rgba(231,223,206,0.4)]"
                       style={{ fontFamily: '"Archivo Black","Archivo",system-ui,sans-serif' }}>
                      {String(c.v).padStart(2, "0")}
                    </p>
                    {i < 3 && <span className="hidden sm:block absolute -right-5 top-1/2 -translate-y-1/2 text-primary/50 text-4xl">:</span>}
                  </div>
                  <p className="mt-1 text-[10px] tracking-[0.3em] uppercase text-primary/50">{c.l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="relative py-14 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader eyebrow="Event Logistics" title="Gathering Details" />
          <div className="mt-8 md:mt-14 grid md:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                icon: Calendar,
                label: "Event Date",
                main: program.event_date ? new Date(program.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "long" }) : "TBA",
                sub: formatDuration(program.duration) ?? "One transformative session",
              },
              {
                icon: Clock,
                label: "Event Hours",
                main: formattedEventTime ?? sessions[0]?.time ?? "TBA",
                sub: sessions.length > 1 ? `${sessions.length} sessions` : "Doors open 30 mins prior",
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
                className="group relative rounded-2xl border border-primary/25 bg-gradient-to-b from-background/28 to-jet/72 text-center overflow-hidden p-5 md:p-8 hover:border-primary/60 hover:shadow-[0_20px_60px_-20px_rgba(231,223,206,0.4)] transition-all">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(231,223,206,0.15),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <c.icon className="mx-auto text-primary" size={28} />
                <p className="mt-4 text-[11px] tracking-[0.3em] uppercase text-primary">{c.label}</p>
                <p className="mt-3 font-display text-[clamp(1.15rem,2.2vw,1.5rem)] text-primary" style={{ fontFamily: '"Archivo Black","Archivo",system-ui,sans-serif' }}>{c.main}</p>
                <p className="mt-2 text-xs text-primary/50">{c.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {sessions.length > 0 && (
        <section className="relative py-14 md:py-24">
          <div className="max-w-4xl mx-auto px-5 sm:px-6">
            <SectionHeader eyebrow="Class Timings" title="Session Schedule" />
            <div className="mt-8 md:mt-12 space-y-3">
              {sessions.map((s, i) => (
                <div key={`${s.time}-${i}`}
                  className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-primary/25 bg-gradient-to-r from-background/28 to-jet/72 px-3 py-3.5 transition-colors hover:border-primary/55 sm:gap-5 sm:rounded-2xl sm:px-6 sm:py-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/10 font-display text-[11px] text-primary"
                          style={{ fontFamily: '"Archivo Black","Archivo",system-ui,sans-serif' }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="min-w-0 break-words font-display text-[clamp(0.875rem,1.6vw,1.05rem)] font-semibold text-primary">
                      {s.name || `Session ${i + 1}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Clock size={15} className="text-primary" />
                    <span className="font-display text-[clamp(0.8125rem,1.6vw,1rem)] text-primary tabular-nums whitespace-nowrap"
                          style={{ fontFamily: '"Archivo Black","Archivo",system-ui,sans-serif' }}>
                      {s.time || "TBA"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}







      <section className="relative py-14 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader eyebrow="Choose Your Pass" title="Registration Options" />

          {tier && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="mt-10 mx-auto max-w-2xl rounded-2xl border border-primary/45 bg-gradient-to-r from-primary/12 to-primary/5 px-5 py-4 text-center backdrop-blur-md"
            >
              <p className="text-[10px] tracking-[0.32em] uppercase text-primary/80">
                {tier.label || "Current Offer"}
              </p>
              <p className="mt-2 text-sm text-primary">
                Applicable price right now: <strong>₹{singlePrice.toLocaleString("en-IN")}</strong>
                {allowSingle && allowBoth && bothPrice > 0 && (
                  <> · Both workshops <strong>₹{bothPrice.toLocaleString("en-IN")}</strong></>
                )}
              </p>
              {tier.remaining > 0 ? (
                <p className="mt-1 text-xs text-primary/70">
                  Only {tier.remaining} {tier.remaining === 1 ? "registration" : "registrations"} left at this price — the price increases after that.
                </p>
              ) : (
                <p className="mt-1 text-xs text-primary/70">Final pricing tier is now active.</p>
              )}
            </motion.div>
          )}


          <div className={`mt-14 grid gap-6 items-stretch ${allowSingle && allowBoth ? "md:grid-cols-2" : "max-w-md mx-auto"}`}>
            {allowSingle && (
              <motion.div
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                className="relative rounded-3xl border border-primary/40 bg-gradient-to-b from-background/40 to-jet/90 p-8 shadow-[0_30px_80px_-30px_rgba(231,223,206,0.35)]"
              >
                <div className="absolute -inset-4 rounded-3xl bg-[radial-gradient(ellipse_at_center,rgba(231,223,206,0.25),transparent_70%)] blur-2xl" />
                <div className="relative">
                  <p className="text-[11px] tracking-[0.35em] uppercase text-primary">Single Workshop</p>
                  <h3 className="mt-3 font-display text-[clamp(1.35rem,2.6vw,1.75rem)] text-primary" style={{ fontFamily: '"Archivo Black","Archivo",system-ui,sans-serif' }}>Individual Entry</h3>
                  <p className="mt-2 text-sm text-primary/60">Register for an individual workshop.</p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-primary text-xl">₹</span>
                    <span className="font-display text-[clamp(2rem,4.4vw,2.75rem)] font-semibold text-primary drop-shadow-[0_6px_30px_rgba(231,223,206,0.5)]" style={{ fontFamily: '"Archivo Black","Archivo",system-ui,sans-serif' }}>
                      {singlePrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-primary/50">per person</p>

                  <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

                  <div className="space-y-2 text-sm text-primary/90">
                    <p className="text-xs uppercase tracking-widest text-primary/80">Available workshops</p>
                    <ul className="space-y-1">
                      {(program as any).workshop1_name ? (
                        <li className="flex gap-2"><span className="text-primary">✔</span>{w1Name}</li>
                      ) : null}
                      {(program as any).workshop2_name ? (
                        <li className="flex gap-2"><span className="text-primary">✔</span>{w2Name}</li>
                      ) : null}
                      {!(program as any).workshop1_name && !(program as any).workshop2_name ? (
                        <li className="flex gap-2"><span className="text-primary">✔</span>{program.name}</li>
                      ) : null}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {allowBoth && (
              <motion.div
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1 }}
                className="relative rounded-3xl border border-primary/60 bg-gradient-to-b from-background/48 to-jet/88 p-8 shadow-[0_30px_80px_-20px_rgba(231,223,206,0.5)]"
              >
                <div className="absolute -inset-4 rounded-3xl bg-[radial-gradient(ellipse_at_center,rgba(231,223,206,0.35),transparent_70%)] blur-2xl" />
                <div className="relative">
                  {allowSingle && (
                    <div className="absolute -top-2 -right-2 rotate-12 px-3 py-1 rounded-md bg-gradient-to-b from-primary to-primary text-primary-foreground text-[10px] font-black tracking-widest shadow-lg">
                      BEST
                    </div>
                  )}
                  <p className="text-[11px] tracking-[0.35em] uppercase text-primary">Both Workshops</p>
                  <h3 className="mt-3 font-display text-[clamp(1.35rem,2.6vw,1.75rem)] text-primary" style={{ fontFamily: '"Archivo Black","Archivo",system-ui,sans-serif' }}>Combined Pass</h3>
                  <p className="mt-2 text-sm text-primary/60">Register for both workshops with a single registration.</p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-primary text-xl">₹</span>
                    <span className="font-display text-[clamp(2rem,4.4vw,2.75rem)] font-semibold text-primary drop-shadow-[0_6px_30px_rgba(231,223,206,0.5)]" style={{ fontFamily: '"Archivo Black","Archivo",system-ui,sans-serif' }}>
                      {bothPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-primary/50">for both workshops</p>

                  <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

                  <div className="space-y-2 text-sm text-primary/90">
                    <p className="text-xs uppercase tracking-widest text-primary/80">Includes</p>
                    <ul className="space-y-1">
                      <li className="flex gap-2"><span className="text-primary">✔</span>{w1Name}</li>
                      <li className="flex gap-2"><span className="text-primary">✔</span>{w2Name}</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {program.silver_seat_enabled && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
              onClick={() => {
                scrollToRegister();
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent("enroll:add-silver", { detail: { programId: program.id, which: "w1" } }));
                }, 400);
              }}
              className="mt-8 max-w-2xl mx-auto w-full block rounded-2xl border border-primary/30 bg-primary/5 p-5 text-center hover:border-primary/60 hover:bg-primary/10 transition cursor-pointer"
            >
              <p className="text-xs font-semibold text-primary flex items-center justify-center gap-2">
                <Ticket size={14} /> Silver Seat Add-on (+ ₹{silverPrice.toLocaleString("en-IN")})
              </p>
              <p className="mt-1 text-[11px] text-primary/60 leading-relaxed">
                A professionally shot & edited solo dance video — ready for socials & portfolio. <span className="text-primary">Tap to add in the form below ↓</span>
              </p>
            </motion.button>
          )}

          {seatsLeft != null && (
            <p className="mt-8 text-center text-[11px] uppercase tracking-widest text-primary/70">
              <AnimatedCounter value={seatsLeft} /> of {program.capacity} seats remaining
            </p>
          )}
        </div>
      </section>


      <section className="relative py-14 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader eyebrow="How It Works" title="Registration Timeline" />
          <div className="mt-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {timelineSteps.map((s, i) => (
              <motion.div key={s.n}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="group relative rounded-2xl border border-primary/20 bg-jet/52 p-5 text-center hover:border-primary/60 hover:-translate-y-1 transition-all">
                <p className="font-display text-[clamp(1.6rem,3.4vw,2.25rem)] text-primary/90" style={{ fontFamily: '"Archivo Black","Archivo",system-ui,sans-serif' }}>
                  Step {s.n}
                </p>
                <p className="mt-3 text-[10px] tracking-[0.25em] uppercase text-primary">{s.t}</p>
                <p className="mt-2 text-xs text-primary/60 leading-relaxed">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {program.venue && (
        <section className="relative py-14 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <SectionHeader eyebrow="Reach The Studio" title="Location & Directions" />
            <div className="mt-14 grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-3xl overflow-hidden border border-primary/30 aspect-[16/10] bg-jet shadow-[0_30px_80px_-30px_rgba(231,223,206,0.4)]">
                {mapsEmbed && (
                  <iframe title="Venue map" src={mapsEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full border-0 grayscale-[40%] contrast-125" allowFullScreen />
                )}
              </div>
              <div className="rounded-3xl border border-primary/30 bg-gradient-to-b from-background/38 to-jet/82 p-8 flex flex-col">
                <MapPin className="text-primary" size={22} />
                <p className="mt-3 text-[11px] tracking-[0.3em] uppercase text-primary">Venue</p>
                <p className="mt-2 font-display text-[clamp(1.15rem,2.2vw,1.5rem)] text-primary" style={{ fontFamily: '"Archivo Black","Archivo",system-ui,sans-serif' }}>
                  {program.venue}
                </p>
                {program.city && <p className="text-sm text-primary/60 mt-1">{program.city}</p>}
                <p className="text-xs text-primary/50 mt-4 leading-relaxed">
                  Entrance is signposted. Please arrive 15 mins before start time.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="relative py-14 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center">
            <p className="text-[11px] tracking-[0.35em] uppercase text-primary">Need Help?</p>
            <h2 className="mt-3 font-display text-[clamp(1.75rem,4vw,2.75rem)] text-primary" style={{ fontFamily: '"Archivo Black","Archivo",system-ui,sans-serif' }}>Contact Support</h2>
            <p className="mt-4 max-w-2xl mx-auto text-primary/60 text-sm">
              Questions about payment, venue, dates or booking confirmation? Reach out — we're happy to help.
            </p>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Mail, label: "Email", value: contactInfo.email, href: contactInfo.email ? `mailto:${contactInfo.email}` : undefined },
              { icon: Phone, label: "Phone", value: contactInfo.phone, href: contactInfo.phone ? `tel:${String(contactInfo.phone).replace(/[^+\d]/g, "")}` : undefined },
              { icon: MessageCircle, label: "WhatsApp", value: contactInfo.whatsapp, href: `https://wa.me/${String(contactInfo.whatsapp ?? "").replace(/[^\d]/g, "")}?text=${encodeURIComponent("Hi! I have a question about a workshop booking.")}`, isWa: true },
            ].filter((c) => c.value).map((c, i) => (
              <motion.div key={c.label}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative rounded-2xl border border-primary/25 bg-gradient-to-b from-background/40 to-jet/80 p-6 text-center hover:border-primary/60 hover:-translate-y-1 transition-all">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(231,223,206,0.12),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="relative mx-auto h-12 w-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary mb-4">
                  <c.icon size={22} />
                </div>
                <p className="text-[11px] tracking-[0.3em] uppercase text-primary">{c.label}</p>
                {c.href ? (
                  <a href={c.href} target={c.isWa ? "_blank" : undefined} rel={c.isWa ? "noreferrer" : undefined}
                    className="mt-2 inline-flex items-center gap-2 text-[clamp(0.95rem,1.8vw,1.0625rem)] text-primary hover:text-primary transition break-words">
                    <span>{c.value}</span>
                    {c.isWa && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#25D366]/15 text-[#25D366]">
                        <MessageCircle size={12} /> Chat
                      </span>
                    )}
                  </a>
                ) : (
                  <p className="mt-2 text-[clamp(0.95rem,1.8vw,1.0625rem)] text-primary">{c.value}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="register" className="relative py-24 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader eyebrow="Secure Your Seat" title="Register Now" />
          <p className="mt-4 text-center text-primary/60 text-sm max-w-xl mx-auto">
            Fill in your details below. After submission you'll be taken to the secure UPI payment step.
          </p>
          <div className="mt-12">
            {full ? (
              <div className="max-w-2xl mx-auto text-center rounded-2xl border border-primary/30 bg-jet/60 p-10 text-primary/70">
                This workshop is sold out.
              </div>
            ) : (
              <EnrollDialog klass={enrollKlass} onClose={() => {}} inline />
            )}
          </div>
        </div>
      </section>


    </div>

  );
}

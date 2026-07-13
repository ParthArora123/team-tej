import { createFileRoute, Link } from "@tanstack/react-router";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import {
  Calendar, MapPin, Clock, ChevronDown, Sparkles,
  ArrowLeft,
  Ticket, PlayCircle, User,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getProgram } from "@/lib/catalog.functions";
import { listWorkshopMedia } from "@/lib/workshop-media.functions";
import { EnrollDialog, type EnrollClass } from "@/components/site/EnrollDialog";
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
      ctx.shadowColor = "rgba(245, 199, 106, 0.62)";
      ctx.shadowBlur = 18 * scale;
      ctx.strokeStyle = "rgba(255, 220, 142, 0.9)";
      ctx.fillStyle = "rgba(255, 220, 142, 0.84)";
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
      base.addColorStop(0, "rgba(17, 8, 1, 0.72)");
      base.addColorStop(0.5, "rgba(48, 25, 4, 0.58)");
      base.addColorStop(1, "rgba(8, 4, 1, 0.8)");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      const rayShift = Math.sin(t * 0.12) * width * 0.08;
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.translate(width * (0.18 + i * 0.16) + rayShift, -height * 0.08);
        ctx.rotate((-18 + i * 9 + Math.sin(t * 0.08 + i) * 3) * Math.PI / 180);
        const ray = ctx.createLinearGradient(0, 0, 0, height * 1.2);
        ray.addColorStop(0, "rgba(255, 213, 127, 0.24)");
        ray.addColorStop(0.62, "rgba(212, 169, 76, 0.09)");
        ray.addColorStop(1, "rgba(212, 169, 76, 0)");
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
        ctx.fillStyle = "rgba(255, 226, 168, 0.82)";
        ctx.shadowColor = "rgba(255, 216, 145, 0.55)";
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      dancers.forEach((d) => drawDancer(width * d.x, height * d.y, d.s * Math.min(width / 1280, 1.05), t * d.speed + d.phase, d.alpha));

      const vignette = ctx.createRadialGradient(width * 0.5, height * 0.42, height * 0.18, width * 0.5, height * 0.52, height * 0.76);
      vignette.addColorStop(0, "rgba(0,0,0,0.02)");
      vignette.addColorStop(0.72, "rgba(0,0,0,0.22)");
      vignette.addColorStop(1, "rgba(0,0,0,0.52)");
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

/* ---------- Workshop detail backdrop: one immediate live-motion layer ---------- */
function WorkshopLiveBackdrop({ media }: { media: Media | null }) {
  const { scrollYProgress } = useScroll();
  const liveY = useTransform(scrollYProgress, [0, 1], ["0vh", "-7vh"]);
  const farY = useTransform(scrollYProgress, [0, 1], ["0vh", "5vh"]);
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        x: (i * 29.7) % 100,
        y: (i * 47.3) % 100,
        size: 2 + (i % 3),
        duration: 36 + (i % 7) * 5,
        driftX: (i % 2 ? 1 : -1) * (18 + (i % 5) * 5),
        driftY: -24 - (i % 6) * 4,
        opacity: 0.16 + (i % 4) * 0.025,
      })),
    []
  );
  const dancers = [
    { pose: "hiphop", left: "4%", bottom: "18%", scale: 1.28, dur: 34, opacity: 0.34, blur: 0.2 },
    { pose: "contemporary", left: "36%", bottom: "16%", scale: 1.46, dur: 42, opacity: 0.28, blur: 0.35 },
    { pose: "freestyle", left: "74%", bottom: "18%", scale: 1.22, dur: 38, opacity: 0.31, blur: 0.2 },
    { pose: "contemporary", left: "19%", bottom: "34%", scale: 0.78, dur: 48, opacity: 0.16, blur: 1.4 },
    { pose: "hiphop", left: "62%", bottom: "35%", scale: 0.82, dur: 46, opacity: 0.16, blur: 1.4 },
  ];
  return (
    <div aria-hidden className="workshop-live-backdrop pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#050301] contain-paint">
      <motion.div style={{ y: liveY }} className="absolute -inset-[8%] will-change-transform transform-gpu">
        {media?.media_kind === "video" && media.media_url ? (
          <video
            src={media.media_url}
            poster={media.poster_url ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            className="h-full w-full scale-[1.04] object-cover opacity-[0.42] transform-gpu"
          />
        ) : media?.media_url ? (
          <img
            src={media.media_url}
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full scale-[1.04] object-cover opacity-[0.38] transform-gpu"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_50%_36%,rgba(217,174,86,0.22),transparent_58%),linear-gradient(135deg,rgba(62,34,7,0.68),rgba(5,3,1,0.92)_58%,rgba(116,73,18,0.38))]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050301]/50 via-[#050301]/34 to-[#050301]/72" />
      </motion.div>

      <motion.div style={{ y: farY }} className="absolute -inset-[14%] will-change-transform transform-gpu">
        <div className="absolute left-[-12%] top-[8%] h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle,rgba(212,169,76,0.22),transparent_68%)] wlb-mesh-a" />
        <div className="absolute right-[-16%] bottom-[2%] h-[50rem] w-[50rem] rounded-full bg-[radial-gradient(circle,rgba(149,91,23,0.28),transparent_72%)] wlb-mesh-b" />
        <div className="absolute left-[25%] top-[18%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(255,214,132,0.12),transparent_74%)] wlb-mesh-c" />
      </motion.div>

      <motion.div style={{ y: liveY }} className="absolute inset-0 will-change-transform transform-gpu">
        {particles.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-amber-200/80 shadow-[0_0_10px_rgba(255,215,140,0.55)] wlb-particle"
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
              } as CSSProperties
            }
          />
        ))}
      </motion.div>

      <svg
        className="absolute left-1/2 top-[-35%] h-[168%] w-[150%] -translate-x-1/2 opacity-[0.13] mix-blend-screen wlb-rays transform-gpu"
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

      <div className="absolute -top-24 left-[8%] h-[72vh] w-[55vw] rounded-full mix-blend-screen wlb-spot-a"
        style={{ background: "radial-gradient(circle, rgba(245,199,106,0.24), rgba(212,169,76,0.06) 45%, transparent 70%)" }} />
      <div className="absolute top-[6%] right-[3%] h-[68vh] w-[52vw] rounded-full mix-blend-screen wlb-spot-b"
        style={{ background: "radial-gradient(circle, rgba(255,220,140,0.18), rgba(184,134,11,0.05) 45%, transparent 70%)" }} />

      <div className="absolute inset-0 wlb-fog transform-gpu">
        <div
          className="absolute left-[-18%] top-[45%] h-[55vh] w-[90vw] rounded-full opacity-35"
          style={{ background: "radial-gradient(circle, rgba(200,160,90,0.18), transparent 70%)" }}
        />
      </div>

      <motion.div style={{ y: liveY }} className="absolute inset-x-0 bottom-0 h-[85vh] will-change-transform transform-gpu">
        {dancers.map((d, i) => (
          <div
            key={i}
            className="absolute wlb-dancer"
            style={
              {
                left: d.left,
                bottom: d.bottom,
                opacity: d.opacity,
                animationDuration: `${d.dur}s`,
                filter: `blur(${d.blur}px)`,
                color: "#f5c76a",
                "--scale": d.scale,
              } as CSSProperties
            }
          >
            <GoldDancerSVG pose={d.pose as any} />
          </div>
        ))}
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-b from-[#050301]/18 via-[#050301]/6 to-[#050301]/38" />
      <div className="absolute inset-x-0 bottom-0 h-[42vh] bg-gradient-to-t from-black/46 via-black/12 to-transparent" />

      <style>{`
        .contain-paint { contain: paint; }
        .wlb-mesh-a, .wlb-mesh-b, .wlb-mesh-c, .wlb-spot-a, .wlb-spot-b, .wlb-fog > div { filter: blur(56px); transform: translate3d(0,0,0); }
        .wlb-mesh-a { animation: wlb-mesh-a 58s ease-in-out infinite; will-change: transform; }
        .wlb-mesh-b { animation: wlb-mesh-b 64s ease-in-out infinite; will-change: transform; }
        .wlb-mesh-c { animation: wlb-mesh-c 72s ease-in-out infinite; will-change: transform; }
        @keyframes wlb-mesh-a { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(8vw,4vh,0) scale(1.1); } }
        @keyframes wlb-mesh-b { 0%,100% { transform: translate3d(0,0,0) scale(1.03); } 50% { transform: translate3d(-7vw,-4vh,0) scale(0.97); } }
        @keyframes wlb-mesh-c { 0%,100% { transform: translate3d(0,0,0) scale(0.99); } 50% { transform: translate3d(4vw,-5vh,0) scale(1.07); } }

        .wlb-particle { animation: wlb-float var(--dur) ease-in-out infinite; will-change: transform; transform: translate3d(0,0,0); }
        @keyframes wlb-float {
          0%,100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(var(--dx),var(--dy),0); }
        }

        .wlb-rays { animation: wlb-rot 180s linear infinite; transform-origin: 50% 0%; will-change: transform; }
        @keyframes wlb-rot { from { transform: translateX(-50%) rotate(0deg); } to { transform: translateX(-50%) rotate(360deg); } }

        .wlb-spot-a { will-change: transform; animation: wlb-spot-a 56s ease-in-out infinite; }
        .wlb-spot-b { will-change: transform; animation: wlb-spot-b 62s ease-in-out infinite; }
        @keyframes wlb-spot-a {
          0%,100% { transform: translate3d(0,0,0) scale(1); }
          50%     { transform: translate3d(11vw,4vh,0) scale(1.08); }
        }
        @keyframes wlb-spot-b {
          0%,100% { transform: translate3d(0,0,0) scale(1); }
          50%     { transform: translate3d(-10vw,-3vh,0) scale(1.06); }
        }

        .wlb-fog { will-change: transform; animation: wlb-fog 86s ease-in-out infinite; }
        @keyframes wlb-fog {
          0%,100% { transform: translate3d(0,0,0); }
          50%     { transform: translate3d(5vw,-2vh,0); }
        }

        .wlb-dancer {
          width: 170px;
          height: 300px;
          transform-origin: 50% 100%;
          will-change: transform;
          animation-name: wlb-sway;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }
        @keyframes wlb-sway {
          0%   { transform: translate3d(0,0,0) rotate(-0.9deg) scale(var(--scale)); }
          50%  { transform: translate3d(5px,-4px,0) rotate(0.45deg) scale(var(--scale)); }
          100% { transform: translate3d(-4px,-2px,0) rotate(-0.35deg) scale(var(--scale)); }
        }

        @media (max-width: 768px) {
          .wlb-dancer { width: 118px; height: 250px; }
          .wlb-particle:nth-child(n+20) { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .wlb-mesh-a, .wlb-mesh-b, .wlb-mesh-c, .wlb-particle, .wlb-rays, .wlb-spot-a, .wlb-spot-b, .wlb-fog, .wlb-dancer { animation: none !important; }
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
    <div className="workshop-detail-page relative isolate min-h-screen pb-40 md:pb-24 text-amber-50 selection:bg-amber-400/30">
      <WorkshopLiveBackdrop media={heroMedia} />


      {/* ==================== HERO ==================== */}
      <section ref={heroRef} className="relative w-full min-h-[100svh] overflow-hidden">
        {/* hero depth overlay only; live background is owned by WorkshopLiveBackdrop */}
        <motion.div style={{ y: yBg }} className="absolute inset-0 will-change-transform transform-gpu">
          {heroMedia?.media_url ? (
            heroMedia.media_kind === "video" ? (
              <video src={heroMedia.media_url} poster={heroMedia.poster_url ?? undefined}
                autoPlay muted loop playsInline preload="auto"
                className="w-full h-full object-cover opacity-[0.18] scale-105 transform-gpu" />
            ) : (
              <img src={heroMedia.media_url} alt="" loading="eager" fetchPriority="high" className="w-full h-full object-cover opacity-[0.16] scale-105 transform-gpu" />
            )
          ) : null}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,169,76,0.12),transparent_62%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050301]/34 via-[#050301]/18 to-[#050301]/42" />
        </motion.div>

        <motion.div style={{ opacity: fadeHero }}
          className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT column */}
          <div>
            <Link to="/workshops" className="inline-flex items-center gap-1.5 text-xs text-amber-200/70 hover:text-amber-300 mb-8 w-fit">
              <ArrowLeft size={14} /> All workshops
            </Link>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/40 bg-[#140d03]/55 shadow-[0_10px_30px_-20px_rgba(245,199,106,0.55)]">
              <Sparkles size={12} className="text-amber-400" />
              <span className="text-[10px] tracking-[0.3em] uppercase text-amber-300">
                {program.category ?? "Featured Workshop"}
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}
              className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/15 to-amber-300/8 px-4 py-2 shadow-[0_0_40px_-12px_rgba(212,169,76,0.45)] backdrop-blur-md">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
                <User size={14} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-amber-200/80 leading-none">Guided by</p>
                <p className="mt-0.5 font-serif text-sm sm:text-base font-semibold text-amber-200 leading-none"
                   style={{ fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
                  Tejas D. Dhoke
                </p>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
              className="mt-5 font-serif text-6xl sm:text-7xl lg:text-8xl font-semibold leading-[0.95] bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(212,169,76,0.25)]"
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
                  autoPlay muted loop playsInline preload="auto"
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
                <p className="text-[10px] tracking-[0.3em] uppercase text-amber-300">Tejas D Dhoke Presents</p>
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
        <section id="countdown" className="relative py-14 border-y border-amber-400/15 bg-black/48">
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
                className="group relative rounded-2xl border border-amber-400/25 bg-gradient-to-b from-amber-950/28 to-black/72 p-8 text-center overflow-hidden hover:border-amber-400/60 hover:shadow-[0_20px_60px_-20px_rgba(212,169,76,0.4)] transition-all">
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
            <div className="relative rounded-3xl border border-amber-400/60 bg-gradient-to-b from-amber-950/48 to-black/88 p-10 text-center shadow-[0_30px_80px_-20px_rgba(212,169,76,0.5)]">
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
                className="group relative rounded-2xl border border-amber-400/20 bg-black/52 p-5 text-center hover:border-amber-400/60 hover:-translate-y-1 transition-all">
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
              <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-b from-amber-950/38 to-black/82 p-8 flex flex-col">
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

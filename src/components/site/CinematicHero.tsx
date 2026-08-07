import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Play, ChevronDown } from "lucide-react";
import { MagneticButton } from "@/components/site/MagneticButton";
import { playHomepageVideo, pauseHomepageVideo } from "@/lib/home-video-playback";

/** Counts 0 → target once, using a single rAF chain (no per-frame React churn beyond setState). */
function HeroCounter({ value, suffix, delay = 0 }: { value: number; suffix: string; delay?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }
    let raf = 0;
    let start = 0;
    const dur = 1400;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / dur);
      setN(Math.round((1 - Math.pow(1 - t, 3)) * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    const timer = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value, delay]);
  return (
    <>
      {n >= 1000 ? `${Math.round(n / 1000)}k` : n}
      {suffix}
    </>
  );
}

/** "1000+" → { value: 1000, suffix: "+" }, "100k+" → { value: 100000, suffix: "+" } */
function parseStat(raw: string) {
  const m = raw.match(/^([\d.]+)\s*([kKmM]?)\s*(.*)$/);
  if (!m) return null;
  const base = parseFloat(m[1]);
  if (!isFinite(base)) return null;
  const mult = m[2].toLowerCase() === "k" ? 1000 : m[2].toLowerCase() === "m" ? 1_000_000 : 1;
  return { value: Math.round(base * mult), suffix: m[3] ?? "" };
}

/**
 * Smooth-scrolls (or pages) to an on-page section when it exists on this page;
 * otherwise falls back to a normal navigation to `fallbackHref`.
 */
function goToSection(e: React.MouseEvent<HTMLAnchorElement>, id: string, fallbackHref: string) {
  if (typeof document === "undefined") return;
  const onHome = window.location.pathname === "/";
  if (!onHome) return; // let the browser follow the href
  e.preventDefault();
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  // Also ask the horizontal pager to bring the owning slide into view.
  window.dispatchEvent(new CustomEvent("pager:goto", { detail: { id } }));
  if (!target) {
    window.setTimeout(() => {
      if (!document.getElementById(id)) window.location.href = fallbackHref;
    }, 700);
  }
}

export function CinematicHero({
  backgroundImage,
  badges,
  clips = [],
  onReady,
}: {
  backgroundImage: string;
  badges: { value: string; label: string }[];
  /** Optional cinematic clips montaged behind the hero (desktop only). */
  clips?: string[];
  onReady?: () => void;
}) {
  const reduce = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [clipIdx, setClipIdx] = useState(0);
  const [clipReady, setClipReady] = useState(false);
  // Heavy background video is desktop-only: phones keep the still portrait so
  // scrolling and touch stay at 60fps.
  const [cinemaOn, setCinemaOn] = useState(false);
  const activeClip = clips.length ? clips[clipIdx % clips.length] : null;

  useEffect(() => {
    if (reduce || clips.length === 0 || typeof window === "undefined") return;
    const wide = window.matchMedia("(min-width: 1024px)");
    const coarse = window.matchMedia("(pointer: coarse)");
    if (!wide.matches || coarse.matches) return;
    // Wait for the poster image so the LCP frame is never delayed by video.
    const t = setTimeout(() => setCinemaOn(true), 900);
    return () => clearTimeout(t);
  }, [reduce, clips.length]);

  // Montage: advance to the next clip on a slow cinematic cadence, and also
  // when the current clip ends (short clips shouldn't loop visibly).
  useEffect(() => {
    if (!cinemaOn || clips.length < 2) return;
    const t = setInterval(() => {
      setClipReady(false);
      setClipIdx((i) => (i + 1) % clips.length);
    }, 9000);
    return () => clearInterval(t);
  }, [cinemaOn, clips.length]);

  useEffect(() => {
    return () => {
      if (videoRef.current) pauseHomepageVideo(videoRef.current);
    };
  }, []);

  // The <img> below fetches the portrait itself (and it is preloaded in <head>),
  // so no duplicate JS-driven fetch here — just handle the "no image" case.
  useEffect(() => {
    if (!backgroundImage) {
      setLoaded(true);
      onReady?.();
      return;
    }
    setFailed(false);
  }, [backgroundImage, onReady]);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative h-[100svh] min-h-[560px] w-full overflow-hidden"
      style={{ background: "var(--surface)" }}
    >
      <style>{`
        /* Every hero animation below is compositor-only (transform/opacity) and
           disabled on touch / reduced-motion so mobile stays at 60fps. */
        @media (max-width: 1024px), (hover: none), (pointer: coarse), (prefers-reduced-motion: reduce) {
          .hero-kenburns, .hero-float-card, .hero-ray, .hero-mote { animation: none !important; }
        }
        @keyframes heroKenBurns {
          0%   { transform: scale(1) translate3d(0,0,0); }
          100% { transform: scale(1.07) translate3d(0,-1.2%,0); }
        }
        @keyframes heroFloat {
          0%,100% { transform: translate3d(0,0,0); }
          50%     { transform: translate3d(0,-7px,0); }
        }
        @keyframes heroRay {
          0%,100% { opacity: .18; transform: translate3d(0,0,0) rotate(var(--ray-rot)); }
          50%     { opacity: .34; transform: translate3d(0,-2%,0) rotate(var(--ray-rot)); }
        }
        @keyframes heroMote {
          0%   { opacity: 0; transform: translate3d(0, 20px, 0); }
          20%  { opacity: .7; }
          100% { opacity: 0; transform: translate3d(0, -120px, 0); }
        }
        .hero-kenburns { animation: heroKenBurns 26s ease-in-out infinite alternate; }
        .hero-float-card { animation: heroFloat 7s ease-in-out infinite; }
        .hero-ray { animation: heroRay 11s ease-in-out infinite; }
        .hero-mote { animation: heroMote 12s linear infinite; }
        .hero-title-grad {
          background: linear-gradient(178deg, #ffffff 22%, color-mix(in oklab, var(--accent-gold) 92%, #fff) 96%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
      `}</style>

      {/* Blurred backdrop fill — static so the expensive blur rasterises once. */}
      {backgroundImage && !failed ? (
        <img
          src={backgroundImage}
          alt=""
          aria-hidden
          className="blur-backdrop opacity-70"
          style={{
            visibility: loaded ? "visible" : "hidden",
            willChange: "transform",
            contain: "paint",
          }}
          loading="eager"
          decoding="async"
          draggable={false}
        />
      ) : null}

      {/* Spotlight behind Tejas — pure gradient, no runtime blur filter. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(46% 62% at 50% 46%, color-mix(in oklab, var(--accent-gold) 26%, transparent) 0%, color-mix(in oklab, var(--accent-gold) 9%, transparent) 38%, transparent 72%)",
        }}
      />

      {/* Soft light rays */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden hidden md:block">
        {[
          { left: "26%", rot: "-14deg", w: "180px", d: "0s" },
          { left: "48%", rot: "4deg", w: "240px", d: "-3.5s" },
          { left: "70%", rot: "13deg", w: "160px", d: "-7s" },
        ].map((r) => (
          <span
            key={r.left}
            className="hero-ray absolute -top-[20%] h-[150%] origin-top"
            style={
              {
                left: r.left,
                width: r.w,
                animationDelay: r.d,
                "--ray-rot": r.rot,
                transform: `rotate(${r.rot})`,
                background:
                  "linear-gradient(180deg, color-mix(in oklab, var(--accent-gold) 30%, transparent) 0%, transparent 78%)",
                filter: "blur(22px)",
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Portrait — Ken Burns on desktop only, never cropped on large screens */}
      <div
        className="hero-kenburns absolute inset-0 w-full h-full transform-gpu"
        style={{ visibility: loaded && !failed && backgroundImage ? "visible" : "hidden" }}
      >
        {backgroundImage && !failed ? (
          <img
            src={backgroundImage}
            alt="Tejas D Dhoke"
            className="absolute inset-0 h-full w-full object-cover lg:object-contain object-top lg:object-center"
            fetchPriority="high"
            decoding="async"
            loading="eager"
            sizes="100vw"
            draggable={false}
            ref={(el) => {
              if (el && el.complete && el.naturalWidth > 0 && !loaded) {
                setLoaded(true);
                onReady?.();
              }
            }}
            onLoad={() => {
              setLoaded(true);
              onReady?.();
            }}
            onError={() => {
              setFailed(true);
              setLoaded(true);
              onReady?.();
            }}
          />
        ) : null}
      </div>

      {/* Cinematic clip montage — crossfades over the portrait on desktop */}
      {cinemaOn && activeClip && (
        <>
          <img
            src={backgroundImage}
            alt=""
            aria-hidden
            className="blur-backdrop opacity-70"
            style={{ willChange: "transform", contain: "paint" }}
            draggable={false}
          />
          <video
            key={activeClip}
            ref={(node) => {
              videoRef.current = node;
              if (node) {
                node.muted = true;
                void playHomepageVideo(node);
              }
            }}
            src={activeClip}
            poster={backgroundImage}
            autoPlay
            muted
            loop={clips.length === 1}
            playsInline
            preload="metadata"
            aria-hidden
            onCanPlay={() => setClipReady(true)}
            onEnded={() => {
              if (clips.length > 1) {
                setClipReady(false);
                setClipIdx((i) => (i + 1) % clips.length);
              }
            }}
            onError={() => {
              if (clips.length > 1) setClipIdx((i) => (i + 1) % clips.length);
            }}
            className="absolute inset-0 h-full w-full object-contain transform-gpu z-[1]"
            style={{ opacity: clipReady ? 1 : 0, transition: "opacity 1.4s ease" }}
          />
        </>
      )}

      {/* Cinematic grading — 40–50% dark wash for text legibility, everywhere. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            "linear-gradient(180deg, oklch(0 0 0 / 42%) 0%, oklch(0 0 0 / 14%) 38%, oklch(0 0 0 / 68%) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] opacity-80"
        style={{
          background:
            "radial-gradient(90% 70% at 50% 88%, oklch(0 0 0 / 62%) 0%, transparent 62%)",
        }}
      />

      {/* Ambient floating motes */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[3] hidden md:block overflow-hidden">
        {[8, 19, 31, 44, 58, 67, 79, 91].map((left, i) => (
          <span
            key={left}
            className="hero-mote absolute bottom-[18%] rounded-full"
            style={{
              left: `${left}%`,
              width: i % 3 === 0 ? 4 : 2.5,
              height: i % 3 === 0 ? 4 : 2.5,
              background: "color-mix(in oklab, var(--accent-gold) 85%, white)",
              boxShadow: "0 0 10px color-mix(in oklab, var(--accent-gold) 70%, transparent)",
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-20 h-full max-w-7xl mx-auto px-6 lg:px-10 flex flex-col items-center text-center pointer-events-none justify-end pb-[12vh] sm:pb-[14vh]">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="text-[10px] sm:text-xs uppercase tracking-[0.5em] text-white/75"
        >
          Dance Educator • Performer • Choreographer
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.05, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="hero-title-grad mt-5 font-display font-bold uppercase leading-[0.9] text-[clamp(2.4rem,8.6vw,7rem)] tracking-[-0.02em] drop-shadow-[0_14px_50px_rgba(0,0,0,0.55)]"
        >
          Tejas D Dhoke
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-5 text-sm sm:text-lg text-white/85 max-w-xl"
        >
          Transforming passion into performance.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.8 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3 sm:gap-4 pointer-events-auto"
        >
          <MagneticButton>
            <a
              href="/workshops"
              onClick={(e) => goToSection(e, "workshops", "/workshops")}
              className="btn-premium-black group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl px-9 py-4 sm:px-11 sm:py-[1.15rem] text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.22em]"
            >
              <span
                aria-hidden
                className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/25 opacity-0 transition-all duration-700 group-hover:left-[110%] group-hover:opacity-100"
              />
              <span className="relative">Explore Workshops</span>
              <ArrowUpRight size={16} className="relative transition-transform group-hover:rotate-45" />
            </a>
          </MagneticButton>
          <MagneticButton>
            <a
              href="/#showcase"
              onClick={(e) => goToSection(e, "showcase", "/#showcase")}
              className="group inline-flex items-center gap-2.5 rounded-full px-8 py-4 sm:px-9 sm:py-[1.15rem] text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.22em] text-white border border-white/25 bg-white/10 backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:scale-[1.03]"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20 transition-transform group-hover:scale-110">
                <Play size={12} className="translate-x-[1px]" fill="currentColor" />
              </span>
              Watch Viral Choreos
            </a>
          </MagneticButton>
        </motion.div>
      </div>

      {/* Floating achievement cards — premium glass */}
      <div aria-hidden={false} className="absolute inset-0 z-20 hidden lg:block pointer-events-none">
        {badges.slice(0, 4).map((b, idx) => {
          const spots = [
            "left-[4%] top-[46%]",
            "right-[4%] top-[54%]",
            "left-[7%] bottom-[15%]",
            "right-[7%] bottom-[19%]",
          ];
          const stat = parseStat(b.value);
          return (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, y: 18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.7 + idx * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`hero-float-card absolute ${spots[idx]} rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-left backdrop-blur-xl`}
              style={{
                animationDelay: `${idx * 0.9}s`,
                boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.18)",
                backfaceVisibility: "hidden",
              }}
            >
              <p className="font-display text-[1.75rem] font-bold text-white leading-none">
                {stat ? <HeroCounter value={stat.value} suffix={stat.suffix} delay={700 + idx * 120} /> : b.value}
              </p>
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.22em] text-white/70">{b.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Scroll indicator */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.2, duration: 0.6 }, y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 text-white/70"
      >
        <span className="text-[9px] uppercase tracking-[0.35em]">Scroll to Explore</span>
        <ChevronDown size={16} />
      </motion.div>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Instagram, Play, Youtube } from "lucide-react";


import { pauseHomepageVideo, playHomepageVideo } from "@/lib/home-video-playback";

/**
 * EditorialHero — full-bleed cinematic hero image.
 * The hero image fills the entire viewport section edge-to-edge with no
 * surrounding whitespace. The Tejas Dhoke heading is removed; CTAs sit on a
 * soft gradient at the bottom so they stay readable over the image.
 */
export function EditorialHero({
  founder,
  image,
  clips,
  onReady,
  onExplore,
  onWatch,
}: {
  founder: any | null;
  workshops: any[];
  image: string;
  clips: string[];
  badges: { value: string; label: string }[];
  onReady?: () => void;
  onExplore: () => void;
  onWatch: () => void;
}) {
  const name = founder?.name || "Tejas D Dhoke";
  const belief = founder?.belief || founder?.philosophy ||
    "Beyond the steps and choreography, dance is a spark that makes us feel alive.";
  const vision = founder?.vision ||
    "To create a space where everyone — from absolute beginners to artists — can say, \u201CI belong here.\u201D";
  const mission = founder?.mission ||
    "Building dancers with craft, confidence and character — one honest rehearsal at a time.";
  const biography = founder?.biography || "";
  const achievements: string[] = Array.isArray(founder?.achievements) ? founder.achievements : [];
  const socials = founder?.socials || {};
  const [open, setOpen] = useState(false);
  const hasMore = Boolean(biography || achievements.length);

  const columns = [
    { k: "Philosophy", t: "Belief", v: belief },
    { k: "Purpose", t: "Vision", v: vision },
    { k: "Mission", t: "Mission", v: mission },
  ];


  return (
    <>
      <section className="relative w-full bg-background">
        {/* The foreground always uses contain so the supplied artwork and all
            embedded text remain visible at every viewport ratio. */}
        <div className="relative z-0 aspect-[4/3] w-full">
          <HeroFill image={image} clips={clips} alt={`${name} — dance choreographer and performer`} onReady={onReady} />
        </div>

        {/* Keep controls outside the artwork so they never cover its text. */}
        <div className="relative z-30 flex flex-col items-center justify-center gap-4 border-b border-border bg-background px-4 py-5 sm:px-6 sm:py-6">
          <div className="ed-rise flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "520ms" }}>
            <button
              type="button"
              onClick={onExplore}
              className="ed-cta group inline-flex items-center gap-2 px-9 py-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.16em]"
            >
              Explore Workshops
              <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            <button
              type="button"
              onClick={onWatch}
              className="inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] text-foreground/90 transition hover:text-primary"
            >
              <Play size={13} /> Watch Performances
            </button>
          </div>
        </div>
      </section>

      {/* ROW 2 — Belief, Vision & Mission */}
      <section className="relative w-full px-3 sm:px-6 lg:px-10 pt-8 pb-8 lg:pt-12 lg:pb-10">
        <div className="mx-auto w-full max-w-[92rem]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {columns.map((c, i) => (
                <article key={c.t} className="ed-rise ed-card p-5 lg:p-7" style={{ animationDelay: `${220 + i * 80}ms` }}>
                  <p className="ed-eyebrow">{c.k}</p>
                  <h2 className="mt-1.5 font-display text-xl lg:text-2xl font-bold">{c.t}</h2>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground whitespace-pre-line">{c.v}</p>
                </article>
              ))}
            </div>

            {(hasMore || socials.instagram || socials.youtube) && (
              <div className="ed-rise flex items-center justify-center gap-2" style={{ animationDelay: "460ms" }}>
                {hasMore && (
                  <button
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium transition hover:border-primary hover:text-primary"
                  >
                    Know more <ArrowUpRight size={14} />
                  </button>
                )}
                {socials.instagram && (
                  <a href={socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                    className="grid h-9 w-9 place-items-center rounded-full border border-border transition hover:border-primary hover:text-primary">
                    <Instagram size={15} />
                  </a>
                )}
                {socials.youtube && (
                  <a href={socials.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                    className="grid h-9 w-9 place-items-center rounded-full border border-border transition hover:border-primary hover:text-primary">
                    <Youtube size={15} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {open && (
        <div className="modal-fade fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="modal-pop relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card p-7 shadow-2xl lg:p-10">
            <button onClick={() => setOpen(false)} aria-label="Close"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-border transition hover:border-primary hover:text-primary">✕</button>
            <p className="ed-eyebrow">{founder?.title || "Founder"}</p>
            <h3 className="mt-2 font-display text-3xl font-bold">{name}</h3>
            {biography && <p className="mt-5 whitespace-pre-line leading-relaxed text-muted-foreground">{biography}</p>}
            {achievements.length > 0 && (
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {achievements.map((a, i) => (
                  <li key={i} className="rounded-xl border border-border bg-surface/60 p-3 text-sm text-muted-foreground">{a}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Tiny inlined WebP of the hero portrait (208 bytes). It paints on the very
 * first frame with zero network cost, so the frame is never empty and never
 * shows a broken-image glyph while the full-size portrait streams in.
 */
const HERO_LQIP =
  "data:image/webp;base64,UklGRsgAAABXRUJQVlA4ILwAAACQBgCdASoYACQAPrVUoUynJKMiKrgKAOAWiWcAzu2LGOrXCeLgFuSrTZX4ZknjnbfTfw2jufWLM6VDyckAAP6XxzNOFXdGBWxS/37jYN0Ut0kY9HXKco15NJdq83Y3DXreKaIuN4vcj+lzSgD60F/11m/O5PAATv7ZaRuI4ILkFtjLpDZROCvVVqWEbKCS8GsqMa5zvRRjzdY8X52uq7T8zMJUW3OXI2Fmjl5nY5xzkxtEhNKzfOSJySIAAA==";

function HeroFill({ image, clips, alt, onReady }: { image: string; clips: string[]; alt: string; onReady?: () => void }) {
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setLoaded(true);
      setFailed(false);
      onReady?.();
      return;
    }
    setLoaded(false);
    setFailed(false);
    const t = setTimeout(() => {
      setLoaded(true);
      onReady?.();
    }, 1200);
    return () => clearTimeout(t);
  }, [image, onReady]);

  useEffect(() => {
    if (clips.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % clips.length), 6000);
    return () => clearInterval(t);
  }, [clips.length]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const raf = requestAnimationFrame(() => void playHomepageVideo(v));
    return () => {
      cancelAnimationFrame(raf);
      pauseHomepageVideo(v);
    };
  }, [idx, clips.length]);

  const clip = clips[idx];

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Edge-filling backdrop preserves a cinematic full-width field without
          cropping the actual foreground artwork. */}
      <img
        src={image}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
        draggable={false}
      />
      {/* Blurred placeholder */}
      <img
        src={HERO_LQIP}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover blur-xl saturate-125 transition-opacity duration-500"
        style={{ opacity: loaded ? 0 : 1 }}
        draggable={false}
      />
      {clip ? (
        <video
          ref={videoRef}
          src={clip}
          muted
          loop
          playsInline
          preload="metadata"
          poster={image}
          disablePictureInPicture
          className="absolute inset-0 h-full w-full object-contain transition-opacity duration-500"
          style={{ opacity: loaded ? 1 : 0 }}
          onLoadedData={() => {
            setLoaded(true);
            onReady?.();
          }}
        />
      ) : (
        <img
          src={image}
          alt={alt}
          width={1400}
          height={1050}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain transition-opacity duration-500"
          style={{ opacity: loaded && !failed ? 1 : 0 }}
          ref={imgRef}
          onLoad={() => {
            setLoaded(true);
            onReady?.();
          }}
          onError={() => {
            setFailed(true);
            onReady?.();
          }}
          draggable={false}
        />
      )}

      {/* cinematic vignette + top light falloff */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 92% 88% at 50% 45%, transparent 70%, oklch(0 0 0 / 22%) 100%)",
        }}
      />
    </div>
  );
}

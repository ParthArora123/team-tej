import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Calendar, Instagram, MapPin, Play, Youtube } from "lucide-react";
import { pauseHomepageVideo, playHomepageVideo } from "@/lib/home-video-playback";

/**
 * EditorialHero — the reference "story board" hero:
 * three editorial columns (philosophy · framed portrait with stat pills ·
 * upcoming studio day) sitting under one centered display title.
 *
 * Everything animates with compositor-only CSS (opacity + transform), so the
 * whole screen stays at 60fps on mobile.
 */
export function EditorialHero({
  founder,
  workshops,
  image,
  clips,
  badges,
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

  const upcoming = useMemo(() => {
    const today = new Date(new Date().toDateString());
    return (workshops || [])
      .filter((w) => w.event_date && new Date(w.event_date) >= today)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }, [workshops]);

  const next = upcoming[0] ?? null;
  const tour = upcoming.slice(1, 4);

  const columns = [
    { k: "Philosophy", t: "Belief", v: belief },
    { k: "Purpose", t: "Vision", v: vision },
    { k: "Our Mission", t: "Movement that Transforms", v: mission },
  ];

  return (
    <section className="relative w-full min-h-[100svh] flex flex-col justify-center px-5 sm:px-8 lg:px-10 pt-24 pb-14 lg:pt-24 lg:pb-10">
      {/* Title block */}
      <header className="relative z-10 mx-auto w-full max-w-7xl text-center">
        <h1 className="ed-rise font-display text-[2.4rem] leading-[0.95] sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight">
          {name.toUpperCase()}
        </h1>
        <p className="ed-rise mt-3 text-[10px] sm:text-xs uppercase tracking-[0.32em] text-muted-foreground" style={{ animationDelay: "90ms" }}>
          Dance Educator <span className="text-primary">•</span> Performer <span className="text-primary">•</span> Choreographer
        </p>
        <p className="ed-rise mt-2 text-sm sm:text-base text-muted-foreground" style={{ animationDelay: "150ms" }}>
          Transforming passion into performance.
        </p>
      </header>

      {/* Three editorial columns */}
      <div className="relative z-10 mx-auto mt-6 lg:mt-7 grid w-full max-w-7xl gap-5 lg:gap-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)_minmax(0,0.95fr)] items-start">
        {/* Left — philosophy stack */}
        <div className="order-2 lg:order-1 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {columns.map((c, i) => (
            <article key={c.t} className="ed-rise ed-card p-4 lg:p-5" style={{ animationDelay: `${220 + i * 80}ms` }}>
              <p className="ed-eyebrow">{c.k}</p>
              <h2 className="mt-1 font-display text-base lg:text-lg font-bold">{c.t}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground line-clamp-5 whitespace-pre-line">{c.v}</p>
            </article>
          ))}
          {(hasMore || socials.instagram || socials.youtube) && (
            <div className="ed-rise flex items-center gap-2 lg:pt-1" style={{ animationDelay: "460ms" }}>
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

        {/* Center — framed media + floating stat pills */}
        <div className="order-1 lg:order-2">
          <div className="relative">
            <HeroFrame image={image} clips={clips} alt={name} onReady={onReady} />

            {/* Floating stats — corner pills, as in the reference */}
            <div className="pointer-events-none absolute inset-0 hidden sm:block">
              {badges.slice(0, 4).map((b, i) => (
                <div
                  key={b.label}
                  className={`ed-rise ed-pill absolute ${
                    ["-left-4 top-6", "-right-4 top-20", "-left-3 bottom-20", "-right-3 bottom-6"][i]
                  }`}
                  style={{ animationDelay: `${420 + i * 90}ms` }}
                >
                  <p className="font-display text-base lg:text-xl font-bold leading-none">{b.value}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{b.label}</p>
                </div>
              ))}
            </div>
          </div>


          {/* Mobile stat row */}
          <div className="mt-3 grid grid-cols-4 gap-2 sm:hidden">
            {badges.slice(0, 4).map((b) => (
              <div key={b.label} className="ed-card px-2 py-2 text-center">
                <p className="font-display text-sm font-bold leading-none">{b.value}</p>
                <p className="mt-1 text-[8px] uppercase tracking-[0.12em] text-muted-foreground">{b.label}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="ed-rise mt-6 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "520ms" }}>
            <button
              type="button"
              onClick={onExplore}
              className="ed-cta group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.14em]"
            >
              Explore Workshops
              <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
            <button
              type="button"
              onClick={onWatch}
              className="inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] text-foreground/80 transition hover:text-primary"
            >
              <Play size={13} /> Watch Performances
            </button>
          </div>
        </div>

        {/* Right — next studio day + tour */}
        <div className="order-3 grid gap-3">
          <article className="ed-rise ed-card p-4 lg:p-5" style={{ animationDelay: "300ms" }}>
            <p className="ed-eyebrow">Next Studio Day{next?.city ? ` · ${next.city}` : ""}</p>
            <h2 className="mt-1 font-display text-base lg:text-lg font-bold">
              {next
                ? `${new Date(next.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "long" })} · ${next.name}`
                : "New dates dropping soon"}
            </h2>
            {next?.venue && (
              <p className="mt-1 inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                <MapPin size={11} /> {next.venue}
              </p>
            )}
            {next?.description && (
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground line-clamp-3">{next.description}</p>
            )}
            {next ? (
              <Link
                to="/workshops/$id"
                params={{ id: String(next.id) }}
                className="ed-cta mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]"
              >
                Register Selected <ArrowUpRight size={13} />
              </Link>
            ) : (
              <Link
                to="/workshops"
                className="ed-cta mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]"
              >
                See all workshops <ArrowUpRight size={13} />
              </Link>
            )}
          </article>

          {tour.length > 0 && (
            <article className="ed-rise ed-card p-4 lg:p-5" style={{ animationDelay: "380ms" }}>
              <p className="ed-eyebrow inline-flex items-center gap-1.5">
                <Calendar size={11} /> Upcoming Tour
              </p>
              <ul className="mt-3 divide-y divide-border">
                {tour.map((w) => (
                  <li key={w.id} className="py-2.5 first:pt-0 last:pb-0">
                    <Link
                      to="/workshops/$id"
                      params={{ id: String(w.id) }}
                      className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold transition group-hover:text-primary">
                          {w.city || w.name}
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground">{w.name}</span>
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {new Date(w.event_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          )}
        </div>
      </div>

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
    </section>
  );
}

function HeroFrame({ image, clips, alt, onReady }: { image: string; clips: string[]; alt: string; onReady?: () => void }) {
  const [idx, setIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    <div className="ed-rise ed-frame relative mx-auto aspect-[4/5] w-full max-w-[26rem] sm:max-w-[30rem] lg:aspect-auto lg:h-[42svh] lg:max-w-none" style={{ animationDelay: "180ms" }}>
      <img
        src={image}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
        draggable={false}
      />
      {clip ? (
        <video
          ref={videoRef}
          key={clip}
          src={clip}
          muted
          loop
          playsInline
          preload="metadata"
          poster={image}
          disablePictureInPicture
          className="absolute inset-0 h-full w-full object-contain"
          onLoadedData={onReady}
        />
      ) : (
        <img
          src={image}
          alt={alt}
          fetchPriority="high"
          decoding="async"
          className="ed-kenburns absolute inset-0 h-full w-full object-contain"
          onLoad={onReady}
          onError={onReady}
          draggable={false}
        />
      )}
    </div>
  );
}

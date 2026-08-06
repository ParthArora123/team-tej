import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Calendar, Clock, Flame, Instagram, MapPin, Navigation as NavigationIcon, Play, Sparkles, Trophy, Users, Youtube } from "lucide-react";
import { buildMapsUrl } from "@/lib/maps-link";

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
    { k: "Mission", t: "Movement that Transforms", v: mission },
  ];

  return (
    <section className="relative w-full min-h-[100svh] px-3 sm:px-6 lg:px-10 pt-24 pb-6 lg:pt-22 lg:pb-8">
      <div className="mx-auto grid w-full max-w-[92rem] gap-5 lg:grid-cols-[minmax(0,67fr)_minmax(0,33fr)] lg:gap-8 lg:items-stretch">

        {/* LEFT — title, portrait, CTAs, then belief/vision/mission */}
        <div className="order-1 flex flex-col justify-center">
          <header className="relative z-10 w-full text-center">
            <h1 className="ed-rise cine-title font-display text-[2.7rem] leading-[0.92] sm:text-6xl lg:text-7xl xl:text-[6rem] font-bold tracking-[-0.03em]">
              {name.toUpperCase()}
            </h1>
            <p className="ed-rise mt-2.5 flex items-center justify-center gap-2 text-[10px] sm:text-[0.85rem] font-extrabold uppercase tracking-[0.2em]" style={{ animationDelay: "90ms" }}>
              <span className="role-educator">Dance Educator</span>
              <span className="text-muted-foreground text-[0.75rem]">•</span>
              <span className="role-performer">Performer</span>
              <span className="text-muted-foreground text-[0.75rem]">•</span>
              <span className="role-choreographer">Choreographer</span>
            </p>
            <p className="ed-rise mt-2 text-sm sm:text-base text-muted-foreground" style={{ animationDelay: "150ms" }}>
              Transforming passion into performance.
            </p>
          </header>

          <div className="relative z-30 mt-4">
            <div className="relative isolate z-30">
              <div aria-hidden className="cine-spot" />
              <HeroFrame image={image} clips={clips} alt={name} onReady={onReady} />
            </div>

            {/* CTAs */}
            <div className="ed-rise mt-5 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "520ms" }}>
              <button
                type="button"
                onClick={onExplore}
                className="ed-cta group inline-flex items-center gap-2 rounded-full px-9 py-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.16em]"
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

          {/* Belief · Vision · Mission — below the hero content */}
          <div className="mt-6 grid content-start gap-2.5 sm:grid-cols-3">
            {columns.map((c, i) => (
              <article key={c.t} className="ed-rise ed-card p-4.5 lg:p-5" style={{ animationDelay: `${220 + i * 80}ms` }}>
                <p className="ed-eyebrow">{c.k}</p>
                <h2 className="mt-1.5 font-display text-lg lg:text-xl font-bold">{c.t}</h2>
                <p className={`mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground whitespace-pre-line ${c.k === "Mission" ? "max-h-32 overflow-y-auto pr-1" : "line-clamp-5"}`}>{c.v}</p>
              </article>
            ))}
          </div>

          {(hasMore || socials.instagram || socials.youtube) && (
            <div className="ed-rise mt-3 flex items-center justify-center gap-2 lg:justify-start" style={{ animationDelay: "460ms" }}>
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

        {/* RIGHT — sticky premium workshop card */}
        <div className="order-2 lg:h-full">
          <div className="lg:sticky lg:top-24 flex flex-col gap-4">
            <article className="ed-rise ed-card group overflow-hidden p-0 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_28px_70px_-30px_color-mix(in_oklab,var(--foreground)_45%,transparent)]" style={{ animationDelay: "300ms" }}>
              {next?.banner_url && (
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <img src={next.banner_url} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl opacity-60" />
                  <img
                    src={next.banner_url}
                    alt={next.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
              )}

              <div className="p-5">
                <p className="ed-eyebrow">Next Studio Day{next?.city ? ` · ${next.city}` : ""}</p>
                <h2 className="mt-1.5 font-display text-lg lg:text-xl font-bold leading-snug">
                  {next ? next.name : "New dates dropping soon"}
                </h2>

                {next && (
                  <div className="mt-3 grid gap-2 text-[12.5px] text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Calendar size={13} className="shrink-0 text-primary" />
                      {new Date(next.event_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    {next.event_time && (
                      <span className="inline-flex items-center gap-2">
                        <Clock size={13} className="shrink-0 text-primary" /> {next.event_time}
                      </span>
                    )}
                    {next.venue && (
                      <a
                        href={buildMapsUrl(next.venue) ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-start gap-2 underline-offset-2 transition hover:text-primary hover:underline"
                      >
                        <MapPin size={13} className="mt-0.5 shrink-0 text-primary" /> <span className="min-w-0">{next.venue}</span>
                      </a>
                    )}
                  </div>
                )}

                {next?.description && (
                  <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground line-clamp-3">{next.description}</p>
                )}

                {next?.venue && (
                  <a
                    href={buildMapsUrl(next.venue) ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition hover:border-primary hover:text-primary"
                  >
                    <NavigationIcon size={11} /> Get Directions
                  </a>
                )}

                {next ? (
                  <Link
                    to="/workshops/$id"
                    params={{ id: String(next.id) }}
                    className="ed-cta mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]"
                  >
                    Register Now <ArrowUpRight size={13} />
                  </Link>
                ) : (
                  <Link
                    to="/workshops"
                    className="ed-cta mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]"
                  >
                    See all workshops <ArrowUpRight size={13} />
                  </Link>
                )}
              </div>
            </article>

            {tour.length > 0 && (
              <article className="ed-rise ed-card p-4.5 lg:p-5" style={{ animationDelay: "380ms" }}>
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
  const frameRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  // Subtle GPU-only pointer parallax on the hero media.
  useEffect(() => {
    const frame = frameRef.current;
    const media = mediaRef.current;
    if (!frame || !media) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = frame.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        media.style.transform = `translate3d(${x * -14}px, ${y * -14}px, 0) scale(1.04)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      media.style.transform = "translate3d(0,0,0) scale(1)";
    };
    frame.addEventListener("pointermove", onMove);
    frame.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      frame.removeEventListener("pointermove", onMove);
      frame.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={frameRef}
      className="ed-rise ed-frame relative mx-auto aspect-[3/4] w-full max-w-[34rem] sm:max-w-[40rem] lg:aspect-auto lg:h-[60svh] lg:max-w-[92%]"
      style={{ animationDelay: "180ms" }}
    >
      <img
        src={image}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
        draggable={false}
      />
      <div
        ref={mediaRef}
        className="absolute inset-0 will-change-transform"
        style={{ transition: "transform 420ms cubic-bezier(0.22,1,0.36,1)" }}
      >
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
      {/* cinematic vignette + top light falloff */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 40%, transparent 55%, oklch(0 0 0 / 45%) 100%)",
        }}
      />
    </div>
  );

}

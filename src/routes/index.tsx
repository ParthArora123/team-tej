import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { cachedCall } from "@/lib/public-data-cache";
import { listPrograms } from "@/lib/catalog.functions";
import { listChoreographies } from "@/lib/choreographies.functions";
import { listPublicGlobe } from "@/lib/content.functions";
import { listDanceStyles } from "@/lib/site-content.functions";

import { HorizontalPager } from "@/components/site/HorizontalPager";
import { pauseHomepageVideo, playHomepageVideo } from "@/lib/home-video-playback";

import uploadedHeroImg from "@/assets/tejasdhoke-hero.jpg.asset.json";
import heroReel from "@/assets/hero-reel.mp4.asset.json";

const isVideoUrl = (u?: string | null) => !!u && /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tejas D Dhoke — Dance Educator, Performer & Choreographer" },
      {
        name: "description",
        content:
          "The official home of Tejas D Dhoke — viral choreographies, world tour dates, the Mindset & Movement method, and live workshop registration.",
      },
      { property: "og:title", content: "Tejas D Dhoke — Dance Educator, Performer & Choreographer" },
      {
        property: "og:description",
        content:
          "Viral choreographies, world tour dates, the Mindset & Movement method, and live workshop registration.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "preload", as: "image", href: uploadedHeroImg.url }],
  }),
  component: Index,
});

/* ------------------------------------------------------------------ */
/* Hero media (video, never cropped — blurred fill behind object-contain) */
/* ------------------------------------------------------------------ */

function HeroMedia({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) void playHomepageVideo(v);
          else pauseHomepageVideo(v);
        }
      },
      { threshold: 0.2 },
    );
    io.observe(v);
    return () => {
      io.disconnect();
      pauseHomepageVideo(v);
    };
  }, []);

  if (!isVideoUrl(src)) {
    return (
      <>
        <img src={src} alt="" aria-hidden className="hero-media-fill" />
        <img src={src} alt="Tejas D Dhoke" className="hero-media" />
      </>
    );
  }

  return (
    <>
      {poster && <img src={poster} alt="" aria-hidden className="hero-media-fill" />}
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        className="hero-media"
      />
    </>
  );
}

/* ------------------------------------------------------------------ */

const DEFAULT_STYLES = [
  "🔥 Bollywood Commercial & Cinematic",
  "⚡ Urban Hip-Hop & Street Grooves",
  "🪔 Devotional & Indian Folk Fusion",
  "🌊 Contemporary & Expressive Flow",
  "💃 Semi-Classical Grace & Technique",
  "🎯 High-Energy Dance Fitness",
  "🎭 Storytelling & Stage Performance",
];

const DEFAULT_TOUR = [
  "Mumbai", "Delhi", "Bengaluru", "Dubai", "London", "New York", "Singapore",
];

const PILLARS = [
  {
    title: "1. Technique",
    desc: "Mastering posture, footwork, core balance, and body mechanics for effortless execution.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path d="M2 12V2h10l10 10V22H12z" />
        <path d="m14 8 3 3" />
        <path d="m12 6 2 2" />
      </svg>
    ),
  },
  {
    title: "2. Expression",
    desc: "Connecting emotion to motion, bringing authenticity and storytelling to every choreography.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path d="M10 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
        <path d="M17 12h.01" />
        <path d="M12 2a10 10 0 0 1 10 10c0 5.5-4.5 10-10 10s-10-4.5-10-10A10 10 0 0 1 12 2z" />
      </svg>
    ),
  },
  {
    title: "3. Musicality",
    desc: "Deepening rhythm control, tempo changes, and beat timing across diverse global sounds.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path d="M2 10v3" /><path d="M6 6v11" /><path d="M10 3v18" />
        <path d="M14 8v7" /><path d="M18 5v13" /><path d="M22 10v3" />
      </svg>
    ),
  },
  {
    title: "4. Stage Presence",
    desc: "Building commanding charisma, spatial control, and authentic connection with audiences.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <circle cx="12" cy="12" r="10" />
        <path d="m12 22 2-6h-4l2 6" /><path d="m14 16.5 6-3" /><path d="m10 16.5-6-3" />
      </svg>
    ),
  },
];

const PROGRAMS = [
  { icon: "✨", title: "Workshops & Events", desc: "High-energy live sessions combining choreography and community energy.", to: "/workshops" },
  { icon: "🎗️", title: "Nritya Sadhana", desc: "A meditative movement exploration focusing on stillness and breath.", to: "/nritya-sadhana" },
  { icon: "👥", title: "DanceFit App & Online", desc: "Structured online learning, live feedback, and dance fitness anywhere.", to: "/online-trainings", app: true },
  { icon: "⚡", title: "The Tej Method", desc: "Core philosophy integrating body awareness and confidence.", to: "/about" },
  { icon: "🚀", title: "Zero to Hero", desc: "A guided beginner-to-performer transformation track.", to: "/zero-to-hero" },
  { icon: "🪔", title: "Bhakti Experience", desc: "A spiritual blend of grace, devotion, and movement.", to: "/nritya-sadhana" },
];

function fmtDate(d?: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
}

function Index() {
  const fetchPrograms = useServerFn(listPrograms);
  const fetchChoreos = useServerFn(listChoreographies);
  const fetchGlobe = useServerFn(listPublicGlobe);
  const fetchStyles = useServerFn(listDanceStyles);

  const [workshops, setWorkshops] = useState<any[]>([]);
  const [choreos, setChoreos] = useState<any[]>([]);
  const [globe, setGlobe] = useState<any[]>([]);
  const [styles, setStyles] = useState<any[]>([]);

  useEffect(() => {
    cachedCall("programs:workshop", () => fetchPrograms({ data: { kind: "workshop" } }))
      .then((r: any) => setWorkshops(r ?? []))
      .catch(() => setWorkshops([]));
    cachedCall("choreographies", () => fetchChoreos())
      .then((r: any) => setChoreos(r ?? []))
      .catch(() => setChoreos([]));
    cachedCall("globe", () => fetchGlobe())
      .then((r: any) => setGlobe(r ?? []))
      .catch(() => setGlobe([]));
    cachedCall("styles", () => fetchStyles())
      .then((r: any) => setStyles(r ?? []))
      .catch(() => setStyles([]));
  }, []);

  const upcoming = useMemo(
    () =>
      workshops
        .filter((w) => w.event_date)
        .sort((a, b) => +new Date(a.event_date) - +new Date(b.event_date)),
    [workshops],
  );
  const nextWorkshop = upcoming[0] ?? workshops[0] ?? null;

  const [month, setMonth] = useState<"august" | "september">("august");
  const monthRows = useMemo(() => {
    const target = month === "august" ? 7 : 8; // 0-indexed months
    const rows = upcoming.filter((w) => new Date(w.event_date).getMonth() === target);
    return rows.length ? rows : upcoming.slice(0, 3);
  }, [upcoming, month]);

  const tourCities = globe.length ? globe.map((g) => `${g.city}`) : DEFAULT_TOUR;
  const styleItems = styles.length ? styles.map((s) => s.name as string) : DEFAULT_STYLES;

  const [activeChoreo, setActiveChoreo] = useState(1);
  const choreoCards = choreos.slice(0, 3);

  /* ---------- registration state (screen 5) ---------- */
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const sessions = useMemo(() => {
    if (!nextWorkshop) return [];
    const base = [
      { id: `${nextWorkshop.id}-s1`, title: nextWorkshop.workshop_1_name || "Session 1", time: nextWorkshop.event_time || "10:00 AM – 12:00 PM", price: nextWorkshop.price_inr ?? 1200 },
    ];
    if (nextWorkshop.workshop_2_name) {
      base.push({
        id: `${nextWorkshop.id}-s2`,
        title: nextWorkshop.workshop_2_name,
        time: nextWorkshop.event_time_2 || "01:00 PM – 03:00 PM",
        price: nextWorkshop.price_inr ?? 1200,
      });
    }
    return base;
  }, [nextWorkshop]);

  return (
    <div className="tej-home">
      <HorizontalPager>
        {/* ================= SCREEN 1 — HERO STAGE ================= */}
        <section id="hero" className="screen-slide">
          <div className="hero-stage">
            {/* LEFT MODULE */}
            <div className="side-module-left">
              <div className="left-sub-panel">
                <span className="module-tag">Philosophy</span>
                <h3 className="module-title">Belief</h3>
                <p className="static-text">
                  Beyond the steps and choreography, dance is a spark that makes us feel alive.
                </p>
              </div>
              <div className="left-sub-panel">
                <span className="module-tag">Purpose</span>
                <h3 className="module-title">Vision</h3>
                <p className="static-text">
                  To create a space where everyone—from absolute beginners to artists—can say, “I belong here.”
                </p>
              </div>
              <div className="left-sub-panel">
                <span className="module-tag">Our Mission</span>
                <h3 className="module-title">Movement that Transforms</h3>
                <div className="scrolling-script-container">
                  <div className="journey-text">
                    Tejas D Dhoke’s journey began with dance, but it never stayed limited to dance. From teaching
                    students in studios to creating viral choreographies, from building DanceFit into a large dance
                    community to launching the DanceFit Studio App, every step of the journey has been about one
                    thing: making dance more accessible, more human, and more transformational.
                    <br />
                    <br />
                    Tej is not just a name, it is a movement built by Tejas D Dhoke and the community around him.
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER HERO COLUMN */}
            <div className="center-hero-col">
              <div className="center-hero-header">
                <h1 className="section-title">Tejas D Dhoke</h1>
                <p className="roles-tag-container">
                  <span className="role-educator">Dance Educator</span>
                  <span className="role-bullet">•</span>
                  <span className="role-performer">Performer</span>
                  <span className="role-bullet">•</span>
                  <span className="role-choreographer">Choreographer</span>
                </p>
                <p className="hero-slogan">Transforming passion into performance</p>
              </div>

              <div className="hero-poster-wrapper">
                <div className="stat-badge badge-top-left">
                  <div className="num">1000+</div>
                  <div className="lbl">workshops</div>
                </div>
                <div className="stat-badge badge-bottom-left">
                  <div className="num">300+</div>
                  <div className="lbl">live performances</div>
                </div>
                <div className="stat-badge badge-top-right">
                  <div className="num">1000k+</div>
                  <div className="lbl">dancers trained</div>
                </div>
                <div className="stat-badge badge-bottom-right">
                  <div className="num">16+</div>
                  <div className="lbl">years on stage</div>
                </div>

                <div className="hero-frame">
                  <HeroMedia src={heroReel.url} poster={uploadedHeroImg.url} />
                </div>
              </div>

              <div className="hero-actions-bottom">
                <Link to="/workshops" className="btn btn-primary">
                  Explore Workshops ↗
                </Link>
                <Link to="/testimonials" className="btn btn-secondary">
                  ▷ Watch Performances
                </Link>
              </div>
            </div>

            {/* RIGHT MODULE */}
            <div className="side-module-right">
              <div className="side-module-card">
                <span className="module-tag">
                  Next Studio Day • {nextWorkshop?.venue?.split(",").pop()?.trim() || "Mumbai"}
                </span>
                <h3 className="module-title" style={{ fontSize: "0.95rem" }}>
                  {nextWorkshop
                    ? `${fmtDate(nextWorkshop.event_date) ?? "Upcoming"} · ${nextWorkshop.name}`
                    : "Masterclass Day"}
                </h3>
                <div className="venue-info-box">
                  <span>📍 {nextWorkshop?.venue || "Byou Studio, Bandra West"}</span>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(nextWorkshop?.venue || "Byou Studio Bandra Mumbai")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Map
                  </a>
                </div>
                <div className="session-checkbox-list">
                  {(sessions.length ? sessions : [{ id: "d1", title: "Full Day Pass (3 Sessions)", time: "10:00 AM – 5:00 PM", price: 2999 }]).map(
                    (s, i) => (
                      <label key={s.id} className={`session-item-option ${i === 0 ? "selected" : ""}`}>
                        <div className="session-info">
                          <span className="session-title">
                            {s.title} {i === 0 && <span className="all-access-badge">Best Value</span>}
                          </span>
                          <span className="session-time">{s.time}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span className="session-price">₹{Number(s.price).toLocaleString("en-IN")}</span>
                          <input type="checkbox" defaultChecked={i === 0} className="custom-checkbox" />
                        </div>
                      </label>
                    ),
                  )}
                </div>
                {nextWorkshop ? (
                  <Link to="/workshops/$id" params={{ id: nextWorkshop.id }} className="btn-widget">
                    Register Selected ↗
                  </Link>
                ) : (
                  <Link to="/workshops" className="btn-widget">
                    Register Selected ↗
                  </Link>
                )}
              </div>

              <div className="upcoming-workshops-frame">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="module-tag" style={{ margin: 0 }}>
                    Upcoming Weekend Tour
                  </span>
                  <div className="city-month-tabs">
                    <button
                      type="button"
                      className={`city-month-btn ${month === "august" ? "active" : ""}`}
                      onClick={() => setMonth("august")}
                    >
                      Aug
                    </button>
                    <button
                      type="button"
                      className={`city-month-btn ${month === "september" ? "active" : ""}`}
                      onClick={() => setMonth("september")}
                    >
                      Sep
                    </button>
                  </div>
                </div>

                <div className="city-schedule-list">
                  {monthRows.length === 0 && (
                    <div className="city-schedule-item">
                      <span className="city-session-desc">New tour dates drop every month — check back soon.</span>
                    </div>
                  )}
                  {monthRows.map((w) => (
                    <Link key={w.id} to="/workshops/$id" params={{ id: w.id }} className="city-schedule-item">
                      <div className="city-item-top">
                        <span className="city-name-badge">📍 {w.venue?.split(",").pop()?.trim() || w.name}</span>
                        <span className="city-date-tag">{fmtDate(w.event_date) ?? "TBA"}</span>
                      </div>
                      <span className="city-session-desc">
                        {w.name}
                        {w.venue ? ` • ${w.venue}` : ""}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SCREEN 2 — WORK & TOUR ================= */}
        <section id="choreo" className="screen-slide">
          <div className="screen-container" style={{ textAlign: "center" }}>
            <p className="section-tag">Iconic Work</p>
            <h2 className="section-title">Choreographies &amp; World Tour</h2>
            <p className="section-desc" style={{ margin: "0 auto 16px auto" }}>
              A showcase of viral choreographies and world tour destinations.
            </p>

            <div className="choreo-coverflow">
              {(choreoCards.length ? choreoCards : [null, null, null]).map((c: any, i: number) => (
                <div
                  key={c?.id ?? i}
                  className={`choreo-card ${i === activeChoreo ? "active" : ""}`}
                  onMouseEnter={() => setActiveChoreo(i)}
                  onClick={() => setActiveChoreo(i)}
                >
                  {c?.thumbnail_url && (
                    <>
                      <img src={c.thumbnail_url} alt="" aria-hidden className="choreo-fill" />
                      <img src={c.thumbnail_url} alt={c.title} loading="lazy" decoding="async" />
                    </>
                  )}
                  <div className="choreo-title">{c?.title ?? "Coming soon"}</div>
                </div>
              ))}
            </div>

            <p className="section-tag" style={{ marginTop: 10 }}>
              Tour Destinations
            </p>
            <div className="tour-pills">
              {tourCities.map((city, i) => (
                <span key={`${city}-${i}`} className="tag-pill">
                  📍 {city}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ================= SCREEN 3 — MINDSET & MOVEMENT ================= */}
        <section id="about" className="screen-slide">
          <div className="screen-container">
            <div className="method-hero-header">
              <p className="section-tag">How We Teach</p>
              <h2 className="section-title section-title-sm" style={{ marginBottom: 4 }}>
                Mindset &amp; Movement
              </h2>
              <p className="section-desc" style={{ margin: "0 auto", maxWidth: 750 }}>
                A 4-pillar learning system designed to help absolute beginners and seasoned dancers express, grow, and
                feel alive.
              </p>
            </div>

            <div className="progression-banner-exact">
              <div className="progression-steps-flow-exact">
                <div className="prog-step-item-exact">
                  <span className="num">01</span> Come move with us
                </div>
                <span className="prog-arrow-exact">→</span>
                <div className="prog-step-item-exact">
                  <span className="num">02</span> Come express with us
                </div>
                <span className="prog-arrow-exact">→</span>
                <div className="prog-step-item-exact">
                  <span className="num">03</span> Come grow with us
                </div>
              </div>
              <div className="prog-banner-tagline-exact">
                “You do not have to be perfect. You do not have to be trained. You do not have to know everything. You
                just have to begin.”
              </div>
            </div>

            <div className="method-pillars-grid-exact">
              {PILLARS.map((p) => (
                <div key={p.title} className="method-pillar-card-exact">
                  <div className="method-icon-box-exact">{p.icon}</div>
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                </div>
              ))}
            </div>

            <div className="embedded-posters-strip">
              {(choreos.slice(0, 3).length ? choreos.slice(0, 3) : [null, null, null]).map((c: any, i: number) => (
                <div key={c?.id ?? i} className="embedded-poster-card">
                  {c?.thumbnail_url && <img src={c.thumbnail_url} alt={c.title} loading="lazy" decoding="async" />}
                  <div className="poster-caption">
                    {c?.title ??
                      ["Studio Masterclass Dynamics", "Tejas & Team Live Stage Sync", "Nritya & Rasa Expression"][i]}
                  </div>
                </div>
              ))}
            </div>

            <div className="audience-strip-exact">
              <div>
                <span className="module-tag">Designed For</span>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 800 }}>Who Benefits Most?</h4>
              </div>
              <div className="audience-tags-container-exact">
                <span className="audience-pill-exact">🌱 Complete Beginners</span>
                <span className="audience-pill-exact">🎭 Actors &amp; Performers</span>
                <span className="audience-pill-exact">🎥 Content Creators</span>
                <span className="audience-pill-exact">🎓 Dance Teachers</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SCREEN 4 — PROGRAMS & STYLES ================= */}
        <section id="programs" className="screen-slide">
          <div className="screen-container">
            <div className="programs-split-container">
              <div>
                <p className="section-tag">Programs &amp; Formats</p>
                <h2 className="section-title section-title-sm">Ways to Train</h2>
                <p className="section-desc" style={{ marginBottom: 20 }}>
                  Signature movement experiences tailored for all levels.
                </p>

                <div className="signature-grid-compact">
                  {PROGRAMS.map((p) => (
                    <div
                      key={p.title}
                      className="signature-card-compact"
                      style={p.app ? { borderColor: "var(--dominant-accent)" } : undefined}
                    >
                      <div className="card-icon">{p.icon}</div>
                      <h3>{p.title}</h3>
                      <p>{p.desc}</p>
                      {p.app ? (
                        <a
                          href="https://dancefitstudio.app"
                          target="_blank"
                          rel="noreferrer"
                          className="app-download-btn"
                        >
                          <span>Download App &amp; Register</span> →
                        </a>
                      ) : (
                        <Link
                          to={p.to}
                          className="text-[0.75rem] font-bold uppercase tracking-wider"
                          style={{ color: "var(--dominant-accent)" }}
                        >
                          Explore →
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="styles-side-panel">
                <p className="section-tag">Dance Disciplines</p>
                <h2 className="section-title section-title-sm">Styles on Floor</h2>
                <p className="section-desc" style={{ marginBottom: 16 }}>
                  Core styles taught in studio masterclasses &amp; online modules.
                </p>
                <div className="styles-list">
                  {styleItems.slice(0, 7).map((s, i) => (
                    <div key={`${s}-${i}`} className="style-item">
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SCREEN 5 — REGISTER & CONTACT ================= */}
        <section id="workshops" className="screen-slide">
          <div className="screen-container">
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <p className="section-tag">Start Moving</p>
              <h2 className="section-title section-title-sm" style={{ marginBottom: 4 }}>
                Book Your Experience
              </h2>
              <p style={{ color: "var(--muted-accent)", fontSize: "0.88rem" }}>
                Select single or multiple workshop sessions from the schedule below:
              </p>
            </div>

            <div className="schedule-form-layout">
              <div className="schedule-table-card">
                <span className="module-tag">Upcoming Multi-Session Days</span>

                {upcoming.slice(0, 2).length === 0 && (
                  <div className="day-group-card">
                    <div className="day-header">
                      <span className="day-date">📅 New dates announced soon</span>
                    </div>
                  </div>
                )}

                {upcoming.slice(0, 2).map((w) => {
                  const rows = [
                    { key: `${w.id}-1`, title: w.workshop_1_name || w.name, time: w.event_time || "10:00 AM – 12:00 PM", price: w.price_inr ?? 1200 },
                    ...(w.workshop_2_name
                      ? [{ key: `${w.id}-2`, title: w.workshop_2_name, time: w.event_time_2 || "01:00 PM – 03:00 PM", price: w.price_inr ?? 1200 }]
                      : []),
                  ];
                  return (
                    <div key={w.id} className="day-group-card">
                      <div className="day-header">
                        <span className="day-date">
                          📅 {fmtDate(w.event_date) ?? "TBA"} • {w.venue || w.name}
                        </span>
                        {w.both_workshops_price_inr && <span className="all-access-badge">All-day pass available</span>}
                      </div>
                      <div className="session-checkbox-list">
                        {rows.map((r) => (
                          <label key={r.key} className={`session-item-option ${picked[r.key] ? "selected" : ""}`}>
                            <div className="session-info">
                              <span className="session-title">{r.title}</span>
                              <span className="session-time">
                                {r.time}
                                {w.venue ? ` • ${w.venue}` : ""}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span className="session-price">₹{Number(r.price).toLocaleString("en-IN")}</span>
                              <input
                                type="checkbox"
                                className="custom-checkbox"
                                checked={!!picked[r.key]}
                                onChange={(e) => setPicked((p) => ({ ...p, [r.key]: e.target.checked }))}
                              />
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="register-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-name">Full Name</label>
                  <input id="reg-name" type="text" className="form-input" placeholder="e.g. John Doe" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-email">Email Address</label>
                  <input id="reg-email" type="email" className="form-input" placeholder="e.g. john@email.com" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-phone">WhatsApp Number (For Updates)</label>
                  <input id="reg-phone" type="tel" className="form-input" placeholder="+91 98765 43210" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-pass">Pass Preference</label>
                  <select id="reg-pass" className="form-input">
                    {upcoming.slice(0, 3).map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} — ₹{Number(w.price_inr ?? 0).toLocaleString("en-IN")}
                      </option>
                    ))}
                    <option value="selected">Selected Individual Sessions (Checked on Left)</option>
                  </select>
                </div>
                {nextWorkshop ? (
                  <Link
                    to="/workshops/$id"
                    params={{ id: nextWorkshop.id }}
                    className="btn btn-primary"
                    style={{ marginTop: 6, justifyContent: "center" }}
                  >
                    Register &amp; Pay Now ↗
                  </Link>
                ) : (
                  <Link to="/workshops" className="btn btn-primary" style={{ marginTop: 6, justifyContent: "center" }}>
                    Register &amp; Pay Now ↗
                  </Link>
                )}
              </div>
            </div>

            <div className="company-contact-banner">
              <div className="company-contact-item">
                <strong>🏢 Office Address:</strong> TEJ Dance Movements, Bandra West, Mumbai, India - 400050
              </div>
              <div className="company-contact-item">
                <strong>📞 Contact:</strong> <Link to="/contact">Get in touch</Link>
              </div>
              <div className="company-contact-item">
                <strong>✉️ Email:</strong> contact@tejmoves.com
              </div>
            </div>

            <footer style={{ marginTop: 16, textAlign: "center", color: "var(--muted-accent)", fontSize: "0.78rem" }}>
              <p>© {new Date().getFullYear()} Tejas D Dhoke. All rights reserved.</p>
            </footer>
          </div>
        </section>
      </HorizontalPager>
    </div>
  );
}

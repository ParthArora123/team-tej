function CinematicShowreel({ choreos, workshops }: { choreos: Choreo[]; workshops: any[] }) {
  const items = useMemo(() => buildReelItems(choreos, workshops), [choreos, workshops]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  // The stage's own aspect ratio adapts to whatever clip is playing, so a
  // portrait phone clip is never cropped *or* letterboxed — the frame just
  // matches the footage. Clamped to sane bounds so one odd file can't blow
  // out the layout.
  const [stageAspect, setStageAspect] = useState(16 / 9);
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const hasItems = items && items.length > 0;
  const active = hasItems ? items[activeIndex % items.length] : null;

  // The deck auto-shuffles on a timer — the front card cycles to the back
  // of the stack, like flipping through a physical deck of video cards.
  useEffect(() => {
    if (!inView || paused || !hasItems || items.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % items.length);
    }, 10000);
    return () => clearInterval(id);
  }, [inView, paused, hasItems, items.length]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (inView) {
      v.muted = muted;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [inView, activeIndex, muted]);

  if (!hasItems || !active) return null;

  const goTo = (i: number) => setActiveIndex(((i % items.length) + items.length) % items.length);

  const applyAspect = (w: number, h: number) => {
    if (!w || !h) return;
    const ratio = Math.min(1.9, Math.max(0.56, w / h)); // clamp between portrait 9:16-ish and wide 1.9:1
    setStageAspect(ratio);
  };

  // Swiping the front card off the deck — left advances, right goes back —
  // is the literal "flip through a pack of cards" gesture on touch/mouse.
  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 90;
    if (info.offset.x < -threshold || info.velocity.x < -500) {
      setActiveIndex((idx) => (idx + 1) % items.length);
    } else if (info.offset.x > threshold || info.velocity.x > 500) {
      setActiveIndex((idx) => (idx - 1 + items.length) % items.length);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) v.play().catch(() => {});
  };

  const goFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const el: any = videoRef.current ?? iframeRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.webkitEnterFullscreen) el.webkitEnterFullscreen();
    } catch {}
  };

  // Depth 0 = front of the deck (playing). Cards fan out behind it, capped
  // so the stack doesn't get visually noisy with a long reel.
  const maxDepth = Math.min(items.length - 1, 4);
  const deck: { it: ReelItem; i: number; depth: number }[] = items
    .map((it, i) => ({ it, i, depth: (i - activeIndex + items.length) % items.length }))
    .filter((c) => c.depth <= maxDepth)
    .sort((a, b) => b.depth - a.depth); // back cards render first

  return (
    <section
      ref={sectionRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="max-w-5xl mx-auto px-6 lg:px-10 py-24 border-t border-border"
    >
      <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary inline-flex items-center gap-1.5">
            <Play size={12} /> On screen
          </p>
          <h2 className="mt-3 font-display text-4xl lg:text-6xl font-bold text-balance leading-[1.02]">
            The <span className="italic font-light">showreel.</span>
          </h2>
        </div>
        <p className="hidden sm:block max-w-sm text-sm text-muted-foreground">
          Choreography drops and workshop highlights — the deck shuffles on its own, or drag the top card to flip through it yourself.
        </p>
      </div>

      {/* THE DECK */}
      {items.length > 1 && items[(activeIndex + 1) % items.length].videoSrc && (
        <video
          key={`preload-${items[(activeIndex + 1) % items.length].id}`}
          src={items[(activeIndex + 1) % items.length].videoSrc as string}
          preload="auto"
          muted
          playsInline
          aria-hidden
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        />
      )}
      <div className="relative mx-auto w-full" style={{ aspectRatio: stageAspect, transition: "aspect-ratio 0.5s ease", maxHeight: "78vh" }}>
        {deck.map(({ it, i, depth }) => {
          const isFront = depth === 0;
          const offsetX = depth * 18;
          const offsetY = depth * 12;
          const rotate = depth === 0 ? 0 : (i % 2 === 0 ? 1 : -1) * (4 + depth * 2);
          const scale = 1 - depth * 0.055;
          return (
            <motion.div
              key={it.id}
              onClick={() => !isFront && goTo(i)}
              drag={isFront && items.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.85}
              onDragEnd={isFront ? handleDragEnd : undefined}
              whileDrag={{ scale: 1.02 }}
              animate={{
                x: offsetX,
                y: offsetY,
                rotate,
                scale,
                opacity: 1,
              }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ zIndex: 50 - depth, touchAction: isFront ? "pan-y" : undefined }}
              className={`absolute inset-0 rounded-3xl overflow-hidden bg-secondary border ${
                isFront
                  ? `border-accent-gold/40 shadow-[0_30px_80px_-30px_oklch(0.56_0.15_66/0.35)] ${items.length > 1 ? "cursor-grab active:cursor-grabbing" : ""}`
                  : "border-border cursor-pointer"
              }`}
            >
              {isFront ? (
                <>
                  {active.embedSrc ? (
                    <iframe
                      ref={iframeRef}
                      src={`${active.embedSrc}?autoplay=1&mute=1&playsinline=1&rel=0`}
                      title={active.title}
                      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  ) : active.videoSrc ? (
                    <video
                      ref={(node) => {
                        videoRef.current = node;
                        if (node) {
                          // Server-rendered markup can omit the `muted` DOM
                          // attribute (React treats it as a property, not an
                          // HTML attribute), which makes browsers block
                          // autoplay until state syncs post-hydration. Setting
                          // it imperatively here guarantees playback starts
                          // immediately, with no click needed.
                          node.muted = muted;
                          node.play().catch(() => {});
                        }
                      }}
                      src={active.videoSrc}
                      poster={active.poster ?? undefined}
                      autoPlay
                      muted={muted}
                      loop
                      playsInline
                      preload="auto"
                      onLoadedMetadata={(e) => {
                        const v = e.currentTarget;
                        applyAspect(v.videoWidth, v.videoHeight);
                      }}
                      onError={() => {
                        // A clip that fails to load shouldn't sit stuck as the
                        // front card for the whole 10s interval — skip ahead.
                        if (items.length > 1) setActiveIndex((i) => (i + 1) % items.length);
                      }}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : active.poster ? (
                    <img
                      src={active.poster}
                      alt={active.title}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        applyAspect(img.naturalWidth, img.naturalHeight);
                      }}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent-gold/30" />
                  )}

                  <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-14 sm:h-20 bg-gradient-to-b from-foreground/60 to-transparent" />
                  <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-32 sm:h-40 bg-gradient-to-t from-foreground/85 via-foreground/35 to-transparent" />

                  <span className="absolute top-4 left-4 sm:top-6 sm:left-6 text-[11px] uppercase tracking-widest text-primary-foreground bg-accent-gold/25 backdrop-blur-sm px-3 py-1 rounded-full border border-accent-gold/50">
                    {active.badge}
                  </span>

                  <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
                    {active.videoSrc && !active.embedSrc && (
                      <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}
                        className="h-9 w-9 grid place-items-center rounded-full bg-accent-gold/20 backdrop-blur-sm border border-accent-gold/40 text-primary-foreground hover:bg-accent-gold/35 transition">
                        <MuteToggleIcon muted={muted} />
                      </button>
                    )}
                    <button type="button" onClick={goFullscreen} aria-label="Expand to fullscreen"
                      className="h-9 w-9 grid place-items-center rounded-full bg-accent-gold/20 backdrop-blur-sm border border-accent-gold/40 text-primary-foreground hover:bg-accent-gold/35 transition">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                    </button>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-accent-gold">{active.subtitle}</p>
                      <h3 className="mt-1 font-display text-2xl sm:text-4xl font-bold text-primary-foreground drop-shadow-md leading-snug max-w-xl">
                        {active.title}
                      </h3>
                    </div>
                    {active.ctaLabel && active.ctaLink && (
                      active.ctaExternal ? (
                        <a href={active.ctaLink} target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-gold text-foreground text-sm font-medium hover:opacity-90 transition shrink-0">
                          {active.ctaLabel} <ArrowUpRight size={16} />
                        </a>
                      ) : (
                        <Link to={active.ctaLink} onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-gold text-foreground text-sm font-medium hover:opacity-90 transition shrink-0">
                          {active.ctaLabel} <ArrowUpRight size={16} />
                        </Link>
                      )
                    )}
                  </div>
                </>
              ) : (
                <>
                  {it.poster ? (
                    <img src={it.poster} alt={it.title} loading="lazy" decoding="async"
                      className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent-gold/30" />
                  )}
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
                  <span className="absolute top-3 left-3 text-[10px] uppercase tracking-widest text-primary-foreground bg-accent-gold/25 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-accent-gold/40">
                    {it.badge}
                  </span>
                  <span className="absolute bottom-3 left-3 right-3 text-xs font-medium text-primary-foreground line-clamp-1">
                    {it.title}
                  </span>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* deck position dots */}
      {items.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Bring ${it.title} to front`}
              aria-current={i === activeIndex}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-primary/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

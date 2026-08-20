let activeVideo: HTMLVideoElement | null = null;

/** Videos that asked to play while Safari refused autoplay — retried on the first gesture. */
const pendingGesturePlay = new Set<HTMLVideoElement>();
let gestureHookInstalled = false;

function stop(video: HTMLVideoElement) {
  try {
    video.pause();
    if (video.currentTime > 0) video.currentTime = 0;
  } catch {
    /* ignore */
  }
}

function release(video: HTMLVideoElement) {
  stop(video);
  try {
    video.removeAttribute("src");
    // Safari keeps the decoder + connection alive until an explicit load().
    video.load();
  } catch {
    /* ignore */
  }
}

/**
 * Safari (iOS especially) rejects `play()` with NotAllowedError until a user
 * gesture has happened on the document. Instead of retrying in a loop — which
 * thrashes the decoder and causes the stutter/freeze — we park the element and
 * resume it once on the next real interaction.
 */
function installGestureHook() {
  if (gestureHookInstalled || typeof document === "undefined") return;
  gestureHookInstalled = true;
  const flush = () => {
    const queued = Array.from(pendingGesturePlay);
    pendingGesturePlay.clear();
    // Only the currently-active element is resumed: never two at once.
    for (const v of queued) {
      if (v === activeVideo && v.isConnected) void v.play().catch(() => undefined);
    }
  };
  const opts = { passive: true } as AddEventListenerOptions;
  document.addEventListener("touchend", flush, opts);
  document.addEventListener("pointerup", flush, opts);
  document.addEventListener("click", flush, opts);
  document.addEventListener("keydown", flush, opts);
}

/**
 * Single-player registry for every homepage video. Playing one clip always
 * pauses + rewinds whichever clip was playing before, so no two videos ever
 * consume decode/network bandwidth at the same time.
 */
/**
 * Safari only honours muted-autoplay when the element is *already* muted at the
 * moment the source starts loading. React assigns the `muted` prop after `src`,
 * so the very first card on a fresh page load gets refused. Call this from a ref
 * callback — it runs before the browser kicks off the network request.
 */
export function primeVideoElement(video: HTMLVideoElement | null) {
  if (!video) return;
  // A user has explicitly unmuted this element — never force it back to muted,
  // otherwise the first "unmute" tap is silently reverted by the next play().
  const soundAllowed = video.dataset["soundOn"] === "1";
  if (!soundAllowed) {
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
  }
  video.autoplay = true;
  video.playsInline = true;
  video.setAttribute("autoplay", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
}

/** Mark/unmark an element as user-unmuted so autoplay priming keeps its sound. */
export function setVideoSoundAllowed(video: HTMLVideoElement | null, allowed: boolean) {
  if (!video) return;
  if (allowed) {
    video.dataset["soundOn"] = "1";
    video.removeAttribute("muted");
    video.defaultMuted = false;
    video.muted = false;
  } else {
    delete video.dataset["soundOn"];
    video.muted = true;
  }
}

/**
 * Attach the source only after muted/inline autoplay has been established.
 * Safari can inspect a declarative React `src` before the ref callback runs,
 * permanently classifying that first load as non-autoplay media.
 */
export function prepareHomepageVideo(video: HTMLVideoElement | null, src: string) {
  if (!video) return;
  primeVideoElement(video);
  if (video.getAttribute("src") === src) return;
  video.setAttribute("src", src);
  video.load();
}

export function playHomepageVideo(video: HTMLVideoElement) {
  if (activeVideo && activeVideo !== video) stop(activeVideo);

  activeVideo = video;
  pendingGesturePlay.delete(video);
  primeVideoElement(video);
  if (!video.paused) return Promise.resolve();

  installGestureHook();

  // A freshly-mounted element often has no decoded frames yet: play() then
  // rejects with AbortError ("interrupted by a new load request"). Retry once
  // the media is actually ready instead of leaving the card frozen on poster.
  const retryWhenReady = () => {
    if (video !== activeVideo || !video.isConnected || !video.paused) return;
    void video.play().catch((err: unknown) => {
      if ((err as { name?: string } | null)?.name !== "AbortError") pendingGesturePlay.add(video);
    });
  };
  video.addEventListener("loadeddata", retryWhenReady, { once: true });
  video.addEventListener("canplay", retryWhenReady, { once: true });

  const attempt = video.play();
  if (!attempt || typeof attempt.catch !== "function") return Promise.resolve();
  return attempt.catch((err: unknown) => {
    // Autoplay refused / interrupted / unsupported source: stay on the poster
    // and wait for a gesture rather than hammering play().
    const name = (err as { name?: string } | null)?.name;
    if (name !== "AbortError") pendingGesturePlay.add(video);
    if (video.readyState >= 2) retryWhenReady();
    return undefined;
  });
}


export function pauseHomepageVideo(video: HTMLVideoElement) {
  stop(video);
  pendingGesturePlay.delete(video);
  if (activeVideo === video) activeVideo = null;
}

/** Fully release network/decoder resources for media that has left its stage. */
export function releaseHomepageVideo(video: HTMLVideoElement) {
  release(video);
  pendingGesturePlay.delete(video);
  if (activeVideo === video) activeVideo = null;
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && activeVideo) {
      try {
        activeVideo.pause();
      } catch {
        /* ignore */
      }
    }
  });
  // Safari bfcache: leaving with a live decoder is the classic "glitched video
  // on back-navigation" source.
  window.addEventListener("pagehide", () => {
    if (activeVideo) stop(activeVideo);
  });
}

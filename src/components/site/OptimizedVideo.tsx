import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { pauseHomepageVideo, playHomepageVideo, prepareHomepageVideo, releaseHomepageVideo } from "@/lib/home-video-playback";
import { isIOSDevice, isSafariBrowser, pickVideoSource } from "@/lib/video-source";
import { capturePosterFrame } from "@/lib/poster-frame";


const IS_IOS = isIOSDevice();
/** WebKit caps simultaneous inline decoders — never warm a second clip there. */
const NO_WARM_PRIME = IS_IOS || isSafariBrowser();

export type OptimizedVideoProps = {
  /** High-quality master used on desktop. */
  desktopSrc?: string | null;
  /** Optimized 720p H.264 MP4 used on iOS / Android / tablets / slow links. */
  mobileSrc?: string | null;
  /** Dance poster — the only visual shown whenever the clip is not actually playing. */
  poster?: string | null;
  alt?: string;
  /** Play when true; pause + rewind when false. */
  play: boolean;
  muted?: boolean;
  /** Eager poster decode for the active/near card. */
  priority?: boolean;
  /** Non-playing neighbour: fetch metadata only so the next switch starts instantly. */
  warm?: boolean;
  className?: string;
};

/**
 * Poster-first video surface.
 *
 * Contract (mandatory behaviour):
 *   not playing / loading / buffering / stalled / errored / paused -> dance poster
 *   actually playing (native `playing` event)                     -> video, cross-faded in
 *
 * The element never gets a `src` until it is asked to play, the mobile 720p
 * encode is chosen before the first byte is requested, and only one clip is
 * ever active thanks to the shared homepage playback registry.
 */
export const OptimizedVideo = memo(function OptimizedVideo({
  desktopSrc,
  mobileSrc,
  poster,
  alt = "",
  play,
  muted = true,
  priority = false,
  warm = false,
  className = "absolute inset-0 h-full w-full object-contain",
}: OptimizedVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [showing, setShowing] = useState(false);
  const [failed, setFailed] = useState(false);
  const nudges = useRef(0);

  const src = pickVideoSource({ desktopSrc, mobileSrc });

  // No stored thumbnail? Derive one from the clip's own first frame in the
  // browser — no database column, no server round-trip.
  const [autoPoster, setAutoPoster] = useState<string | null>(null);
  const [autoPending, setAutoPending] = useState(false);
  useEffect(() => {
    setAutoPoster(null);
    if (poster || !src) {
      setAutoPending(false);
      return;
    }
    let alive = true;
    setAutoPending(true);
    void capturePosterFrame(src).then((p) => {
      if (!alive) return;
      setAutoPoster(p);
      setAutoPending(false);
    });
    return () => { alive = false; };
  }, [poster, src]);

  const effectivePoster = poster ?? autoPoster;
  /** Capture failed (tainted canvas / decode error): show a paused frame instead. */
  const frameFallback = !effectivePoster && !autoPending && !!src;

  const [posterPainted, setPosterPainted] = useState(!poster);

  // Any source or intent change puts the poster back on top immediately
  // (layout effect => happens in the same commit as the carousel switch).
  useLayoutEffect(() => {
    setShowing(false);
    setFailed(false);
    setPosterPainted(!effectivePoster && !autoPending);
    nudges.current = 0;
  }, [src, play, effectivePoster, autoPending]);


  useEffect(() => {
    const v = ref.current;
    if (!v || !posterPainted) return;
    v.muted = play ? muted : true;

    if (!play) {
      pauseHomepageVideo(v);
      setShowing(false);
      return;
    }

    const tryPlay = () => {
      if (v.paused) void playHomepageVideo(v);
    };
    // The video is revealed only once a real frame has been painted: we prefer
    // requestVideoFrameCallback, and fall back to `playing` + a non-zero
    // currentTime. `canplay` alone never reveals, so a black/blank frame can't
    // appear over the poster.
    let rvfcHandle = 0;
    const reveal = () => setShowing(true);
    type WithRVFC = HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
      cancelVideoFrameCallback?: (handle: number) => void;
    };
    const vf = v as WithRVFC;
    const onPlaying = () => {
      if (typeof vf.requestVideoFrameCallback === "function") {
        rvfcHandle = vf.requestVideoFrameCallback(reveal);
      } else if (v.readyState >= 2 && v.currentTime > 0) {
        reveal();
      } else {
        v.addEventListener("timeupdate", onTimeUpdate);
      }
    };
    const onTimeUpdate = () => {
      if (v.currentTime > 0 && !v.paused) {
        v.removeEventListener("timeupdate", onTimeUpdate);
        reveal();
      }
    };
    const onHold = () => {
      if (rvfcHandle && typeof vf.cancelVideoFrameCallback === "function") {
        vf.cancelVideoFrameCallback(rvfcHandle);
        rvfcHandle = 0;
      }
      setShowing(false);
    };
    const onSoftStall = () => {
      setShowing(false);
      // Bounded nudges — no reload loops, no infinite retries.
      if (nudges.current++ < 2) window.setTimeout(tryPlay, 1200);
    };
    // Decode error / unsupported codec / dead network: unmount the element and
    // keep the poster on screen forever instead of a broken black player.
    const onError = () => {
      onHold();
      setFailed(true);
    };


    v.addEventListener("loadedmetadata", tryPlay);
    v.addEventListener("loadeddata", tryPlay);
    v.addEventListener("canplay", tryPlay);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("pause", onHold);
    v.addEventListener("waiting", onSoftStall);
    v.addEventListener("stalled", onSoftStall);
    v.addEventListener("error", onError);
    v.addEventListener("seeking", onHold);
    v.addEventListener("emptied", onHold);
    v.addEventListener("ended", onHold);
    v.addEventListener("abort", onHold);
    tryPlay();

    return () => {
      v.removeEventListener("loadedmetadata", tryPlay);
      v.removeEventListener("loadeddata", tryPlay);
      v.removeEventListener("canplay", tryPlay);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("pause", onHold);
      v.removeEventListener("waiting", onSoftStall);
      v.removeEventListener("stalled", onSoftStall);
      v.removeEventListener("error", onError);
      v.removeEventListener("seeking", onHold);
      v.removeEventListener("emptied", onHold);
      v.removeEventListener("ended", onHold);
      v.removeEventListener("abort", onHold);
      v.removeEventListener("timeupdate", onTimeUpdate);
      if (rvfcHandle && typeof vf.cancelVideoFrameCallback === "function") {
        vf.cancelVideoFrameCallback(rvfcHandle);
      }
    };
  }, [play, muted, src, posterPainted]);

  // Lookahead: while this clip is the *next* one, prime a short buffer without
  // playing it. iOS ignores `preload` until a user gesture, so we nudge the
  // element with a muted play/pause to fill the first seconds, then park it.
  useEffect(() => {
    const v = ref.current;
    if (!v || !posterPainted || play || !warm || !src || NO_WARM_PRIME) return;
    let cancelled = false;
    let started = false;

    const buffered = () => {
      try {
        return v.buffered.length ? v.buffered.end(v.buffered.length - 1) : 0;
      } catch {
        return 0;
      }
    };

    const stopWhenReady = () => {
      if (cancelled) return;
      if (buffered() >= 2 || v.readyState >= 3) {
        v.pause();
        try {
          v.currentTime = 0;
        } catch {
          /* ignore */
        }
      }
    };

    const prime = () => {
      if (cancelled || started) return;
      started = true;
      v.muted = true;
      const p = v.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          if (cancelled) return;
          window.setTimeout(stopWhenReady, 350);
        }).catch(() => {
          /* autoplay refused — `preload` still buffers what it can */
        });
      }
    };

    v.addEventListener("progress", stopWhenReady);
    v.addEventListener("canplay", stopWhenReady);
    v.addEventListener("loadeddata", prime);
    if (v.readyState >= 2) prime();
    else v.load();

    return () => {
      cancelled = true;
      v.removeEventListener("progress", stopWhenReady);
      v.removeEventListener("canplay", stopWhenReady);
      v.removeEventListener("loadeddata", prime);
      v.pause();
    };
  }, [play, warm, src, posterPainted]);

  // Release decoder + in-flight bytes on unmount.
  useEffect(() => {
    const v = ref.current;
    return () => {
      if (v) releaseHomepageVideo(v);
    };
  }, []);

  return (
    <>
      {effectivePoster && (
        <img
          src={effectivePoster}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={() => {
            // Wait until the loaded thumbnail has crossed a real paint boundary
            // before attaching the video source. This prevents a fast cached
            // clip from winning the race and exposing its first frame first.
            requestAnimationFrame(() => requestAnimationFrame(() => setPosterPainted(true)));
          }}
          onError={() => setPosterPainted(true)}
          className={className}
          style={{
            opacity: showing ? 0 : 1,
            transition: "opacity 260ms ease",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
      )}
      {/* Last-resort thumbnail: a paused, metadata-only frame of the clip
          itself when the canvas capture was blocked. */}
      {frameFallback && (
        <video
          src={`${src}#t=0.1`}
          muted
          playsInline
          preload="metadata"
          aria-hidden
          tabIndex={-1}
          className={className}
          style={{
            opacity: showing ? 0 : 1,
            transition: "opacity 260ms ease",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
      )}
      {/* One persistent element for the active clip AND the single lookahead
          neighbour: the buffer built while warm survives the switch, so
          playback starts without a fresh network round-trip. */}
      {posterPainted && (play || (warm && !NO_WARM_PRIME)) && src && !failed && (
        <video
          key={src}
          ref={(element) => {
            ref.current = element;
            if (element) prepareHomepageVideo(element, src);
          }}
          poster={effectivePoster ?? undefined}

          muted
          loop
          playsInline
          preload="auto"
          disableRemotePlayback
          disablePictureInPicture
          aria-hidden={!play}
          tabIndex={-1}
          className={className}
          style={{
            opacity: showing ? 1 : 0,
            transition: "opacity 200ms ease",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
});

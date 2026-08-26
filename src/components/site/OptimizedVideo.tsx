import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { pauseHomepageVideo, playHomepageVideo, prepareHomepageVideo, releaseHomepageVideo } from "@/lib/home-video-playback";
import { isIOSDevice, isSafariBrowser, pickVideoSource } from "@/lib/video-source";

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

  // Any source or intent change puts the poster back on top immediately
  // (layout effect => happens in the same commit as the carousel switch).
  useLayoutEffect(() => {
    setShowing(false);
    setFailed(false);
    nudges.current = 0;
  }, [src, play]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = play ? muted : true;

    if (!play) {
      pauseHomepageVideo(v);
      setShowing(false);
      return;
    }

    // Re-assert the user's audio preference *after* every play attempt: the
    // playback registry primes elements muted for autoplay, so without this the
    // newly active clip would stay silent until some later render.
    const applyMute = () => {
      const want = play ? muted : true;
      if (v.muted !== want) v.muted = want;
      if (!want) v.removeAttribute("muted");
    };
    const tryPlay = () => {
      applyMute();
      if (v.paused) void playHomepageVideo(v).then(applyMute);
      applyMute();
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
      applyMute();
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
      // Bounded, immediate nudges — never an artificial wait before playback.
      if (nudges.current++ < 3) tryPlay();
    };
    // Decode error / unsupported codec / dead network: unmount the element and
    // keep the poster on screen forever instead of a broken black player.
    const onError = () => {
      onHold();
      setFailed(true);
    };


    v.addEventListener("volumechange", applyMute);
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
      v.removeEventListener("volumechange", applyMute);
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
  }, [play, muted, src]);

  // Lookahead: while this clip is the *next* one, prime a short buffer without
  // playing it. iOS ignores `preload` until a user gesture, so we nudge the
  // element with a muted play/pause to fill the first seconds, then park it.
  useEffect(() => {
    const v = ref.current;
    if (!v || play || !warm || !src || NO_WARM_PRIME) return;
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
          stopWhenReady();
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
  }, [play, warm, src]);

  // Release decoder + in-flight bytes on unmount.
  useEffect(() => {
    const v = ref.current;
    return () => {
      if (v) releaseHomepageVideo(v);
    };
  }, []);

  return (
    <>
      {poster && (
        <img
          src={poster}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
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
      {(play || (warm && !NO_WARM_PRIME)) && src && !failed && (
        <video
          key={src}
          ref={(element) => {
            ref.current = element;
            if (element) prepareHomepageVideo(element, src);
          }}
          poster={poster ?? undefined}
          muted={play ? muted : true}
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

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { pauseHomepageVideo, playHomepageVideo, releaseHomepageVideo } from "@/lib/home-video-playback";
import { isIOSDevice, pickVideoSource } from "@/lib/video-source";

const IS_IOS = isIOSDevice();

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
  const nudges = useRef(0);

  const src = pickVideoSource({ desktopSrc, mobileSrc });

  // Any source or intent change puts the poster back on top immediately
  // (layout effect => happens in the same commit as the carousel switch).
  useLayoutEffect(() => {
    setShowing(false);
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

    v.addEventListener("loadedmetadata", tryPlay);
    v.addEventListener("loadeddata", tryPlay);
    v.addEventListener("canplay", tryPlay);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("pause", onHold);
    v.addEventListener("waiting", onSoftStall);
    v.addEventListener("stalled", onSoftStall);
    v.addEventListener("error", onHold);
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
      v.removeEventListener("error", onHold);
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
      {!play && warm && src && (
        <video
          src={src}
          muted
          playsInline
          preload="metadata"
          disableRemotePlayback
          disablePictureInPicture
          aria-hidden
          tabIndex={-1}
          className={className}
          style={{ opacity: 0, pointerEvents: "none" }}
        />
      )}
      {play && src && (
        <video
          ref={ref}
          src={src}
          poster={poster ?? undefined}
          muted
          loop
          playsInline
          preload={IS_IOS ? "metadata" : "auto"}
          disableRemotePlayback
          disablePictureInPicture
          className={className}
          style={{ opacity: showing ? 1 : 0, transition: "opacity 200ms ease", zIndex: 1 }}
        />
      )}
    </>
  );
});

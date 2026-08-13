import { memo, useCallback, useEffect, useRef, useState } from "react";
import { pauseHomepageVideo, playHomepageVideo, releaseHomepageVideo } from "@/lib/home-video-playback";
import { pickVideoSource, useDeviceProfile } from "@/lib/video-source";

type OptimizedVideoProps = {
  /** High-quality master used on desktop. */
  desktopSrc?: string | null;
  /** 720p–1080p H.264 encode preferred on iOS/Android/slow links. */
  mobileSrc?: string | null;
  poster?: string | null;
  /** This element is the one the user is looking at. */
  active: boolean;
  /** The active element may play (section in view, tab visible). */
  playing?: boolean;
  /** Warm neighbour: allowed to buffer quietly, never to play. */
  warm?: boolean;
  muted?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Fires when a real frame is decoded, so callers can cross-fade a poster. */
  onReadyChange?: (ready: boolean) => void;
};

/**
 * Single reusable media element for every homepage video surface.
 *
 * Responsibilities: device/network aware source selection, lazy mounting,
 * poster-first paint, iOS-safe autoplay (muted + playsInline + gesture-free
 * retry on native events), bounded error recovery, and release of decoder /
 * network resources once the element is no longer needed. Playback is routed
 * through the shared registry so only one video ever plays at a time.
 *
 * No polling loops, no rAF, no per-timeupdate state updates.
 */
export const OptimizedVideo = memo(function OptimizedVideo({
  desktopSrc,
  mobileSrc,
  poster,
  active,
  playing = true,
  warm = false,
  muted = true,
  className,
  style,
  onReadyChange,
}: OptimizedVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const profile = useDeviceProfile();
  const [ready, setReady] = useState(false);
  const errors = useRef(0);

  const src = pickVideoSource({ desktopSrc, mobileSrc }, profile);

  /**
   * iOS caps simultaneous inline decoders and drops the visible clip when
   * neighbours are mounted, so only the active element ever gets a source
   * there. Elsewhere the immediate neighbour may buffer for instant switching.
   */
  const shouldMount = !!src && (active || (warm && !profile.ios));

  useEffect(() => {
    setReady(false);
    onReadyChange?.(false);
    errors.current = 0;
  }, [src, onReadyChange]);

  // Release network + decoder as soon as the element stops being needed.
  useEffect(() => {
    const v = ref.current;
    if (!v || shouldMount) return;
    releaseHomepageVideo(v);
    setReady(false);
    onReadyChange?.(false);
  }, [shouldMount, onReadyChange]);

  useEffect(() => {
    const v = ref.current;
    return () => {
      if (v) releaseHomepageVideo(v);
    };
  }, []);

  // Play/pause driven purely by props; the registry guarantees exclusivity.
  useEffect(() => {
    const v = ref.current;
    if (!v || !shouldMount) return;
    v.muted = active ? muted : true;
    if (active && playing) void playHomepageVideo(v);
    else pauseHomepageVideo(v);
  }, [active, playing, muted, shouldMount]);

  const markReady = useCallback(() => {
    setReady((r) => {
      if (!r) onReadyChange?.(true);
      return true;
    });
  }, [onReadyChange]);

  /** Safari sometimes rejects the first autoplay; retry on readiness events. */
  const onCanPlay = useCallback(() => {
    markReady();
    const v = ref.current;
    if (v && active && playing && v.paused) void playHomepageVideo(v);
  }, [active, playing, markReady]);

  /**
   * `stalled` / `waiting` are transient — showing the poster and letting the
   * browser recover beats reloading, which restarts the download. Only a hard
   * `error` triggers a reload, and at most twice.
   */
  const onError = useCallback(() => {
    const v = ref.current;
    if (!v || errors.current >= 2) return;
    errors.current += 1;
    const delay = 800 * errors.current;
    window.setTimeout(() => {
      if (ref.current === v && shouldMount) v.load();
    }, delay);
  }, [shouldMount]);

  const onWaiting = useCallback(() => {
    setReady(false);
    onReadyChange?.(false);
  }, [onReadyChange]);

  return (
    <video
      ref={ref}
      // Source resolved before the attribute exists — the wrong file is never
      // requested, and the URL stays stable for browser/CDN caching.
      src={shouldMount ? src : undefined}
      poster={poster ?? undefined}
      muted
      loop
      playsInline
      // Never "auto" for inactive media. Warm neighbours fetch metadata only.
      preload={!shouldMount ? "none" : active ? (profile.ios ? "metadata" : "auto") : "metadata"}
      disableRemotePlayback
      disablePictureInPicture
      controls={false}
      onLoadedMetadata={markReady}
      onLoadedData={markReady}
      onCanPlay={onCanPlay}
      onPlaying={markReady}
      onWaiting={onWaiting}
      onStalled={onWaiting}
      onError={onError}
      className={className}
      style={{ ...style, opacity: ready && active ? (style?.opacity ?? 1) : 0 }}
    />
  );
});

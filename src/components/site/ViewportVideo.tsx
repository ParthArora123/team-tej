import { memo, useEffect, useRef, useState } from "react";
import { pauseHomepageVideo, playHomepageVideo, releaseHomepageVideo } from "@/lib/home-video-playback";

type ViewportVideoProps = Omit<React.VideoHTMLAttributes<HTMLVideoElement>, "src" | "preload"> & {
  src: string;
  active?: boolean;
  rootMargin?: string;
  releaseOnExit?: boolean;
  preload?: "none" | "metadata" | "auto";
};

/** Mounts media only near the viewport and releases its decoder after exit. */
export const ViewportVideo = memo(function ViewportVideo({
  src,
  active = true,
  rootMargin = "160px 0px",
  releaseOnExit = true,
  autoPlay,
  muted = true,
  preload = "metadata",
  ...props
}: ViewportVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  // A failed source (decode error, 404, unsupported codec) permanently falls
  // back to the poster instead of leaving a broken black player behind.
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === "undefined") {
      setNear(true);
      setVisible(true);
      return;
    }
    const nearObserver = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { rootMargin, threshold: 0.01 },
    );
    const visibleObserver = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.35 },
    );
    nearObserver.observe(video);
    visibleObserver.observe(video);
    return () => {
      nearObserver.disconnect();
      visibleObserver.disconnect();
    };
  }, [rootMargin, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active && visible && autoPlay) void playHomepageVideo(video);
    else if (!near && releaseOnExit) releaseHomepageVideo(video);
    else pauseHomepageVideo(video);
    return () => pauseHomepageVideo(video);
  }, [active, autoPlay, visible, near, releaseOnExit]);

  const mounted = (near || !releaseOnExit) && !failed;

  return (
    <video
      {...props}
      ref={videoRef}
      src={mounted ? src : undefined}
      onError={(e) => {
        setFailed(true);
        props.onError?.(e);
      }}
      muted={muted}
      autoPlay={false}
      playsInline
      preload={active && visible ? preload : "none"}
    />
  );
});
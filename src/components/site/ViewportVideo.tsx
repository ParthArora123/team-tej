import { memo, useEffect, useRef, useState } from "react";
import { pauseHomepageVideo, playHomepageVideo } from "@/lib/home-video-playback";

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
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof IntersectionObserver === "undefined") {
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
    nearObserver.observe(host);
    visibleObserver.observe(host);
    return () => {
      nearObserver.disconnect();
      visibleObserver.disconnect();
    };
  }, [rootMargin]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active && visible && autoPlay) void playHomepageVideo(video);
    else pauseHomepageVideo(video);
    return () => pauseHomepageVideo(video);
  }, [active, autoPlay, visible, near]);

  const mounted = near || !releaseOnExit;

  return (
    <div ref={hostRef} className="contents">
      {mounted ? (
        <video
          {...props}
          ref={videoRef}
          src={src}
          muted={muted}
          autoPlay={false}
          playsInline
          preload={active && visible ? preload : "none"}
        />
      ) : props.poster ? (
        <img
          src={props.poster}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className={props.className}
        />
      ) : null}
    </div>
  );
});
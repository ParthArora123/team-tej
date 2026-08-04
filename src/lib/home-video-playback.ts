let activeVideo: HTMLVideoElement | null = null;

function stop(video: HTMLVideoElement) {
  try {
    video.pause();
    if (video.currentTime > 0) video.currentTime = 0;
  } catch {
    /* ignore */
  }
}

/**
 * Single-player registry for every homepage video. Playing one clip always
 * pauses + rewinds whichever clip was playing before, so no two videos ever
 * consume decode/network bandwidth at the same time.
 */
export function playHomepageVideo(video: HTMLVideoElement) {
  if (activeVideo && activeVideo !== video) stop(activeVideo);

  activeVideo = video;
  if (!video.paused) return Promise.resolve();
  return video.play().catch(() => undefined);
}

export function pauseHomepageVideo(video: HTMLVideoElement) {
  stop(video);
  if (activeVideo === video) activeVideo = null;
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && activeVideo) activeVideo.pause();
  });
}

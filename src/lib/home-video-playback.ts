let activeVideo: HTMLVideoElement | null = null;

export function playHomepageVideo(video: HTMLVideoElement) {
  if (activeVideo && activeVideo !== video) {
    activeVideo.pause();
  }

  activeVideo = video;
  return video.play().catch(() => undefined);
}

export function pauseHomepageVideo(video: HTMLVideoElement) {
  video.pause();
  if (activeVideo === video) activeVideo = null;
}
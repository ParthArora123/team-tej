/**
 * Central video delivery policy.
 *
 * Encoding contract (what the CMS should upload):
 *  - Desktop master (`video_url`)        : H.264 High / MP4 + AAC, existing high quality. Untouched.
 *  - Mobile variant  (`video_url_mobile`): H.264 Main/Baseline MP4 + AAC, 720p (preferred) or
 *                                          1080p, ~2–5 Mbps, 24/30 fps, faststart (moov atom first).
 *                                          Never HEVC-only — every iOS browser is WebKit and 720p
 *                                          H.264 is the one universally hardware-decoded profile.
 *  - Poster (`thumbnail_url`)            : compressed WebP/AVIF/JPEG, no 4K posters on phones.
 *
 * When a mobile variant is missing the desktop source is used as a fallback, so nothing breaks —
 * adding the variant later requires no carousel changes.
 */

export type VideoSources = {
  /** High-quality master. */
  desktopSrc?: string | null;
  /** Optimized 720p/1080p H.264 MP4 for phones, tablets and slow links. */
  mobileSrc?: string | null;
};

const ua = () => (typeof navigator === "undefined" ? "" : navigator.userAgent || "");

/**
 * iOS / iPadOS detection. iPadOS 13+ reports a desktop UA, so the touch-capable
 * Mac check is required — viewport width alone is not reliable.
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const s = ua();
  const touchMac =
    /Mac/.test(s) && ((navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints ?? 0) > 1;
  return /iP(hone|ad|od)/.test(s) || touchMac;
}

/** Any handheld/tablet WebKit or Android browser — all get the mobile strategy. */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  if (isIOSDevice()) return true;
  if (/Android|Mobile|Silk|Kindle|Opera Mini|IEMobile/i.test(ua())) return true;
  if (typeof window !== "undefined" && window.matchMedia) {
    // Coarse pointer without hover = phone/tablet even with a wide viewport.
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  }
  return false;
}

type NetInfo = { effectiveType?: string; saveData?: boolean; downlink?: number };

/**
 * Optional enhancement only — everything below works when the API is absent.
 */
function connection(): NetInfo | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & { connection?: NetInfo }).connection;
}

/** True when the link is known-slow. Unknown networks are treated as fast. */
export function isSlowConnection(): boolean {
  const c = connection();
  if (!c) return false;
  if (c.saveData) return true;
  if (c.effectiveType && /(^|-)(2g|slow-2g)$/.test(c.effectiveType)) return true;
  if (c.effectiveType === "3g") return true;
  return typeof c.downlink === "number" && c.downlink > 0 && c.downlink < 1.5;
}

/**
 * Pick the source BEFORE the element ever gets a `src`, so the browser never
 * downloads the desktop master first and swaps afterwards.
 */
export function pickVideoSource(item: VideoSources): string | undefined {
  const desktop = item.desktopSrc ?? undefined;
  const mobile = item.mobileSrc ?? undefined;
  if (isMobileDevice() || isSlowConnection()) return mobile || desktop;
  return desktop || mobile;
}

import { useEffect, useState } from "react";

/**
 * Device + network aware video source selection.
 *
 * Encoding contract (documented so new uploads stay consistent):
 *  - Desktop source  : H.264/AVC MP4 + AAC, existing high-quality master.
 *  - Mobile source   : H.264/AVC MP4 + AAC, 720p–1080p, ~2–5 Mbps, 24/30 fps.
 *  - Never rely on HEVC/H.265 or WebM alone — MP4/H.264 is the iOS fallback.
 *
 * Items expose `videoSrc` (desktop) and optional `videoSrcMobile`. When a
 * mobile variant is missing we fall back to the desktop file so nothing
 * breaks; those clips are the ones that need a 720p encode added.
 */

export type DeviceProfile = {
  /** iPhone / iPad / iPod, including iPadOS reporting itself as "Mac". */
  ios: boolean;
  /** Any handheld/tablet class device (iOS, Android, coarse-pointer tablets). */
  mobile: boolean;
  /** Connection looks constrained (Network Information API, when available). */
  slow: boolean;
};

const DEFAULT_PROFILE: DeviceProfile = { ios: false, mobile: false, slow: false };

/** UA + capability detection — never screen width alone (iPad is desktop-wide). */
export function detectDevice(): DeviceProfile {
  if (typeof navigator === "undefined") return DEFAULT_PROFILE;

  const ua = navigator.userAgent || "";
  const touchPoints = (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints ?? 0;
  const ios = /iP(hone|ad|od)/.test(ua) || (/Mac/.test(ua) && touchPoints > 1);
  const android = /Android/i.test(ua);
  const mobileUa = /Mobi|Tablet|Silk|Kindle|Opera Mini|IEMobile/i.test(ua);
  const coarse =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches &&
    touchPoints > 0;

  return {
    ios,
    mobile: ios || android || mobileUa || coarse,
    slow: isSlowConnection(),
  };
}

/**
 * Optional enhancement only. Every caller must behave correctly when the
 * Network Information API is unavailable (Safari, Firefox).
 */
function isSlowConnection(): boolean {
  const conn = (navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean };
  }).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  return conn.effectiveType === "slow-2g" || conn.effectiveType === "2g" || conn.effectiveType === "3g";
}

/**
 * Stable during SSR + first client render (avoids hydration mismatch); the
 * real profile lands in an effect, before any video element mounts because
 * media only mounts once it is near the viewport.
 */
export function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = useState<DeviceProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    setProfile(detectDevice());
    const conn = (navigator as Navigator & {
      connection?: { addEventListener?: (t: string, cb: () => void) => void; removeEventListener?: (t: string, cb: () => void) => void };
    }).connection;
    if (!conn?.addEventListener) return;
    const onChange = () => setProfile(detectDevice());
    conn.addEventListener("change", onChange);
    return () => conn.removeEventListener?.("change", onChange);
  }, []);

  return profile;
}

/**
 * Picks the URL BEFORE the element gets a `src`, so the browser never starts
 * the heavy master download and then swaps. URLs stay untouched/stable so
 * browser + CDN caching keeps working.
 */
export function pickVideoSource(
  sources: { desktopSrc?: string | null; mobileSrc?: string | null },
  profile: DeviceProfile,
): string | undefined {
  const desktop = sources.desktopSrc ?? undefined;
  const mobile = sources.mobileSrc ?? undefined;
  if (profile.mobile || profile.slow) return mobile || desktop;
  return desktop || mobile;
}

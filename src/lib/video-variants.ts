/**
 * Storage naming contract for optimized video variants.
 *
 *   <name>.mp4        -> desktop master (kept as uploaded)
 *   <name>-1080.mp4   -> desktop master when a pair was generated
 *   <name>-720.mp4    -> Safari / mobile variant: H.264 (AVC) Main, 720p cap,
 *                        ~1.8-2.5 Mbps, AAC 96-128 kbps, faststart (moov first)
 *
 * Signed URLs are path-bound, so the mobile key must be derived and signed on
 * the server. When the sibling does not exist the signer returns null and the
 * player simply falls back to the master — nothing breaks.
 */
export function mobileVariantKey(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return null;
  if (/-720\.mp4$/i.test(url)) return null;
  if (/-1080\.mp4$/i.test(url)) return url.replace(/-1080\.mp4$/i, "-720.mp4");
  if (/\.mp4$/i.test(url)) return url.replace(/\.mp4$/i, "-720.mp4");
  return null;
}

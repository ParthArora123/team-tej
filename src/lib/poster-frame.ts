/**
 * Client-side poster generation — no database column required.
 *
 * When a clip has no stored thumbnail we grab its own first frame in the
 * browser (hidden <video> -> <canvas> -> JPEG data URL) and use that as the
 * poster. Results are memoised in memory and in sessionStorage keyed by the
 * storage path (signed-URL query strings are stripped so a re-signed URL
 * still hits the cache).
 *
 * If the frame cannot be captured (CORS-tainted canvas, decode error), the
 * hook resolves to `null` and the caller falls back to a paused video frame.
 */

const memory = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

const MAX_W = 640;

function cacheKey(src: string) {
  try {
    const u = new URL(src, typeof window !== "undefined" ? window.location.href : "http://x");
    return u.origin + u.pathname;
  } catch {
    return src.split("?")[0] ?? src;
  }
}

function readSession(key: string): string | null | undefined {
  try {
    const raw = sessionStorage.getItem(`pf:${key}`);
    if (raw === null) return undefined;
    return raw === "" ? null : raw;
  } catch {
    return undefined;
  }
}

function writeSession(key: string, value: string | null) {
  try {
    sessionStorage.setItem(`pf:${key}`, value ?? "");
  } catch {
    /* quota / private mode — memory cache still applies */
  }
}

export function capturePosterFrame(src: string): Promise<string | null> {
  const key = cacheKey(src);
  if (memory.has(key)) return Promise.resolve(memory.get(key) ?? null);
  const stored = readSession(key);
  if (stored !== undefined) {
    memory.set(key, stored);
    return Promise.resolve(stored);
  }
  const existing = inflight.get(key);
  if (existing) return existing;

  const task = new Promise<string | null>((resolve) => {
    const v = document.createElement("video");
    let done = false;
    const finish = (result: string | null) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      v.removeAttribute("src");
      try { v.load(); } catch { /* ignore */ }
      memory.set(key, result);
      writeSession(key, result);
      inflight.delete(key);
      resolve(result);
    };

    const grab = () => {
      try {
        const w = v.videoWidth;
        const h = v.videoHeight;
        if (!w || !h) return finish(null);
        const scale = Math.min(1, MAX_W / w);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return finish(null);
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        finish(canvas.toDataURL("image/jpeg", 0.72));
      } catch {
        finish(null); // tainted canvas
      }
    };

    v.crossOrigin = "anonymous";
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.addEventListener("error", () => finish(null));
    v.addEventListener("seeked", grab);
    v.addEventListener("loadeddata", () => {
      if (v.currentTime > 0.01) grab();
      else {
        try { v.currentTime = 0.1; } catch { grab(); }
      }
    });
    const timer = window.setTimeout(() => finish(null), 8000);
    v.src = src;
    try { v.load(); } catch { /* ignore */ }
  });

  inflight.set(key, task);
  return task;
}

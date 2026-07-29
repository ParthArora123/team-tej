/**
 * Tiny request-deduplicating cache for read-only public content.
 *
 * The public marketing pages call the same server functions (site content,
 * programs, CMS lists) from several routes. Without a cache, every navigation
 * — and every React StrictMode double-effect — refires the same request,
 * which is what makes sections flash empty before repopulating.
 *
 * This stores the in-flight *promise*, so concurrent callers share one
 * request, and keeps the resolved value for a short TTL.
 *
 * Browser-only by design: on the server a module-level cache would be shared
 * across users' requests, so there it simply passes through.
 */

type Entry = { at: number; promise: Promise<unknown> };

const store = new Map<string, Entry>();

const DEFAULT_TTL_MS = 5 * 60_000;

const isBrowser = typeof window !== "undefined";

export function cachedCall<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  if (!isBrowser) return fn();

  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) {
    return hit.promise as Promise<T>;
  }

  const promise = fn().catch((err) => {
    // Never cache failures — the next caller should retry.
    store.delete(key);
    throw err;
  });

  store.set(key, { at: Date.now(), promise });
  return promise;
}

/** Drop cached entries so the next read re-fetches (use after admin edits). */
export function invalidateCachedCall(keyPrefix?: string) {
  if (!keyPrefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(keyPrefix)) store.delete(key);
  }
}

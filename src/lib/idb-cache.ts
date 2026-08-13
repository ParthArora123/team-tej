/**
 * Tiny IndexedDB key/value cache for PUBLIC, read-only datasets
 * (homepage bundle, choreography metadata, styles, testimonials...).
 *
 * Why IndexedDB and not localStorage: these payloads are large-ish JSON blobs
 * and localStorage writes are synchronous on the main thread — exactly the
 * kind of long task we're trying to remove. IDB is async and off-thread.
 *
 * NEVER store user-specific or authoritative data here (auth, payments,
 * registrations, tickets, admin data). Supabase remains the source of truth;
 * this only makes repeat visits paint instantly while fresh data is fetched
 * in the background (stale-while-revalidate).
 */

const DB_NAME = "tdd-public-cache";
const STORE = "kv";
const DB_VERSION = 1;

type Entry<T> = { v: T; at: number; version: string };

const isBrowser = typeof window !== "undefined" && typeof indexedDB !== "undefined";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }).catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise as Promise<IDBDatabase>;
}


/** Read a cached value. Returns null when missing, expired or unavailable. */
export async function idbGet<T>(
  key: string,
  { maxAgeMs = 24 * 60 * 60_000, version = "1" }: { maxAgeMs?: number; version?: string } = {},
): Promise<T | null> {
  if (!isBrowser) return null;
  try {
    const db = await openDb();
    const entry = await new Promise<Entry<T> | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (!entry || entry.version !== version) return null;
    if (Date.now() - entry.at > maxAgeMs) return null;
    return entry.v ?? null;
  } catch {
    return null;
  }
}

/** Persist a value. Failures are non-fatal — caching is best-effort. */
export async function idbSet<T>(key: string, value: T, version = "1"): Promise<void> {
  if (!isBrowser) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ v: value, at: Date.now(), version } satisfies Entry<T>, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* quota / private mode — ignore */
  }
}

export async function idbDelete(key: string): Promise<void> {
  if (!isBrowser) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* ignore */
  }
}

/** Cheap structural comparison so we skip React commits when nothing changed. */
export function sameShallowJson(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

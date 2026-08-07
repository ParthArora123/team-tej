/**
 * Request coalescer for workshop galleries.
 *
 * The workshops listing renders one <WorkshopGallery /> per card. Fetching per
 * card meant one HTTP round-trip per workshop (16 on a full page), which is the
 * single biggest source of request overhead on that route. This collects every
 * id requested within the same tick and resolves them all from one bulk call.
 */
import { listWorkshopMediaBulk } from "@/lib/workshop-media.functions";

type Row = {
  id: string;
  media_kind: "image" | "video" | "gif";
  media_url: string | null;
  poster_url: string | null;
  caption: string | null;
};

const cache = new Map<string, Row[]>();
let pending = new Set<string>();
let inflight: Promise<Record<string, Row[]>> | null = null;

function flush(): Promise<Record<string, Row[]>> {
  const ids = [...pending];
  pending = new Set();
  inflight = null;
  if (ids.length === 0) return Promise.resolve({});
  return (listWorkshopMediaBulk as any)({ data: { programIds: ids } })
    .then((grouped: Record<string, Row[]>) => {
      for (const [id, rows] of Object.entries(grouped ?? {})) cache.set(id, rows ?? []);
      return grouped ?? {};
    })
    .catch(() => ({}));
}

export function loadWorkshopMedia(programId: string): Promise<Row[]> {
  const hit = cache.get(programId);
  if (hit) return Promise.resolve(hit);

  pending.add(programId);
  if (!inflight) {
    inflight = new Promise((resolve) => {
      queueMicrotask(() => {
        // Give sibling galleries mounting in the same commit a chance to join.
        setTimeout(() => resolve(flush()), 0);
      });
    });
  }
  return inflight.then((grouped) => grouped[programId] ?? cache.get(programId) ?? []);
}

export function invalidateWorkshopMedia() {
  cache.clear();
}

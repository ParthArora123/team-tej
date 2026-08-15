/**
 * Canonical workshop ordering: newest workshop date first (descending).
 * Ties on the same date fall back to the earlier start time first.
 * Undated workshops sink to the bottom, newest-created first.
 */
function dateValue(row: any): number | null {
  const raw = row?.event_date ?? row?.workshop_date ?? null;
  if (!raw) return null;
  const d = new Date(raw);
  const t = d.getTime();
  return Number.isNaN(t) ? null : t;
}

/** Parses "6:00 PM", "18:00", "18:00 - 20:00" into minutes since midnight. */
function timeValue(row: any): number {
  const raw: string | null = row?.event_time ?? row?.workshop_time ?? null;
  if (!raw) return Number.MAX_SAFE_INTEGER;
  const m = String(raw).match(/(\d{1,2})\s*:?\s*(\d{2})?\s*(am|pm)?/i);
  if (!m) return Number.MAX_SAFE_INTEGER;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const mer = m[3]?.toLowerCase();
  if (mer === "pm" && h < 12) h += 12;
  if (mer === "am" && h === 12) h = 0;
  return h * 60 + min;
}

export function sortWorkshopsByDateDesc<T>(rows: T[]): T[] {
  return [...(rows ?? [])].sort((a: any, b: any) => {
    const da = dateValue(a);
    const db = dateValue(b);
    if (da == null && db == null) {
      return (new Date(b?.created_at ?? 0).getTime() || 0) - (new Date(a?.created_at ?? 0).getTime() || 0);
    }
    if (da == null) return 1;
    if (db == null) return -1;
    if (da !== db) return db - da;
    const ta = timeValue(a);
    const tb = timeValue(b);
    if (ta !== tb) return ta - tb;
    return (new Date(b?.created_at ?? 0).getTime() || 0) - (new Date(a?.created_at ?? 0).getTime() || 0);
  });
}

/**
 * On-the-spot (workshop-day) pricing.
 *
 * A workshop can define a temporary price used ONLY on its exact event date.
 * Before that date the original price applies; after it the workshop is over.
 * The original `price_inr` is never modified — this is a read-time override.
 *
 * Dates are compared as calendar day keys (YYYY-MM-DD) in India Standard Time,
 * matching the rest of the catalogue's date handling, so there is no
 * one-day-early/late drift regardless of the server or browser timezone.
 */

export function todayKeyIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export function dateKey(value: unknown): string | null {
  if (!value) return null;
  const raw = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

export interface SpotPricingRow {
  event_date?: string | null;
  spot_registration_enabled?: boolean | null;
  spot_price_inr?: number | null;
}

/** True when the on-the-spot amount should override the original price today. */
export function isSpotPricingActive(row: SpotPricingRow | null | undefined): boolean {
  if (!row?.spot_registration_enabled) return false;
  const price = Number(row.spot_price_inr ?? 0);
  if (!Number.isFinite(price) || price <= 0) return false;
  const eventKey = dateKey(row.event_date);
  if (!eventKey) return false;
  return eventKey === todayKeyIST();
}

/** The price to charge/display for a single workshop pass right now. */
export function effectiveSinglePrice(
  row: SpotPricingRow & { price_inr?: number | null },
  fallback?: number,
): number {
  if (isSpotPricingActive(row)) return Number(row.spot_price_inr);
  return Number(fallback ?? row.price_inr ?? 0);
}

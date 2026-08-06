/**
 * Single source of truth for turning a workshop's existing venue/address text
 * into a Google Maps link. No new admin fields, no duplicated location data.
 */
export function buildMapsUrl(venue?: string | null): string | null {
  const raw = (venue ?? "").trim();
  if (!raw) return null;

  // If the admin already pasted a Maps link inside the venue text, reuse it.
  const existing = raw.match(/https?:\/\/(?:www\.)?(?:google\.[a-z.]+\/maps\S*|maps\.app\.goo\.gl\/\S+|goo\.gl\/maps\/\S+)/i);
  if (existing) return existing[0];

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(raw)}`;
}

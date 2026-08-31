/** Extract a ticket code from raw QR contents (may be a verify URL or a bare code). */
export function extractTicketCode(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  try {
    const u = new URL(s);
    const q = u.searchParams.get("code");
    if (q) return q.trim().toUpperCase();
  } catch {
    /* not a url */
  }
  const m = s.match(/[A-Za-z]{2,5}-[A-Za-z0-9]{4,}/);
  return (m ? m[0] : s).trim().toUpperCase();
}

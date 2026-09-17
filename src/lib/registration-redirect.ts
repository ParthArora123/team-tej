export function normalizeRegistrationRedirectUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function openRegistrationRedirect(value: unknown): boolean {
  const url = normalizeRegistrationRedirectUrl(value);
  if (!url || typeof window === "undefined") return false;
  window.location.assign(url);
  return true;
}
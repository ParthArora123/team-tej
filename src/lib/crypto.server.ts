import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

// AES-256-GCM at rest. Key derived from APP_ENCRYPTION_KEY env (never sent client-side).
function key(): Buffer {
  const k = process.env.APP_ENCRYPTION_KEY;
  if (!k) throw new Error("APP_ENCRYPTION_KEY not configured");
  // Normalize any-length secret into 32 bytes via SHA-256.
  return createHash("sha256").update(k).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // v1:iv:tag:cipher, all base64url — versioned so we can rotate later.
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${enc.toString("base64url")}`;
}

export function decryptSecret(payload: string | null | undefined): string | null {
  if (!payload) return null;
  try {
    const [v, ivB64, tagB64, dataB64] = payload.split(":");
    if (v !== "v1") return null;
    const iv = Buffer.from(ivB64, "base64url");
    const tag = Buffer.from(tagB64, "base64url");
    const data = Buffer.from(dataB64, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}

// Basic UPI VPA validation: <handle>@<provider>. Handles alphanumerics, dots,
// hyphens, underscores. Providers are alphabetic. 6–80 chars total.
const UPI_RE = /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z][a-zA-Z0-9]{1,32}$/;
export function sanitizeUpiId(raw: string): string {
  const v = String(raw ?? "").trim();
  if (!UPI_RE.test(v)) throw new Error("Invalid UPI ID format (expected name@provider)");
  return v;
}

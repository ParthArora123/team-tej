// Shared payment screenshot validation.
// Runs identically in local dev, Vercel, and production — no platform APIs.

export const PAYMENT_PROOF_MAX_BYTES = 8 * 1024 * 1024; // 8 MB
export const PAYMENT_PROOF_MIN_BYTES = 1024; // 1 KB — reject empty/near-empty files
export const PAYMENT_PROOF_ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"] as const;
export const PAYMENT_PROOF_ALLOWED_EXT = ["png", "jpg", "jpeg", "webp"] as const;

export type PaymentProofMime = (typeof PAYMENT_PROOF_ALLOWED_MIME)[number];

export interface ValidatedPaymentProof {
  mime: PaymentProofMime;
  ext: "png" | "jpg" | "webp";
  bytes: Uint8Array;
  size: number;
  sha256: string;
  safeName: string;
}

/** Sniff the real image type from the first few bytes. Returns null if not a supported image. */
export function sniffImageMime(bytes: Uint8Array): PaymentProofMime | null {
  if (bytes.length < 12) return null;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "image/png";
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  // WEBP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "image/webp";
  return null;
}

export function extForMime(mime: PaymentProofMime): "png" | "jpg" | "webp" {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

/** Strip any path components and unsafe characters. Keeps a short, predictable name. */
export function sanitizeFileName(name: string, fallbackExt: string): string {
  const base = (name.split(/[\\/]/).pop() || "screenshot").toLowerCase();
  const cleaned = base.replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  const safe = cleaned.slice(0, 60) || "screenshot";
  if (/\.(png|jpe?g|webp)$/i.test(safe)) return safe;
  return `${safe.replace(/\.+$/, "")}.${fallbackExt}`;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  // Prefer Web Crypto (browser + workerd + modern Node).
  const subtle = (globalThis.crypto as Crypto | undefined)?.subtle;
  if (subtle) {
    const digest = await subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Node fallback.
  const { createHash } = await import("crypto");
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Validate raw bytes as a payment screenshot.
 * Server-side entrypoint (used inside server functions after download).
 * Throws a user-friendly Error on any failure.
 */
export async function validatePaymentProofBytes(
  bytes: Uint8Array,
  originalName: string | null | undefined,
): Promise<ValidatedPaymentProof> {
  const size = bytes.byteLength;
  if (size === 0) throw new Error("The uploaded file is empty. Please upload a valid payment screenshot.");
  if (size < PAYMENT_PROOF_MIN_BYTES) {
    throw new Error("This file looks too small to be a real payment screenshot. Please upload a clearer image.");
  }
  if (size > PAYMENT_PROOF_MAX_BYTES) {
    throw new Error("Screenshot is too large. Maximum size is 8 MB.");
  }
  const mime = sniffImageMime(bytes);
  if (!mime) {
    throw new Error(
      "Only image files are allowed (PNG, JPG, or WEBP). PDFs, ZIPs, and other file types are not accepted.",
    );
  }
  const ext = extForMime(mime);
  const sha256 = await sha256Hex(bytes);
  const safeName = sanitizeFileName(originalName || `screenshot.${ext}`, ext);
  return { mime, ext, bytes, size, sha256, safeName };
}

/**
 * Client-side validation for a File selected via <input type="file">.
 * Also verifies the file decodes as a real image (rejects corrupted files).
 */
export async function validatePaymentProofFile(file: File): Promise<ValidatedPaymentProof> {
  if (!file) throw new Error("Please select a payment screenshot.");
  const nameLower = (file.name || "").toLowerCase();
  const extMatch = nameLower.match(/\.([a-z0-9]+)$/);
  const ext = extMatch?.[1] ?? "";
  if (!ext || !(PAYMENT_PROOF_ALLOWED_EXT as readonly string[]).includes(ext)) {
    throw new Error("Only .jpg, .jpeg, .png, and .webp images are allowed.");
  }
  const declared = (file.type || "").toLowerCase();
  if (declared && !(PAYMENT_PROOF_ALLOWED_MIME as readonly string[]).includes(declared)) {
    throw new Error("Only image files are allowed (PNG, JPG, or WEBP).");
  }
  if (file.size === 0) throw new Error("The selected file is empty.");
  if (file.size > PAYMENT_PROOF_MAX_BYTES) throw new Error("Screenshot must be under 8 MB.");
  if (file.size < PAYMENT_PROOF_MIN_BYTES) {
    throw new Error("This image looks too small to be a real payment screenshot.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const validated = await validatePaymentProofBytes(bytes, file.name);

  // Verify it actually decodes as an image (catches corrupted or truncated files).
  await new Promise<void>((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([bytes], { type: validated.mime }));
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.naturalWidth < 50 || img.naturalHeight < 50) {
        reject(new Error("This image is too small to read. Please upload a clearer payment screenshot."));
      } else {
        resolve();
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This image appears to be corrupted or unreadable. Please try a different screenshot."));
    };
    img.src = url;
  });

  return validated;
}

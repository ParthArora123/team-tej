// Client-side image compression using canvas.
// Downscales to a max edge and re-encodes as JPEG/WebP with quality.
// Leaves GIF/SVG untouched (animation/vector).

export type CompressOptions = {
  maxEdge?: number;   // px, longest side
  quality?: number;   // 0..1
  mimeType?: "image/jpeg" | "image/webp";
};

const DEFAULTS: Required<CompressOptions> = {
  maxEdge: 1920,
  quality: 0.82,
  mimeType: "image/jpeg",
};

export async function compressImageFile(file: File, opts: CompressOptions = {}): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;
  // Preserve animation / vector formats and small files.
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;
  if (file.size < 300 * 1024) return file; // <300 KB — skip

  const { maxEdge, quality, mimeType } = { ...DEFAULTS, ...opts };

  let bitmap: ImageBitmap | null = null;
  let objectUrl: string | null = null;
  let imgEl: HTMLImageElement | null = null;
  let width = 0, height = 0;
  try {
    try {
      bitmap = await createImageBitmap(file);
      width = bitmap.width; height = bitmap.height;
    } catch {
      objectUrl = URL.createObjectURL(file);
      imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error("decode failed"));
        im.src = objectUrl!;
      });
      width = imgEl.naturalWidth; height = imgEl.naturalHeight;
    }

    if (!width || !height) return file;
    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetW; canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    if (bitmap) ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    else if (imgEl) ctx.drawImage(imgEl, 0, 0, targetW, targetH);

    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, mimeType, quality));
    if (!blob || blob.size >= file.size) return file; // no win — keep original

    const ext = mimeType === "image/webp" ? "webp" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.${ext}`, { type: mimeType, lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    if (bitmap) bitmap.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

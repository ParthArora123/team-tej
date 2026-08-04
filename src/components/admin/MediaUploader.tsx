import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Upload, X, Film, Image as ImageIcon } from "lucide-react";
import { compressImageFile } from "@/lib/compress-image";
import { adminCreateWorkshopMediaUpload } from "@/lib/workshop-hero.functions";

export type MediaKind = "image" | "video" | "gif";

const MAX_MB: Record<MediaKind, number> = { image: 20, gif: 50, video: 500 };
const ACCEPT: Record<MediaKind, string> = {
  image: "image/jpeg,image/png,image/webp",
  gif: "image/gif",
  video: "video/mp4,video/webm,video/quicktime",
};
const KIND_LABEL: Record<MediaKind, string> = { image: "image (JPG / PNG / WebP)", gif: "GIF", video: "video (MP4 / WebM / MOV)" };

async function uploadDirect(url: string, file: Blob, contentType: string) {
  const res = await fetch(url, { method: "PUT", body: file, headers: { "content-type": contentType, "x-upsert": "true" } });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
}

export function MediaUploader({
  kind,
  path,
  previewUrl,
  onChange,
  compact,
}: {
  kind: MediaKind;
  path: string | null;
  previewUrl: string | null;
  onChange: (path: string | null, previewUrl: string | null) => void;
  compact?: boolean;
}) {
  const create = useServerFn(adminCreateWorkshopMediaUpload);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const maxMb = MAX_MB[kind];

  const pick = async (raw: File) => {
    if (raw.size > maxMb * 1024 * 1024) return toast.error(`Too large — max ${maxMb} MB`);
    setBusy(true);
    setProgress("Preparing…");
    try {
      let file: File | Blob = raw;
      let contentType = raw.type;
      let filename = raw.name;
      if (kind === "image") {
        const compressed = await compressImageFile(raw);
        file = compressed; contentType = compressed.type; filename = compressed.name;
      }
      setProgress("Requesting…");
      const meta: any = await create({ data: { kind, filename } });
      setProgress(kind === "video" ? "Uploading video…" : "Uploading…");
      await uploadDirect(meta.uploadUrl, file, contentType);
      const localPreview = URL.createObjectURL(file);
      onChange(meta.path, localPreview);
      toast.success("Uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  const Icon = kind === "video" ? Film : ImageIcon;

  return (
    <div className="space-y-2">
      <div
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) pick(f); }}
        className={`flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 ${compact ? "p-2" : "p-3"} cursor-pointer`}
      >
        <div className={`${compact ? "h-14 w-20" : "h-20 w-28"} rounded bg-muted overflow-hidden flex items-center justify-center shrink-0`}>
          {previewUrl ? (
            kind === "video"
              ? <video src={previewUrl} muted playsInline className="h-full w-full object-contain" preload="metadata" />
              : <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Icon size={18} className="text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 text-xs min-w-0">
          <p className="font-medium">{busy ? (progress || "Uploading…") : path ? `Replace ${kind}` : `Upload ${KIND_LABEL[kind]}`}</p>
          <p className="text-muted-foreground">Up to {maxMb} MB</p>
        </div>
        {path && !busy && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null, null); }} className="p-1 rounded bg-background border border-border">
            <X size={12} />
          </button>
        )}
        <input ref={inputRef} type="file" hidden accept={ACCEPT[kind]}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.currentTarget.value = ""; }} />
      </div>
    </div>
  );
}

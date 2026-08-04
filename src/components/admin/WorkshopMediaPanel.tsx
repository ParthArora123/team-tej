import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
  adminListWorkshopMedia, adminSaveWorkshopMedia,
  adminDeleteWorkshopMedia, adminReorderWorkshopMedia,
} from "@/lib/workshop-media.functions";
import { MediaUploader, type MediaKind } from "./MediaUploader";

export function WorkshopMediaPanel({ programId }: { programId: string }) {
  const list = useServerFn(adminListWorkshopMedia);
  const save = useServerFn(adminSaveWorkshopMedia);
  const del = useServerFn(adminDeleteWorkshopMedia);
  const reorder = useServerFn(adminReorderWorkshopMedia);
  const [rows, setRows] = useState<any[]>([]);
  const [kind, setKind] = useState<MediaKind>("image");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = () => list({ data: { programId } }).then(setRows).catch(() => {});
  useEffect(() => { reload(); }, [programId]);

  const onUpload = async (path: string | null) => {
    if (!path) return;
    setBusy(true);
    try {
      await save({ data: {
        program_id: programId,
        media_kind: kind, media_path: path,
        caption: caption || null,
        sort_order: rows.length,
      }});
      setCaption("");
      reload();
      toast.success("Added to gallery");
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this media item?")) return;
    try { await del({ data: { id } }); toast.success("Removed"); reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const next = [...rows];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setRows(next);
    try { await reorder({ data: { ids: next.map((r) => r.id) } }); }
    catch (e: any) { toast.error(e.message); reload(); }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-3">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Media gallery</p>
      <div className="grid sm:grid-cols-3 gap-2">
        {(["image", "video", "gif"] as MediaKind[]).map((k) => (
          <button key={k} type="button" onClick={() => setKind(k)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${kind === k ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
            + {k === "image" ? "Image" : k === "video" ? "Video" : "GIF"}
          </button>
        ))}
      </div>
      <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)"
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
      <MediaUploader kind={kind} path={null} previewUrl={null} onChange={(p) => !busy && onUpload(p)} compact />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {rows.map((r, i) => (
          <div key={r.id} className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="aspect-square bg-muted relative">
              {r.media_kind === "video"
                ? <video src={r.media_url} muted playsInline preload="metadata" className="w-full h-full object-contain" />
                : r.media_url && <img src={r.media_url} alt="" className="w-full h-full object-cover" />}
              <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] rounded bg-background/80 border border-border">{r.media_kind}</span>
            </div>
            <div className="p-2 flex items-center justify-between gap-1">
              <p className="text-[11px] truncate flex-1">{r.caption || "—"}</p>
              <button onClick={() => move(i, -1)} className="p-1 rounded border border-border" title="Up"><ArrowUp size={10} /></button>
              <button onClick={() => move(i, 1)} className="p-1 rounded border border-border" title="Down"><ArrowDown size={10} /></button>
              <button onClick={() => remove(r.id)} className="p-1 rounded border border-border text-destructive"><Trash2 size={10} /></button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-xs text-muted-foreground col-span-full">No media yet.</p>}
      </div>
    </div>
  );
}

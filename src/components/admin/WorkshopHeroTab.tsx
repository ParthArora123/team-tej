import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
  adminListWorkshopHeroSlides, adminSaveWorkshopHeroSlide,
  adminDeleteWorkshopHeroSlide, adminReorderWorkshopHeroSlides,
} from "@/lib/workshop-hero.functions";
import { MediaUploader, type MediaKind } from "./MediaUploader";

const empty = () => ({
  id: undefined as string | undefined,
  media_kind: "image" as MediaKind,
  media_path: "" as string,
  media_preview: null as string | null,
  poster_path: null as string | null,
  poster_preview: null as string | null,
  title: "", subtitle: "", description: "",
  cta_text: "", cta_link: "",
  sort_order: 0,
  active: true,
  start_at: "", end_at: "",
});

export function WorkshopHeroTab() {
  const list = useServerFn(adminListWorkshopHeroSlides);
  const save = useServerFn(adminSaveWorkshopHeroSlide);
  const del = useServerFn(adminDeleteWorkshopHeroSlide);
  const reorder = useServerFn(adminReorderWorkshopHeroSlides);
  const [rows, setRows] = useState<any[]>([]);
  const [f, setF] = useState<any>(empty());

  const reload = () => list().then(setRows).catch(() => {});
  useEffect(() => { reload(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.media_path) return toast.error("Media required");
    try {
      await save({ data: {
        id: f.id, media_kind: f.media_kind, media_path: f.media_path,
        poster_path: f.poster_path || null,
        title: f.title || null, subtitle: f.subtitle || null, description: f.description || null,
        cta_text: f.cta_text || null, cta_link: f.cta_link || null,
        sort_order: Number(f.sort_order) || 0, active: !!f.active,
        start_at: f.start_at ? new Date(f.start_at).toISOString() : null,
        end_at: f.end_at ? new Date(f.end_at).toISOString() : null,
      }});
      setF(empty());
      toast.success("Saved");
      reload();
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    try { await del({ data: { id } }); toast.success("Deleted"); reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const next = [...rows];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setRows(next);
    try { await reorder({ data: { ids: next.map((r) => r.id) } }); }
    catch (e: any) { toast.error(e.message ?? "Reorder failed"); reload(); }
  };

  const toLocal = (v: string | null | undefined) => v ? new Date(v).toISOString().slice(0, 16) : "";

  return (
    <div className="mt-8 space-y-8">
      <form onSubmit={submit} className="p-5 rounded-2xl border border-border bg-card space-y-4">
        <p className="font-display text-lg">{f.id ? "Edit slide" : "Add workshop hero slide"}</p>

        <div className="grid sm:grid-cols-3 gap-3">
          {(["image", "video", "gif"] as MediaKind[]).map((k) => (
            <label key={k} className={`px-3 py-2 rounded-lg border text-sm cursor-pointer text-center ${f.media_kind === k ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
              <input type="radio" name="mk" checked={f.media_kind === k} onChange={() => setF({ ...f, media_kind: k, media_path: "", media_preview: null })} className="hidden" />
              {k === "image" ? "Image" : k === "video" ? "Video" : "GIF"}
            </label>
          ))}
        </div>

        <MediaUploader kind={f.media_kind} path={f.media_path} previewUrl={f.media_preview}
          onChange={(p, pv) => setF({ ...f, media_path: p ?? "", media_preview: pv })} />

        {f.media_kind === "video" && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Optional poster image (shown while video loads)</p>
            <MediaUploader kind="image" path={f.poster_path} previewUrl={f.poster_preview}
              onChange={(p, pv) => setF({ ...f, poster_path: p, poster_preview: pv })} compact />
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Title"
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          <input value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} placeholder="Subtitle"
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
        </div>
        <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Description" rows={2}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={f.cta_text} onChange={(e) => setF({ ...f, cta_text: e.target.value })} placeholder="CTA button text"
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          <input value={f.cta_link} onChange={(e) => setF({ ...f, cta_link: e.target.value })} placeholder="CTA link (/workshops or https://…)"
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })} placeholder="Sort order"
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          <label className="text-xs text-muted-foreground">
            Start (optional)
            <input type="datetime-local" value={f.start_at} onChange={(e) => setF({ ...f, start_at: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          </label>
          <label className="text-xs text-muted-foreground">
            End (optional)
            <input type="datetime-local" value={f.end_at} onChange={(e) => setF({ ...f, end_at: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active
        </label>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">{f.id ? "Update" : "Add slide"}</button>
          {f.id && <button type="button" onClick={() => setF(empty())} className="px-4 py-2 rounded-lg border border-border text-sm">Cancel</button>}
        </div>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r, i) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="aspect-[16/9] bg-muted relative">
              {r.media_kind === "video"
                ? <video src={r.media_url} poster={r.poster_url ?? undefined} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                : r.media_url && <img src={r.media_url} alt={r.title ?? ""} className="w-full h-full object-cover" />}
              <span className="absolute top-1.5 left-1.5 px-2 py-0.5 text-[10px] rounded-full bg-background/80 border border-border">{r.media_kind}</span>
            </div>
            <div className="p-3 space-y-1">
              <p className="text-sm font-medium truncate">{r.title || "Untitled slide"}</p>
              <p className="text-xs text-muted-foreground">#{r.sort_order} · {r.active ? "Active" : "Hidden"}</p>
              <div className="flex gap-1 pt-2">
                <button onClick={() => move(i, -1)} className="p-1.5 rounded border border-border" title="Move up"><ArrowUp size={12} /></button>
                <button onClick={() => move(i, 1)} className="p-1.5 rounded border border-border" title="Move down"><ArrowDown size={12} /></button>
                <button onClick={() => setF({
                  id: r.id, media_kind: r.media_kind, media_path: r.media_path, media_preview: r.media_url,
                  poster_path: r.poster_path, poster_preview: r.poster_url,
                  title: r.title ?? "", subtitle: r.subtitle ?? "", description: r.description ?? "",
                  cta_text: r.cta_text ?? "", cta_link: r.cta_link ?? "",
                  sort_order: r.sort_order ?? 0, active: !!r.active,
                  start_at: toLocal(r.start_at), end_at: toLocal(r.end_at),
                })} className="px-2 py-1 text-xs rounded border border-border">Edit</button>
                <button onClick={() => remove(r.id)} className="p-1.5 rounded border border-border text-destructive"><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground text-sm col-span-full">No slides yet.</p>}
      </div>
    </div>
  );
}

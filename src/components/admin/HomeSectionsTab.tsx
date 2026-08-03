import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  adminListPerformances, adminSavePerformance, adminDeletePerformance,
  adminListSignaturePrograms, adminSaveSignatureProgram, adminDeleteSignatureProgram,
} from "@/lib/home-sections.functions";
import { MediaUploader, type MediaKind } from "./MediaUploader";

const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm";

const emptyPerf = () => ({
  id: undefined as string | undefined,
  title: "", event_name: "", location: "", achievement: "",
  media_kind: "image" as MediaKind,
  media_path: "" as string, media_preview: null as string | null,
  poster_path: null as string | null, poster_preview: null as string | null,
  cta_text: "Watch Performance", cta_link: "",
  sort_order: 0, active: true,
});

const emptyProg = () => ({
  id: undefined as string | undefined,
  title: "", description: "",
  media_kind: "image" as MediaKind,
  media_path: "" as string, media_preview: null as string | null,
  poster_path: null as string | null, poster_preview: null as string | null,
  cta_text: "Explore", cta_link: "",
  sort_order: 0, active: true,
});

function MediaFields({ f, setF, radioName }: { f: any; setF: (v: any) => void; radioName: string }) {
  return (
    <>
      <div className="grid sm:grid-cols-3 gap-3">
        {(["image", "video", "gif"] as MediaKind[]).map((k) => (
          <label key={k} className={`px-3 py-2 rounded-lg border text-sm cursor-pointer text-center ${f.media_kind === k ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
            <input type="radio" name={radioName} checked={f.media_kind === k}
              onChange={() => setF({ ...f, media_kind: k, media_path: "", media_preview: null })} className="hidden" />
            {k === "image" ? "Image" : k === "video" ? "Video" : "GIF"}
          </label>
        ))}
      </div>
      <MediaUploader kind={f.media_kind} path={f.media_path} previewUrl={f.media_preview}
        onChange={(p, pv) => setF({ ...f, media_path: p ?? "", media_preview: pv })} />
      {f.media_kind === "video" && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Optional poster image</p>
          <MediaUploader kind="image" path={f.poster_path} previewUrl={f.poster_preview}
            onChange={(p, pv) => setF({ ...f, poster_path: p, poster_preview: pv })} compact />
        </div>
      )}
    </>
  );
}

function Thumb({ r }: { r: any }) {
  return (
    <div className="aspect-[4/3] bg-muted relative">
      {r.media_kind === "video"
        ? <video src={r.media_url ?? undefined} poster={r.poster_url ?? undefined} muted playsInline preload="metadata" className="w-full h-full object-cover" />
        : r.media_url && <img src={r.media_url} alt={r.title} loading="lazy" className="w-full h-full object-cover" />}
      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 text-[10px] rounded-full bg-background/80 border border-border">{r.media_kind}</span>
    </div>
  );
}

function PerformancesSection() {
  const list = useServerFn(adminListPerformances);
  const save = useServerFn(adminSavePerformance);
  const del = useServerFn(adminDeletePerformance);
  const [rows, setRows] = useState<any[]>([]);
  const [f, setF] = useState<any>(emptyPerf());

  const reload = () => list().then(setRows).catch(() => {});
  useEffect(() => { reload(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim()) return toast.error("Title required");
    try {
      await save({ data: {
        id: f.id, title: f.title.trim(),
        event_name: f.event_name || null, location: f.location || null,
        achievement: f.achievement || null,
        media_kind: f.media_kind, media_path: f.media_path || null,
        poster_path: f.poster_path || null,
        cta_text: f.cta_text || "Watch Performance", cta_link: f.cta_link || null,
        sort_order: Number(f.sort_order) || 0, active: !!f.active,
      }});
      setF(emptyPerf()); toast.success("Saved"); reload();
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this performance?")) return;
    try { await del({ data: { id } }); toast.success("Deleted"); reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="p-5 rounded-2xl border border-border bg-card space-y-4">
        <p className="font-display text-lg">{f.id ? "Edit performance" : "Add featured performance"}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Title *" className={inputCls} />
          <input value={f.event_name} onChange={(e) => setF({ ...f, event_name: e.target.value })} placeholder="Event name" className={inputCls} />
          <input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="Location" className={inputCls} />
          <input value={f.achievement} onChange={(e) => setF({ ...f, achievement: e.target.value })} placeholder="Achievement / highlight" className={inputCls} />
        </div>
        <MediaFields f={f} setF={setF} radioName="perfkind" />
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={f.cta_text} onChange={(e) => setF({ ...f, cta_text: e.target.value })} placeholder="Button text" className={inputCls} />
          <input value={f.cta_link} onChange={(e) => setF({ ...f, cta_link: e.target.value })} placeholder="Button link (e.g. YouTube URL)" className={inputCls} />
        </div>
        <div className="flex items-center gap-4">
          <input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })} placeholder="Sort" className="w-28 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active
          </label>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">{f.id ? "Update" : "Add"}</button>
          {f.id && <button type="button" onClick={() => setF(emptyPerf())} className="px-4 py-2 rounded-lg border border-border text-sm">Cancel</button>}
        </div>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card overflow-hidden">
            <Thumb r={r} />
            <div className="p-3 space-y-1">
              <p className="text-sm font-medium truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground truncate">{[r.event_name, r.location].filter(Boolean).join(" · ") || "—"}</p>
              <p className="text-xs text-muted-foreground">#{r.sort_order} · {r.active ? "Active" : "Hidden"}</p>
              <div className="flex gap-1 pt-2">
                <button onClick={() => setF({
                  id: r.id, title: r.title, event_name: r.event_name ?? "", location: r.location ?? "",
                  achievement: r.achievement ?? "", media_kind: r.media_kind, media_path: r.media_path ?? "",
                  media_preview: r.media_url, poster_path: r.poster_path, poster_preview: r.poster_url,
                  cta_text: r.cta_text ?? "", cta_link: r.cta_link ?? "",
                  sort_order: r.sort_order ?? 0, active: !!r.active,
                })} className="px-2 py-1 text-xs rounded border border-border">Edit</button>
                <button onClick={() => remove(r.id)} className="p-1.5 rounded border border-border text-destructive"><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground text-sm col-span-full">No performances yet.</p>}
      </div>
    </div>
  );
}

function ProgramsSection() {
  const list = useServerFn(adminListSignaturePrograms);
  const save = useServerFn(adminSaveSignatureProgram);
  const del = useServerFn(adminDeleteSignatureProgram);
  const [rows, setRows] = useState<any[]>([]);
  const [f, setF] = useState<any>(emptyProg());

  const reload = () => list().then(setRows).catch(() => {});
  useEffect(() => { reload(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim()) return toast.error("Title required");
    try {
      await save({ data: {
        id: f.id, title: f.title.trim(), description: f.description || null,
        media_kind: f.media_kind, media_path: f.media_path || null,
        poster_path: f.poster_path || null,
        cta_text: f.cta_text || "Explore", cta_link: f.cta_link || null,
        sort_order: Number(f.sort_order) || 0, active: !!f.active,
      }});
      setF(emptyProg()); toast.success("Saved"); reload();
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this program?")) return;
    try { await del({ data: { id } }); toast.success("Deleted"); reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="p-5 rounded-2xl border border-border bg-card space-y-4">
        <p className="font-display text-lg">{f.id ? "Edit program" : "Add signature program"}</p>
        <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Program title *" className={inputCls} />
        <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} placeholder="Short description" className={inputCls} />
        <MediaFields f={f} setF={setF} radioName="progkind" />
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={f.cta_text} onChange={(e) => setF({ ...f, cta_text: e.target.value })} placeholder="Button text" className={inputCls} />
          <input value={f.cta_link} onChange={(e) => setF({ ...f, cta_link: e.target.value })} placeholder="Button link (e.g. /zero-to-hero)" className={inputCls} />
        </div>
        <div className="flex items-center gap-4">
          <input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })} placeholder="Sort" className="w-28 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active
          </label>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">{f.id ? "Update" : "Add"}</button>
          {f.id && <button type="button" onClick={() => setF(emptyProg())} className="px-4 py-2 rounded-lg border border-border text-sm">Cancel</button>}
        </div>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card overflow-hidden">
            <Thumb r={r} />
            <div className="p-3 space-y-1">
              <p className="text-sm font-medium truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{r.description || "—"}</p>
              <p className="text-xs text-muted-foreground">#{r.sort_order} · {r.active ? "Active" : "Hidden"}</p>
              <div className="flex gap-1 pt-2">
                <button onClick={() => setF({
                  id: r.id, title: r.title, description: r.description ?? "",
                  media_kind: r.media_kind, media_path: r.media_path ?? "", media_preview: r.media_url,
                  poster_path: r.poster_path, poster_preview: r.poster_url,
                  cta_text: r.cta_text ?? "", cta_link: r.cta_link ?? "",
                  sort_order: r.sort_order ?? 0, active: !!r.active,
                })} className="px-2 py-1 text-xs rounded border border-border">Edit</button>
                <button onClick={() => remove(r.id)} className="p-1.5 rounded border border-border text-destructive"><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground text-sm col-span-full">No programs yet.</p>}
      </div>
    </div>
  );
}

export function HomeSectionsTab() {
  const [sub, setSub] = useState<"performances" | "programs">("performances");
  return (
    <div className="mt-8 space-y-6">
      <div className="flex gap-2">
        {([["performances", "Featured performances"], ["programs", "Signature programs"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setSub(k)}
            className={`px-4 py-2 rounded-lg text-sm border ${sub === k ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
            {label}
          </button>
        ))}
      </div>
      {sub === "performances" ? <PerformancesSection /> : <ProgramsSection />}
    </div>
  );
}

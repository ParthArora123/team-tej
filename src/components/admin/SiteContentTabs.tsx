import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";
import {
  getSiteContent, adminSaveSiteContent,
  adminListDanceStyles, adminSaveDanceStyle, adminDeleteDanceStyle,
  adminUploadStyleMedia,
} from "@/lib/site-content.functions";

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let binary = ""; const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// ============ CONTACT INFO TAB ============
export function ContactInfoTab() {
  const load = useServerFn(getSiteContent);
  const save = useServerFn(adminSaveSiteContent);
  const [f, setF] = useState({
    email: "", phone: "", whatsapp: "", address: "", hours_line1: "", hours_line2: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load({ data: { key: "contact" } }).then((v: any) => v && setF({
      email: v.email ?? "", phone: v.phone ?? "", whatsapp: v.whatsapp ?? "",
      address: v.address ?? "", hours_line1: v.hours_line1 ?? "", hours_line2: v.hours_line2 ?? "",
    })).catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try { await save({ data: { key: "contact", value: f } }); toast.success("Contact info saved"); }
    catch (e: any) { toast.error(e.message ?? "Save failed"); }
    finally { setBusy(false); }
  };

  const F = (label: string, key: keyof typeof f, placeholder = "") => (
    <div>
      <label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</label>
      <input value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })}
        placeholder={placeholder}
        className="mt-2 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
    </div>
  );

  return (
    <form onSubmit={submit} className="mt-8 max-w-2xl space-y-5 p-6 rounded-2xl border border-border bg-card">
      <p className="font-display text-lg">Contact page details</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {F("Email", "email", "hello@teamtej.com")}
        {F("Phone", "phone", "+91 …")}
        {F("WhatsApp", "whatsapp", "+91 …")}
        {F("Studio address", "address", "Full studio address")}
        {F("Studio hours (line 1)", "hours_line1")}
        {F("Studio hours (line 2)", "hours_line2")}
      </div>
      <button disabled={busy} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
        {busy ? "Saving…" : "Save contact info"}
      </button>
    </form>
  );
}

// ============ ABOUT TAB ============
export function AboutContentTab() {
  const load = useServerFn(getSiteContent);
  const save = useServerFn(adminSaveSiteContent);
  const [f, setF] = useState<any>({
    eyebrow: "About", headline: "", paragraphs: [""],
    values_title: "What we stand on",
    values: [] as Array<{ title: string; body: string }>,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load({ data: { key: "about" } }).then((v: any) => v && setF({
      eyebrow: v.eyebrow ?? "About",
      headline: v.headline ?? "",
      paragraphs: Array.isArray(v.paragraphs) && v.paragraphs.length ? v.paragraphs : [""],
      values_title: v.values_title ?? "What we stand on",
      values: Array.isArray(v.values) ? v.values : [],
    })).catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await save({ data: { key: "about", value: {
        ...f,
        paragraphs: f.paragraphs.filter((p: string) => p.trim()),
        values: f.values.filter((v: any) => v.title?.trim() || v.body?.trim()),
      }}});
      toast.success("About page saved");
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="mt-8 max-w-3xl space-y-5 p-6 rounded-2xl border border-border bg-card">
      <p className="font-display text-lg">About page content</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Eyebrow</label>
          <input value={f.eyebrow} onChange={(e) => setF({ ...f, eyebrow: e.target.value })}
            className="mt-2 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Values section title</label>
          <input value={f.values_title} onChange={(e) => setF({ ...f, values_title: e.target.value })}
            className="mt-2 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
        </div>
      </div>
      <div>
        <label className="text-xs uppercase tracking-widest text-muted-foreground">Headline</label>
        <textarea value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} rows={2}
          className="mt-2 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">Story paragraphs</p>
          <button type="button" onClick={() => setF({ ...f, paragraphs: [...f.paragraphs, ""] })}
            className="px-3 py-1 text-xs rounded border border-border">+ Paragraph</button>
        </div>
        {f.paragraphs.map((p: string, i: number) => (
          <div key={i} className="flex gap-2">
            <textarea value={p} rows={3}
              onChange={(e) => { const a = [...f.paragraphs]; a[i] = e.target.value; setF({ ...f, paragraphs: a }); }}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            <button type="button" onClick={() => setF({ ...f, paragraphs: f.paragraphs.filter((_: any, x: number) => x !== i) })}
              className="p-2 rounded border border-border text-destructive self-start"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">Values</p>
          <button type="button" onClick={() => setF({ ...f, values: [...f.values, { title: "", body: "" }] })}
            className="px-3 py-1 text-xs rounded border border-border">+ Value</button>
        </div>
        {f.values.map((v: any, i: number) => (
          <div key={i} className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex gap-2">
              <input value={v.title} placeholder="Title" onChange={(e) => {
                const a = [...f.values]; a[i] = { ...a[i], title: e.target.value }; setF({ ...f, values: a });
              }} className="flex-1 px-3 py-2 rounded border border-border bg-background text-sm" />
              <button type="button" onClick={() => setF({ ...f, values: f.values.filter((_: any, x: number) => x !== i) })}
                className="p-2 rounded border border-border text-destructive"><Trash2 size={14} /></button>
            </div>
            <textarea value={v.body} placeholder="Description" rows={2} onChange={(e) => {
              const a = [...f.values]; a[i] = { ...a[i], body: e.target.value }; setF({ ...f, values: a });
            }} className="w-full px-3 py-2 rounded border border-border bg-background text-sm" />
          </div>
        ))}
      </div>

      <button disabled={busy} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
        {busy ? "Saving…" : "Save about page"}
      </button>
    </form>
  );
}

// ============ DANCE STYLES TAB ============
function MediaPicker({ kind, value, preview, onChange }: {
  kind: "image" | "video"; value: string; preview: string | null;
  onChange: (ref: string, preview: string | null) => void;
}) {
  const upload = useServerFn(adminUploadStyleMedia);
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File) => {
    if (file.size > 30 * 1024 * 1024) return toast.error("Max 30 MB");
    setBusy(true);
    try {
      const dataBase64 = await fileToBase64(file);
      const res = await upload({ data: { kind, filename: file.name, contentType: file.type, dataBase64 } });
      onChange(res.url, res.preview_url ?? URL.createObjectURL(file));
      toast.success(`${kind === "video" ? "Video" : "Image"} uploaded`);
    } catch (e: any) { toast.error(e.message ?? "Upload failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <button type="button" onClick={() => ref.current?.click()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:border-primary">
          <Upload size={14} /> {busy ? "Uploading…" : `Upload ${kind}`}
        </button>
        <input ref={ref} hidden type="file"
          accept={kind === "image" ? "image/*" : "video/mp4,video/webm,video/quicktime"}
          onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
        <input value={value} onChange={(e) => onChange(e.target.value, null)}
          placeholder={`or paste ${kind} URL`}
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
      </div>
      {(preview || value) && (
        <div className="w-full max-w-xs aspect-[4/5] rounded-lg overflow-hidden bg-muted border border-border">
          {kind === "image"
            ? <img src={preview || value} alt="" className="w-full h-full object-cover" />
            : <video src={preview || value} muted loop playsInline autoPlay className="w-full h-full object-cover" />}
        </div>
      )}
    </div>
  );
}

export function DanceStylesTab() {
  const list = useServerFn(adminListDanceStyles);
  const save = useServerFn(adminSaveDanceStyle);
  const del = useServerFn(adminDeleteDanceStyle);
  const [rows, setRows] = useState<any[]>([]);
  const empty = { name: "", tagline: "", image_url: "", video_url: "", sort_order: 0, active: true,
    image_preview: null as string | null, video_preview: null as string | null };
  const [f, setF] = useState<any>(empty);
  const reload = () => list().then(setRows).catch(() => {});
  useEffect(() => { reload(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name) return toast.error("Name required");
    try {
      await save({ data: {
        id: f.id, name: f.name, tagline: f.tagline || "",
        image_url: f.image_url || null, video_url: f.video_url || null,
        sort_order: Number(f.sort_order) || 0, active: !!f.active,
      }});
      setF(empty); toast.success("Saved"); reload();
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this dance style?")) return;
    try { await del({ data: { id } }); toast.success("Deleted"); reload(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="mt-8 space-y-8">
      <form onSubmit={submit} className="p-5 rounded-2xl border border-border bg-card space-y-4">
        <p className="font-display text-lg">{f.id ? "Edit dance style" : "Add dance style"}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })}
            placeholder="Style name (e.g. Fusion)" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          <input value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })}
            placeholder="Tagline" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Poster image</p>
          <MediaPicker kind="image" value={f.image_url} preview={f.image_preview}
            onChange={(ref, prev) => setF({ ...f, image_url: ref, image_preview: prev })} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Looping video (MP4/WebM/MOV, max 30 MB)</p>
          <MediaPicker kind="video" value={f.video_url} preview={f.video_preview}
            onChange={(ref, prev) => setF({ ...f, video_url: ref, video_preview: prev })} />
        </div>
        <div className="flex gap-3 items-center">
          <input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })}
            placeholder="Sort" className="w-24 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active
          </label>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">{f.id ? "Update" : "Add"}</button>
          {f.id && <button type="button" onClick={() => setF(empty)} className="px-4 py-2 rounded-lg border border-border text-sm">Cancel</button>}
        </div>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="aspect-[4/5] bg-muted relative">
              {r.video_url
                ? <video src={r.video_url} poster={r.image_url ?? undefined} muted loop playsInline autoPlay className="w-full h-full object-cover" />
                : r.image_url && <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />}
            </div>
            <div className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground truncate">{r.tagline || "—"} · #{r.sort_order} · {r.active ? "Active" : "Hidden"}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setF({ ...r, image_preview: r.image_url, video_preview: r.video_url })}
                  className="px-2 py-1 text-xs rounded border border-border">Edit</button>
                <button onClick={() => remove(r.id)} className="p-1.5 rounded border border-border text-destructive"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

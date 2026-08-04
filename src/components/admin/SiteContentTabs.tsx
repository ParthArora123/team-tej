import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";
import {
  getSiteContent, adminSaveSiteContent,
  adminListDanceStyles, adminSaveDanceStyle, adminDeleteDanceStyle,
  adminUploadStyleMedia,
} from "@/lib/site-content.functions";
import {
  adminListChoreographies, adminSaveChoreography, adminDeleteChoreography,
  adminUploadChoreographyMedia, adminCreateChoreographyUploadUrl,
} from "@/lib/choreographies.functions";
import { supabase } from "@/integrations/supabase/client";
import { compressImageFile } from "@/lib/compress-image";


async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return reject(new Error("Unexpected file reader result"));
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(file);
  });
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

  const pick = async (rawFile: File) => {
    if (rawFile.size > 500 * 1024 * 1024) return toast.error("Max 500 MB");
    setBusy(true);
    try {
      const file = kind === "image" ? await compressImageFile(rawFile) : rawFile;
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

// ============ CHOREOGRAPHIES TAB ============
function ChoreoMediaPicker({ kind, value, preview, onChange }: {
  kind: "image" | "video"; value: string; preview: string | null;
  onChange: (ref: string, preview: string | null) => void;
}) {
  const createUploadUrl = useServerFn(adminCreateChoreographyUploadUrl);
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File) => {
    const maxMB = kind === "video" ? 500 : 30;
    if (file.size > maxMB * 1024 * 1024) return toast.error(`Max ${maxMB} MB`);
    setBusy(true);
    try {
      const { bucket, path, token, ref: storageRef } = await createUploadUrl({
        data: { kind, filename: file.name, contentType: file.type },
      });
      const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, {
        contentType: file.type, upsert: false,
      });
      if (error) throw error;
      onChange(storageRef, URL.createObjectURL(file));
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
        <div className="w-full max-w-xs aspect-video rounded-lg overflow-hidden bg-muted border border-border">
          {kind === "image"
            ? <img src={preview || value} alt="" className="w-full h-full object-cover" />
            : <video src={preview || value} muted loop playsInline autoPlay className="w-full h-full object-cover" />}
        </div>
      )}
    </div>
  );
}

export function ChoreographiesTab() {
  const list = useServerFn(adminListChoreographies);
  const save = useServerFn(adminSaveChoreography);
  const del = useServerFn(adminDeleteChoreography);
  const [rows, setRows] = useState<any[]>([]);
  const empty = {
    id: undefined as string | undefined,
    title: "", description: "", thumbnail_url: "", video_url: "", youtube_url: "", instagram_url: "",
    published: true, sort_order: 0,
    thumb_preview: null as string | null, video_preview: null as string | null,
  };
  const [f, setF] = useState<any>(empty);
  const reload = () => list().then(setRows).catch(() => {});
  useEffect(() => { reload(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title) return toast.error("Title required");
    const ig = (f.instagram_url || "").trim();
    if (ig && !/^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/.+/i.test(ig)) {
      return toast.error("Instagram link must be a valid instagram.com URL");
    }
    try {
      await save({ data: {
        id: f.id, title: f.title, description: f.description || null,
        thumbnail_url: f.thumbnail_url || null,
        video_url: f.video_url || null,
        youtube_url: f.youtube_url || null,
        instagram_url: ig || null,
        published: !!f.published, sort_order: Number(f.sort_order) || 0,
      }});
      setF(empty); toast.success("Saved"); reload();
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this choreography?")) return;
    try { await del({ data: { id } }); toast.success("Deleted"); reload(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="mt-8 space-y-8">
      <form onSubmit={submit} className="p-5 rounded-2xl border border-border bg-card space-y-4">
        <p className="font-display text-lg">{f.id ? "Edit choreography" : "Add choreography"}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })}
            placeholder="Title" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          <input value={f.youtube_url} onChange={(e) => setF({ ...f, youtube_url: e.target.value })}
            placeholder="YouTube URL (optional)" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
        </div>
        <input value={f.instagram_url} onChange={(e) => setF({ ...f, instagram_url: e.target.value })}
          placeholder="Instagram post/reel URL (optional, e.g. https://www.instagram.com/reel/XXXX/)"
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
        <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })}
          placeholder="Short description (optional)" rows={2}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Thumbnail image</p>
          <ChoreoMediaPicker kind="image" value={f.thumbnail_url} preview={f.thumb_preview}
            onChange={(ref, prev) => setF({ ...f, thumbnail_url: ref, thumb_preview: prev })} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Video upload (leave blank if using YouTube URL)</p>
          <ChoreoMediaPicker kind="video" value={f.video_url} preview={f.video_preview}
            onChange={(ref, prev) => setF({ ...f, video_url: ref, video_preview: prev })} />
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })}
            placeholder="Sort" className="w-24 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} /> Published
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
            <div className="aspect-video bg-muted relative">
              {r.thumbnail_url
                ? <img src={r.thumbnail_url} alt={r.title} className="w-full h-full object-cover" />
                : r.video_url
                  ? <video src={r.video_url} muted loop playsInline className="w-full h-full object-cover" />
                  : <div className="w-full h-full grid place-items-center text-xs text-muted-foreground">No thumbnail</div>}
            </div>
            <div className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {new Date(r.uploaded_at).toLocaleDateString()} · #{r.sort_order} · {r.published ? "Published" : "Hidden"}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setF({
                  id: r.id, title: r.title, description: r.description ?? "",
                  thumbnail_url: r.thumbnail_url ?? "", video_url: r.video_url ?? "",
                  youtube_url: r.youtube_url ?? "", instagram_url: r.instagram_url ?? "",
                  published: !!r.published, sort_order: r.sort_order ?? 0,
                  thumb_preview: r.thumbnail_url, video_preview: r.video_url,
                })}
                  className="px-2 py-1 text-xs rounded border border-border">Edit</button>
                <button onClick={() => remove(r.id)} className="p-1.5 rounded border border-border text-destructive"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No choreographies yet.</p>}
      </div>
    </div>
  );
}

// ============ FOUNDER TAB ============
export function FounderTab() {
  const load = useServerFn(getSiteContent);
  const save = useServerFn(adminSaveSiteContent);
  const upload = useServerFn(adminUploadChoreographyMedia); // reuse media uploader (image)
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [f, setF] = useState<any>({
    name: "Tejas D Dhoke",
    title: "Founder",
    intro: "",
    image_url: "",
    image_preview: null as string | null,
    biography: "",
    achievements: [] as string[],
    vision: "",
    mission: "",
    socials: { instagram: "", youtube: "", facebook: "", twitter: "", linkedin: "" },
    cta_text: "Register for Workshops",
    cta_link: "/workshops",
  });

  useEffect(() => {
    load({ data: { key: "founder" } }).then((v: any) => {
      if (!v) return;
      setF({
        name: v.name ?? "Tejas D Dhoke",
        title: v.title ?? "Founder",
        intro: v.intro ?? "",
        image_url: v.image_url ?? "",
        image_preview: v.image_url ?? null,
        biography: v.biography ?? "",
        achievements: Array.isArray(v.achievements) ? v.achievements : [],
        vision: v.vision ?? "",
        mission: v.mission ?? "",
        socials: { instagram: "", youtube: "", facebook: "", twitter: "", linkedin: "", ...(v.socials ?? {}) },
        cta_text: v.cta_text ?? "Register for Workshops",
        cta_link: v.cta_link ?? "/workshops",
      });
    }).catch(() => {});
  }, []);

  const pickImage = async (rawFile: File) => {
    if (rawFile.size > 50 * 1024 * 1024) return toast.error("Max 50 MB");
    setUploading(true);
    try {
      const file = await compressImageFile(rawFile);
      const dataBase64 = await fileToBase64(file);
      const res = await upload({ data: { kind: "image", filename: file.name, contentType: file.type, dataBase64 } });
      setF((s: any) => ({ ...s, image_url: res.url, image_preview: res.preview_url ?? URL.createObjectURL(file) }));
      toast.success("Image uploaded");
    } catch (e: any) { toast.error(e.message ?? "Upload failed"); }
    finally { setUploading(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { image_preview: _p, ...rest } = f;
      await save({ data: { key: "founder", value: {
        ...rest,
        achievements: (f.achievements as string[]).map((s) => s.trim()).filter(Boolean),
      }}});
      toast.success("Founder section saved");
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
    finally { setBusy(false); }
  };

  const Input = ({ label, value, onChange, placeholder, rows }: any) => (
    <div>
      <label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</label>
      {rows ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
          className="mt-2 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="mt-2 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
      )}
    </div>
  );

  return (
    <form onSubmit={submit} className="mt-8 max-w-3xl space-y-5 p-6 rounded-2xl border border-border bg-card">
      <p className="font-display text-lg">Founder section</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Name" value={f.name} onChange={(v: string) => setF({ ...f, name: v })} />
        <Input label="Title" value={f.title} onChange={(v: string) => setF({ ...f, title: v })} placeholder="Founder" />
      </div>

      <Input label="Short intro" value={f.intro} onChange={(v: string) => setF({ ...f, intro: v })} rows={2} placeholder="One-line introduction" />

      <div>
        <label className="text-xs uppercase tracking-widest text-muted-foreground">Founder photo</label>
        <div className="mt-2 flex gap-3 items-start flex-wrap">
          <button type="button" onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:border-primary">
            <Upload size={14} /> {uploading ? "Uploading…" : "Upload photo"}
          </button>
          <input ref={fileRef} hidden type="file" accept="image/*"
            onChange={(e) => e.target.files?.[0] && pickImage(e.target.files[0])} />
          <input value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value, image_preview: e.target.value })}
            placeholder="or paste image URL"
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          {(f.image_preview || f.image_url) && (
            <div className="w-32 aspect-[4/5] rounded-lg overflow-hidden border border-border">
              <img src={f.image_preview || f.image_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      <Input label="Biography / About" value={f.biography} onChange={(v: string) => setF({ ...f, biography: v })} rows={5} />
      <Input label="Vision" value={f.vision} onChange={(v: string) => setF({ ...f, vision: v })} rows={3} />
      <Input label="Mission" value={f.mission} onChange={(v: string) => setF({ ...f, mission: v })} rows={3} />

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">Achievements / Dance journey</p>
          <button type="button" onClick={() => setF({ ...f, achievements: [...f.achievements, ""] })}
            className="px-3 py-1 text-xs rounded border border-border">+ Achievement</button>
        </div>
        {(f.achievements as string[]).map((a, i) => (
          <div key={i} className="flex gap-2">
            <input value={a} placeholder="e.g. Choreographed for major brands"
              onChange={(e) => { const arr = [...f.achievements]; arr[i] = e.target.value; setF({ ...f, achievements: arr }); }}
              className="flex-1 px-3 py-2 rounded border border-border bg-background text-sm" />
            <button type="button" onClick={() => setF({ ...f, achievements: f.achievements.filter((_: any, x: number) => x !== i) })}
              className="p-2 rounded border border-border text-destructive"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Input label="Instagram URL" value={f.socials.instagram} onChange={(v: string) => setF({ ...f, socials: { ...f.socials, instagram: v } })} placeholder="https://instagram.com/…" />
        <Input label="YouTube URL" value={f.socials.youtube} onChange={(v: string) => setF({ ...f, socials: { ...f.socials, youtube: v } })} placeholder="https://youtube.com/…" />
        <Input label="Facebook URL" value={f.socials.facebook} onChange={(v: string) => setF({ ...f, socials: { ...f.socials, facebook: v } })} />
        <Input label="Twitter/X URL" value={f.socials.twitter} onChange={(v: string) => setF({ ...f, socials: { ...f.socials, twitter: v } })} />
        <Input label="LinkedIn URL" value={f.socials.linkedin} onChange={(v: string) => setF({ ...f, socials: { ...f.socials, linkedin: v } })} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Input label="CTA button text" value={f.cta_text} onChange={(v: string) => setF({ ...f, cta_text: v })} />
        <Input label="CTA link" value={f.cta_link} onChange={(v: string) => setF({ ...f, cta_link: v })} placeholder="/workshops" />
      </div>

      <button disabled={busy} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
        {busy ? "Saving…" : "Save founder section"}
      </button>
    </form>
  );
}

// ============ WHATSAPP TEMPLATE TAB ============
import { DEFAULT_WHATSAPP_TEMPLATE, WHATSAPP_PLACEHOLDERS, renderWhatsappTemplate } from "@/lib/whatsapp-template";

export function WhatsappTemplateTab() {
  const load = useServerFn(getSiteContent);
  const save = useServerFn(adminSaveSiteContent);
  const [template, setTemplate] = useState<string>(DEFAULT_WHATSAPP_TEMPLATE);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load({ data: { key: "whatsapp_template" } }).then((v: any) => {
      if (v && typeof v.template === "string") setTemplate(v.template);
    }).catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await save({ data: { key: "whatsapp_template", value: { template } } });
      toast.success("WhatsApp template saved");
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
    finally { setBusy(false); }
  };

  const insert = (name: string) => setTemplate((t) => `${t}${t.endsWith(" ") || t === "" ? "" : " "}{{${name}}}`);

  const preview = renderWhatsappTemplate(template, {
    StudentName: "Priya Sharma",
    WorkshopName: "Bollywood Masterclass",
    RegistrationId: "TT-2026-00042",
    PaymentStatus: "Verified",
    WorkshopDate: "Sat, 15 Aug 2026",
    WorkshopTime: "5:00 PM",
    Venue: "Team Tej Studio, Mumbai",
    InstructorName: "Tejas D Dhoke",
    SupportContact: "+91 98765 43210",
    CustomInstructions: "Please arrive 15 minutes early.",
    QRCodeUrl: "https://example.com/verify?code=TT-2026-00042",
    TicketUrl: "https://example.com/verify?code=TT-2026-00042",
  });

  return (
    <form onSubmit={submit} className="mt-8 max-w-3xl space-y-5 p-6 rounded-2xl border border-border bg-card">
      <div>
        <p className="font-display text-lg">WhatsApp confirmation message</p>
        <p className="text-xs text-muted-foreground mt-1">
          Sent to the student's WhatsApp automatically after a successful payment. Use the placeholders below — they'll be replaced with real registration details.
        </p>
      </div>

      <div>
        <label className="text-xs uppercase tracking-widest text-muted-foreground">Available placeholders</label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {WHATSAPP_PLACEHOLDERS.map((p) => (
            <button type="button" key={p} onClick={() => insert(p)}
              className="px-2 py-1 rounded border border-border bg-background text-[11px] font-mono hover:border-primary">
              {`{{${p}}}`}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-widest text-muted-foreground">Message template</label>
        <textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={16}
          className="mt-2 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono" />
      </div>

      <div>
        <label className="text-xs uppercase tracking-widest text-muted-foreground">Preview</label>
        <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-sm">{preview}</pre>
      </div>

      <div className="flex gap-2">
        <button disabled={busy} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
          {busy ? "Saving…" : "Save template"}
        </button>
        <button type="button" onClick={() => setTemplate(DEFAULT_WHATSAPP_TEMPLATE)}
          className="px-4 py-2 rounded-lg border border-border text-sm">Reset to default</button>
      </div>
    </form>
  );
}

// ============ HERO PHOTO TAB ============
export function HeroPortraitTab() {
  const load = useServerFn(getSiteContent);
  const save = useServerFn(adminSaveSiteContent);
  const upload = useServerFn(adminUploadChoreographyMedia);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    load({ data: { key: "hero_portrait" } }).then((v: any) => {
      if (!v) return;
      setImageUrl(v.image_url ?? "");
      setPreview(v.image_url ?? null);
    }).catch(() => {});
  }, []);

  const pickImage = async (rawFile: File) => {
    if (rawFile.size > 50 * 1024 * 1024) return toast.error("Max 50 MB");
    setUploading(true);
    try {
      const file = await compressImageFile(rawFile);
      const dataBase64 = await fileToBase64(file);
      const res: any = await upload({ data: { kind: "image", filename: file.name, contentType: file.type, dataBase64 } });
      setImageUrl(res.url);
      setPreview(res.preview_url ?? URL.createObjectURL(file));
      toast.success("Photo uploaded");
    } catch (e: any) { toast.error(e.message ?? "Upload failed"); }
    finally { setUploading(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return toast.error("Upload a photo first");
    setBusy(true);
    try {
      await save({ data: { key: "hero_portrait", value: { image_url: imageUrl } } });
      toast.success("Homepage hero photo saved");
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="mt-8 max-w-2xl space-y-5 p-6 rounded-2xl border border-border bg-card">
      <div>
        <p className="font-display text-lg">Homepage hero photo</p>
        <p className="text-xs text-muted-foreground mt-1">
          This photo fills the top of the homepage. Portrait / tall images work best.
        </p>
      </div>

      <div className="rounded-xl overflow-hidden border border-border bg-muted aspect-[3/4] max-w-xs flex items-center justify-center">
        {preview
          ? <img src={preview} alt="Hero preview" className="h-full w-full object-cover object-top" />
          : <span className="text-xs text-muted-foreground">No photo yet</span>}
      </div>

      <div className="flex items-center gap-3">
        <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm">
          <Upload size={14} /> {uploading ? "Uploading…" : preview ? "Replace photo" : "Upload photo"}
        </button>
        {preview && (
          <button type="button" onClick={() => { setImageUrl(""); setPreview(null); }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground">
            <Trash2 size={14} /> Remove
          </button>
        )}
        <input ref={fileRef} type="file" hidden accept="image/jpeg,image/png,image/webp"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pickImage(f); e.currentTarget.value = ""; }} />
      </div>

      <button disabled={busy} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
        {busy ? "Saving…" : "Save hero photo"}
      </button>
    </form>
  );
}

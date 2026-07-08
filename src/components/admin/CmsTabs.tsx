import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";
import {
  adminListHeroSlides, adminSaveHeroSlide, adminDeleteHeroSlide,
  adminListFeaturedExperiences, adminSaveFeaturedExperience, adminDeleteFeaturedExperience,
  adminListGalleryItems, adminSaveGalleryItem, adminDeleteGalleryItem,
  adminUploadCmsImage, adminCreateHeroVideoUpload,
} from "@/lib/cms.functions";
import { compressImageFile } from "@/lib/compress-image";

type Bucket = "hero-images" | "gallery" | "featured-banners";

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

function ImageUploader({ bucket, value, previewUrl, onChange, maxMb }:
  { bucket: Bucket; value: string; previewUrl?: string | null; onChange: (ref: string, preview: string | null) => void; maxMb?: number }) {
  const upload = useServerFn(adminUploadCmsImage);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const limit = maxMb ?? 8;

  const pick = async (rawFile: File) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(rawFile.type)) return toast.error("Only JPG/PNG/WebP/GIF");
    if (rawFile.size > limit * 1024 * 1024) return toast.error(`Max ${limit} MB`);
    setBusy(true);

    try {
      const file = await compressImageFile(rawFile);
      const dataBase64 = await fileToBase64(file);
      const res = await upload({ data: { bucket, filename: file.name, contentType: file.type, dataBase64 } });
      onChange(res.image_url, res.preview_url ?? URL.createObjectURL(file));
      toast.success("Uploaded");
    } catch (e: any) { toast.error(e.message ?? "Upload failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <button type="button" onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:border-primary">
          <Upload size={14} /> {busy ? "Uploading…" : "Upload image"}
        </button>
        <input ref={inputRef} type="file" hidden accept="image/*"
          onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
        <input value={value} onChange={(e) => onChange(e.target.value, null)}
          placeholder="or paste image URL" className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
      </div>
      {(previewUrl || value) && (
        <div className="w-full max-w-md aspect-[16/9] rounded-lg border border-border overflow-hidden bg-muted">
          <img src={previewUrl || value} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

// =========== HERO SLIDES ===========
export function HeroSlidesTab() {
  const list = useServerFn(adminListHeroSlides);
  const save = useServerFn(adminSaveHeroSlide);
  const del = useServerFn(adminDeleteHeroSlide);
  const [rows, setRows] = useState<any[]>([]);
  const [f, setF] = useState<any>({ image_url: "", alt: "", sort_order: 0, active: true, preview: null });
  const reload = () => list().then(setRows).catch(() => {});
  useEffect(() => { reload(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.image_url) return toast.error("Image required");
    try {
      await save({ data: { id: f.id, image_url: f.image_url, alt: f.alt || null, sort_order: Number(f.sort_order) || 0, active: !!f.active } });
      setF({ image_url: "", alt: "", sort_order: 0, active: true, preview: null });
      toast.success("Saved"); reload();
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    try { await del({ data: { id } }); toast.success("Deleted"); reload(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="mt-8 space-y-8">
      <form onSubmit={submit} className="p-5 rounded-2xl border border-border bg-card space-y-3">
        <p className="font-display text-lg">{f.id ? "Edit slide" : "Add hero slide"}</p>
        <ImageUploader bucket="hero-images" value={f.image_url} previewUrl={f.preview} maxMb={500}
          onChange={(ref, preview) => setF({ ...f, image_url: ref, preview })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={f.alt ?? ""} onChange={(e) => setF({ ...f, alt: e.target.value })}
            placeholder="Alt text" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          <input type="number" value={f.sort_order ?? 0} onChange={(e) => setF({ ...f, sort_order: e.target.value })}
            placeholder="Sort order" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active
        </label>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">{f.id ? "Update" : "Add"}</button>
          {f.id && <button type="button" onClick={() => setF({ image_url: "", alt: "", sort_order: 0, active: true, preview: null })}
            className="px-4 py-2 rounded-lg border border-border text-sm">Cancel</button>}
        </div>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="aspect-[16/9] bg-muted">{r.image_url && <img src={r.image_url} alt={r.alt ?? ""} className="w-full h-full object-cover" />}</div>
            <div className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm truncate">{r.alt || "—"}</p>
                <p className="text-xs text-muted-foreground">#{r.sort_order} · {r.active ? "Active" : "Hidden"}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setF({ ...r, preview: r.image_url })} className="px-2 py-1 text-xs rounded border border-border">Edit</button>
                <button onClick={() => remove(r.id)} className="p-1.5 rounded border border-border text-destructive"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========== FEATURED EXPERIENCE ===========
export function FeaturedExperienceTab() {
  const list = useServerFn(adminListFeaturedExperiences);
  const save = useServerFn(adminSaveFeaturedExperience);
  const del = useServerFn(adminDeleteFeaturedExperience);
  const [rows, setRows] = useState<any[]>([]);
  const empty = { title: "", description: "", banner_url: "", city: "", start_date: "", end_date: "",
    day_schedule: [] as Array<{ day: string; content: string }>, cta_text: "Register now", cta_link: "/workshops", active: true, preview: null as string | null };
  const [f, setF] = useState<any>(empty);
  const reload = () => list().then(setRows).catch(() => {});
  useEffect(() => { reload(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title) return toast.error("Title required");
    try {
      await save({ data: {
        id: f.id, title: f.title, description: f.description || "",
        banner_url: f.banner_url || null, city: f.city || null,
        start_date: f.start_date || null, end_date: f.end_date || null,
        day_schedule: f.day_schedule ?? [],
        cta_text: f.cta_text || "Register now", cta_link: f.cta_link || "/workshops",
        active: !!f.active,
      }});
      setF(empty); toast.success("Saved"); reload();
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this featured experience?")) return;
    try { await del({ data: { id } }); toast.success("Deleted"); reload(); } catch (e: any) { toast.error(e.message); }
  };
  const addDay = () => setF({ ...f, day_schedule: [...(f.day_schedule ?? []), { day: `Day ${(f.day_schedule?.length ?? 0) + 1}`, content: "" }] });
  const updateDay = (i: number, key: "day" | "content", v: string) => {
    const arr = [...(f.day_schedule ?? [])]; arr[i] = { ...arr[i], [key]: v }; setF({ ...f, day_schedule: arr });
  };
  const removeDay = (i: number) => setF({ ...f, day_schedule: (f.day_schedule ?? []).filter((_: any, idx: number) => idx !== i) });

  return (
    <div className="mt-8 space-y-8">
      <form onSubmit={submit} className="p-5 rounded-2xl border border-border bg-card space-y-3">
        <p className="font-display text-lg">{f.id ? "Edit featured experience" : "New featured experience"}</p>
        <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })}
          placeholder="Title" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
        <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })}
          placeholder="Description" rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
        <ImageUploader bucket="featured-banners" value={f.banner_url ?? ""} previewUrl={f.preview}
          onChange={(ref, preview) => setF({ ...f, banner_url: ref, preview })} />
        <div className="grid sm:grid-cols-3 gap-3">
          <input value={f.city ?? ""} onChange={(e) => setF({ ...f, city: e.target.value })}
            placeholder="City" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          <input type="date" value={f.start_date ?? ""} onChange={(e) => setF({ ...f, start_date: e.target.value })}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          <input type="date" value={f.end_date ?? ""} onChange={(e) => setF({ ...f, end_date: e.target.value })}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={f.cta_text ?? ""} onChange={(e) => setF({ ...f, cta_text: e.target.value })}
            placeholder="CTA label" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          <input value={f.cta_link ?? ""} onChange={(e) => setF({ ...f, cta_link: e.target.value })}
            placeholder="CTA link" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Day schedule</p>
            <button type="button" onClick={addDay} className="px-3 py-1 rounded-lg border border-border text-xs">Add day</button>
          </div>
          {(f.day_schedule ?? []).map((d: any, i: number) => (
            <div key={i} className="flex gap-2 items-start">
              <input value={d.day} onChange={(e) => updateDay(i, "day", e.target.value)}
                className="w-28 px-2 py-1.5 rounded border border-border bg-background text-sm" />
              <textarea value={d.content} onChange={(e) => updateDay(i, "content", e.target.value)}
                rows={2} placeholder="What happens this day" className="flex-1 px-2 py-1.5 rounded border border-border bg-background text-sm" />
              <button type="button" onClick={() => removeDay(i)} className="p-1.5 rounded border border-border text-destructive"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active (only one is shown on the site)
        </label>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">{f.id ? "Update" : "Create"}</button>
          {f.id && <button type="button" onClick={() => setF(empty)} className="px-4 py-2 rounded-lg border border-border text-sm">Cancel</button>}
        </div>
      </form>

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4 flex gap-4 items-start">
            <div className="w-32 aspect-[16/9] rounded-lg bg-muted overflow-hidden shrink-0">
              {r.banner_url && <img src={r.banner_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-lg">{r.title}</p>
              <p className="text-xs text-muted-foreground">{r.city ?? ""}{r.start_date ? ` · ${r.start_date}` : ""}{r.end_date ? `–${r.end_date}` : ""} · {r.active ? "Active" : "Hidden"}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setF({ ...r, preview: r.banner_url, day_schedule: r.day_schedule ?? [] })} className="px-2 py-1 text-xs rounded border border-border">Edit</button>
              <button onClick={() => remove(r.id)} className="p-1.5 rounded border border-border text-destructive"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========== GALLERY ===========
export function GalleryTab() {
  const list = useServerFn(adminListGalleryItems);
  const save = useServerFn(adminSaveGalleryItem);
  const del = useServerFn(adminDeleteGalleryItem);
  const [rows, setRows] = useState<any[]>([]);
  const [f, setF] = useState<any>({ image_url: "", caption: "", sort_order: 0, active: true, preview: null });
  const reload = () => list().then(setRows).catch(() => {});
  useEffect(() => { reload(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.image_url) return toast.error("Image required");
    try {
      await save({ data: { id: f.id, image_url: f.image_url, caption: f.caption || "", sort_order: Number(f.sort_order) || 0, active: !!f.active } });
      setF({ image_url: "", caption: "", sort_order: 0, active: true, preview: null });
      toast.success("Saved"); reload();
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this gallery item?")) return;
    try { await del({ data: { id } }); toast.success("Deleted"); reload(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="mt-8 space-y-8">
      <form onSubmit={submit} className="p-5 rounded-2xl border border-border bg-card space-y-3">
        <p className="font-display text-lg">{f.id ? "Edit gallery item" : "Add to gallery"}</p>
        <ImageUploader bucket="gallery" value={f.image_url} previewUrl={f.preview}
          onChange={(ref, preview) => setF({ ...f, image_url: ref, preview })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={f.caption ?? ""} onChange={(e) => setF({ ...f, caption: e.target.value })}
            placeholder="Caption" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          <input type="number" value={f.sort_order ?? 0} onChange={(e) => setF({ ...f, sort_order: e.target.value })}
            placeholder="Sort order" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active
        </label>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">{f.id ? "Update" : "Add"}</button>
          {f.id && <button type="button" onClick={() => setF({ image_url: "", caption: "", sort_order: 0, active: true, preview: null })}
            className="px-4 py-2 rounded-lg border border-border text-sm">Cancel</button>}
        </div>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="aspect-square bg-muted">{r.image_url && <img src={r.image_url} alt={r.caption ?? ""} className="w-full h-full object-cover" />}</div>
            <div className="p-2 flex items-center justify-between gap-1">
              <p className="text-xs truncate flex-1">{r.caption || "—"}</p>
              <button onClick={() => setF({ ...r, preview: r.image_url })} className="text-[10px] px-1.5 py-0.5 rounded border border-border">Edit</button>
              <button onClick={() => remove(r.id)} className="p-1 rounded border border-border text-destructive"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

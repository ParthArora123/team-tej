import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeCanvas } from "qrcode.react";
import { toast, Toaster } from "sonner";
import { CalendarDays, Clock, ImageUp, Sparkles, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  listAllEnrollments, adminSaveWorkshop, adminSetPublished,
  adminDeleteWorkshop, adminListWorkshops, adminStats, adminScanTicket, checkIsAdmin,
  adminListTeam, adminSetUserAdmin, adminAddTeamByEmail, approveEnrollment, adminGetProofUrl,
  adminUploadWorkshopImage,
} from "@/lib/enrollment.functions";
import {
  adminListTeamProfiles, adminSaveTeamProfile, adminDeleteTeamProfile,
  adminSetTeamProfilePublished, adminReorderTeamProfile, adminUploadTeamPhoto,
} from "@/lib/team.functions";
import {
  adminListCelebrities, adminSaveCelebrity, adminDeleteCelebrity, adminUploadCelebrityPhoto,
  adminListBrands, adminSaveBrand, adminDeleteBrand,
  adminListGlobe, adminSaveGlobe, adminDeleteGlobe,
} from "@/lib/content.functions";
import { HeroSlidesTab, FeaturedExperienceTab, GalleryTab } from "@/components/admin/CmsTabs";
import { MessagesTab } from "@/components/admin/MessagesTab";
import { ContactInfoTab, AboutContentTab, DanceStylesTab, ChoreographiesTab, FounderTab } from "@/components/admin/SiteContentTabs";

import { WorkshopHeroTab } from "@/components/admin/WorkshopHeroTab";
import { WorkshopMediaPanel } from "@/components/admin/WorkshopMediaPanel";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { ZeroToHeroMediaTab } from "@/components/admin/ZeroToHeroMediaTab";
import { compressImageFile } from "@/lib/compress-image";



export const Route = createFileRoute("/_authenticated/admin")({ component: AdminPage });

type Tab = "overview" | "workshops" | "workshop_hero" | "profiles" | "students" | "team" | "scan" | "celebrities" | "brands" | "globe" | "hero" | "featured" | "gallery" | "messages" | "contact_info" | "about_page" | "styles" | "choreographies" | "founder" | "zero_to_hero";

const adminTabs: Array<{ id: Tab; label: string; emphasis?: boolean }> = [
  { id: "overview", label: "Overview" },
  { id: "messages", label: "Messages" },
  { id: "team", label: "Team roles" },
  { id: "profiles", label: "Home profiles" },
  { id: "hero", label: "Hero carousel" },
  { id: "featured", label: "Featured experience" },
  { id: "gallery", label: "Gallery" },
  { id: "styles", label: "Dance styles" },
  { id: "choreographies", label: "Choreographies", emphasis: true },
  { id: "founder", label: "Founder section" },
  { id: "zero_to_hero", label: "Zero to Hero media", emphasis: true },
  { id: "contact_info", label: "Contact info" },
  { id: "about_page", label: "About page" },

  { id: "workshops", label: "Workshops" },
  { id: "workshop_hero", label: "Workshop hero", emphasis: true },
  { id: "celebrities", label: "Celebrities" },
  { id: "brands", label: "Brands" },
  { id: "globe", label: "Globe" },
  { id: "students", label: "Students" },
  { id: "scan", label: "Scan" },
];




function AdminPage() {
  const navigate = useNavigate();
  const fetchStats = useServerFn(adminStats);
  const fetchAll = useServerFn(listAllEnrollments);
  const approve = useServerFn(approveEnrollment);
  const fetchWorkshops = useServerFn(adminListWorkshops);
  const saveWorkshop = useServerFn(adminSaveWorkshop);
  const setPublished = useServerFn(adminSetPublished);
  const delWorkshop = useServerFn(adminDeleteWorkshop);
  const scan = useServerFn(adminScanTicket);
  const adminCheck = useServerFn(checkIsAdmin);

  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<any>(null);
  const [enrs, setEnrs] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);

  useEffect(() => {
    adminCheck().then((r) => { if (!r.isAdmin) navigate({ to: "/dashboard" }); else reload(); });
  }, []);
  const reload = async () => {
    setStats(await fetchStats());
    setEnrs(await fetchAll());
    setWorkshops(await fetchWorkshops());
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 lg:px-10 max-w-6xl mx-auto">
      <Toaster position="top-right" richColors closeButton />
      <p className="text-xs uppercase tracking-widest text-primary">Admin</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl font-bold">Control room</h1>
        <button
          type="button"
          onClick={() => setTab("team")}
          className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium"
        >
          Manage team roles
        </button>
      </div>

      <div className="mt-6 flex gap-2 flex-wrap">
        {adminTabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm ${tab===t.id?"bg-primary text-primary-foreground":t.emphasis?"bg-primary/10 text-primary border border-primary/30":"bg-muted"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && stats && (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total workshops" value={stats.totalWorkshops} />
          <StatCard label="Published" value={stats.activeWorkshops} />
          <StatCard label="Total registrations" value={stats.totalRegs} />
          <StatCard label="Confirmed (paid)" value={stats.approved} accent />
          <StatCard label="Awaiting payment" value={stats.awaiting} />
          <StatCard label="Revenue (₹)" value={stats.revenue.toLocaleString("en-IN")} />
        </div>
      )}

      {tab === "workshops" && (
        <WorkshopsTab rows={workshops.filter((w: any) => (w.kind ?? "workshop") === "workshop")} onSave={saveWorkshop} onDel={delWorkshop} onPub={setPublished} reload={reload} />
      )}

      


      {tab === "students" && <StudentsTab rows={enrs} />}

      {tab === "team" && <TeamTab />}

      {tab === "profiles" && <ProfilesTab />}

      {tab === "celebrities" && <CelebritiesTab />}

      {tab === "brands" && <BrandsTab />}

      {tab === "globe" && <GlobeTab />}

      {tab === "hero" && <HeroSlidesTab />}

      {tab === "workshop_hero" && <WorkshopHeroTab />}

      {tab === "zero_to_hero" && <ZeroToHeroMediaTab />}

      {tab === "featured" && <FeaturedExperienceTab />}

      {tab === "gallery" && <GalleryTab />}

      {tab === "messages" && <MessagesTab />}

      {tab === "contact_info" && <ContactInfoTab />}

      {tab === "about_page" && <AboutContentTab />}

      {tab === "styles" && <DanceStylesTab />}

      {tab === "choreographies" && <ChoreographiesTab />}

      {tab === "founder" && <FounderTab />}

      {tab === "scan" && <ScanTab onScan={scan} />}
    </div>
  );
}


function StatCard({ label, value, accent }: { label: string; value: any; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border ${accent ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const WS_PAYER_KEY = "admin:ws:payerDefaults";
type WsPayerDefaults = { upi_id: string; bank_account_holder: string };
function readWsPayerDefaults(): WsPayerDefaults | null {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(WS_PAYER_KEY) : null;
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && typeof p.upi_id === "string" && typeof p.bank_account_holder === "string" && p.upi_id && p.bank_account_holder) return p;
    return null;
  } catch { return null; }
}

const emptyWs = () => ({
  id: undefined as string | undefined,
  kind: "workshop", name: "", description: "", banner_url: "", banner_path: "",
  banner_preview: "" as string,
  banner_video_path: "" as string,
  banner_video_preview: null as string | null,
  banner_gif_path: "" as string,
  banner_gif_preview: null as string | null,
  event_date: "", event_time: "", venue: "", city: "", instructor: "",
  duration: "", capacity: "", price_inr: "",
  registration_open_on: todayISO(),
  category: "", style: "", published: true,
  silver_seat_enabled: true,
  silver_seat_price: "1000",
  allow_single: true,
  allow_both: false,
  both_price: "",
  workshop1_name: "",
  workshop2_name: "",
  silver_capacity_w1: "",
  silver_capacity_w2: "",
  upi_id: "", clear_upi: false, has_upi: false,
  bank_account_holder: "",
  save_payer_default: false,
});

function WorkshopsTab({ rows, onSave, onDel, onPub, reload }: any) {
  const uploadImage = useServerFn(adminUploadWorkshopImage);
  const [f, setF] = useState<any>(emptyWs());
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [payerDefaults, setPayerDefaults] = useState<WsPayerDefaults | null>(null);
  const [toDelete, setToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const openAdd = () => {
    const def = readWsPayerDefaults();
    setPayerDefaults(def);
    setF({ ...emptyWs(), upi_id: def?.upi_id ?? "", bank_account_holder: def?.bank_account_holder ?? "" });
    setOpen(true);
  };
  const closeDialog = () => { setOpen(false); setF(emptyWs()); };

  const edit = (r: any) => {
    setPayerDefaults(readWsPayerDefaults());
    setF({
      id: r.id, kind: r.kind, name: r.name ?? "", description: r.description ?? "",
      banner_url: r.banner_url ?? "", banner_path: r.banner_path ?? "",
      banner_preview: r.banner_signed_url ?? r.banner_url ?? "",
      banner_video_path: r.banner_video_path ?? "",
      banner_video_preview: r.banner_video_signed_url ?? null,
      banner_gif_path: r.banner_gif_path ?? "",
      banner_gif_preview: r.banner_gif_signed_url ?? null,
      event_date: r.event_date ?? "", event_time: r.event_time ?? "",
      venue: r.venue ?? "", city: r.city ?? "", instructor: r.instructor ?? "", duration: r.duration ?? "",
      capacity: r.capacity ?? "", price_inr: r.price_inr ?? "",
      registration_open_on: r.registration_open_on ?? todayISO(),
      category: r.category ?? "",
      style: r.style ?? "", published: !!r.published,
      silver_seat_enabled: !!r.silver_seat_enabled,
      silver_seat_price: (r.silver_seat_price ?? 1000).toString(),
      allow_single: r.allow_single !== false,
      allow_both: !!r.allow_both,
      both_price: r.both_price != null ? String(r.both_price) : "",
      workshop1_name: r.workshop1_name ?? "",
      workshop2_name: r.workshop2_name ?? "",
      silver_capacity_w1: r.silver_capacity_w1 != null ? String(r.silver_capacity_w1) : "",
      silver_capacity_w2: r.silver_capacity_w2 != null ? String(r.silver_capacity_w2) : "",
      upi_id: "", clear_upi: false, has_upi: !!r.has_upi,
      bank_account_holder: r.bank_account_holder ?? "",
      save_payer_default: false,
    });
    setOpen(true);
  };

  const handleFile = async (rawFile: File) => {
    if (!/^image\/(png|jpe?g|webp)$/.test(rawFile.type)) {
      toast.error("Only JPG, PNG or WebP images are allowed.");
      return;
    }
    if (rawFile.size > 50 * 1024 * 1024) {
      toast.error("Image is too large. Max 50 MB.");
      return;
    }
    setUploading(true);
    try {
      const file = await compressImageFile(rawFile);
      const buf = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const dataBase64 = btoa(binary);
      const res = await uploadImage({ data: { filename: file.name, contentType: file.type, dataBase64 } });
      setF((s: any) => ({ ...s, banner_path: res.path, banner_url: "", banner_preview: res.url ?? URL.createObjectURL(file) }));
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.allow_single && !f.allow_both) {
      toast.error("Enable at least one registration option (Single or Both).");
      return;
    }
    if (f.allow_both && !(Number(f.both_price) > 0)) {
      toast.error("Enter a Both Workshops price.");
      return;
    }
    if (f.allow_both && (!f.workshop1_name?.trim() || !f.workshop2_name?.trim())) {
      toast.error("Enter both Workshop 1 and Workshop 2 names.");
      return;
    }
    setBusy(true);
    try {
      await onSave({ data: {
        ...f,
        price_inr: Number(f.price_inr),
        capacity: f.capacity ? Number(f.capacity) : undefined,
        silver_seat_price: f.silver_seat_enabled ? Number(f.silver_seat_price || 1000) : 1000,
        allow_single: !!f.allow_single,
        allow_both: !!f.allow_both,
        both_price: f.allow_both ? Number(f.both_price) : null,
        workshop1_name: f.allow_both ? (f.workshop1_name?.trim() || null) : null,
        workshop2_name: f.allow_both ? (f.workshop2_name?.trim() || null) : null,
        silver_capacity_w1: f.silver_capacity_w1 !== "" ? Number(f.silver_capacity_w1) : null,
        silver_capacity_w2: f.allow_both && f.silver_capacity_w2 !== "" ? Number(f.silver_capacity_w2) : null,
        upi_id: f.upi_id?.trim() || undefined,
        clear_upi: !!f.clear_upi,
        silver_seat_enabled: !!f.silver_seat_enabled,
        banner_url: f.banner_url || undefined,
        banner_path: f.banner_path || undefined,
        banner_video_path: f.banner_video_path || null,
        banner_gif_path: f.banner_gif_path || null,
        registration_open_on: f.registration_open_on || undefined,
      }});
      if (!payerDefaults && f.save_payer_default && f.upi_id?.trim() && f.bank_account_holder?.trim()) {
        try {
          window.localStorage.setItem(WS_PAYER_KEY, JSON.stringify({
            upi_id: f.upi_id.trim(),
            bank_account_holder: f.bank_account_holder.trim(),
          }));
          setPayerDefaults({ upi_id: f.upi_id.trim(), bank_account_holder: f.bank_account_holder.trim() });
        } catch {}
      }
      toast.success(f.id ? "Workshop updated successfully!" : "Workshop added successfully!", { duration: 3500 });
      closeDialog();
      reload();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save workshop");
    } finally { setBusy(false); }
  };

  return (
    <div className="mt-6 min-w-0">
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="font-display text-lg font-bold">Workshops</p>
        <button onClick={openAdd} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shrink-0">
          + Add Workshop
        </button>
      </div>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : closeDialog())}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{f.id ? "Edit Workshop" : "Add Workshop"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4 min-w-0">
            <FieldRow label="Workshop Title *">
              <In placeholder="Enter workshop title" v={f.name} on={(v) => setF({ ...f, name: v })} required />
            </FieldRow>

            <FieldRow label="Workshop Description">
              <textarea placeholder="Enter workshop description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" rows={3} />
            </FieldRow>

            <FieldRow label="Workshop Banner">
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f0 = e.dataTransfer.files?.[0]; if (f0) handleFile(f0); }}
                className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 p-2 cursor-pointer"
              >
                <div className="h-14 w-20 rounded bg-muted overflow-hidden flex items-center justify-center shrink-0">
                  {f.banner_preview ? <img src={f.banner_preview} alt="" className="h-full w-full object-cover" /> : <ImageUp size={18} className="text-muted-foreground" />}
                </div>
                <div className="flex-1 text-xs">
                  <p className="font-medium">{uploading ? "Uploading…" : f.banner_preview ? "Replace image" : "Upload workshop banner image"}</p>
                  <p className="text-muted-foreground">JPG, PNG, WebP · up to 8 MB</p>
                </div>
                {f.banner_preview && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setF({ ...f, banner_path: "", banner_url: "", banner_preview: "" }); }}
                    className="p-1 rounded bg-background border border-border"><X size={12} /></button>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
                  onChange={(e) => { const f0 = e.target.files?.[0]; if (f0) handleFile(f0); e.currentTarget.value = ""; }} />
              </div>
            </FieldRow>

            <FieldRow label="Banner Video (optional, up to 500 MB)">
              <MediaUploader kind="video" path={f.banner_video_path || null} previewUrl={f.banner_video_preview}
                onChange={(p, pv) => setF({ ...f, banner_video_path: p ?? "", banner_video_preview: pv })} />
            </FieldRow>

            <FieldRow label="Banner GIF (optional)">
              <MediaUploader kind="gif" path={f.banner_gif_path || null} previewUrl={f.banner_gif_preview}
                onChange={(p, pv) => setF({ ...f, banner_gif_path: p ?? "", banner_gif_preview: pv })} />
            </FieldRow>

            {f.id && (
              <FieldRow label="Workshop Media Gallery">
                <WorkshopMediaPanel programId={f.id} />
              </FieldRow>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldRow label="Registration Open Date">
                <In type="date" placeholder="Select registration open date" v={f.registration_open_on} on={(v) => setF({ ...f, registration_open_on: v })} />
              </FieldRow>
              <FieldRow label="Workshop Date">
                <In type="date" placeholder="Select workshop date" v={f.event_date} on={(v) => setF({ ...f, event_date: v })} />
              </FieldRow>
              <FieldRow label="Workshop Time">
                <In type="time" placeholder="Select workshop time" v={f.event_time} on={(v) => setF({ ...f, event_time: v })} />
              </FieldRow>
              <FieldRow label="Workshop Duration">
                <In placeholder="Enter duration (e.g. 2 hrs)" v={f.duration} on={(v) => setF({ ...f, duration: v })} />
              </FieldRow>
              <FieldRow label="Workshop Location">
                <In placeholder="Enter workshop location" v={f.venue} on={(v) => setF({ ...f, venue: v })} />
              </FieldRow>
              <FieldRow label="City">
                <In placeholder="e.g. Mumbai" v={f.city} on={(v) => setF({ ...f, city: v })} />
              </FieldRow>

              <FieldRow label="Instructor">
                <In placeholder="Enter instructor name" v={f.instructor} on={(v) => setF({ ...f, instructor: v })} />
              </FieldRow>
              <FieldRow label="Category">
                <In placeholder="Enter category (e.g. Hip-Hop)" v={f.category} on={(v) => setF({ ...f, category: v })} />
              </FieldRow>
              <FieldRow label="Maximum Capacity">
                <In type="number" placeholder="Enter maximum participants" v={f.capacity} on={(v) => setF({ ...f, capacity: v })} />
              </FieldRow>
              <FieldRow label="Workshop Type">
                <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm">
                  <option value="workshop">Workshop</option>
                  <option value="nritya_sadhana">Nritya Sadhana</option>
                  <option value="zero_to_hero">Zero to Hero</option>
                  <option value="online_training">Online Training</option>
                </select>
              </FieldRow>
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={!!f.silver_seat_enabled} onChange={(e) => setF({ ...f, silver_seat_enabled: e.target.checked })} />
                Enable Silver Seat option
              </label>
              {f.silver_seat_enabled && (
                <>
                  <FieldRow label="Silver Seat Price (₹)">
                    <In type="number" placeholder="Enter additional Silver Seat price" v={f.silver_seat_price} on={(v) => setF({ ...f, silver_seat_price: v })} />
                  </FieldRow>
                  <FieldRow label={f.allow_both ? "Silver Seat Capacity · Workshop 1" : "Silver Seat Capacity"}>
                    <In type="number" placeholder="Leave empty for unlimited" v={f.silver_capacity_w1} on={(v) => setF({ ...f, silver_capacity_w1: v })} />
                  </FieldRow>
                  {f.allow_both && (
                    <FieldRow label="Silver Seat Capacity · Workshop 2">
                      <In type="number" placeholder="Leave empty for unlimited" v={f.silver_capacity_w2} on={(v) => setF({ ...f, silver_capacity_w2: v })} />
                    </FieldRow>
                  )}
                </>
              )}
              <p className="text-[11px] text-muted-foreground">Default price is ₹1,000. Leave capacity empty for unlimited silver seats.</p>
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Registration Configuration</p>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={!!f.allow_single} onChange={(e) => setF({ ...f, allow_single: e.target.checked })} />
                Enable Single Workshop registration
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={!!f.allow_both} onChange={(e) => setF({ ...f, allow_both: e.target.checked })} />
                Enable Both Workshops registration
              </label>
              <FieldRow label="Single Workshop Price (₹) *">
                <In type="number" placeholder="Enter Single Workshop price" v={f.price_inr} on={(v) => setF({ ...f, price_inr: v })} required />
              </FieldRow>
              {f.allow_both && (
                <>
                  <FieldRow label="Both Workshops Price (₹) *">
                    <In type="number" placeholder="Enter Both Workshops price" v={f.both_price} on={(v) => setF({ ...f, both_price: v })} />
                  </FieldRow>
                  <FieldRow label="Workshop 1 Name *">
                    <In placeholder="e.g. Bollywood Fusion" v={f.workshop1_name} on={(v) => setF({ ...f, workshop1_name: v })} />
                  </FieldRow>
                  <FieldRow label="Workshop 2 Name *">
                    <In placeholder="e.g. Contemporary" v={f.workshop2_name} on={(v) => setF({ ...f, workshop2_name: v })} />
                  </FieldRow>
                </>
              )}
              <p className="text-[11px] text-muted-foreground">Enable one or both options. Workshop names are shown on the registration form when Both is enabled.</p>
            </div>




            <div className="rounded-lg border border-border/60 bg-muted/40 p-3 space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Payment · UPI</p>

              {!f.id && payerDefaults ? (
                <div className="rounded-md border border-border/60 bg-background/50 p-2 text-xs space-y-1">
                  <p className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Using saved default payer</span>
                    <button type="button"
                      onClick={() => { try { window.localStorage.removeItem(WS_PAYER_KEY); } catch {} setPayerDefaults(null); setF({ ...f, upi_id: "", bank_account_holder: "", save_payer_default: false }); }}
                      className="text-primary underline underline-offset-2">Change</button>
                  </p>
                  <p><span className="text-muted-foreground">UPI:</span> {payerDefaults.upi_id}</p>
                  <p><span className="text-muted-foreground">Holder:</span> {payerDefaults.bank_account_holder}</p>
                </div>
              ) : (
                <>
                  <FieldRow label="Official UPI ID">
                    <In placeholder={f.has_upi ? "UPI already saved · enter to replace (e.g. tejas@upi)" : "Enter UPI ID (e.g. tejas@upi)"}
                      v={f.upi_id} on={(v) => setF({ ...f, upi_id: v })} />
                  </FieldRow>
                  <FieldRow label="Bank Account Holder Name *">
                    <In placeholder="Enter bank account holder name (e.g. Tejas D Dhoke)"
                      v={f.bank_account_holder} on={(v) => setF({ ...f, bank_account_holder: v })} required />
                  </FieldRow>
                  <p className="text-[11px] text-muted-foreground">UPI ID stored encrypted. Holder name is shown below the UPI ID on the payment page so students can verify the recipient before paying.</p>
                  {!f.id && !payerDefaults && (
                    <label className="flex items-start gap-2 text-xs rounded-md border border-border/60 bg-background/50 p-2 cursor-pointer">
                      <input type="checkbox" className="mt-0.5" checked={!!f.save_payer_default}
                        onChange={(e) => setF({ ...f, save_payer_default: e.target.checked })} />
                      <span className="flex-1">
                        <span className="block font-medium text-foreground">Set as default</span>
                        <span className="text-muted-foreground">Save this UPI ID and holder name. Next time you add a workshop these fields will be hidden and used automatically.</span>
                      </span>
                    </label>
                  )}
                  {f.has_upi && (
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={!!f.clear_upi} onChange={(e) => setF({ ...f, clear_upi: e.target.checked })} />
                      Remove saved UPI and fall back to default
                    </label>
                  )}
                </>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />
              Publish (visible to customers)
            </label>
            <div className="flex gap-2 justify-end pt-3 border-t border-border">
              <button type="button" onClick={closeDialog} className="px-4 py-2 rounded-lg bg-muted text-sm">Cancel</button>
              <button type="submit" disabled={busy || uploading} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-60">
                {busy ? "Saving…" : f.id ? "Update Workshop" : "Create Workshop"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {rows.map((r: any) => (
          <div key={r.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.event_date ?? "—"} · {r.venue ?? "—"} · ₹{r.price_inr}
                  {r.silver_seat_enabled && <span className="text-primary"> · Silver +₹1,000</span>}
                  {" · "}{r.seats_taken ?? 0}/{r.capacity ?? "∞"} seats
                </p>
                <p className="text-[11px] mt-1 flex flex-wrap gap-2">
                  <span className={r.published ? "text-emerald-400" : "text-amber-400"}>
                    {r.published ? "Published" : "Draft"}
                  </span>
                  <span className={r.has_upi ? "text-emerald-400" : "text-muted-foreground"}>
                    {r.has_upi ? "UPI set 🔒" : "No UPI"}
                  </span>
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => edit(r)} className="px-3 py-1 text-xs rounded bg-muted">Edit</button>
                <button onClick={async () => { await onPub({ data: { id: r.id, published: !r.published }}); reload(); }}
                  className="px-3 py-1 text-xs rounded bg-muted">{r.published ? "Unpublish" : "Publish"}</button>
                <button onClick={() => setToDelete(r)}
                  className="px-3 py-1 text-xs rounded bg-destructive text-white">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground text-sm">No workshops yet.</p>}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => { if (!v && !deleting) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this workshop?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.name ? <><strong>{toDelete.name}</strong> and all its registrations will be permanently removed. </> : null}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={async (e) => {
                e.preventDefault();
                if (!toDelete) return;
                setDeleting(true);
                try {
                  await onDel({ data: { id: toDelete.id } });
                  toast.success(`"${toDelete.name}" deleted successfully.`);
                  setToDelete(null);
                  await reload();
                } catch (err: any) {
                  toast.error(err?.message ?? "Failed to delete workshop");
                } finally {
                  setDeleting(false);
                }
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${checked ? "bg-primary" : "bg-muted border border-border"}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}


function In({ v, on, ...p }: { v: string; on: (v: string) => void; [k: string]: any }) {
  return <input value={v} onChange={(e) => on(e.target.value)} {...p}
    className="w-full min-w-0 px-3 py-2 rounded-lg bg-muted border border-border text-sm" />;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function StudentsTab({ rows }: { rows: any[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [prog, setProg] = useState<string>("all");

  const programs = Array.from(new Set(rows.map((r) => r.program?.name).filter(Boolean))) as string[];

  const filtered = rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (prog !== "all" && r.program?.name !== prog) return false;
    if (!q.trim()) return true;
    const hay = `${r.full_name ?? ""} ${r.email ?? ""} ${r.phone ?? ""} ${r.ticket_code ?? ""} ${r.city ?? ""} ${r.state ?? ""}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  const cols = [
    ["Registered", (r: any) => new Date(r.created_at).toLocaleString("en-IN")],
    ["Full name", (r: any) => r.full_name ?? ""],
    ["Email", (r: any) => r.email ?? ""],
    ["Phone", (r: any) => r.phone ?? ""],
    ["Age", (r: any) => r.age ?? ""],
    ["Gender", (r: any) => r.gender ?? ""],
    ["City", (r: any) => r.city ?? ""],
    ["State", (r: any) => r.state ?? ""],
    ["Address", (r: any) => r.address ?? ""],
    ["Emergency contact", (r: any) => r.emergency_contact ?? ""],
    ["Medical info", (r: any) => r.medical_info ?? ""],
    ["Workshop", (r: any) => r.program?.name ?? ""],
    ["Workshop date", (r: any) => r.program?.event_date ?? ""],
    ["Amount (INR)", (r: any) => r.amount_inr ?? 0],
    ["Status", (r: any) => r.status ?? ""],
    ["Ticket code", (r: any) => r.ticket_code ?? ""],
  ] as const;

  const exportCsv = () => {
    const esc = (v: any) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = cols.map(([h]) => esc(h)).join(",");
    const body = filtered.map((r) => cols.map(([, get]) => esc(get(r))).join(",")).join("\n");
    // BOM so Excel picks up UTF-8 (₹, é, etc.)
    const csv = "\ufeff" + header + "\n" + body;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `team-tej-students-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, ticket…"
          className="flex-1 min-w-[220px] px-3 py-2 rounded-lg bg-muted border border-border text-sm" />
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-muted border border-border text-sm">
          <option value="all">All statuses</option>
          <option value="awaiting_payment">Awaiting payment</option>
          <option value="payment_submitted">Payment submitted</option>
          <option value="confirmed">Confirmed</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={prog} onChange={(e) => setProg(e.target.value)}
          className="px-3 py-2 rounded-lg bg-muted border border-border text-sm">
          <option value="all">All workshops</option>
          {programs.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={exportCsv} disabled={filtered.length === 0}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-40">
          Export to Excel ({filtered.length})
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
            <tr>
              {cols.map(([h]) => <th key={h} className="text-left px-3 py-2 whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border/60 hover:bg-muted/30">
                {cols.map(([h, get]) => (
                  <td key={h} className="px-3 py-2 whitespace-nowrap">{String(get(r) ?? "")}</td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={cols.length} className="px-3 py-6 text-center text-muted-foreground">No students match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">Export downloads a UTF-8 CSV that opens directly in Excel or Google Sheets.</p>
    </div>
  );
}

function ScanTab({ onScan }: { onScan: any }) {
  const [code, setCode] = useState("");
  const [res, setRes] = useState<any>(null);
  const [err, setErr] = useState("");

  const doScan = async (ticket: string) => {
    setErr(""); setRes(null);
    try {
      const r = await onScan({ data: { ticket } });
      if (!r) setErr("No ticket found."); else setRes(r);
    } catch (e: any) { setErr(e.message); }
  };

  return (
    <div className="mt-8 max-w-xl">
      <p className="text-sm text-muted-foreground">Enter or paste a ticket code (TTJ-XXXXXX). If you scan a ticket QR with your phone, it opens the verify page — you can also paste the code here for a full details lookup.</p>
      <div className="mt-4 flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="TTJ-XXXXXX"
          className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm" />
        <button onClick={() => doScan(code)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Scan</button>
      </div>
      {err && <p className="mt-3 text-xs text-destructive">{err}</p>}
      {res && (
        <div className="mt-5 bg-card border border-border rounded-xl p-5">
          <p className="text-xs uppercase tracking-widest text-emerald-400">Valid ticket</p>
          <p className="font-display text-2xl mt-1">{res.program?.name}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {res.full_name}</p>
            <p><span className="text-muted-foreground">Phone:</span> {res.phone}</p>
            <p><span className="text-muted-foreground">Email:</span> {res.email}</p>
            <p><span className="text-muted-foreground">Age / Gender:</span> {res.age} · {res.gender}</p>
            <p className="col-span-2"><span className="text-muted-foreground">City/State:</span> {res.city}, {res.state}</p>
            <p><span className="text-muted-foreground">Ticket:</span> <span className="font-mono">{res.ticket_code}</span></p>
            <p><span className="text-muted-foreground">Amount:</span> ₹{res.amount_inr}</p>
          </div>
          <div className="mt-4 inline-block bg-white p-2 rounded">
            <QRCodeCanvas value={res.ticket_code ?? ""} size={132} level="Q" marginSize={4} bgColor="#ffffff" fgColor="#000000" />
          </div>
        </div>
      )}
    </div>
  );
}

function TeamTab() {
  const list = useServerFn(adminListTeam);
  const setRole = useServerFn(adminSetUserAdmin);
  const addByEmail = useServerFn(adminAddTeamByEmail);
  const [rows, setRows] = useState<any[]>([]);
  const [me, setMe] = useState<string>("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string>("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const team = await list();
      setRows(team);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) =>
      supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? ""))
    );
  }, []);

  // Team = admin users only. Toggle to show every signed-up user when granting new admin.
  const scoped = showAll ? rows : rows.filter((r) => r.is_admin);
  const filtered = scoped.filter((r) => {
    if (!q.trim()) return true;
    const hay = `${r.full_name ?? ""} ${r.email ?? ""} ${r.phone ?? ""}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  const toggle = async (r: any) => {
    setErr(""); setMsg(""); setBusy(r.id);
    try {
      await setRole({ data: { userId: r.id, makeAdmin: !r.is_admin } });
      await load();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(""); }
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setMsg(""); setInviting(true);
    try {
      await addByEmail({ data: { email: inviteEmail } });
      setMsg(`${inviteEmail} is now an admin.`);
      setInviteEmail("");
      await load();
    } catch (e: any) { setErr(e.message); }
    finally { setInviting(false); }
  };

  const adminCount = rows.filter((r) => r.is_admin).length;

  return (
    <div className="mt-8 space-y-6">
      <form onSubmit={invite} className="rounded-xl border border-border bg-card p-4">
        <label className="block text-sm font-medium mb-2">Add team member by email</label>
        <div className="flex flex-wrap gap-2">
          <input
            type="email" required value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="teammate@example.com"
            className="flex-1 min-w-[240px] px-3 py-2 rounded-lg bg-muted border border-border text-sm"
          />
          <button type="submit" disabled={inviting}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-40">
            {inviting ? "Adding…" : "Grant admin"}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          The person must sign in once before you can grant them admin.
        </p>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search team…"
          className="flex-1 min-w-[240px] px-3 py-2 rounded-lg bg-muted border border-border text-sm" />
        <button type="button" onClick={() => setShowAll((v) => !v)}
          className="px-3 py-2 rounded-lg border border-border text-xs">
          {showAll ? "Show team only" : "Show all users"}
        </button>
        <p className="text-xs text-muted-foreground">
          {adminCount} team · {rows.length} signed-up
        </p>
      </div>

      {err && <p className="text-xs text-destructive">{err}</p>}
      {msg && <p className="text-xs text-primary">{msg}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading team…</p>}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
            <tr>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Email</th>
              <th className="text-left px-3 py-2">Phone</th>
              <th className="text-left px-3 py-2">Role</th>
              <th className="text-right px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const self = r.id === me;
              return (
                <tr key={r.id} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.full_name || <span className="text-muted-foreground">—</span>}
                    {self && <span className="ml-2 text-[10px] uppercase tracking-widest text-primary">you</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.email}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.phone || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.is_admin
                      ? <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs">Admin</span>
                      : <span className="px-2 py-0.5 rounded-full bg-muted text-xs">User</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    <button onClick={() => toggle(r)} disabled={busy === r.id || (self && r.is_admin)}
                      title={self && r.is_admin ? "You cannot remove your own admin role" : ""}
                      className={`px-3 py-1.5 rounded-lg text-xs disabled:opacity-40 ${
                        r.is_admin ? "bg-destructive text-white" : "bg-primary text-primary-foreground"
                      }`}>
                      {busy === r.id ? "…" : r.is_admin ? "Revoke admin" : "Make admin"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                {showAll ? "No users match." : "No team members yet. Add one by email above."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Registered students appear in the Students tab — not here.
      </p>
    </div>
  );
}

type ProfileForm = {
  id?: string;
  name: string;
  designation: string;
  short_description: string;
  biography: string;
  photo_url: string;
  photo_path: string;
  achievements: string;
  dance_styles: string;
  experience: string;
  socials: string; // JSON textarea
  sort_order: string;
  published: boolean;
};

const emptyProfile: ProfileForm = {
  name: "", designation: "", short_description: "", biography: "",
  photo_url: "", photo_path: "", achievements: "", dance_styles: "",
  experience: "", socials: "", sort_order: "0", published: true,
};

function ProfilesTab() {
  const list = useServerFn(adminListTeamProfiles);
  const save = useServerFn(adminSaveTeamProfile);
  const del = useServerFn(adminDeleteTeamProfile);
  const setPub = useServerFn(adminSetTeamProfilePublished);
  const reorder = useServerFn(adminReorderTeamProfile);
  const upload = useServerFn(adminUploadTeamPhoto);

  const [rows, setRows] = useState<any[]>([]);
  const [f, setF] = useState<ProfileForm>(emptyProfile);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setRows(await list()); } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const edit = (r: any) => setF({
    id: r.id, name: r.name ?? "", designation: r.designation ?? "",
    short_description: r.short_description ?? "", biography: r.biography ?? "",
    photo_url: r.photo_url && !r.photo_path ? r.photo_url : "",
    photo_path: r.photo_path ?? "",
    achievements: (r.achievements ?? []).join("\n"),
    dance_styles: (r.dance_styles ?? []).join(", "),
    experience: r.experience ?? "",
    socials: r.socials ? JSON.stringify(r.socials, null, 2) : "",
    sort_order: String(r.sort_order ?? 0),
    published: !!r.published,
  });

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setMsg("");
    let socialsObj: Record<string, string> = {};
    if (f.socials.trim()) {
      try { socialsObj = JSON.parse(f.socials); }
      catch { setErr("Social links must be valid JSON, e.g. { \"instagram\": \"https://…\" }"); return; }
    }
    try {
      await save({ data: {
        id: f.id,
        name: f.name.trim(),
        designation: f.designation.trim() || null,
        short_description: f.short_description.trim() || null,
        biography: f.biography.trim() || null,
        photo_url: f.photo_url.trim() || null,
        photo_path: f.photo_path.trim() || null,
        achievements: f.achievements.split("\n").map((s) => s.trim()).filter(Boolean),
        dance_styles: f.dance_styles.split(",").map((s) => s.trim()).filter(Boolean),
        experience: f.experience.trim() || null,
        socials: socialsObj,
        sort_order: Number(f.sort_order) || 0,
        published: f.published,
      }});
      setMsg("Saved.");
      setF(emptyProfile);
      await load();
    } catch (e: any) { setErr(e.message); }
  };

  const onFile = async (rawFile: File) => {
    setErr(""); setMsg(""); setUploading(true);
    try {
      const file = await compressImageFile(rawFile);
      const buf = await file.arrayBuffer();
      let bin = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const b64 = btoa(bin);
      const res = await upload({ data: {
        profileId: f.id, filename: file.name, contentType: file.type || "image/jpeg", dataBase64: b64,
      }});
      setF((prev) => ({ ...prev, photo_path: res.path, photo_url: res.url ?? prev.photo_url }));
      if (f.id) { setMsg("Photo uploaded."); await load(); }
    } catch (e: any) { setErr(e.message); }
    finally { setUploading(false); }
  };

  return (
    <div className="mt-8 grid lg:grid-cols-[1fr_1fr] gap-6">
      <form onSubmit={onSave} className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <p className="font-display text-lg font-bold">{f.id ? "Edit profile" : "Add profile"}</p>

        <In placeholder="Name *" v={f.name} on={(v) => setF({ ...f, name: v })} required />
        <In placeholder="Designation (e.g. Founder · Artistic Director)" v={f.designation} on={(v) => setF({ ...f, designation: v })} />
        <textarea placeholder="Short description (shown on Home)" value={f.short_description}
          onChange={(e) => setF({ ...f, short_description: e.target.value })} rows={2}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" />
        <textarea placeholder="Full biography" value={f.biography}
          onChange={(e) => setF({ ...f, biography: e.target.value })} rows={4}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" />

        <div className="rounded-lg border border-border/60 bg-muted/40 p-3 space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Profile photo</p>
          {(f.photo_url || f.photo_path) && (
            <div className="flex items-center gap-3">
              {f.photo_url && <img src={f.photo_url} alt="" className="h-20 w-20 rounded-lg object-cover border border-border" />}
              <p className="text-[11px] text-muted-foreground break-all">{f.photo_path || f.photo_url}</p>
            </div>
          )}
          <input type="file" accept="image/*"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) onFile(file); }}
            className="block w-full text-xs" />
          {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
          <p className="text-[11px] text-muted-foreground">Or paste an external image URL below.</p>
          <In placeholder="Photo URL (external)" v={f.photo_url} on={(v) => setF({ ...f, photo_url: v, photo_path: v ? "" : f.photo_path })} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <In placeholder="Experience (e.g. 12+ years)" v={f.experience} on={(v) => setF({ ...f, experience: v })} />
          <In type="number" placeholder="Sort order" v={f.sort_order} on={(v) => setF({ ...f, sort_order: v })} />
        </div>
        <In placeholder="Dance styles (comma separated)" v={f.dance_styles} on={(v) => setF({ ...f, dance_styles: v })} />
        <textarea placeholder="Achievements (one per line)" value={f.achievements}
          onChange={(e) => setF({ ...f, achievements: e.target.value })} rows={3}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" />
        <textarea placeholder='Social links JSON, e.g. {"instagram":"https://…","youtube":"https://…"}'
          value={f.socials} onChange={(e) => setF({ ...f, socials: e.target.value })} rows={3}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm font-mono" />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />
          Publish on Home page
        </label>

        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
            {f.id ? "Update" : "Save"}
          </button>
          {f.id && <button type="button" onClick={() => setF(emptyProfile)} className="px-4 py-2 rounded-lg bg-muted text-sm">Cancel</button>}
        </div>
        {msg && <p className="text-xs text-primary">{msg}</p>}
        {err && <p className="text-xs text-destructive">{err}</p>}
      </form>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Loading profiles…</p>}
        {!loading && rows.length === 0 && <p className="text-sm text-muted-foreground">No profiles yet. Add one on the left.</p>}
        {rows.map((r, i) => (
          <div key={r.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {r.photo_url
                  ? <img src={r.photo_url} alt={r.name} className="h-16 w-16 rounded-lg object-cover border border-border" />
                  : <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center font-display text-2xl text-primary">{r.name?.charAt(0)?.toUpperCase()}</div>}
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.designation ?? "—"}</p>
                  <p className="text-[11px] mt-1">
                    <span className={r.published ? "text-emerald-400" : "text-amber-400"}>
                      {r.published ? "Published" : "Draft"}
                    </span>
                    <span className="text-muted-foreground"> · order {r.sort_order ?? 0}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1">
                  <button disabled={i === 0} onClick={async () => { await reorder({ data: { id: r.id, direction: "up" }}); load(); }}
                    className="px-2 py-1 text-xs rounded bg-muted disabled:opacity-40">↑</button>
                  <button disabled={i === rows.length - 1} onClick={async () => { await reorder({ data: { id: r.id, direction: "down" }}); load(); }}
                    className="px-2 py-1 text-xs rounded bg-muted disabled:opacity-40">↓</button>
                </div>
                <button onClick={() => edit(r)} className="px-3 py-1 text-xs rounded bg-muted">Edit</button>
                <button onClick={async () => { await setPub({ data: { id: r.id, published: !r.published }}); load(); }}
                  className="px-3 py-1 text-xs rounded bg-muted">{r.published ? "Unpublish" : "Publish"}</button>
                <button onClick={async () => { if (confirm("Delete this profile?")) { await del({ data: { id: r.id }}); load(); } }}
                  className="px-3 py-1 text-xs rounded bg-destructive text-white">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function ApprovalsTab({ rows, onApprove, reload }: { rows: any[]; onApprove: any; reload: () => void }) {
  const pending = rows.filter((r) => r.status === "payment_submitted");
  const [busy, setBusy] = useState<string | null>(null);
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const getProof = useServerFn(adminGetProofUrl);

  useEffect(() => {
    (async () => {
      const next: Record<string, string> = {};
      for (const r of pending) {
        if (r.payment_proof_path && !proofUrls[r.id]) {
          try {
            const { url } = await getProof({ data: { path: r.payment_proof_path } });
            next[r.id] = url;
          } catch {}
        }
      }
      if (Object.keys(next).length) setProofUrls((prev) => ({ ...prev, ...next }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending.length]);

  const act = async (id: string, approve: boolean) => {
    setBusy(id);
    try {
      await onApprove({ data: { enrollmentId: id, approve } });
      await reload();
    } catch (e: any) {
      alert(e.message ?? "Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-8 space-y-3">
      <p className="text-sm text-muted-foreground">
        Review each uploaded payment screenshot, then approve to issue the ticket and increment seats.
      </p>
      {pending.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
          No payments awaiting verification.
        </div>
      )}
      {pending.map((r) => (
        <div key={r.id} className="bg-card border border-border rounded-2xl p-5 grid gap-4 md:grid-cols-[1fr_240px]">
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold">{r.full_name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{r.email} · {r.phone}</p>
            <p className="text-sm mt-2">{r.program?.name ?? "Workshop"} · ₹{(r.amount_inr ?? 0).toLocaleString("en-IN")}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Submitted {r.payment_confirmed_at ? new Date(r.payment_confirmed_at).toLocaleString() : "—"}</p>
            <div className="flex gap-2 mt-4">
              <button disabled={busy === r.id} onClick={() => act(r.id, true)}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium disabled:opacity-50">
                Approve & issue ticket
              </button>
              <button disabled={busy === r.id} onClick={() => act(r.id, false)}
                className="px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium disabled:opacity-50">
                Reject
              </button>
            </div>
          </div>
          <div>
            {proofUrls[r.id] ? (
              <a href={proofUrls[r.id]} target="_blank" rel="noreferrer" className="block">
                <img src={proofUrls[r.id]} alt="Payment proof" className="w-full h-auto max-h-64 object-contain rounded-md border border-border bg-muted" />
                <span className="mt-1 block text-[11px] text-primary underline">Open full size</span>
              </a>
            ) : (
              <div className="w-full h-40 rounded-md border border-dashed border-border grid place-items-center text-xs text-muted-foreground">
                {r.payment_proof_path ? "Loading screenshot…" : "No screenshot"}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ Celebrities / Brands / Globe admin tabs ============
function CelebritiesTab() {
  const list = useServerFn(adminListCelebrities);
  const save = useServerFn(adminSaveCelebrity);
  const del = useServerFn(adminDeleteCelebrity);
  const upload = useServerFn(adminUploadCelebrityPhoto);
  const [rows, setRows] = useState<any[]>([]);
  const [edit, setEdit] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const reload = async () => setRows(await list());
  useEffect(() => { reload(); }, []);
  const empty = { name: "", role: "", photo_url: "", photo_path: "", photo_preview: "", sort_order: 0, published: true };

  const handleFile = async (rawFile: File) => {
    if (!/^image\/(png|jpe?g|webp)$/.test(rawFile.type)) {
      toast.error("Only JPG, JPEG, PNG, or WebP images are allowed.");
      return;
    }
    if (rawFile.size > 50 * 1024 * 1024) {
      toast.error("Image is too large. Max 50 MB.");
      return;
    }
    const localPreview = URL.createObjectURL(rawFile);
    setEdit((s: any) => ({ ...s, photo_preview: localPreview }));
    setUploading(true);
    try {
      const file = await compressImageFile(rawFile);
      const buf = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const dataBase64 = btoa(binary);
      const res = await upload({ data: { filename: file.name, contentType: file.type, dataBase64 } });
      setEdit((s: any) => ({ ...s, photo_path: res.path, photo_url: "", photo_preview: res.url ?? localPreview }));
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) { toast.error("Please wait for the upload to finish."); return; }
    try {
      const { photo_preview, ...payload } = edit;
      await save({ data: { ...payload, photo_url: payload.photo_url || undefined, photo_path: payload.photo_path || undefined, sort_order: Number(payload.sort_order) || 0 } });
      toast.success("Saved"); setEdit(null); reload();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl font-bold">Celebrities</h2>
        <button onClick={() => setEdit({ ...empty })} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm">Add celebrity</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4 flex gap-4">
            <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden shrink-0 flex items-center justify-center text-2xl font-display text-primary">
              {r.photo_url ? <img src={r.photo_url} alt={r.name} className="w-full h-full object-cover" /> : r.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{r.name}</p>
              <p className="text-xs text-muted-foreground truncate">{r.role || "—"}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{r.published ? "Published" : "Hidden"} · order {r.sort_order}</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => setEdit({ ...r, photo_preview: r.photo_url ?? "" })} className="px-2 py-1 text-xs rounded bg-muted">Edit</button>
                <button onClick={async () => { if (confirm("Delete?")) { await del({ data: { id: r.id } }); reload(); } }} className="px-2 py-1 text-xs rounded bg-destructive/10 text-destructive">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground text-sm">No celebrities yet.</p>}
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit" : "Add"} celebrity</DialogTitle></DialogHeader>
          {edit && (
            <form onSubmit={submit} className="space-y-3">
              <input required placeholder="Name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted" />
              <input placeholder="Role / description" value={edit.role ?? ""} onChange={(e) => setEdit({ ...edit, role: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted" />

              <div>
                <label className="text-xs font-medium text-muted-foreground">Celebrity photo</label>
                <div
                  onClick={() => !uploading && fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const f0 = e.dataTransfer.files?.[0]; if (f0) handleFile(f0); }}
                  className={`mt-1 flex items-center gap-3 rounded-lg border border-dashed p-3 cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/40"}`}
                >
                  <div className="h-20 w-20 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    {edit.photo_preview ? (
                      <img src={edit.photo_preview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageUp size={20} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 text-xs min-w-0">
                    <p className="font-medium">
                      {uploading ? "Uploading…" : edit.photo_preview ? "Replace image" : "Click or drag to upload image"}
                    </p>
                    <p className="text-muted-foreground">JPG, JPEG, PNG, or WebP · up to 8 MB</p>
                  </div>
                  {edit.photo_preview && !uploading && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setEdit({ ...edit, photo_path: "", photo_url: "", photo_preview: "" }); }}
                      className="p-1 rounded bg-background border border-border" aria-label="Remove image"><X size={12} /></button>
                  )}
                  <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
                    onChange={(e) => { const f0 = e.target.files?.[0]; if (f0) handleFile(f0); e.currentTarget.value = ""; }} />
                </div>
              </div>

              <div className="flex gap-3">
                <input type="number" placeholder="Sort order" value={edit.sort_order ?? 0} onChange={(e) => setEdit({ ...edit, sort_order: e.target.value })} className="flex-1 px-3 py-2 rounded-lg bg-muted" />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!edit.published} onChange={(e) => setEdit({ ...edit, published: e.target.checked })} /> Published</label>
              </div>
              <button disabled={uploading} className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-60">{uploading ? "Uploading…" : "Save"}</button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BrandsTab() {
  const list = useServerFn(adminListBrands);
  const save = useServerFn(adminSaveBrand);
  const del = useServerFn(adminDeleteBrand);
  const [rows, setRows] = useState<any[]>([]);
  const [edit, setEdit] = useState<any | null>(null);
  const reload = async () => setRows(await list());
  useEffect(() => { reload(); }, []);
  const empty = { name: "", logo_url: "", sort_order: 0, published: true };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await save({ data: { ...edit, sort_order: Number(edit.sort_order) || 0 } });
      toast.success("Saved"); setEdit(null); reload();
    } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="mt-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl font-bold">Brands</h2>
        <button onClick={() => setEdit({ ...empty })} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm">Add brand</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4 flex gap-4">
            <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden shrink-0 flex items-center justify-center text-xl font-display text-primary">
              {r.logo_url ? <img src={r.logo_url} alt={r.name} className="w-full h-full object-contain p-2" /> : r.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{r.name}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{r.published ? "Published" : "Hidden"} · order {r.sort_order}</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => setEdit({ ...r })} className="px-2 py-1 text-xs rounded bg-muted">Edit</button>
                <button onClick={async () => { if (confirm("Delete?")) { await del({ data: { id: r.id } }); reload(); } }} className="px-2 py-1 text-xs rounded bg-destructive/10 text-destructive">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground text-sm">No brands yet.</p>}
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit" : "Add"} brand</DialogTitle></DialogHeader>
          {edit && (
            <form onSubmit={submit} className="space-y-3">
              <input required placeholder="Brand name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted" />
              <input placeholder="Logo URL" value={edit.logo_url ?? ""} onChange={(e) => setEdit({ ...edit, logo_url: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted" />
              <div className="flex gap-3">
                <input type="number" placeholder="Sort order" value={edit.sort_order ?? 0} onChange={(e) => setEdit({ ...edit, sort_order: e.target.value })} className="flex-1 px-3 py-2 rounded-lg bg-muted" />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!edit.published} onChange={(e) => setEdit({ ...edit, published: e.target.checked })} /> Published</label>
              </div>
              <button className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground">Save</button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GlobeTab() {
  const list = useServerFn(adminListGlobe);
  const save = useServerFn(adminSaveGlobe);
  const del = useServerFn(adminDeleteGlobe);
  const [rows, setRows] = useState<any[]>([]);
  const [edit, setEdit] = useState<any | null>(null);
  const reload = async () => setRows(await list());
  useEffect(() => { reload(); }, []);
  const empty = { city: "", country: "", status: "conducted" as const, event_date: "", sort_order: 0, published: true };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await save({ data: { ...edit, sort_order: Number(edit.sort_order) || 0, event_date: edit.event_date || null } });
      toast.success("Saved"); setEdit(null); reload();
    } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="mt-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl font-bold">Globe locations</h2>
        <button onClick={() => setEdit({ ...empty })} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm">Add location</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-semibold">{r.city}, {r.country}</p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] ${r.status === "upcoming" ? "bg-amber-500/15 text-amber-500" : "bg-emerald-500/15 text-emerald-500"}`}>{r.status}</span>
              {r.event_date && ` · ${new Date(r.event_date).toDateString()}`}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">{r.published ? "Published" : "Hidden"} · order {r.sort_order}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setEdit({ ...r })} className="px-2 py-1 text-xs rounded bg-muted">Edit</button>
              <button onClick={async () => { if (confirm("Delete?")) { await del({ data: { id: r.id } }); reload(); } }} className="px-2 py-1 text-xs rounded bg-destructive/10 text-destructive">Delete</button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground text-sm">No locations yet.</p>}
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit" : "Add"} location</DialogTitle></DialogHeader>
          {edit && (
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="City" value={edit.city} onChange={(e) => setEdit({ ...edit, city: e.target.value })} className="px-3 py-2 rounded-lg bg-muted" />
                <input required placeholder="Country" value={edit.country} onChange={(e) => setEdit({ ...edit, country: e.target.value })} className="px-3 py-2 rounded-lg bg-muted" />
              </div>
              <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted">
                <option value="conducted">Conducted</option>
                <option value="upcoming">Upcoming</option>
              </select>
              <input type="date" value={edit.event_date ?? ""} onChange={(e) => setEdit({ ...edit, event_date: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted" />
              <div className="flex gap-3">
                <input type="number" placeholder="Sort order" value={edit.sort_order ?? 0} onChange={(e) => setEdit({ ...edit, sort_order: e.target.value })} className="flex-1 px-3 py-2 rounded-lg bg-muted" />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!edit.published} onChange={(e) => setEdit({ ...edit, published: e.target.checked })} /> Published</label>
              </div>
              <button className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground">Save</button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

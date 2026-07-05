import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2, Edit3, Plus, Sparkles } from "lucide-react";
import {
  adminListBundles, adminSaveBundle, adminDeleteBundle,
  adminListBundlePurchases, adminBundleStats,
} from "@/lib/bundles.functions";
import { adminListWorkshops } from "@/lib/enrollment.functions";

type BundleForm = {
  id?: string;
  name: string;
  description: string;
  min_workshops: number;
  max_workshops: number | null;
  discount_type: "fixed_bundle_price" | "percentage" | "fixed_amount";
  discount_value: number;
  applies_to_all_workshops: boolean;
  program_ids: string[];
  eligible_cities_text: string;
  valid_from: string;
  valid_until: string;
  active: boolean;
  priority: number;
};

const empty = (): BundleForm => ({
  name: "", description: "", min_workshops: 2, max_workshops: null,
  discount_type: "fixed_bundle_price", discount_value: 0,
  applies_to_all_workshops: true, program_ids: [],
  eligible_cities_text: "",
  valid_from: "", valid_until: "", active: true, priority: 0,
});


export function BundlesTab() {
  const list = useServerFn(adminListBundles);
  const save = useServerFn(adminSaveBundle);
  const del = useServerFn(adminDeleteBundle);
  const listWs = useServerFn(adminListWorkshops);

  const [rows, setRows] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [f, setF] = useState<BundleForm>(empty());
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = () => list().then(setRows);
  useEffect(() => { reload(); listWs().then((r: any[]) => setWorkshops(r.filter((w) => w.kind === "workshop"))); }, []);

  const startNew = () => { setF(empty()); setEditing(true); };
  const startEdit = (r: any) => {
    setF({
      id: r.id, name: r.name, description: r.description ?? "",
      min_workshops: r.min_workshops, max_workshops: r.max_workshops,
      discount_type: r.discount_type, discount_value: Number(r.discount_value),
      applies_to_all_workshops: r.applies_to_all_workshops,
      program_ids: (r.bundle_offer_programs ?? []).map((p: any) => p.program_id),
      valid_from: r.valid_from ? r.valid_from.slice(0, 10) : "",
      valid_until: r.valid_until ? r.valid_until.slice(0, 10) : "",
      active: r.active, priority: r.priority ?? 0,
    });
    setEditing(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await save({ data: {
        ...f,
        max_workshops: f.max_workshops || null,
        discount_value: Number(f.discount_value),
        valid_from: f.valid_from || null,
        valid_until: f.valid_until || null,
      }});
      toast.success("Bundle saved");
      setEditing(false);
      reload();
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
    finally { setBusy(false); }
  };

  const doDelete = async (id: string) => {
    if (!confirm("Delete this bundle?")) return;
    await del({ data: { id } });
    toast.success("Deleted");
    reload();
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <p className="font-display text-lg font-bold">Bundle offers</p>
        {!editing && <button onClick={startNew} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm inline-flex items-center gap-1"><Plus size={14}/> New bundle</button>}
      </div>

      {editing && (
        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 space-y-4 mb-6">
          <p className="font-display font-bold">{f.id ? "Edit bundle" : "New bundle"}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Fld label="Name *"><input value={f.name} onChange={(e) => setF({...f, name: e.target.value})} required className={inputCls}/></Fld>
            <Fld label="Priority"><input type="number" value={f.priority} onChange={(e) => setF({...f, priority: Number(e.target.value)})} className={inputCls}/></Fld>
            <Fld label="Description" span2><textarea value={f.description} onChange={(e) => setF({...f, description: e.target.value})} rows={2} className={inputCls}/></Fld>
            <Fld label="Min workshops *"><input type="number" min={2} value={f.min_workshops} onChange={(e) => setF({...f, min_workshops: Number(e.target.value)})} className={inputCls}/></Fld>
            <Fld label="Max workshops (blank = no limit)"><input type="number" min={2} value={f.max_workshops ?? ""} onChange={(e) => setF({...f, max_workshops: e.target.value ? Number(e.target.value) : null})} className={inputCls}/></Fld>
            <Fld label="Discount type *">
              <select value={f.discount_type} onChange={(e) => setF({...f, discount_type: e.target.value as any})} className={inputCls}>
                <option value="fixed_bundle_price">Fixed bundle price (₹)</option>
                <option value="percentage">Percentage off (%)</option>
                <option value="fixed_amount">Flat discount (₹)</option>
              </select>
            </Fld>
            <Fld label={
              f.discount_type === "fixed_bundle_price" ? "Bundle price (₹) *" :
              f.discount_type === "percentage" ? "Percent off *" : "Discount amount (₹) *"
            }>
              <input type="number" min={0} value={f.discount_value} onChange={(e) => setF({...f, discount_value: Number(e.target.value)})} required className={inputCls}/>
            </Fld>
            <Fld label="Valid from"><input type="date" value={f.valid_from} onChange={(e) => setF({...f, valid_from: e.target.value})} className={inputCls}/></Fld>
            <Fld label="Valid until"><input type="date" value={f.valid_until} onChange={(e) => setF({...f, valid_until: e.target.value})} className={inputCls}/></Fld>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.applies_to_all_workshops} onChange={(e) => setF({...f, applies_to_all_workshops: e.target.checked})} />
            Applies to all workshops
          </label>

          {!f.applies_to_all_workshops && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Applicable workshops</p>
              <div className="grid sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto rounded-lg border border-border p-3">
                {workshops.map((w) => (
                  <label key={w.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={f.program_ids.includes(w.id)}
                      onChange={(e) => setF({...f, program_ids: e.target.checked ? [...f.program_ids, w.id] : f.program_ids.filter((x) => x !== w.id)})} />
                    <span className="truncate">{w.name}</span>
                  </label>
                ))}
                {workshops.length === 0 && <p className="text-xs text-muted-foreground">No workshops yet.</p>}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.active} onChange={(e) => setF({...f, active: e.target.checked})} /> Active
          </label>

          <div className="flex gap-2">
            <button disabled={busy} type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">{busy ? "Saving…" : "Save bundle"}</button>
            <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg bg-muted text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-semibold flex items-center gap-2"><Sparkles size={14} className="text-primary"/> {r.name}</p>
                {r.description && <p className="text-xs text-muted-foreground mt-1 max-w-xl">{r.description}</p>}
                <p className="text-xs text-muted-foreground mt-2">
                  Min {r.min_workshops}{r.max_workshops ? `–${r.max_workshops}` : "+"} workshops ·
                  {" "}{r.discount_type === "fixed_bundle_price" ? `Bundle ₹${Number(r.discount_value).toLocaleString("en-IN")}` :
                      r.discount_type === "percentage" ? `${r.discount_value}% off` :
                      `₹${Number(r.discount_value).toLocaleString("en-IN")} off`} ·
                  {" "}{r.applies_to_all_workshops ? "all workshops" : `${(r.bundle_offer_programs ?? []).length} workshops`}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {r.active ? "Active" : "Inactive"}
                  {r.valid_until ? ` · until ${new Date(r.valid_until).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(r)} className="p-2 rounded hover:bg-muted"><Edit3 size={14}/></button>
                <button onClick={() => doDelete(r.id)} className="p-2 rounded hover:bg-destructive/10 text-destructive"><Trash2 size={14}/></button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && !editing && <p className="text-sm text-muted-foreground">No bundles yet. Create your first offer.</p>}
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm";
function Fld({ label, children, span2 }: any) {
  return <label className={`block ${span2 ? "sm:col-span-2" : ""}`}><span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>;
}

export function BundlePurchasesTab() {
  const list = useServerFn(adminListBundlePurchases);
  const statsFn = useServerFn(adminBundleStats);
  const [rows, setRows] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { list().then(setRows); statsFn().then(setStats); }, []);

  return (
    <div className="mt-6">
      {stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Stat label="Bundle purchases" value={stats.totalBundles} />
          <Stat label="Confirmed" value={stats.confirmed} />
          <Stat label="Gross revenue (₹)" value={stats.originalRevenue.toLocaleString("en-IN")} />
          <Stat label="Discounts given (₹)" value={stats.totalDiscount.toLocaleString("en-IN")} accent />
          <Stat label="Net revenue (₹)" value={stats.netRevenue.toLocaleString("en-IN")} />
        </div>
      )}
      <p className="font-display text-lg font-bold mb-3">Bundle purchases</p>
      <div className="grid gap-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-semibold">{r.full_name || r.email} <span className="text-xs text-muted-foreground">· {r.workshop_count} workshops</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.email} · {r.phone}</p>
                {r.bundle_name && <p className="text-xs text-primary mt-1">Offer: {r.bundle_name}</p>}
                <p className="text-xs text-muted-foreground mt-2">
                  Original ₹{r.original_amount_inr.toLocaleString("en-IN")} · Discount ₹{r.discount_amount_inr.toLocaleString("en-IN")} · <strong className="text-foreground">Paid ₹{r.final_amount_inr.toLocaleString("en-IN")}</strong>
                </p>
                <div className="mt-2 space-y-0.5 text-xs">
                  {(r.enrollments ?? []).map((e: any) => (
                    <p key={e.id}>· {e.program?.name} {e.silver_seat && "🎥"} — {e.status}{e.ticket_code ? ` (${e.ticket_code})` : ""}</p>
                  ))}
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${r.status === "confirmed" ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"}`}>{r.status}</span>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No bundle purchases yet.</p>}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: any) {
  return (
    <div className={`rounded-2xl p-4 border ${accent ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

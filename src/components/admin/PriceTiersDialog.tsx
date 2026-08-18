import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { adminListPriceTiers, adminSavePriceTiers } from "@/lib/pricing-tiers.functions";

type Row = {
  id?: string;
  label: string;
  max_registrations: string;
  price_inr: string;
  both_price: string;
};

interface Props {
  program: any | null;
  onClose: () => void;
}

/**
 * Registration-count based ("early bird") pricing tiers for one workshop.
 * Tiers are consumed in order: the first tier covers the first N valid
 * registrations, the next tier the following M, and so on. When every tier
 * is exhausted the last tier's price stays applicable.
 */
export function PriceTiersDialog({ program, onClose }: Props) {
  const load = useServerFn(adminListPriceTiers);
  const save = useServerFn(adminSavePriceTiers);

  const [rows, setRows] = useState<Row[]>([]);
  const [pricing, setPricing] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!program?.id) return;
    setLoading(true);
    load({ data: { programId: program.id } })
      .then((res: any) => {
        setRows(
          (res.tiers ?? []).map((t: any) => ({
            id: t.id,
            label: t.label ?? "",
            max_registrations: String(t.max_registrations),
            price_inr: String(t.price_inr),
            both_price: t.both_price != null ? String(t.both_price) : "",
          })),
        );
        setPricing(res.pricing ?? null);
      })
      .catch((e: any) => toast.error(e.message ?? "Could not load pricing tiers"))
      .finally(() => setLoading(false));
  }, [program?.id]);

  const allowBoth = !!program?.allow_both;

  const addRow = () =>
    setRows((s) => [...s, { label: "", max_registrations: "", price_inr: "", both_price: "" }]);

  const update = (i: number, patch: Partial<Row>) =>
    setRows((s) => s.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const remove = (i: number) => setRows((s) => s.filter((_, idx) => idx !== i));

  const submit = async () => {
    for (const r of rows) {
      if (!(Number(r.max_registrations) > 0)) {
        toast.error("Each tier needs a registration count greater than 0.");
        return;
      }
      if (!(Number(r.price_inr) >= 0) || r.price_inr === "") {
        toast.error("Each tier needs a single-workshop price.");
        return;
      }
    }
    setBusy(true);
    try {
      await save({
        data: {
          programId: program.id,
          tiers: rows.map((r) => ({
            ...(r.id ? { id: r.id } : {}),
            label: r.label.trim() || null,
            max_registrations: Number(r.max_registrations),
            price_inr: Number(r.price_inr),
            both_price: allowBoth && r.both_price !== "" ? Number(r.both_price) : null,
          })),
        },
      });
      toast.success(rows.length ? "Pricing tiers saved" : "Pricing tiers removed — base price applies");
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Could not save pricing tiers");
    } finally {
      setBusy(false);
    }
  };

  // Cumulative ranges shown to the admin, e.g. "Registrations 1–10".
  let running = 0;
  const ranges = rows.map((r) => {
    const n = Number(r.max_registrations) || 0;
    const from = running + 1;
    running += n;
    return n > 0 ? `Registrations ${from}–${running}` : "Registrations —";
  });

  return (
    <Dialog open={!!program} onOpenChange={(v) => { if (!v && !busy) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Early-Bird Pricing Tiers</DialogTitle>
          <DialogDescription>
            {program?.name} — prices change automatically as registrations come in.
            Leave empty to always use the workshop's base price.
          </DialogDescription>
        </DialogHeader>

        {pricing && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
            <span className="text-muted-foreground">Valid registrations so far: </span>
            <strong>{pricing.registration_count ?? 0}</strong>
            {pricing.current && (
              <>
                <span className="text-muted-foreground"> · Currently applicable: </span>
                <strong className="text-primary">
                  ₹{Number(pricing.current.price_inr).toLocaleString("en-IN")}
                </strong>
                {pricing.current.label ? ` (${pricing.current.label})` : ""}
                <span className="text-muted-foreground">
                  {" "}· {pricing.current.remaining} left at this price
                </span>
              </>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground py-6">Loading tiers…</p>
        ) : (
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={r.id ?? `new-${i}`} className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{ranges[i]}</p>
                  <button type="button" onClick={() => remove(i)}
                    className="p-1.5 rounded text-destructive hover:bg-destructive/10">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block col-span-2">
                    <span className="text-xs text-muted-foreground">Offer name (optional)</span>
                    <input value={r.label} onChange={(e) => update(i, { label: e.target.value })}
                      placeholder="e.g. Early Bird"
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted-foreground">Number of registrations</span>
                    <input type="number" min={1} value={r.max_registrations}
                      onChange={(e) => update(i, { max_registrations: e.target.value })}
                      placeholder="e.g. 10"
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted-foreground">Single workshop price (₹)</span>
                    <input type="number" min={0} value={r.price_inr}
                      onChange={(e) => update(i, { price_inr: e.target.value })}
                      placeholder="e.g. 1499"
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" />
                  </label>
                  {allowBoth && (
                    <label className="block col-span-2">
                      <span className="text-xs text-muted-foreground">Both workshops price (₹) — optional</span>
                      <input type="number" min={0} value={r.both_price}
                        onChange={(e) => update(i, { both_price: e.target.value })}
                        placeholder="Leave blank to use the workshop's Both price"
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" />
                    </label>
                  )}
                </div>
              </div>
            ))}

            <button type="button" onClick={addRow}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground">
              <Plus size={14} /> Add pricing tier
            </button>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-3 border-t border-border">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-muted text-sm">Cancel</button>
          <button type="button" onClick={submit} disabled={busy || loading}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-60">
            {busy ? "Saving…" : "Save Tiers"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

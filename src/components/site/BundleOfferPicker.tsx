import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Check, Sparkles, ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { computeCartPricing, createBundleCheckout } from "@/lib/bundles.functions";

type Workshop = {
  id: string;
  name: string;
  price_inr: number;
  event_date?: string | null;
  event_time?: string | null;
  venue?: string | null;
  city?: string | null;
  capacity?: number | null;
  seats_taken?: number | null;
  banner_url?: string | null;
  silver_seat_enabled?: boolean | null;
  silver_seat_price?: number | null;
};

interface Props {
  workshops: Workshop[];
  hasActiveBundles: boolean;
}

const initialForm = {
  fullName: "", email: "", phone: "", gender: "Female",
  address: "", city: "", state: "", emergencyContact: "",
};

const cityOf = (w: Workshop) => (w.city || w.venue || "").trim();
const dayDiff = (a?: string | null, b?: string | null) => {
  if (!a || !b) return Infinity;
  const da = new Date(a).setHours(0, 0, 0, 0);
  const db = new Date(b).setHours(0, 0, 0, 0);
  return Math.abs(Math.round((da - db) / 86400000));
};

export function BundleOfferPicker({ workshops, hasActiveBundles }: Props) {
  const navigate = useNavigate();
  const compute = useServerFn(computeCartPricing);
  const checkout = useServerFn(createBundleCheckout);

  const [city, setCity] = useState<string>("");
  const [firstId, setFirstId] = useState<string | null>(null);
  const [secondId, setSecondId] = useState<string | null>(null);
  const [firstSilver, setFirstSilver] = useState(false);
  const [secondSilver, setSecondSilver] = useState(false);
  const [pricing, setPricing] = useState<{ originalAmount: number; discountAmount: number; finalAmount: number; bundleName: string | null } | null>(null);
  const [pricingErr, setPricingErr] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const available = useMemo(
    () => workshops.filter((w) => w.capacity == null || (w.seats_taken ?? 0) < w.capacity),
    [workshops],
  );

  const cities = useMemo(() => {
    const set = new Set<string>();
    available.forEach((w) => { const c = cityOf(w); if (c) set.add(c); });
    return Array.from(set).sort();
  }, [available]);

  const cityWorkshops = useMemo(
    () => (city ? available.filter((w) => cityOf(w).toLowerCase() === city.toLowerCase()) : []),
    [available, city],
  );

  const first = firstId ? workshops.find((w) => w.id === firstId) ?? null : null;

  const eligibleSecond = useMemo(() => {
    if (!first) return [] as Workshop[];
    return cityWorkshops.filter((w) => w.id !== first.id);
  }, [first, cityWorkshops]);

  // Reset second when first changes.
  useEffect(() => { setSecondId(null); setPricing(null); setPricingErr(""); }, [firstId]);
  // Reset first & second when city changes.
  useEffect(() => { setFirstId(null); }, [city]);

  useEffect(() => {
    if (!firstId || !secondId) { setPricing(null); setPricingErr(""); return; }
    let cancelled = false;
    compute({ data: { selections: [{ programId: firstId, silverSeat: false }, { programId: secondId, silverSeat: false }] } })
      .then((res: any) => {
        if (cancelled) return;
        if (!res.bundle) {
          setPricing(null);
          setPricingErr("No active bundle offer covers these workshops yet. Please check back soon.");
        } else {
          setPricing({
            originalAmount: res.originalAmount,
            discountAmount: res.discountAmount,
            finalAmount: res.finalAmount,
            bundleName: res.bundle.name,
          });
          setPricingErr("");
        }
      })
      .catch((e: any) => { if (!cancelled) setPricingErr(e.message ?? "Pricing failed"); });
    return () => { cancelled = true; };
  }, [firstId, secondId]);

  useEffect(() => {
    if (!showForm) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setF((s) => ({ ...s, email: s.email || data.user!.email! }));
    });
  }, [showForm]);

  const openForm = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { navigate({ to: "/auth" }); return; }
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstId || !secondId) return;
    setErr(""); setBusy(true);
    try {
      const res = await checkout({ data: {
        selections: [{ programId: firstId, silverSeat: false }, { programId: secondId, silverSeat: false }],
        fullName: f.fullName, email: f.email, phone: f.phone, gender: f.gender,
        address: f.address, city: f.city, state: f.state, emergencyContact: f.emergencyContact,
      }});
      navigate({ to: "/pay-bundle/$purchaseId", params: { purchaseId: res.purchaseId } });
    } catch (e: any) { setErr(e.message ?? "Checkout failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="mt-6 rounded-2xl border border-primary/40 bg-primary/5 p-4 sm:p-5">
      <div className="flex items-center gap-2 font-semibold">
        <Sparkles size={16} className="text-primary" />
        <h2 className="text-base">Bundle Registration (2 Workshops)</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Register for any 2 workshops in the same city, scheduled on the same day or within 1 day, and get the special bundle price automatically.
        {!hasActiveBundles && " (No active bundle offers right now — please check back soon.)"}
      </p>

      <div className="mt-4 space-y-4">
        {/* City */}
        <div>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Select city</span>
            <select value={city} onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-sm">
              <option value="">— Choose a city —</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          {city && cityWorkshops.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">No workshops available in {city}.</p>
          )}
        </div>

        {/* Workshop 1 */}
        {city && cityWorkshops.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Workshop 1</p>
            {first ? (
              <SelectedRow w={first} onRemove={() => setFirstId(null)} />
            ) : (
              <WorkshopList workshops={cityWorkshops} onPick={setFirstId} />
            )}
          </div>
        )}

        {/* Workshop 2 */}
        {first && (
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Workshop 2 <span className="normal-case tracking-normal text-[11px] text-muted-foreground">(same city)</span>
            </p>
            {secondId ? (
              <SelectedRow w={workshops.find((w) => w.id === secondId)!} onRemove={() => setSecondId(null)} />
            ) : eligibleSecond.length > 0 ? (
              <WorkshopList workshops={eligibleSecond} onPick={setSecondId} />
            ) : (
              <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border p-3">
                No other workshops available in {city}.
              </p>
            )}
          </div>
        )}

        {pricingErr && <p className="text-xs text-destructive">{pricingErr}</p>}

        {pricing && first && secondId && (
          <div className="rounded-xl bg-background border border-primary/30 p-4">
            <p className="text-sm text-primary font-semibold">🎉 Bundle Offer Applied — {pricing.bundleName}</p>
            <p className="text-xs text-muted-foreground mt-1">You're registering for 2 workshops and have received the special bundle price.</p>
            <div className="mt-3 flex items-end justify-between">
              <div className="text-xs text-muted-foreground">
                <span className="line-through">₹{pricing.originalAmount.toLocaleString("en-IN")}</span>
                <span className="ml-2 text-primary">save ₹{pricing.discountAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Bundle price</p>
                <p className="font-display text-2xl font-bold">₹{pricing.finalAmount.toLocaleString("en-IN")}</p>
              </div>
            </div>
            <button onClick={openForm}
              className="mt-4 w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              Continue to registration
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && first && secondId && pricing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => !busy && setShowForm(false)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-card border border-border rounded-2xl p-6 sm:p-8">
              <button onClick={() => !busy && setShowForm(false)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted"><X size={18} /></button>
              <button type="button" onClick={() => !busy && setShowForm(false)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft size={12}/> Back to selection
              </button>
              <form onSubmit={submit} className="mt-3">
                <p className="text-xs uppercase tracking-widest text-primary">Bundle registration</p>
                <h3 className="mt-1 text-2xl font-display font-bold">{first.name} + {workshops.find((w) => w.id === secondId)?.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">Bundle price · ₹{pricing.finalAmount.toLocaleString("en-IN")}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Field label="Full name" v={f.fullName} on={(v) => setF({...f, fullName: v})} span2 />
                  <Field label="Email" type="email" v={f.email} on={(v) => setF({...f, email: v})} />
                  <Field label="Mobile" v={f.phone} on={(v) => setF({...f, phone: v})} />
                  <label className="block">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Gender</span>
                    <select value={f.gender} onChange={(e) => setF({...f, gender: e.target.value})}
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm">
                      <option>Female</option><option>Male</option><option>Other</option>
                    </select>
                  </label>
                  <Field label="Address" v={f.address} on={(v) => setF({...f, address: v})} span2 />
                  <Field label="City" v={f.city} on={(v) => setF({...f, city: v})} />
                  <Field label="State" v={f.state} on={(v) => setF({...f, state: v})} />
                  <Field label="Emergency contact" v={f.emergencyContact} on={(v) => setF({...f, emergencyContact: v})} span2 />
                </div>
                {err && <p className="mt-3 text-xs text-destructive">{err}</p>}
                <button disabled={busy} type="submit"
                  className="mt-6 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium">
                  {busy ? "Submitting…" : `Register & pay ₹${pricing.finalAmount.toLocaleString("en-IN")}`}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WorkshopList({ workshops, onPick }: { workshops: Workshop[]; onPick: (id: string) => void }) {
  if (workshops.length === 0) {
    return <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border p-3">No eligible workshops available.</p>;
  }
  return (
    <div className="grid sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
      {workshops.map((w) => (
        <button type="button" key={w.id} onClick={() => onPick(w.id)}
          className="text-left rounded-lg border border-border bg-card p-3 hover:border-primary transition">
          <p className="font-medium text-sm">{w.name}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {w.event_date ? new Date(w.event_date).toDateString() : ""}
            {w.city || w.venue ? ` · ${w.city || w.venue}` : ""}
          </p>
          <p className="text-xs mt-1">₹{w.price_inr.toLocaleString("en-IN")}</p>
        </button>
      ))}
    </div>
  );
}

function SelectedRow({ w, onRemove }: { w: Workshop; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/40 bg-background p-3">
      <div className="min-w-0">
        <p className="font-medium text-sm truncate flex items-center gap-1.5"><Check size={12} className="text-primary"/> {w.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {w.event_date ? new Date(w.event_date).toDateString() : ""}
          {w.city || w.venue ? ` · ${w.city || w.venue}` : ""} · ₹{w.price_inr.toLocaleString("en-IN")}
        </p>
      </div>
      <button type="button" onClick={onRemove} className="text-xs px-2 py-1 rounded bg-muted hover:bg-destructive/10 hover:text-destructive">
        Remove / Change
      </button>
    </div>
  );
}

function Field({ label, v, on, type = "text", span2 }: { label: string; v: string; on: (v: string) => void; type?: string; span2?: boolean }) {
  return (
    <label className={`block ${span2 ? "col-span-2" : ""}`}>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={v} onChange={(e) => on(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" required />
    </label>
  );
}

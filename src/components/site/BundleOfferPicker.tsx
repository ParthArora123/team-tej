import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, Check, Ticket } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { computeCartPricing, createBundleCheckout, type PricingResult } from "@/lib/bundles.functions";
import { createEnrollment } from "@/lib/enrollment.functions";

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
  bundles: any[];
}

const initialForm = {
  fullName: "", email: "", phone: "", gender: "Female",
  address: "", city: "", state: "", emergencyContact: "",
};

const cityOf = (w: Workshop) => (w.city || w.venue || "").trim();

export function BundleOfferPicker({ workshops, bundles }: Props) {
  const navigate = useNavigate();
  const compute = useServerFn(computeCartPricing);
  const checkout = useServerFn(createBundleCheckout);
  const enroll = useServerFn(createEnrollment);

  const [city, setCity] = useState<string>("");
  const [mode, setMode] = useState<"single" | "both" | null>(null);
  const [firstId, setFirstId] = useState<string | null>(null);
  const [secondId, setSecondId] = useState<string | null>(null);
  const [silver, setSilver] = useState(false);
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [pricingErr, setPricingErr] = useState<string>("");
  const [f, setF] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const hasActiveBundles = bundles.length > 0;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setF((s) => ({ ...s, email: s.email || data.user!.email! }));
    });
  }, []);

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

  const selectedWorkshops = useMemo(() => {
    const ids = mode === "single" ? [firstId] : [firstId, secondId];
    return ids
      .filter((id): id is string => Boolean(id))
      .map((id) => workshops.find((w) => w.id === id))
      .filter((w): w is Workshop => Boolean(w));
  }, [mode, firstId, secondId, workshops]);

  // Reset workshop selection whenever the city or registration mode changes.
  useEffect(() => {
    setFirstId(null);
    setSecondId(null);
    setSilver(false);
    setPricing(null);
    setPricingErr("");
  }, [city, mode]);

  // In "Both Workshops" mode, automatically select the workshops covered by the
  // active bundle (if available), otherwise the first two available workshops in the city.
  useEffect(() => {
    if (mode !== "both") return;
    const active = bundles[0];
    let list = cityWorkshops;
    if (active && !active.applies_to_all_workshops && active.bundle_offer_programs?.length) {
      const ids = new Set(active.bundle_offer_programs.map((p: any) => p.program_id));
      list = cityWorkshops.filter((w) => ids.has(w.id));
    }
    if (list.length >= 2) {
      setFirstId(list[0].id);
      setSecondId(list[1].id);
    } else {
      setFirstId(null);
      setSecondId(null);
    }
  }, [mode, cityWorkshops, bundles]);

  // Compute the total dynamically based on the selected workshops and Silver Seat.
  useEffect(() => {
    if (selectedWorkshops.length === 0) {
      setPricing(null);
      setPricingErr("");
      return;
    }
    let cancelled = false;
    const selections = selectedWorkshops.map((w) => ({ programId: w.id, silverSeat: silver }));
    compute({ data: { selections } })
      .then((res: PricingResult) => {
        if (cancelled) return;
        if (mode === "both" && !res.bundle) {
          setPricing(null);
          setPricingErr("No active bundle offer covers these workshops yet. Please check back soon.");
        } else {
          setPricing(res);
          setPricingErr("");
        }
      })
      .catch((e: any) => { if (!cancelled) setPricingErr(e.message ?? "Pricing failed"); });
    return () => { cancelled = true; };
  }, [selectedWorkshops, silver, mode, compute]);

  const silverEnabled = selectedWorkshops.length > 0 && selectedWorkshops.some((w) => w.silver_seat_enabled);
  const silverPrice = selectedWorkshops.reduce(
    (sum, w) => sum + (w.silver_seat_enabled ? Number(w.silver_seat_price ?? 1000) : 0),
    0,
  );

  const showWorkshopSection = f.emergencyContact.trim().length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricing) return;
    setErr("");
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/auth" });
        return;
      }
      if (mode === "single") {
        if (!firstId) throw new Error("Please select a workshop.");
        const enr = await enroll({ data: { programId: firstId, ...f, silverSeat: silver } });
        navigate({ to: "/pay/$enrollmentId", params: { enrollmentId: enr.id } });
      } else {
        if (!firstId || !secondId) throw new Error("Please select two workshops.");
        const res = await checkout({ data: {
          selections: [{ programId: firstId, silverSeat: silver }, { programId: secondId, silverSeat: silver }],
          ...f,
        }});
        navigate({ to: "/pay-bundle/$purchaseId", params: { purchaseId: res.purchaseId } });
      }
    } catch (e: any) {
      setErr(e.message ?? "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4 sm:p-5">
      <div className="flex items-center gap-2 font-semibold">
        <Sparkles size={16} className="text-primary" />
        <h2 className="text-base">Workshop Registration</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Fill in your details, then choose Single Workshop or Both Workshops to register.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
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

        <AnimatePresence>
          {showWorkshopSection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                <p className="text-xs uppercase tracking-widest text-primary">Workshop Selection</p>

                <div className="grid grid-cols-2 gap-2">
                  <ModeButton active={mode === "single"} onClick={() => setMode("single")}>
                    Register for Single Workshop
                  </ModeButton>
                  <ModeButton active={mode === "both"} onClick={() => setMode("both")}>
                    Register for Both Workshops
                  </ModeButton>
                </div>

                {mode && (
                  <div>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">Select city</span>
                    <select value={city} onChange={(e) => setCity(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-sm">
                      <option value="">— Choose a city —</option>
                      {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {city && cityWorkshops.length === 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">No workshops available in {city}.</p>
                    )}
                  </div>
                )}

                {mode === "single" && city && cityWorkshops.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Choose a workshop</p>
                    {firstId && selectedWorkshops[0] ? (
                      <SelectedRow w={selectedWorkshops[0]} onRemove={() => setFirstId(null)} />
                    ) : (
                      <WorkshopList workshops={cityWorkshops} onPick={setFirstId} />
                    )}
                  </div>
                )}

                {mode === "both" && city && cityWorkshops.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Selected workshops</p>
                    {selectedWorkshops.length >= 2 ? (
                      <div className="space-y-2">
                        {selectedWorkshops.map((w) => (
                          <SelectedRow key={w.id} w={w} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border p-3">
                        At least two workshops are required in {city} for the bundle.
                      </p>
                    )}
                    {!hasActiveBundles && (
                      <p className="mt-2 text-xs text-destructive">
                        No active bundle offers right now.
                      </p>
                    )}
                  </div>
                )}

                {silverEnabled && (
                  <label className="flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3 cursor-pointer">
                    <input type="checkbox" checked={silver} onChange={(e) => setSilver(e.target.checked)} className="mt-1" />
                    <span className="flex-1">
                      <span className="flex items-center gap-1.5 font-medium text-sm">
                        <Ticket size={14} className="text-primary" /> Silver Seat
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        Premium solo dance video for your selected workshops.
                      </span>
                    </span>
                    <span className="text-sm font-medium">+₹{silverPrice.toLocaleString("en-IN")}</span>
                  </label>
                )}

                {pricingErr && <p className="text-xs text-destructive">{pricingErr}</p>}

                {pricing && (
                  <div className="rounded-xl bg-background border border-primary/30 p-4">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Total amount</p>
                    <div className="mt-1 flex items-end justify-between gap-4">
                      <div className="text-xs text-muted-foreground">
                        {pricing.discountAmount > 0 ? (
                          <>
                            <span className="line-through">₹{pricing.originalAmount.toLocaleString("en-IN")}</span>
                            <span className="ml-2 text-primary">save ₹{pricing.discountAmount.toLocaleString("en-IN")}</span>
                          </>
                        ) : mode === "single" ? (
                          <span>Single workshop fee</span>
                        ) : null}
                      </div>
                      <p className="font-display text-2xl font-bold">₹{pricing.finalAmount.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {err && <p className="text-xs text-destructive">{err}</p>}
        <button disabled={busy || !pricing} type="submit"
          className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-60">
          {busy ? "Submitting…" : pricing ? `Continue to payment · ₹${pricing.finalAmount.toLocaleString("en-IN")}` : "Complete workshop selection to continue"}
        </button>
      </form>
    </div>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`text-left rounded-lg border px-3 py-2.5 text-xs sm:text-sm font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:border-primary/60"
      }`}>
      {children}
    </button>
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

function SelectedRow({ w, onRemove }: { w: Workshop; onRemove?: () => void }) {
  return (
    <div className="rounded-lg border border-primary/40 bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate flex items-center gap-1.5">
            <Check size={12} className="text-primary" /> {w.name}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {w.event_date ? new Date(w.event_date).toDateString() : ""}
            {w.city || w.venue ? ` · ${w.city || w.venue}` : ""} · ₹{w.price_inr.toLocaleString("en-IN")}
          </p>
        </div>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-xs px-2 py-1 rounded bg-muted hover:bg-destructive/10 hover:text-destructive shrink-0">
            Remove / Change
          </button>
        )}
      </div>
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

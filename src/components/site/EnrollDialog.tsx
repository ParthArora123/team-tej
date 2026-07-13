import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Sparkles, Layers } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createEnrollment } from "@/lib/enrollment.functions";
import { listPrograms } from "@/lib/catalog.functions";
import {
  computeCartPricing,
  createBundleCheckout,
  listActiveBundles,
  type PricingResult,
} from "@/lib/bundles.functions";

export interface EnrollClass {
  id: string;
  name: string;
  price: number;
  duration: string;
  silverSeatEnabled?: boolean;
  silverSeatPrice?: number;
}

interface Props {
  klass: EnrollClass | null;
  onClose: () => void;
}

const initial = {
  fullName: "", email: "", phone: "", gender: "Female",
  address: "", city: "", state: "", emergencyContact: "",
};

const cityOf = (w: any) => (w?.city || w?.venue || "").trim();

export function EnrollDialog({ klass, onClose }: Props) {
  const navigate = useNavigate();
  const create = useServerFn(createEnrollment);
  const compute = useServerFn(computeCartPricing);
  const checkout = useServerFn(createBundleCheckout);
  const fetchPrograms = useServerFn(listPrograms);
  const fetchBundles = useServerFn(listActiveBundles);

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [d, setD] = useState(initial);
  const [silver, setSilver] = useState(false);
  const [mode, setMode] = useState<"single" | "both">("single");
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [secondId, setSecondId] = useState<string | null>(null);
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [pricingErr, setPricingErr] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!klass) return;
    setSilver(false);
    setMode("single");
    setSecondId(null);
    setPricing(null);
    setPricingErr("");
    setErr("");
    setDone(false);
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
      if (data.user?.email) setD((s) => ({ ...s, email: data.user!.email! }));
    });
    fetchPrograms({ data: { kind: "workshop" } }).then(setWorkshops).catch(() => {});
    fetchBundles().then(setBundles).catch(() => {});
  }, [klass]);

  // Candidates for the "Both Workshops" second pick — same city, not the current workshop, seats available.
  const bothCandidates = useMemo(() => {
    if (!klass) return [];
    const current = workshops.find((w) => w.id === klass.id);
    const cCity = cityOf(current).toLowerCase();
    let list = workshops.filter((w) =>
      w.id !== klass.id &&
      (w.capacity == null || (w.seats_taken ?? 0) < w.capacity) &&
      (!cCity || cityOf(w).toLowerCase() === cCity),
    );
    const active = bundles[0];
    if (active && !active.applies_to_all_workshops && active.bundle_offer_programs?.length) {
      const ids = new Set(active.bundle_offer_programs.map((p: any) => p.program_id));
      if (ids.has(klass.id)) list = list.filter((w) => ids.has(w.id));
    }
    return list;
  }, [klass, workshops, bundles]);

  // Auto-pick a second workshop when switching to "both".
  useEffect(() => {
    if (mode !== "both") return;
    if (!secondId && bothCandidates[0]) setSecondId(bothCandidates[0].id);
  }, [mode, bothCandidates, secondId]);

  // Compute pricing dynamically.
  useEffect(() => {
    if (!klass) return;
    if (mode === "single") {
      const single = klass.price + (klass.silverSeatEnabled && silver ? (klass.silverSeatPrice ?? 1000) : 0);
      setPricing({
        originalAmount: klass.price + (klass.silverSeatEnabled && silver ? (klass.silverSeatPrice ?? 1000) : 0),
        discountAmount: 0,
        finalAmount: single,
        bundle: null,
      } as any);
      setPricingErr("");
      return;
    }
    if (!secondId) { setPricing(null); return; }
    let cancelled = false;
    compute({ data: { selections: [
      { programId: klass.id, silverSeat: silver },
      { programId: secondId, silverSeat: silver },
    ] } })
      .then((res: PricingResult) => {
        if (cancelled) return;
        if (!res.bundle) {
          setPricing(null);
          setPricingErr("No active bundle offer covers these workshops yet.");
        } else {
          setPricing(res);
          setPricingErr("");
        }
      })
      .catch((e: any) => { if (!cancelled) setPricingErr(e.message ?? "Pricing failed"); });
    return () => { cancelled = true; };
  }, [klass, mode, secondId, silver, compute]);

  if (!klass) return null;

  const silverAddon = klass.silverSeatPrice ?? 1000;
  const total = pricing?.finalAmount ?? klass.price;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      if (mode === "both") {
        if (!secondId) throw new Error("Please select a second workshop for the bundle.");
        if (!pricing?.bundle) throw new Error("No active bundle offer available.");
        const res = await checkout({ data: {
          selections: [
            { programId: klass.id, silverSeat: !!(klass.silverSeatEnabled && silver) },
            { programId: secondId, silverSeat: silver },
          ],
          fullName: d.fullName, email: d.email, phone: d.phone, gender: d.gender,
          address: d.address, city: d.city, state: d.state, emergencyContact: d.emergencyContact,
        }});
        onClose();
        navigate({ to: "/pay-bundle/$purchaseId", params: { purchaseId: res.purchaseId } });
        return;
      }
      await create({ data: {
        programId: klass.id, fullName: d.fullName, email: d.email, phone: d.phone,
        gender: d.gender, address: d.address, city: d.city,
        state: d.state, emergencyContact: d.emergencyContact,
        silverSeat: !!(klass.silverSeatEnabled && silver),
      }});
      setDone(true);
    } catch (e: any) { setErr(e.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  const bothAvailable = bothCandidates.length > 0 && bundles.length > 0;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-card border border-border rounded-2xl p-6 sm:p-8">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted"><X size={18} /></button>

          {signedIn === false && (
            <div>
              <p className="text-xs uppercase tracking-widest text-primary">Sign in required</p>
              <h3 className="mt-2 text-2xl font-display font-bold">{klass.name}</h3>
              <p className="text-sm text-muted-foreground mt-2">Create an account to register.</p>
              <button onClick={() => navigate({ to: "/auth" })}
                className="mt-5 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground">Sign in / Sign up</button>
            </div>
          )}

          {signedIn && !done && (
            <form onSubmit={submit}>
              <p className="text-xs uppercase tracking-widest text-primary">Registration</p>
              <h3 className="mt-2 text-2xl font-display font-bold">{klass.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{klass.duration} · ₹{total.toLocaleString("en-IN")}</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Field label="Full name" v={d.fullName} on={(v) => setD({...d, fullName: v})} span2 />
                <Field label="Email" type="email" v={d.email} on={(v) => setD({...d, email: v})} />
                <Field label="Mobile" v={d.phone} on={(v) => setD({...d, phone: v})} />
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Gender</span>
                  <select value={d.gender} onChange={(e) => setD({...d, gender: e.target.value})}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm">
                    <option>Female</option><option>Male</option><option>Other</option>
                  </select>
                </label>
                <Field label="Address" v={d.address} on={(v) => setD({...d, address: v})} span2 />
                <Field label="City" v={d.city} on={(v) => setD({...d, city: v})} />
                <Field label="State" v={d.state} on={(v) => setD({...d, state: v})} />
                <Field label="Emergency contact" v={d.emergencyContact} on={(v) => setD({...d, emergencyContact: v})} span2 />

                {/* Workshop selection (Single / Both) — placed just above Silver Seat */}
                <div className="col-span-2 rounded-xl border border-border bg-muted/30 p-3 space-y-3">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Layers size={12} className="text-primary" /> Workshop selection
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <ModeBtn active={mode === "single"} onClick={() => setMode("single")}>
                      Single Workshop
                    </ModeBtn>
                    <ModeBtn
                      active={mode === "both"}
                      disabled={!bothAvailable}
                      onClick={() => bothAvailable && setMode("both")}
                    >
                      Both Workshops
                    </ModeBtn>
                  </div>
                  {mode === "both" && (
                    <>
                      {bothCandidates.length > 1 && (
                        <label className="block">
                          <span className="text-xs uppercase tracking-wider text-muted-foreground">Second workshop</span>
                          <select value={secondId ?? ""} onChange={(e) => setSecondId(e.target.value || null)}
                            className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-sm">
                            {bothCandidates.map((w) => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                          </select>
                        </label>
                      )}
                      {bothCandidates.length === 1 && secondId && (
                        <p className="text-xs text-muted-foreground">
                          Bundled with: <span className="font-medium text-foreground">{bothCandidates[0].name}</span>
                        </p>
                      )}
                      {pricingErr && <p className="text-xs text-destructive">{pricingErr}</p>}
                      {pricing?.bundle && (
                        <p className="text-xs text-primary">
                          Bundle applied · save ₹{pricing.discountAmount.toLocaleString("en-IN")}
                        </p>
                      )}
                    </>
                  )}
                  {!bothAvailable && (
                    <p className="text-[11px] text-muted-foreground">
                      "Both Workshops" is unavailable — no eligible second workshop or active bundle in this city.
                    </p>
                  )}
                </div>

                {klass.silverSeatEnabled && (
                  <label className="col-span-2 flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3 cursor-pointer">
                    <input type="checkbox" checked={silver} onChange={(e) => setSilver(e.target.checked)} className="mt-1" />
                    <span className="flex-1">
                      <span className="flex items-center gap-1.5 font-medium text-sm">
                        <Sparkles size={14} className="text-primary" /> Silver Seat
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        Premium seating · adds ₹{silverAddon.toLocaleString("en-IN")}
                        {mode === "both" ? " per workshop" : ""}.
                      </span>
                    </span>
                    <span className="text-sm font-medium">+₹{silverAddon.toLocaleString("en-IN")}</span>
                  </label>
                )}
              </div>
              {err && <p className="mt-3 text-xs text-destructive">{err}</p>}
              <button disabled={busy || (mode === "both" && !pricing?.bundle)} type="submit"
                className="mt-6 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-60">
                {busy ? "Submitting…" : `Continue to payment · ₹${total.toLocaleString("en-IN")}`}
              </button>
            </form>
          )}

          {done && (
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center">
                <Check className="text-primary" size={28} />
              </div>
              <h3 className="mt-3 text-xl font-display font-bold">Registered</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Head to your dashboard to scan the UPI QR and pay. Your ticket and QR are issued instantly after payment.
              </p>
              <button onClick={() => { onClose(); navigate({ to: "/dashboard" }); }}
                className="mt-5 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground">Go to payment</button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ModeBtn({ active, disabled, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`text-left rounded-lg border px-3 py-2 text-xs sm:text-sm font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:border-primary/60"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}>
      {children}
    </button>
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

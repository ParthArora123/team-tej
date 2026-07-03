import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createEnrollment } from "@/lib/enrollment.functions";

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
  fullName: "", email: "", phone: "", age: "", gender: "Female",
  address: "", city: "", state: "", emergencyContact: "", medicalInfo: "",
  upiId: "", accountHolder: "",
};

const DEFAULTS_KEY = "enroll:payerDefaults";
type PayerDefaults = { upiId: string; accountHolder: string };
function readDefaults(): PayerDefaults | null {
  try {
    const raw = localStorage.getItem(DEFAULTS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && typeof p.upiId === "string" && typeof p.accountHolder === "string" && p.upiId && p.accountHolder) return p;
    return null;
  } catch { return null; }
}

export function EnrollDialog({ klass, onClose }: Props) {
  const navigate = useNavigate();
  const create = useServerFn(createEnrollment);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [d, setD] = useState(initial);
  const [silver, setSilver] = useState(false);
  const [saveDefault, setSaveDefault] = useState(false);
  const [savedDefaults, setSavedDefaults] = useState<PayerDefaults | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setSilver(false);
    const def = readDefaults();
    setSavedDefaults(def);
    setSaveDefault(false);
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
      setD((s) => ({
        ...s,
        email: data.user?.email ?? s.email,
        upiId: def?.upiId ?? "",
        accountHolder: def?.accountHolder ?? "",
      }));
    });
  }, [klass]);

  if (!klass) return null;

  const silverAddon = klass.silverSeatPrice ?? 1000;
  const total = klass.price + (klass.silverSeatEnabled && silver ? silverAddon : 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await create({ data: {
        programId: klass.id, fullName: d.fullName, email: d.email, phone: d.phone,
        age: Number(d.age), gender: d.gender, address: d.address, city: d.city,
        state: d.state, emergencyContact: d.emergencyContact,
        medicalInfo: d.medicalInfo || null,
        silverSeat: !!(klass.silverSeatEnabled && silver),
      }});
      if (!savedDefaults && saveDefault && d.upiId.trim() && d.accountHolder.trim()) {
        try {
          localStorage.setItem(DEFAULTS_KEY, JSON.stringify({
            upiId: d.upiId.trim(), accountHolder: d.accountHolder.trim(),
          }));
        } catch {}
      }
      setDone(true);
    } catch (e: any) { setErr(e.message ?? "Failed"); }
    finally { setBusy(false); }
  };

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
                <Field label="Age" type="number" v={d.age} on={(v) => setD({...d, age: v})} />
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
                <label className="block col-span-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Medical info (optional)</span>
                  <textarea value={d.medicalInfo} onChange={(e) => setD({...d, medicalInfo: e.target.value})} rows={2}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" />
                </label>

                {!savedDefaults && (
                  <>
                    <Field label="UPI ID (for payment)" v={d.upiId} on={(v) => setD({...d, upiId: v})} span2 />
                    <Field label="Account holder name" v={d.accountHolder} on={(v) => setD({...d, accountHolder: v})} span2 />
                    <label className="col-span-2 flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3 cursor-pointer">
                      <input type="checkbox" checked={saveDefault} onChange={(e) => setSaveDefault(e.target.checked)} className="mt-1" />
                      <span className="flex-1 text-xs text-muted-foreground">
                        <span className="block font-medium text-sm text-foreground">Set as default</span>
                        Save this UPI ID and account holder name. Next time these fields will be hidden and used automatically.
                      </span>
                    </label>
                  </>
                )}

                {klass.silverSeatEnabled && (
                  <label className="col-span-2 flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3 cursor-pointer">
                    <input type="checkbox" checked={silver} onChange={(e) => setSilver(e.target.checked)} className="mt-1" />
                    <span className="flex-1">
                      <span className="flex items-center gap-1.5 font-medium text-sm">
                        <Sparkles size={14} className="text-primary" /> Silver Seat
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">Premium seating · adds ₹{silverAddon.toLocaleString("en-IN")} to your fee.</span>
                    </span>
                    <span className="text-sm font-medium">+₹{silverAddon.toLocaleString("en-IN")}</span>
                  </label>
                )}
              </div>
              {err && <p className="mt-3 text-xs text-destructive">{err}</p>}
              <button disabled={busy} type="submit"
                className="mt-6 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium">
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

function Field({ label, v, on, type = "text", span2 }: { label: string; v: string; on: (v: string) => void; type?: string; span2?: boolean }) {
  return (
    <label className={`block ${span2 ? "col-span-2" : ""}`}>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={v} onChange={(e) => on(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" required />
    </label>
  );
}

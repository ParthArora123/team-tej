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
  allowSingle?: boolean;
  allowBoth?: boolean;
  bothPrice?: number | null;
  workshop1Name?: string | null;
  workshop2Name?: string | null;
}

interface Props {
  klass: EnrollClass | null;
  onClose: () => void;
}

const initial = {
  fullName: "", email: "", phone: "", gender: "Female",
  address: "", city: "", state: "", emergencyContact: "",
};

export function EnrollDialog({ klass, onClose }: Props) {
  const navigate = useNavigate();
  const create = useServerFn(createEnrollment);

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState("");
  const [d, setD] = useState(initial);
  const [silverW1, setSilverW1] = useState(false);
  const [silverW2, setSilverW2] = useState(false);
  const [regType, setRegType] = useState<"single" | "both">("single");
  const [selectedWorkshop, setSelectedWorkshop] = useState<"w1" | "w2">("w1");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const allowSingle = klass?.allowSingle !== false;
  const allowBoth = !!klass?.allowBoth && !!klass?.bothPrice;
  const hasNamedWorkshops = allowBoth && !!(klass?.workshop1Name || klass?.workshop2Name);
  const w1Name = klass?.workshop1Name || "Workshop 1";
  const w2Name = klass?.workshop2Name || "Workshop 2";

  useEffect(() => {
    if (!klass) return;
    setSilverW1(false);
    setSilverW2(false);
    setErr("");
    setDone(false);
    const initialType: "single" | "both" = allowSingle ? "single" : allowBoth ? "both" : "single";
    setRegType(initialType);
    setSelectedWorkshop("w1");
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setSignedIn(true);
        if (data.user.email) setD((s) => ({ ...s, email: data.user!.email! }));
        return;
      }
      // No signup required to register — create a lightweight anonymous
      // session in the background so the existing auth-gated enrollment
      // + payment flow (RLS, dashboard, ticket generation) keeps working
      // untouched. Users can later add an email/password to their
      // account from the dashboard if they want to log in elsewhere.
      const { data: anon, error } = await supabase.auth.signInAnonymously();
      if (error || !anon.user) {
        setAuthError(
          "We couldn't start your registration session. Please check your connection and try again."
        );
        setSignedIn(false);
        return;
      }
      setSignedIn(true);
    });
  }, [klass]);

  if (!klass) return null;

  const silverAddon = klass.silverSeatPrice ?? 1000;
  const basePrice = regType === "both" ? (klass.bothPrice ?? klass.price) : klass.price;
  const silverCount = regType === "both"
    ? (silverW1 ? 1 : 0) + (silverW2 ? 1 : 0)
    : ((silverW1 || silverW2) ? 1 : 0);
  const total = basePrice + (klass.silverSeatEnabled ? silverCount * silverAddon : 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      // For "single" with named workshops, silverW1/W2 map to selectedWorkshop.
      const payload: any = {
        programId: klass.id, fullName: d.fullName, email: d.email, phone: d.phone,
        gender: d.gender, address: d.address, city: d.city,
        state: d.state, emergencyContact: d.emergencyContact,
        registrationType: regType,
      };
      if (regType === "both") {
        payload.silverSeatW1 = !!(klass.silverSeatEnabled && silverW1);
        payload.silverSeatW2 = !!(klass.silverSeatEnabled && silverW2);
      } else {
        if (hasNamedWorkshops) payload.selectedWorkshop = selectedWorkshop;
        payload.silverSeat = !!(klass.silverSeatEnabled && (silverW1 || silverW2));
      }
      await create({ data: payload });
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

          {signedIn === null && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Preparing your registration…
            </div>
          )}

          {signedIn === false && (
            <div>
              <p className="text-xs uppercase tracking-widest text-destructive">Something went wrong</p>
              <h3 className="mt-2 text-2xl font-display font-bold">{klass.name}</h3>
              <p className="text-sm text-muted-foreground mt-2">{authError}</p>
              <button
                onClick={() => {
                  setSignedIn(null);
                  supabase.auth.signInAnonymously().then(({ data, error }) => {
                    if (error || !data.user) { setSignedIn(false); return; }
                    setSignedIn(true);
                  });
                }}
                className="mt-5 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground">Try again</button>
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

                {(allowSingle || allowBoth) && (allowSingle && allowBoth ? (
                  <div className="col-span-2 rounded-xl border border-primary/40 bg-primary/5 p-3 space-y-2">
                    <p className="text-xs uppercase tracking-widest text-primary font-medium">Workshop Selection</p>
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className="flex items-center gap-2 text-sm">
                        <input type="radio" name="regType" checked={regType === "single"} onChange={() => setRegType("single")} />
                        Single Workshop
                      </span>
                      <span className="text-sm font-medium">₹{klass.price.toLocaleString("en-IN")}</span>
                    </label>
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className="flex items-center gap-2 text-sm">
                        <input type="radio" name="regType" checked={regType === "both"} onChange={() => setRegType("both")} />
                        Both Workshops
                      </span>
                      <span className="text-sm font-medium">₹{(klass.bothPrice ?? 0).toLocaleString("en-IN")}</span>
                    </label>
                  </div>
                ) : (
                  <div className="col-span-2 rounded-xl border border-primary/40 bg-primary/5 p-3 flex items-center justify-between">
                    <span className="text-sm font-medium">{regType === "both" ? "Both Workshops" : "Single Workshop"}</span>
                    <span className="text-sm font-medium">₹{basePrice.toLocaleString("en-IN")}</span>
                  </div>
                ))}

                {regType === "single" && hasNamedWorkshops && (
                  <div className="col-span-2 rounded-xl border border-primary/30 bg-muted/30 p-3 space-y-2">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Choose your workshop</p>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="wpick" checked={selectedWorkshop === "w1"} onChange={() => { setSelectedWorkshop("w1"); setSilverW2(false); }} />
                      {w1Name}
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="wpick" checked={selectedWorkshop === "w2"} onChange={() => { setSelectedWorkshop("w2"); setSilverW1(false); }} />
                      {w2Name}
                    </label>
                  </div>
                )}

                {klass.silverSeatEnabled && regType === "both" && (
                  <div className="col-span-2 rounded-xl border border-primary/40 bg-primary/5 p-3 space-y-2">
                    <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-primary font-medium">
                      <Sparkles size={12} /> Silver Seats
                    </p>
                    <label className="flex items-center justify-between gap-3 cursor-pointer text-sm">
                      <span className="flex items-center gap-2">
                        <input type="checkbox" checked={silverW1} onChange={(e) => setSilverW1(e.target.checked)} />
                        {w1Name} · Silver Seat
                      </span>
                      <span className="font-medium">+₹{silverAddon.toLocaleString("en-IN")}</span>
                    </label>
                    <label className="flex items-center justify-between gap-3 cursor-pointer text-sm">
                      <span className="flex items-center gap-2">
                        <input type="checkbox" checked={silverW2} onChange={(e) => setSilverW2(e.target.checked)} />
                        {w2Name} · Silver Seat
                      </span>
                      <span className="font-medium">+₹{silverAddon.toLocaleString("en-IN")}</span>
                    </label>
                  </div>
                )}

                {klass.silverSeatEnabled && regType === "single" && (
                  <label className="col-span-2 flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedWorkshop === "w2" ? silverW2 : silverW1}
                      onChange={(e) => selectedWorkshop === "w2" ? setSilverW2(e.target.checked) : setSilverW1(e.target.checked)}
                      className="mt-1"
                    />
                    <span className="flex-1">
                      <span className="flex items-center gap-1.5 font-medium text-sm">
                        <Sparkles size={14} className="text-primary" /> Silver Seat
                        {hasNamedWorkshops && <span className="text-muted-foreground">· {selectedWorkshop === "w2" ? w2Name : w1Name}</span>}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        Premium seating · adds ₹{silverAddon.toLocaleString("en-IN")}.
                      </span>
                    </span>
                    <span className="text-sm font-medium">+₹{silverAddon.toLocaleString("en-IN")}</span>
                  </label>
                )}
              </div>
              {err && <p className="mt-3 text-xs text-destructive">{err}</p>}
              <button disabled={busy} type="submit"
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

function Field({ label, v, on, type = "text", span2 }: { label: string; v: string; on: (v: string) => void; type?: string; span2?: boolean }) {
  return (
    <label className={`block ${span2 ? "col-span-2" : ""}`}>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={v} onChange={(e) => on(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" required />
    </label>
  );
}

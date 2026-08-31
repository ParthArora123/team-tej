import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createEnrollment } from "@/lib/enrollment.functions";
import { isValidName, normalizeName, NAME_ERROR_MESSAGE, NAME_MAX_LENGTH } from "@/lib/name-validation";
import { isValidPhone, sanitizePhone, PHONE_ERROR_MESSAGE } from "@/lib/phone-validation";

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
  eventTime?: string | null;
}

interface Props {
  klass: EnrollClass | null;
  onClose: () => void;
  inline?: boolean;
}


const initial = {
  fullName: "", email: "", phone: "", gender: "Female",
  emergencyContact: "",
};

export function EnrollDialog({ klass, onClose, inline = false }: Props) {
  const navigate = useNavigate();
  const create = useServerFn(createEnrollment);

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState("");
  const [d, setD] = useState(initial);
  const [silverW1, setSilverW1] = useState(false);
  const [silverW2, setSilverW2] = useState(false);
  const [regType, setRegType] = useState<"single" | "both">("single");
  const [participantCount, setParticipantCount] = useState(1);
  const [extras, setExtras] = useState<Array<{ fullName: string; email: string; phone: string }>>([]);
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
    setParticipantCount(1);
    setExtras([]);
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setSignedIn(true);
        if (data.user.email) setD((s) => ({ ...s, email: data.user!.email! }));
        return;
      }
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
  }, [klass?.id]);

  // Allow external triggers (e.g. the "Silver Seat" marketing card on the
  // workshop detail page) to pre-select silver seats when the user clicks
  // an "Add Silver Seat" affordance outside the form.
  useEffect(() => {
    if (!klass) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ programId?: string; which?: "w1" | "w2" | "both" }>).detail || {};
      if (detail.programId && detail.programId !== klass.id) return;
      if (detail.which === "w2") setSilverW2(true);
      else if (detail.which === "both") { setSilverW1(true); setSilverW2(true); }
      else setSilverW1(true);
    };
    window.addEventListener("enroll:add-silver", handler as EventListener);
    return () => window.removeEventListener("enroll:add-silver", handler as EventListener);
  }, [klass?.id]);

  if (!klass) return null;

  const silverAddon = klass.silverSeatPrice ?? 1000;
  const basePrice = regType === "both" ? (klass.bothPrice ?? klass.price) : klass.price;
  const silverCount = regType === "both"
    ? (silverW1 ? 1 : 0) + (silverW2 ? 1 : 0)
    : ((silverW1 || silverW2) ? 1 : 0);
  const total = basePrice * participantCount + (klass.silverSeatEnabled ? silverCount * silverAddon : 0);

  const setCount = (n: number) => {
    setParticipantCount(n);
    setExtras((prev) => {
      const next = prev.slice(0, Math.max(n - 1, 0));
      while (next.length < n - 1) next.push({ fullName: "", email: "", phone: "" });
      return next;
    });
  };
  const updateExtra = (i: number, patch: Partial<{ fullName: string; email: string; phone: string }>) =>
    setExtras((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = normalizeName(d.fullName);
    if (!isValidName(cleanName)) {
      setErr(NAME_ERROR_MESSAGE);
      return;
    }
    if (!isValidPhone(d.phone) || !isValidPhone(d.emergencyContact)) {
      setErr(PHONE_ERROR_MESSAGE);
      return;
    }
    const cleanExtras = extras.map((x) => ({
      fullName: normalizeName(x.fullName),
      email: x.email.trim(),
      phone: x.phone,
    }));
    for (let i = 0; i < cleanExtras.length; i++) {
      const x = cleanExtras[i];
      if (!isValidName(x.fullName)) { setErr(`Participant ${i + 2}: ${NAME_ERROR_MESSAGE}`); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x.email)) { setErr(`Participant ${i + 2}: please enter a valid email address.`); return; }
      if (!isValidPhone(x.phone)) { setErr(`Participant ${i + 2}: ${PHONE_ERROR_MESSAGE}`); return; }
    }
    setErr(""); setBusy(true);
    try {
      // For "single" with named workshops, silverW1/W2 map to selectedWorkshop.
      const payload: any = {
        programId: klass.id, fullName: cleanName, email: d.email, phone: d.phone,
        gender: d.gender, emergencyContact: d.emergencyContact,
        registrationType: regType,
        participantCount,
        participants: cleanExtras,
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
      onClose();
      navigate({ to: "/dashboard" });
    } catch (e: any) { setErr(e.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  const content = (
    <>
      {!inline && (
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted"><X size={18} /></button>
      )}


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
              {participantCount > 1 && (
                <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground flex items-center justify-between">
                  <span>₹{basePrice.toLocaleString("en-IN")} × {participantCount} participants</span>
                  <span className="font-semibold text-foreground">₹{(basePrice * participantCount).toLocaleString("en-IN")}</span>
                </div>
              )}
              {klass.silverSeatEnabled && silverCount > 0 && (
                <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Base ₹{basePrice.toLocaleString("en-IN")} + Silver Seat ₹{(silverCount * silverAddon).toLocaleString("en-IN")}</span>
                  <span className="font-semibold text-primary">= ₹{total.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <label className="col-span-2 block">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Number of participants</span>
                  <select
                    value={participantCount}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  {participantCount > 1 && (
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      Each participant gets their own Ticket ID and QR code.
                    </span>
                  )}
                </label>
                {participantCount > 1 && (
                  <p className="col-span-2 -mb-1 text-xs uppercase tracking-widest text-primary">Participant 1 (you)</p>
                )}
                <Field label="Full name" v={d.fullName} on={(v) => setD({...d, fullName: v})} span2 maxLength={NAME_MAX_LENGTH} title={NAME_ERROR_MESSAGE} />
                <Field label="Email" type="email" v={d.email} on={(v) => setD({...d, email: v})} />
                <Field
                  label="Mobile"
                  type="tel"
                  v={d.phone}
                  on={(v) => setD({ ...d, phone: sanitizePhone(v) })}
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  title={PHONE_ERROR_MESSAGE}
                />

                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Gender</span>
                  <select value={d.gender} onChange={(e) => setD({...d, gender: e.target.value})}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm">
                    <option>Female</option><option>Male</option><option>Other</option>
                  </select>
                </label>
                <Field
                  label="Emergency contact"
                  type="tel"
                  v={d.emergencyContact}
                  on={(v) => setD({ ...d, emergencyContact: sanitizePhone(v) })}
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  title={PHONE_ERROR_MESSAGE}
                  span2
                />
                {((d.phone && !isValidPhone(d.phone)) || (d.emergencyContact && !isValidPhone(d.emergencyContact))) && (
                  <p className="col-span-2 -mt-1 text-xs text-destructive">{PHONE_ERROR_MESSAGE}</p>
                )}

                {extras.map((x, i) => (
                  <div key={i} className="col-span-2 rounded-xl border border-border bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-widest text-primary">Participant {i + 2}</p>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field
                        label="Full name"
                        v={x.fullName}
                        on={(v) => updateExtra(i, { fullName: v })}
                        maxLength={NAME_MAX_LENGTH}
                        title={NAME_ERROR_MESSAGE}
                        span2
                      />
                      <Field label="Email" type="email" v={x.email} on={(v) => updateExtra(i, { email: v })} />
                      <Field
                        label="Mobile"
                        type="tel"
                        v={x.phone}
                        on={(v) => updateExtra(i, { phone: sanitizePhone(v) })}
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        title={PHONE_ERROR_MESSAGE}
                      />
                    </div>
                  </div>
                ))}

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
                        Get our Silver Seat Offer where we’ll shoot and professionally edit your solo dance video using a professional camera setup, so you get a high-quality video of your performance. (+₹{silverAddon.toLocaleString("en-IN")})
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
              <div className="mt-3 inline-flex flex-col gap-1 items-center text-sm">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {regType === "both" ? "2 Classes" : "1 Class"}
                </span>
                {klass.eventTime && (
                  <span className="text-muted-foreground">🕒 {klass.eventTime}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Head to your dashboard to scan the UPI QR and pay. Your ticket and QR are issued instantly after payment.
              </p>
              <button onClick={() => { onClose(); navigate({ to: "/dashboard" }); }}
                className="mt-5 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground">Go to payment</button>
            </div>
          )}
    </>
  );

  if (inline) {
    if (!klass) return null;
    return (
      <div className="relative w-full max-w-2xl mx-auto bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
        {content}
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-card border border-border rounded-2xl p-6 sm:p-8">
          {content}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


function Field({ label, v, on, type = "text", span2, ...rest }: { label: string; v: string; on: (v: string) => void; type?: string; span2?: boolean } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
  return (
    <label className={`block ${span2 ? "col-span-2" : ""}`}>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={v} onChange={(e) => on(e.target.value)} {...rest}
        className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" required />
    </label>
  );
}

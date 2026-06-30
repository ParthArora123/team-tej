import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createEnrollment } from "@/lib/enrollment.functions";

export interface EnrollClass {
  id: string;
  name: string;
  price: number;
  duration: string;
}

interface Props {
  klass: EnrollClass | null;
  onClose: () => void;
}

export function EnrollDialog({ klass, onClose }: Props) {
  const navigate = useNavigate();
  const create = useServerFn(createEnrollment);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [details, setDetails] = useState({ fullName: "", phone: "", age: "", experience: "Beginner" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
  }, [klass]);

  if (!klass) return null;

  const submit = async () => {
    setErr(""); setBusy(true);
    try {
      await create({ data: {
        programId: klass.id,
        fullName: details.fullName,
        phone: details.phone,
        age: Number(details.age),
        experience: details.experience,
      }});
      setDone(true);
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally { setBusy(false); }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted">
            <X size={18} />
          </button>

          {signedIn === false && (
            <div>
              <p className="text-xs uppercase tracking-widest text-primary">Sign in required</p>
              <h3 className="mt-2 text-2xl font-display font-bold">{klass.name}</h3>
              <p className="text-sm text-muted-foreground mt-2">Create an account to enroll. You can pay and track your ticket from your dashboard.</p>
              <button onClick={() => navigate({ to: "/auth" })}
                className="mt-5 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground">
                Sign in / Sign up
              </button>
            </div>
          )}

          {signedIn && !done && (
            <>
              <p className="text-xs uppercase tracking-widest text-primary">Enroll</p>
              <h3 className="mt-2 text-2xl font-display font-bold">{klass.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{klass.duration} · ₹{klass.price.toLocaleString("en-IN")}</p>

              <div className="mt-5 space-y-3">
                <Field label="Full name" v={details.fullName} on={(v) => setDetails({...details, fullName: v})} />
                <Field label="Phone" v={details.phone} on={(v) => setDetails({...details, phone: v})} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Age" type="number" v={details.age} on={(v) => setDetails({...details, age: v})} />
                  <label className="block">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Experience</span>
                    <select value={details.experience} onChange={(e) => setDetails({...details, experience: e.target.value})}
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm">
                      <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                    </select>
                  </label>
                </div>
              </div>
              {err && <p className="mt-3 text-xs text-destructive">{err}</p>}
              <button disabled={busy} onClick={submit}
                className="mt-6 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium">
                {busy ? "Creating…" : "Continue to payment"}
              </button>
            </>
          )}

          {done && (
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center">
                <Check className="text-primary" size={28} />
              </div>
              <h3 className="mt-3 text-xl font-display font-bold">Enrollment created</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Head to your dashboard to scan the UPI QR, pay, and confirm. Once admin verifies, your ticket appears there.
              </p>
              <button onClick={() => { onClose(); navigate({ to: "/dashboard" }); }}
                className="mt-5 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground">
                Go to dashboard
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, v, on, type="text" }: { label: string; v: string; on: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={v} onChange={(e) => on(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" required />
    </label>
  );
}

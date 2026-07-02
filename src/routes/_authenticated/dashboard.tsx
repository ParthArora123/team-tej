import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Clock, X as XIcon, Ticket, LogOut, Shield, Upload } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { listMyEnrollments, markPaymentSubmitted, checkIsAdmin } from "@/lib/enrollment.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

const DEFAULT_UPI_ID = "teamtej@upi";

function StatusPill({ s }: { s: string }) {
  const map: Record<string, { label: string; cls: string; Icon: any }> = {
    awaiting_payment: { label: "Awaiting payment", cls: "bg-amber-500/15 text-amber-400", Icon: Clock },
    payment_submitted: { label: "Pending admin approval", cls: "bg-blue-500/15 text-blue-400", Icon: Clock },
    confirmed: { label: "Confirmed", cls: "bg-emerald-500/15 text-emerald-400", Icon: Check },
    rejected: { label: "Rejected", cls: "bg-destructive/15 text-destructive", Icon: XIcon },
  };
  const m = map[s] ?? map.awaiting_payment;
  return <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${m.cls}`}><m.Icon size={12} />{m.label}</span>;
}

function Dashboard() {
  const navigate = useNavigate();
  const fetchEnrollments = useServerFn(listMyEnrollments);
  const submitPay = useServerFn(markPaymentSubmitted);
  const adminCheck = useServerFn(checkIsAdmin);
  const [rows, setRows] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [payErr, setPayErr] = useState("");
  const [paying, setPaying] = useState(false);

  const reload = async () => setRows(await fetchEnrollments());
  useEffect(() => { reload(); adminCheck().then((r) => setIsAdmin(r.isAdmin)); }, []);



  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 lg:px-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Your account</p>
          <h1 className="font-display text-4xl font-bold mt-1">My enrollments</h1>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link to="/admin" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm">
              <Shield size={14} /> Admin
            </Link>
          )}
          <button onClick={signOut} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      {rows.length === 0 && (
        <div className="mt-10 text-center text-muted-foreground border border-dashed border-border rounded-2xl py-16">
          <p>You haven't enrolled in anything yet.</p>
          <Link to="/workshops" className="inline-block mt-4 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm">
            Browse workshops
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-4">
        {rows.map((r) => {
          const upiId = r.program?.upi_id || DEFAULT_UPI_ID;
          const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("Team Tej")}&am=${r.amount_inr}&cu=INR&tn=${encodeURIComponent(r.program?.name ?? "Enrollment")}`;
          const verifyUrl = typeof window !== "undefined" && r.ticket_code
            ? `${window.location.origin}/verify?code=${encodeURIComponent(r.ticket_code)}`
            : "";
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-display text-xl font-bold">{r.program?.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.program?.duration} · ₹{r.amount_inr.toLocaleString("en-IN")}</p>
                </div>
                <StatusPill s={r.status} />
              </div>

              {r.status === "awaiting_payment" && (
                <div className="mt-4">
                  <button onClick={() => setOpen(open === r.id ? null : r.id)}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
                    {open === r.id ? "Hide payment QR" : "Pay now"}
                  </button>
                  {open === r.id && (
                    <div className="mt-4 flex flex-col items-center bg-muted/40 rounded-xl p-5">
                      <div className="p-3 bg-white rounded-lg"><QRCodeSVG value={upiUrl} size={180} /></div>
                      <p className="mt-3 text-xs text-muted-foreground">Scan with any UPI app</p>
                      <p className="text-sm font-mono select-all text-foreground">{upiId}</p>

                      <div className="mt-5 w-full max-w-sm space-y-3">
                        <label className="block">
                          <span className="text-xs uppercase tracking-wider text-muted-foreground">Upload your payment screenshot</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => {
                              const f = e.target.files?.[0] ?? null;
                              setPayErr("");
                              if (f && !f.type.startsWith("image/")) {
                                setPayErr("Only image files are allowed."); return;
                              }
                              if (f && f.size > 8 * 1024 * 1024) {
                                setPayErr("Screenshot must be under 8 MB."); return;
                              }
                              setFile(f);
                              setPreview(f ? URL.createObjectURL(f) : "");
                            }}
                            id={`payment-proof-${r.id}`}
                            className="sr-only"
                          />
                          <span className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/10 px-4 py-4 text-sm font-medium text-primary cursor-pointer active:scale-[0.99]">
                            <Upload size={16} /> {file ? "Change payment screenshot" : "Choose payment screenshot"}
                          </span>
                          {file && <span className="mt-2 block truncate text-xs text-foreground">{file.name}</span>}
                          <span className="mt-1 block text-[11px] text-muted-foreground">
                            Upload the success receipt from your UPI app (GPay, PhonePe, Paytm, BHIM, bank app). We auto-verify it.
                          </span>
                        </label>
                        {preview && (
                          <img src={preview} alt="Payment proof preview" className="max-h-56 rounded-md border border-border mx-auto" />
                        )}
                        {payErr && <p className="text-xs text-destructive">{payErr}</p>}
                        <button
                          disabled={paying || !file}
                          onClick={async () => {
                            if (!file) return;
                            setPayErr(""); setPaying(true);
                            try {
                              const { data: userData } = await supabase.auth.getUser();
                              const uid = userData.user?.id;
                              if (!uid) throw new Error("Please sign in again.");
                              const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
                              const path = `${uid}/${r.id}-${Date.now()}.${ext || "jpg"}`;
                              const up = await supabase.storage.from("payment-proofs").upload(path, file, {
                                contentType: file.type, upsert: false,
                              });
                              if (up.error) throw up.error;
                              await submitPay({ data: { enrollmentId: r.id, proofPath: path } });
                              setFile(null); setPreview(""); setOpen(null);
                              await reload();
                            } catch (e: any) {
                              setPayErr(e?.message ?? "Verification failed");
                            } finally { setPaying(false); }
                          }}
                          className="w-full px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium disabled:opacity-60">
                          {paying ? "Verifying payment…" : "I've completed the payment"}
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              )}


              {r.status === "payment_submitted" && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Thanks! Admin will verify your payment and your ticket will appear here once approved.
                </p>
              )}

              {r.status === "confirmed" && (
                <div className="mt-5 relative rounded-xl border border-dashed border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-primary">
                        <Ticket size={16} /><span className="text-xs uppercase tracking-widest font-semibold">Ticket · Confirmed</span>
                      </div>
                      <p className="mt-2 font-mono text-lg">{r.ticket_code}</p>
                      <p className="text-xs text-muted-foreground">Show this at the studio on your first day.</p>
                    </div>
                    <div className="bg-white p-2 rounded"><QRCodeSVG value={verifyUrl} size={92} /></div>
                  </div>
                </div>
              )}

              {r.status === "rejected" && (
                <p className="mt-4 text-sm text-destructive">Payment couldn't be verified. Please contact us.</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

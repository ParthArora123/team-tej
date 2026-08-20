import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Clock, X as XIcon, Ticket, LogOut, Shield, Download, Save, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { validatePaymentProofFile } from "@/lib/payment-proof-validation";

async function buildQrCanvas(containerId: string, size = 720): Promise<HTMLCanvasElement | null> {
  const sourceCanvas = document.querySelector(`#${containerId} canvas`) as HTMLCanvasElement | null;
  if (sourceCanvas) {
    const padding = Math.round(size * 0.08);
    const qrSize = size - padding * 2;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sourceCanvas, padding, padding, qrSize, qrSize);
    return canvas;
  }

  const svg = document.querySelector(`#${containerId} svg`) as SVGSVGElement | null;
  if (!svg) return null;
  const xml = new XMLSerializer().serializeToString(svg);
  const svg64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = svg64; });
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);
  return canvas;
}

async function downloadQrPng(containerId: string, filename: string, size = 720) {
  const canvas = await buildQrCanvas(containerId, size);
  if (!canvas) return;
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  a.click();
}

// Saves the exact same QR image — no regeneration or resizing. Uses the native
// share/save sheet when available (mobile "Save to Photos"), else falls back to download.
async function saveQrPng(containerId: string, filename: string, size = 720) {
  const canvas = await buildQrCanvas(containerId, size);
  if (!canvas) return;
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
  if (blob && typeof navigator !== "undefined" && (navigator as any).canShare) {
    const file = new File([blob], filename, { type: "image/png" });
    if ((navigator as any).canShare({ files: [file] })) {
      try {
        await (navigator as any).share({ files: [file], title: "Payment QR" });
        return;
      } catch (e: any) {
        if (e?.name === "AbortError") return;
      }
    }
  }
  await downloadQrPng(containerId, filename, size);
  toast.success("Payment QR saved to your device");
}

import { useServerFn } from "@tanstack/react-start";
import { listMyEnrollments, checkIsAdmin, markPaymentSubmitted } from "@/lib/enrollment.functions";
import { supabase } from "@/integrations/supabase/client";
import { FeedbackForm } from "@/components/site/FeedbackForm";

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

function getSelectedWorkshopNames(enrollment: any): string | null {
  const program = enrollment?.program ?? {};
  const regType = enrollment?.registration_type;
  const selected = enrollment?.selected_workshop;
  const w1 = program.workshop1_name || "Workshop 1";
  const w2 = program.workshop2_name || "Workshop 2";

  if (regType === "both") {
    return [w1, w2].filter(Boolean).join(" + ");
  }
  if (regType === "single") {
    if (selected === "w2") return w2;
    return w1;
  }
  return null;
}

function Dashboard() {
  const navigate = useNavigate();
  const fetchEnrollments = useServerFn(listMyEnrollments);
  const adminCheck = useServerFn(checkIsAdmin);
  const submitPayment = useServerFn(markPaymentSubmitted);
  const [rows, setRows] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<Record<string, File | null>>({});
  const [reference, setReference] = useState<Record<string, string>>({});
  const [proofError, setProofError] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const reload = async () => {
    // A dropped request must never take the whole page down.
    try {
      setRows(await fetchEnrollments());
    } catch {
      toast.error("Couldn't load your bookings. Please check your connection and retry.");
    }
  };
  useEffect(() => {
    reload();
    adminCheck().then((r) => setIsAdmin(r.isAdmin)).catch(() => setIsAdmin(false));
  }, []);


  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  const submitProof = async (enrollmentId: string) => {
    const file = proofFile[enrollmentId];
    const ref = (reference[enrollmentId] || "").trim();
    setProofError((s) => ({ ...s, [enrollmentId]: "" }));

    if (!file) {
      setProofError((s) => ({ ...s, [enrollmentId]: "Please choose a payment screenshot." }));
      return;
    }
    if (!/^[A-Za-z0-9-]{6,64}$/.test(ref)) {
      setProofError((s) => ({ ...s, [enrollmentId]: "Enter the 6–64 character UPI Reference / UTR ID from your payment app." }));
      return;
    }

    setSubmitting((s) => ({ ...s, [enrollmentId]: true }));
    try {
      const validated = await validatePaymentProofFile(file);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Your session expired. Please sign in again.");

      const proofPath = `${userId}/${enrollmentId}-${Date.now()}.${validated.ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-proofs")
        .upload(proofPath, validated.bytes, { contentType: validated.mime, upsert: false });
      if (upErr) throw new Error(upErr.message || "Could not upload the screenshot. Please try again.");

      await submitPayment({ data: { enrollmentId, proofPath, paymentReference: ref } });

      toast.success("Payment completed successfully. Your registration is awaiting admin approval.", {
        description: "Your ticket will be generated and appear here once an admin approves it.",
      });

      setProofFile((s) => ({ ...s, [enrollmentId]: null }));
      setReference((s) => ({ ...s, [enrollmentId]: "" }));
      await reload();
    } catch (e: any) {
      setProofError((s) => ({ ...s, [enrollmentId]: e.message ?? "Something went wrong. Please try again." }));
    } finally {
      setSubmitting((s) => ({ ...s, [enrollmentId]: false }));
    }
  };

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
          // Build a spec-compliant UPI deep link. Common causes of the
          // "Invalid QR / Invalid format" error in GPay/PhonePe/Paytm/BHIM:
          //   - VPA missing or not in name@psp form
          //   - amount not sent as a fixed 2-decimal number (e.g. "100" vs "100.00")
          //   - payee name / note containing reserved URI chars (& = # ? / :)
          //   - QR rendered without the required quiet-zone margin
          const rawUpi = (r.program?.upi_id || "").trim().toLowerCase();
          const validUpi = /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z][a-zA-Z0-9]{1,32}$/.test(rawUpi);
          const upiId = validUpi ? rawUpi : "";
          const cleanText = (s: string) =>
            String(s ?? "")
              .replace(/[&=#?/:%]+/g, " ")     // strip URI-reserved chars
              .replace(/[^a-zA-Z0-9 .-]/g, " ") // keep UPI-app-safe printable set
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 40);
          const payeeName = cleanText(r.program?.bank_account_holder || "Tejas D Dhoke") || "Tejas D Dhoke";
          const payAmountInr = Number(r.amount_inr || 0);
          const note = cleanText(r.program?.name || "Enrollment") || "Enrollment";
          const amount = payAmountInr.toFixed(2);
          const enc = (v: string) => encodeURIComponent(v);
          const upiUrl = upiId
            ? `upi://pay?pa=${upiId}&pn=${enc(payeeName)}&am=${amount}&cu=INR&tn=${enc(note)}`
            : "";
          const verifyUrl = typeof window !== "undefined" && r.ticket_code
            ? `${window.location.origin}/verify?code=${encodeURIComponent(r.ticket_code)}`
            : "";
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl overflow-hidden">
              {r.program?.banner_url && (
                <div className="w-full overflow-hidden bg-muted">
                  <img src={r.program.banner_url} alt={r.program?.name ?? ""} className="w-full h-auto object-contain mx-auto md:max-w-[320px]" loading="lazy" />
                </div>
              )}
              <div className="p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-display text-xl font-bold">{r.program?.name}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {r.program?.event_date && <span>📅 {new Date(r.program.event_date).toDateString()}{r.program?.event_time ? ` · ${r.program.event_time}` : ""}</span>}
                    {r.program?.venue && <span>📍 {r.program.venue}</span>}
                    {r.program?.duration && <span>⏱ {r.program.duration}</span>}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">₹{r.amount_inr.toLocaleString("en-IN")}{r.silver_seat && " · includes Silver Seat"}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.silver_seat && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary">🎥 Silver Seat</span>
                    )}
                  </div>
                </div>
                <StatusPill s={r.status} />
              </div>

              {r.status === "awaiting_payment" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setOpen(open === r.id ? null : r.id)}
                    className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/30 hover:opacity-90">
                    {open === r.id ? "Hide payment details" : "Complete Payment"}
                  </button>
                </div>
              )}
              {r.status === "awaiting_payment" && (
                <div>

                  {open === r.id && (
                    <div className="mt-4 flex flex-col items-center bg-muted/40 rounded-xl p-5">
                      {upiUrl ? (
                        <>
                          <div id={`pay-qr-${r.id}`} className="p-3 bg-white rounded-lg"><QRCodeCanvas value={upiUrl} size={220} level="Q" marginSize={4} bgColor="#ffffff" fgColor="#000000" /></div>
                          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => downloadQrPng(`pay-qr-${r.id}`, `payment-qr-${r.id}.png`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-xs font-medium">
                              <Download size={12} /> Download QR
                            </button>
                            <button
                              type="button"
                              onClick={() => saveQrPng(`pay-qr-${r.id}`, `payment-qr-${r.id}.png`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium">
                              <Save size={12} /> Save QR
                            </button>
                          </div>

                        </>
                      ) : (
                        <p className="text-xs text-destructive text-center max-w-xs">
                          The workshop's UPI ID is missing or invalid. Please contact the admin before paying.
                        </p>
                      )}
                      <div className="mt-3 text-center">
                        <p className="text-xs text-muted-foreground">Scan with any UPI app and pay ₹{payAmountInr.toLocaleString("en-IN")}</p>
                        <p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">Official UPI ID</p>
                        <p className="font-mono text-sm">{upiId || "—"}</p>
                        {r.program?.bank_account_holder && (
                          <>
                            <p className="mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">Account holder</p>
                            <p className="text-sm font-medium">{r.program.bank_account_holder}</p>
                            <p className="mt-2 text-[11px] text-muted-foreground max-w-xs mx-auto">Please verify the recipient name in your UPI app matches the above before paying.</p>
                          </>
                        )}
                      </div>

                      <div className="mt-5 w-full max-w-sm rounded-xl border border-border bg-card p-4 space-y-3">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground text-center">
                          Already paid? Submit proof below
                        </p>

                        <label className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 p-3 cursor-pointer">
                          <Upload size={16} className="text-primary shrink-0" />
                          <span className="flex-1 min-w-0 text-xs text-muted-foreground truncate">
                            {proofFile[r.id]?.name || "Choose payment screenshot (PNG, JPG, WEBP)"}
                          </span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0] ?? null;
                              setProofFile((s) => ({ ...s, [r.id]: f }));
                              setProofError((s) => ({ ...s, [r.id]: "" }));
                            }}
                          />
                        </label>

                        <input
                          type="text"
                          value={reference[r.id] || ""}
                          onChange={(e) => {
                            setReference((s) => ({ ...s, [r.id]: e.target.value }));
                            setProofError((s) => ({ ...s, [r.id]: "" }));
                          }}
                          placeholder="UPI Reference / UTR ID (from your payment app)"
                          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                        />

                        {proofError[r.id] && (
                          <p className="text-xs text-destructive">{proofError[r.id]}</p>
                        )}

                        <button
                          type="button"
                          disabled={!!submitting[r.id]}
                          onClick={() => submitProof(r.id)}
                          className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium disabled:opacity-60">
                          {submitting[r.id] ? (
                            <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                          ) : (
                            "I have completed the payment"
                          )}
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
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-primary">
                        <Ticket size={16} /><span className="text-xs uppercase tracking-widest font-semibold">Ticket · Confirmed</span>
                      </div>
                      <p className="mt-2 font-mono text-lg break-all">{r.ticket_code}</p>
                      {(() => {
                        const ws = getSelectedWorkshopNames(r);
                        if (!ws) return null;
                        return <p className="mt-1 text-sm text-foreground font-medium">{ws}</p>;
                      })()}
                      <p className="text-xs text-muted-foreground">Show this at the studio on your first day.</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 w-full sm:w-auto shrink-0">
                      <div id={`ticket-qr-${r.id}`} className="bg-white p-2 rounded inline-block">
                        <QRCodeCanvas
                          value={verifyUrl || r.ticket_code || ""}
                          size={132}
                          level="Q"
                          marginSize={4}
                          bgColor="#ffffff"
                          fgColor="#000000"
                          style={{ display: "block", maxWidth: "100%", height: "auto" }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => downloadQrPng(`ticket-qr-${r.id}`, `ticket-${r.ticket_code}.png`)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-[11px] font-medium">
                        <Download size={11} /> Download
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {r.status === "rejected" && (
                <p className="mt-4 text-sm text-destructive">Payment couldn't be verified. Please contact us.</p>
              )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <FeedbackForm />
    </div>
  );
}

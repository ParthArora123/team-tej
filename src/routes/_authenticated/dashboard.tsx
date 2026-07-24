import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Clock, X as XIcon, Ticket, LogOut, Shield, Download } from "lucide-react";

// Minimal typing for the Web Share API (not always present in TS's default
// lib.dom, and only partially supported across browsers).
type ShareCapableNavigator = Navigator & {
  canShare?: (data: { files: File[] }) => boolean;
  share?: (data: { files: File[]; title?: string }) => Promise<void>;
};

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob((blob) => resolve(blob), "image/png");
      return;
    }
    // Fallback for the rare browser without canvas.toBlob support: decode
    // the base64 data-URL into real binary bytes ourselves rather than
    // handing the raw data-URL string to the anchor (that raw-string
    // approach is what produces corrupted/unsupported files).
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const byteString = atob(dataUrl.split(",")[1]);
      const bytes = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
      resolve(new Blob([bytes], { type: "image/png" }));
    } catch {
      resolve(null);
    }
  });
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after the browser has had a chance to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function shareOrDownloadBlob(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: "image/png" });
  const nav = typeof navigator !== "undefined" ? (navigator as ShareCapableNavigator) : undefined;

  // On phones, the browser's own "download" via <a download> is what causes
  // the "This format is not supported" error: iOS Safari and most in-app
  // webviews (WhatsApp/Instagram browser, some Android browsers) either
  // ignore the download attribute or mishandle the payload, saving a
  // corrupted/mistyped file instead of a real PNG. The native Share sheet
  // receives an actual `image/png` File object and lets the OS save it
  // straight into Photos/Gallery correctly — so we prefer it when available.
  if (nav?.share && nav?.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: filename });
      return;
    } catch (err) {
      // User cancelled the share sheet — don't fall back to a forced
      // download in that case, just stop.
      if (err instanceof Error && err.name === "AbortError") return;
      // Any other failure: fall through to the direct blob download below.
    }
  }

  triggerBlobDownload(blob, filename);
}

async function downloadQrPng(containerId: string, filename: string, size = 720) {
  const safeFilename = filename.toLowerCase().endsWith(".png") ? filename : `${filename}.png`;

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

    // Use canvas.toBlob() to get a real binary PNG with the correct
    // "image/png" MIME type, instead of handing a raw base64 data-URL
    // string to the anchor's href (that was producing corrupted/
    // unrecognized files on save).
    const blob = await canvasToPngBlob(canvas);
    if (!blob) return;
    await shareOrDownloadBlob(blob, safeFilename);
    return;
  }

  const svg = document.querySelector(`#${containerId} svg`) as SVGSVGElement | null;
  if (!svg) return;
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

  const blob = await canvasToPngBlob(canvas);
  if (!blob) return;
  await shareOrDownloadBlob(blob, safeFilename);
}
import { useServerFn } from "@tanstack/react-start";
import { listMyEnrollments, checkIsAdmin } from "@/lib/enrollment.functions";
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

function Dashboard() {
  const navigate = useNavigate();
  const fetchEnrollments = useServerFn(listMyEnrollments);
  const adminCheck = useServerFn(checkIsAdmin);
  const [rows, setRows] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

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
                  <img src={r.program.banner_url} alt={r.program?.name ?? ""} className="w-full h-auto object-contain" loading="lazy" />
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
                  <Link
                    to="/pay/$enrollmentId"
                    params={{ enrollmentId: r.id }}
                    className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/30 hover:opacity-90">
                    Complete Payment
                  </Link>
                  <button onClick={() => setOpen(open === r.id ? null : r.id)}
                    className="px-4 py-2 rounded-lg bg-secondary text-sm">
                    {open === r.id ? "Hide payment QR" : "Show payment QR"}
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
                          <button
                            type="button"
                            onClick={() => downloadQrPng(`pay-qr-${r.id}`, `payment-qr-${r.id}.png`)}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-xs font-medium">
                            <Download size={12} /> Download QR
                          </button>
                          <a
                            href={upiUrl}
                            className="mt-2 text-[11px] text-primary underline underline-offset-2">
                            Or tap here to open in your UPI app
                          </a>
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

                      <Link
                        to="/pay/$enrollmentId"
                        params={{ enrollmentId: r.id }}
                        className="mt-5 w-full max-w-sm text-center px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium">
                        I have completed the payment
                      </Link>
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

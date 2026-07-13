import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload, ArrowLeft, Check, Ticket, Download } from "lucide-react";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { QRCodeCanvas } from "qrcode.react";
import { useServerFn } from "@tanstack/react-start";
import { listMyEnrollments, markPaymentSubmitted } from "@/lib/enrollment.functions";
import { getSiteContent } from "@/lib/site-content.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  validatePaymentProofFile,
  sanitizeFileName,
  type ValidatedPaymentProof,
} from "@/lib/payment-proof-validation";

async function downloadQrPng(containerId: string, filename: string, size = 720) {
  const sourceCanvas = document.querySelector(`#${containerId} canvas`) as HTMLCanvasElement | null;
  if (!sourceCanvas) return;
  const padding = Math.round(size * 0.08);
  const qrSize = size - padding * 2;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sourceCanvas, padding, padding, qrSize, qrSize);
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  a.click();
}

export const Route = createFileRoute("/_authenticated/pay/$enrollmentId")({
  component: PayUpload,
});

function PayUpload() {
  const { enrollmentId } = Route.useParams();
  const navigate = useNavigate();
  const fetchEnrollments = useServerFn(listMyEnrollments);
  const submitPay = useServerFn(markPaymentSubmitted);
  const loadSiteContent = useServerFn(getSiteContent);
  const [enr, setEnr] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [validated, setValidated] = useState<ValidatedPaymentProof | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [err, setErr] = useState("");
  const [validating, setValidating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [confirmed, setConfirmed] = useState<{ ticket: string | null } | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  

  useEffect(() => {
    fetchEnrollments().then((rows: any[]) => {
      setEnr(rows.find((r) => r.id === enrollmentId) ?? null);
    });
    loadSiteContent({ data: { key: "contact" } }).then((v: any) => {
      if (v?.whatsapp) setWhatsapp(String(v.whatsapp));
    }).catch(() => {});
  }, [enrollmentId]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const onPick = async (f: File | null) => {
    setErr("");
    setValidated(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    if (!f) { setFile(null); return; }
    setValidating(true);
    try {
      const v = await validatePaymentProofFile(f);
      setFile(f);
      setValidated(v);
      setPreview(URL.createObjectURL(new Blob([v.bytes as BlobPart], { type: v.mime })));
    } catch (e: any) {
      setFile(null);
      setValidated(null);
      if (inputRef.current) inputRef.current.value = "";
      setErr(e?.message ?? "Please upload a valid payment screenshot.");
    } finally {
      setValidating(false);
    }
  };

  const submit = async () => {
    if (!file || !validated || !enr || busy || validating) return;
    setErr(""); setBusy(true);
    let uploadedPath: string | null = null;
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Please sign in again.");
      const safeName = sanitizeFileName(file.name, validated.ext);
      const path = `${uid}/${enr.id}-${Date.now()}-${validated.sha256.slice(0, 12)}-${safeName}`;
      const uploadBlob = new Blob([validated.bytes as BlobPart], { type: validated.mime });
      const up = await supabase.storage.from("payment-proofs").upload(path, uploadBlob, {
        contentType: validated.mime,
        upsert: false,
      });
      if (up.error) throw new Error(`Upload failed: ${up.error.message}. Please check your connection and try again.`);
      uploadedPath = path;
      const result = await submitPay({ data: { enrollmentId: enr.id, proofPath: path } });
      const ticket = (result as any)?.ticket ?? enr.ticket_code ?? null;
      setConfirmed({ ticket });
      setDone(true);
      // Auto-open WhatsApp addressed to the student's registered number with
      // the confirmation from Tejas D Dhoke — mirrors the wa.me flow used on the
      // Contact page. Falls back to the business number if the student didn't
      // provide a phone.
      const studentNumber = String(enr.phone ?? "").replace(/[^\d]/g, "");
      const businessNumber = String(whatsapp ?? "").replace(/[^\d]/g, "");
      const waNumber = studentNumber || businessNumber;
      if (waNumber) {
        const dateStr = enr.program?.event_date ? new Date(enr.program.event_date).toDateString() : "—";
        const timeStr = enr.program?.event_time || "—";
        const venueStr = enr.program?.venue || "—";
        const qrImageUrl = ticket
          ? `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=20&data=${encodeURIComponent(ticket)}`
          : "";
        const message =
          `🎉 Hi ${enr.full_name || "there"},\n\n` +
          `✅ Your payment has been verified.\n` +
          `✅ Your seat has been confirmed.\n\n` +
          `Workshop: ${enr.program?.name || "the workshop"}\n` +
          `Date: ${dateStr}\n` +
          `Time: ${timeStr}\n` +
          `Venue: ${venueStr}\n\n` +
          (ticket ? `🎫 Ticket ID: ${ticket}\n` : "") +
          (qrImageUrl ? `Your Workshop Entry QR Code (tap to view / save the image):\n${qrImageUrl}\n\n` : "") +
          `🔍 Present this QR code to the Workshop Manager at the venue — they will scan it during check-in.\n\n` +
          `Please keep this QR code safe and bring it to the workshop.\n\n` +
          `– Tejas D Dhoke`;
        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      }
    } catch (e: any) {
      // If the DB step failed after upload, clean up so no orphan file lingers.
      if (uploadedPath) {
        await supabase.storage.from("payment-proofs").remove([uploadedPath]).catch(() => {});
      }
      setErr(e?.message ?? "Please upload a valid payment screenshot.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    const ticket = confirmed?.ticket ?? enr?.ticket_code ?? null;
    const verifyUrl = typeof window !== "undefined" && ticket
      ? `${window.location.origin}/verify?code=${encodeURIComponent(ticket)}`
      : "";
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 max-w-xl mx-auto">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <Check className="text-emerald-500" size={28} />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold">Registration Successful</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your payment has been verified and your workshop registration is confirmed.
          </p>
        </div>

        {enr && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-widest text-primary">Workshop Details</p>
            <p className="mt-1 font-display text-xl font-bold">{enr.program?.name}</p>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              {enr.program?.event_date && <p>📅 {new Date(enr.program.event_date).toDateString()}{enr.program?.event_time ? ` · ${enr.program.event_time}` : ""}</p>}
              {enr.program?.venue && <p>📍 {enr.program.venue}</p>}
              {enr.program?.duration && <p>⏱ {enr.program.duration}</p>}
              <p>💰 ₹{(enr.amount_inr ?? 0).toLocaleString("en-IN")}{enr.silver_seat ? " · includes Silver Seat" : ""}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Registration / Ticket ID</p>
              <p className="mt-1 font-mono text-lg flex items-center gap-2">
                <Ticket size={18} className="text-primary" /> {ticket || enr.id}
              </p>
            </div>
          </div>
        )}

        {ticket && verifyUrl && (
          <div className="mt-6 rounded-2xl border border-dashed border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-5">
            <p className="text-xs uppercase tracking-widest text-primary text-center">Generated QR Code</p>
            <div className="mt-4 flex flex-col items-center justify-center gap-3">
              <div id="ticket-qr-success" className="bg-white p-3 rounded-lg flex items-center justify-center w-full max-w-[220px]">
                <QRCodeCanvas value={verifyUrl} size={200} level="Q" marginSize={4} bgColor="#ffffff" fgColor="#000000" className="w-full h-auto" />
              </div>
              <button
                type="button"
                onClick={() => downloadQrPng("ticket-qr-success", `ticket-${ticket}.png`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-xs font-medium">
                <Download size={12} /> Download QR
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <a
            href={(() => {
              const studentNumber = String(enr?.phone ?? "").replace(/[^\d]/g, "");
              const businessNumber = String(whatsapp ?? "").replace(/[^\d]/g, "");
              const waNumber = studentNumber || businessNumber;
              if (!waNumber || !enr) return undefined;
              const dateStr = enr.program?.event_date ? new Date(enr.program.event_date).toDateString() : "—";
              const timeStr = enr.program?.event_time || "—";
              const venueStr = enr.program?.venue || "—";
              const message =
                `🎉 Hi ${enr.full_name || "there"},\n\n` +
                `✅ Your payment has been verified.\n` +
                `✅ Your seat has been confirmed.\n\n` +
                `Workshop: ${enr.program?.name || "the workshop"}\n` +
                `Date: ${dateStr}\n` +
                `Time: ${timeStr}\n` +
                `Venue: ${venueStr}\n\n` +
                (verifyUrl ? `🎫 This QR code is your workshop entry pass:\n${verifyUrl}\n\n` : "") +
                `🔍 This QR code will be scanned by the Workshop Manager at the venue during check-in.\n\n` +
                `Please keep this QR code safe and present it at the workshop.\n\n` +
                `– Tejas D Dhoke`;
              return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
            })()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium inline-flex items-center justify-center gap-2">
            <WhatsAppIcon size={16} /> I Have Completed My Payment
          </a>
          <Link to="/dashboard" className="w-full text-center px-5 py-2.5 rounded-lg border border-border text-sm hover:bg-muted transition">
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const canSubmit = !!file && !!validated && !validating && !busy;

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 max-w-xl mx-auto">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Back to dashboard
      </Link>
      <h1 className="font-display text-3xl font-bold mt-4">Upload payment screenshot</h1>
      {enr && (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            {enr.program?.name} · ₹{(enr.amount_inr ?? 0).toLocaleString("en-IN")}
          </p>
          {(enr.program?.upi_id || enr.program?.bank_account_holder) && (
            <div className="mt-4 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Paid to</p>
              {enr.program?.upi_id && <p className="font-mono">{enr.program.upi_id}</p>}
              {enr.program?.bank_account_holder && (
                <p className="mt-0.5 font-medium">{enr.program.bank_account_holder}</p>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground">The screenshot must show this exact UPI ID and account holder name, otherwise it will be rejected.</p>
            </div>
          )}
        </>
      )}

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">
          Payment screenshot (.jpg, .jpeg, .png, .webp — max 8 MB)
        </label>
        <div className="mt-3 flex items-center gap-2 text-sm font-medium text-primary">
          <Upload size={16} /> {file ? "Change screenshot" : "Choose screenshot"}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,.jpg,.jpeg,.png,.webp"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          disabled={busy}
          className="mt-2 block w-full cursor-pointer rounded-md border border-border bg-background text-sm text-foreground file:mr-3 file:cursor-pointer file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground disabled:opacity-60"
        />
        {validating && <p className="mt-2 text-xs text-muted-foreground">Checking your screenshot…</p>}
        {file && !validating && <p className="mt-2 text-xs text-foreground truncate">{file.name}</p>}
        {preview && (
          <img src={preview} alt="Payment proof preview" className="mt-4 max-h-72 rounded-md border border-border mx-auto" />
        )}
        {!file && !err && !validating && (
          <p className="mt-3 text-xs text-muted-foreground">
            Please upload your payment confirmation screenshot to continue.
          </p>
        )}
        {err && <p className="mt-3 text-sm text-destructive whitespace-pre-line">{err}</p>}

        <button
          disabled={!canSubmit}
          onClick={submit}
          className="mt-5 w-full px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
          <WhatsAppIcon size={16} />
          {busy ? "Uploading & verifying…" : validating ? "Validating…" : "I Have Completed the Payment"}
        </button>
        <p className="mt-3 text-[11px] text-muted-foreground">
          The screenshot must show a successful payment to the official UPI ID with the correct amount and date. Photos of screens, cropped, or unclear images will be rejected.
        </p>
      </div>
    </div>
  );
}

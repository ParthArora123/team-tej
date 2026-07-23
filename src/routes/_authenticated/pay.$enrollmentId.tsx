import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload, ArrowLeft, Clock } from "lucide-react";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { useServerFn } from "@tanstack/react-start";
import { listMyEnrollments, markPaymentSubmitted } from "@/lib/enrollment.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  validatePaymentProofFile,
  sanitizeFileName,
  type ValidatedPaymentProof,
} from "@/lib/payment-proof-validation";

export const Route = createFileRoute("/_authenticated/pay/$enrollmentId")({
  component: PayUpload,
});

function PayUpload() {
  const { enrollmentId } = Route.useParams();
  const navigate = useNavigate();
  const fetchEnrollments = useServerFn(listMyEnrollments);
  const submitPay = useServerFn(markPaymentSubmitted);
  const [enr, setEnr] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [validated, setValidated] = useState<ValidatedPaymentProof | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [err, setErr] = useState("");
  const [validating, setValidating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEnrollments().then((rows: any[]) => {
      setEnr(rows.find((r) => r.id === enrollmentId) ?? null);
    });
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
    const ref = paymentReference.trim();
    if (ref.length < 6 || ref.length > 64 || !/^[A-Za-z0-9-]+$/.test(ref)) {
      setErr("Please enter a valid UPI/Transaction Reference ID (6–64 letters/digits).");
      return;
    }
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
      await submitPay({ data: { enrollmentId: enr.id, proofPath: path, paymentReference: ref } });
      // No ticket yet and no WhatsApp message here — the registration is now
      // Pending Admin Approval. The confirmation WhatsApp message (with the
      // ticket/QR details) is only sent once an admin approves the payment
      // from the admin dashboard.
      setDone(true);
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

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => { navigate({ to: "/dashboard" }); }, 2500);
    return () => clearTimeout(t);
  }, [done, navigate]);

  if (done) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 max-w-xl mx-auto">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-blue-500/15 flex items-center justify-center">
            <Clock className="text-blue-400" size={28} />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold">Pending Admin Approval</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thanks! Admin will verify your payment and your ticket will appear here once approved.
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
          </div>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">Redirecting to your dashboard…</p>
      </div>
    );
  }


  const canSubmit = !!file && !!validated && !validating && !busy
    && /^[A-Za-z0-9-]{6,64}$/.test(paymentReference.trim());

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 max-w-xl mx-auto">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Back to dashboard
      </Link>
      <h1 className="font-display text-3xl font-bold mt-4">Upload payment screenshot</h1>
      {enr?.status === "rejected" && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Your previous payment couldn't be verified and was rejected. Please double-check your payment and resubmit the screenshot and UPI reference ID below.
        </div>
      )}
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
          UPI / Transaction Reference ID (UTR)
        </label>
        <input
          type="text"
          value={paymentReference}
          onChange={(e) => setPaymentReference(e.target.value)}
          disabled={busy}
          placeholder="e.g. 123456789012"
          maxLength={64}
          className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Enter the UTR / Reference number shown in your UPI app or bank SMS for this payment (6–64 letters/digits).
        </p>

        <label className="mt-5 block text-xs uppercase tracking-wider text-muted-foreground">
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

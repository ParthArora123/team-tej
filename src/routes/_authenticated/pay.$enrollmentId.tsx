import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload, ArrowLeft, MessageCircle, Check, Ticket, Download } from "lucide-react";
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
      await submitPay({ data: { enrollmentId: enr.id, proofPath: path } });
      setDone(true);
      setTimeout(() => navigate({ to: "/dashboard" }), 1600);
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
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 max-w-xl mx-auto text-center">
        <h1 className="font-display text-3xl font-bold">Payment screenshot uploaded</h1>
        <p className="mt-3 text-muted-foreground">
          Your payment is now <strong>Pending Verification</strong>. An admin will review it and your ticket will appear in your dashboard once approved.
        </p>
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
          className="mt-5 w-full px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed">
          {busy ? "Uploading & verifying…" : validating ? "Validating…" : "I Have Completed the Payment"}
        </button>
        <p className="mt-3 text-[11px] text-muted-foreground">
          The screenshot must show a successful payment to the official UPI ID with the correct amount and date. Photos of screens, cropped, or unclear images will be rejected.
        </p>
      </div>
    </div>
  );
}

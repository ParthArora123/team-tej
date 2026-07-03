import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Upload, ArrowLeft } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { listMyEnrollments, markPaymentSubmitted } from "@/lib/enrollment.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/pay/$enrollmentId")({
  component: PayUpload,
});

const ALLOWED_EXT = /\.(jpe?g|png|webp|heic|heif|gif|bmp|tiff?)$/i;

const contentTypeFromExt = (name: string) => {
  const ext = (name.split(".").pop() || "jpg").toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "bmp") return "image/bmp";
  if (ext === "tif" || ext === "tiff") return "image/tiff";
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  return "image/jpeg";
};

function PayUpload() {
  const { enrollmentId } = Route.useParams();
  const navigate = useNavigate();
  const fetchEnrollments = useServerFn(listMyEnrollments);
  const submitPay = useServerFn(markPaymentSubmitted);
  const [enr, setEnr] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetchEnrollments().then((rows: any[]) => {
      setEnr(rows.find((r) => r.id === enrollmentId) ?? null);
    });
  }, [enrollmentId]);

  const onPick = (f: File | null) => {
    setErr("");
    if (!f) { setFile(null); setPreview(""); return; }
    const name = f.name.toLowerCase();
    const okExt = /\.(jpe?g|png|webp)$/.test(name);
    const type = f.type.toLowerCase();
    const okType = !type || ALLOWED.includes(type);
    if (!okExt || !okType) {
      setErr("Only .jpg, .jpeg, .png, or .webp images are allowed.");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setErr("Screenshot must be under 8 MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!file || !enr) return;
    setErr(""); setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Please sign in again.");
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${uid}/${enr.id}-${Date.now()}.${ext || "jpg"}`;
      const up = await supabase.storage.from("payment-proofs").upload(path, file, {
        contentType: file.type || contentTypeFromExt(file.name), upsert: false,
      });
      if (up.error) throw up.error;
      await submitPay({ data: { enrollmentId: enr.id, proofPath: path } });
      setDone(true);
      setTimeout(() => navigate({ to: "/dashboard" }), 1600);
    } catch (e: any) {
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
          Payment screenshot (.jpg, .jpeg, .png, .webp)
        </label>
        <div className="mt-3 flex items-center gap-2 text-sm font-medium text-primary">
          <Upload size={16} /> {file ? "Change screenshot" : "Choose screenshot"}
        </div>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          className="mt-2 block w-full cursor-pointer rounded-md border border-border bg-background text-sm text-foreground file:mr-3 file:cursor-pointer file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
        />
        {file && <p className="mt-2 text-xs text-foreground truncate">{file.name}</p>}
        {preview && (
          <img src={preview} alt="Payment proof preview" className="mt-4 max-h-72 rounded-md border border-border mx-auto" />
        )}
        {!file && !err && (
          <p className="mt-3 text-xs text-muted-foreground">
            Please upload your payment confirmation screenshot to continue.
          </p>
        )}
        {err && <p className="mt-3 text-sm text-destructive whitespace-pre-line">{err}</p>}

        <button
          disabled={busy || !file}
          onClick={submit}
          className="mt-5 w-full px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed">
          {busy ? "Verifying payment…" : "I Have Completed the Payment"}
        </button>
        <p className="mt-3 text-[11px] text-muted-foreground">
          The screenshot must show a successful payment to the official UPI ID with the correct amount and date. Photos of screens, cropped, or unclear images will be rejected.
        </p>
      </div>
    </div>
  );
}

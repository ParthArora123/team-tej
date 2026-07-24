import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeCanvas } from "qrcode.react";
import { Clock, CheckCircle2, XCircle, Upload, ShieldCheck, Ticket, LogOut, Download } from "lucide-react";

function downloadQrCanvas(id: string, filename: string) {
  const canvas = document.getElementById(id) as HTMLCanvasElement | null;
  if (!canvas) return;
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
import {
  listMyEnrollments,
  markPaymentSubmitted,
  checkIsAdmin,
} from "@/lib/enrollment.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  validatePaymentProofFile,
  sanitizeFileName,
  type ValidatedPaymentProof,
} from "@/lib/payment-proof-validation";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: StudentDashboard,
});

function StudentDashboard() {
  const fetchMine = useServerFn(listMyEnrollments);
  const adminCheck = useServerFn(checkIsAdmin);
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[] | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = async () => {
    const [mine, admin] = await Promise.all([fetchMine(), adminCheck()]);
    setRows(mine as any);
    setIsAdmin(!!admin.isAdmin);
  };

  useEffect(() => { load(); }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">My dashboard</p>
          <h1 className="mt-1 font-display text-4xl font-bold">Your registrations</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              <ShieldCheck size={16} /> Admin control room
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/40 text-foreground text-sm font-medium hover:bg-muted transition"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {rows === null && <p className="text-sm text-muted-foreground">Loading…</p>}
        {rows && rows.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">You haven't registered for any workshops yet.</p>
            <Link to="/workshops" className="mt-4 inline-block px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              Explore workshops
            </Link>
          </div>
        )}
        {rows?.map((r) => (
          <EnrollmentCard key={r.id} enr={r} onChange={load} />
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "confirmed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-medium">
        <CheckCircle2 size={12} /> Approved
      </span>
    );
  }
  if (status === "payment_submitted") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-500 text-xs font-medium">
        <Clock size={12} /> Pending admin approval
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/15 text-destructive text-xs font-medium">
        <XCircle size={12} /> Rejected · please resubmit
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-500 text-xs font-medium">
      <Clock size={12} /> Awaiting payment
    </span>
  );
}

function EnrollmentCard({ enr, onChange }: { enr: any; onChange: () => void }) {
  const p = enr.program ?? {};
  const status = enr.status as string;
  const showPaymentForm = status === "awaiting_payment" || status === "rejected";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-display text-xl font-bold">{p.name ?? "Workshop"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Registration ID: <span className="font-mono text-foreground">{enr.id.slice(0, 8).toUpperCase()}</span>
          </p>
        </div>
        <StatusPill status={status} />
      </div>

      <div className="mt-3 text-sm text-muted-foreground space-y-1">
        {p.event_date && (
          <p>📅 {new Date(p.event_date).toDateString()}{p.event_time ? ` · ${p.event_time}` : ""}</p>
        )}
        {p.venue && <p>📍 {p.venue}</p>}
        <p>💰 ₹{(enr.amount_inr ?? 0).toLocaleString("en-IN")}{enr.silver_seat ? " · includes Silver Seat" : ""}</p>
      </div>

      {status === "confirmed" && enr.ticket_code && (
        <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="p-2 bg-white rounded">
            <QRCodeCanvas
              id={`ticket-qr-${enr.id}`}
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/verify?code=${enr.ticket_code}`}
              size={128}
            />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xs uppercase tracking-widest text-emerald-500 flex items-center gap-1.5 justify-center sm:justify-start">
              <Ticket size={12} /> Your ticket
            </p>
            <p className="mt-1 font-mono text-lg font-bold">{enr.ticket_code}</p>
            <p className="text-xs text-muted-foreground mt-1">Show this QR at the venue entry.</p>
            <button
              onClick={() => downloadQrCanvas(`ticket-qr-${enr.id}`, `ticket-${enr.ticket_code}.png`)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition"
            >
              <Download size={12} /> Download ticket QR
            </button>
          </div>
        </div>
      )}

      {status === "payment_submitted" && (
        <div className="mt-5 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 text-sm">
          Your payment is being verified by our admin team. Your ticket will appear here once approved.
        </div>
      )}

      {showPaymentForm && <PaymentBlock enr={enr} onDone={onChange} />}
    </div>
  );
}

function PaymentBlock({ enr, onDone }: { enr: any; onDone: () => void }) {
  const p = enr.program ?? {};
  const submitPay = useServerFn(markPaymentSubmitted);
  const [file, setFile] = useState<File | null>(null);
  const [validated, setValidated] = useState<ValidatedPaymentProof | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [paymentReference, setPaymentReference] = useState("");
  const [err, setErr] = useState("");
  const [validating, setValidating] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const upiValue = useMemo(() => {
    if (!p.upi_id) return "";
    const params = new URLSearchParams({
      pa: p.upi_id,
      pn: p.bank_account_holder || "Team Tej",
      am: String(enr.amount_inr ?? 0),
      cu: "INR",
      tn: `Reg ${enr.id.slice(0, 8).toUpperCase()}`,
    });
    return `upi://pay?${params.toString()}`;
  }, [p.upi_id, p.bank_account_holder, enr.amount_inr, enr.id]);

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
      if (inputRef.current) inputRef.current.value = "";
      setErr(e?.message ?? "Please upload a valid payment screenshot.");
    } finally {
      setValidating(false);
    }
  };

  const canSubmit = !!file && !!validated && !validating && !busy
    && /^[A-Za-z0-9-]{6,64}$/.test(paymentReference.trim());

  const submit = async () => {
    if (!canSubmit || !file || !validated) return;
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
        contentType: validated.mime, upsert: false,
      });
      if (up.error) throw new Error(`Upload failed: ${up.error.message}`);
      uploadedPath = path;
      await submitPay({ data: { enrollmentId: enr.id, proofPath: path, paymentReference: paymentReference.trim() } });
      onDone();
    } catch (e: any) {
      if (uploadedPath) {
        await supabase.storage.from("payment-proofs").remove([uploadedPath]).catch(() => {});
      }
      setErr(e?.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
      {enr.status === "rejected" && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Your previous payment couldn't be verified. Please double-check and resubmit below.
        </div>
      )}
      <p className="text-xs uppercase tracking-widest text-primary">Step 1 · Pay via UPI</p>

      <div className="mt-3 flex flex-col sm:flex-row gap-4 items-center">
        {p.upi_id && upiValue ? (
          <div className="p-2 bg-white rounded shrink-0">
            <QRCodeCanvas value={upiValue} size={148} />
          </div>
        ) : (
          <div className="p-4 rounded bg-background border border-border text-xs text-muted-foreground">
            Payment QR unavailable — please contact admin.
          </div>
        )}
        <div className="text-sm min-w-0">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Amount</p>
          <p className="font-display text-2xl font-bold">₹{(enr.amount_inr ?? 0).toLocaleString("en-IN")}</p>
          {p.upi_id && (
            <>
              <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">UPI ID</p>
              <p className="font-mono text-sm break-all">{p.upi_id}</p>
            </>
          )}
          {p.bank_account_holder && (
            <p className="mt-1 text-xs text-muted-foreground">Paid to: {p.bank_account_holder}</p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">
            Scan the QR with any UPI app, or send to the UPI ID above. Keep the payment screenshot ready.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs uppercase tracking-widest text-primary">Step 2 · Submit payment proof</p>

        <label className="mt-3 block text-xs uppercase tracking-wider text-muted-foreground">
          UPI / Transaction Reference ID (UTR) *
        </label>
        <input
          type="text"
          value={paymentReference}
          onChange={(e) => setPaymentReference(e.target.value)}
          disabled={busy}
          placeholder="e.g. 123456789012"
          maxLength={64}
          required
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          6–64 letters/digits. Must be unique — cannot be reused across registrations.
        </p>

        <label className="mt-4 block text-xs uppercase tracking-wider text-muted-foreground">
          Payment screenshot * (.jpg, .png, .webp — max 8 MB)
        </label>
        <div className="mt-2 flex items-center gap-2 text-sm font-medium text-primary">
          <Upload size={14} /> {file ? "Change screenshot" : "Choose screenshot"}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,.jpg,.jpeg,.png,.webp"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          disabled={busy}
          className="mt-2 block w-full cursor-pointer rounded-md border border-border bg-background text-sm file:mr-3 file:cursor-pointer file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
        />
        {validating && <p className="mt-2 text-xs text-muted-foreground">Checking your screenshot…</p>}
        {preview && (
          <img src={preview} alt="Payment proof preview" className="mt-3 max-h-56 rounded border border-border" />
        )}
        {err && <p className="mt-3 text-sm text-destructive whitespace-pre-line">{err}</p>}

        <button
          disabled={!canSubmit}
          onClick={submit}
          className="mt-5 w-full px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed">
          {busy ? "Submitting…" : "I Have Completed Payment"}
        </button>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Both fields are required. Your registration will be marked Pending Admin Approval, and a WhatsApp confirmation will be sent to your mobile number once admin approves.
        </p>
      </div>
    </div>
  );
}

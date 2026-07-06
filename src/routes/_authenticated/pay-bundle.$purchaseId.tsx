import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Upload, ArrowLeft, Sparkles, Download } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getBundlePurchase, submitBundlePayment } from "@/lib/bundles.functions";
import { supabase } from "@/integrations/supabase/client";

async function downloadQrPng(containerId: string, filename: string, size = 720) {
  const sourceCanvas = document.querySelector(`#${containerId} canvas`) as HTMLCanvasElement | null;
  if (!sourceCanvas) return;
  const padding = Math.round(size * 0.08);
  const qrSize = size - padding * 2;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sourceCanvas, padding, padding, qrSize, qrSize);
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  a.click();
}

export const Route = createFileRoute("/_authenticated/pay-bundle/$purchaseId")({ component: PayBundle });

function PayBundle() {
  const { purchaseId } = Route.useParams();
  const navigate = useNavigate();
  const fetchPurchase = useServerFn(getBundlePurchase);
  const submitPay = useServerFn(submitBundlePayment);
  const [state, setState] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const reload = () => fetchPurchase({ data: { id: purchaseId } }).then(setState).catch((e) => setErr(e.message));
  useEffect(() => { reload(); }, [purchaseId]);

  const onPick = (f: File | null) => {
    setErr("");
    if (!f) { setFile(null); setPreview(""); return; }
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) { setErr("PNG, JPG or WEBP only."); return; }
    if (f.size > 8 * 1024 * 1024) { setErr("Max 8 MB."); return; }
    setFile(f); setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!file || !state) return;
    setErr(""); setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Please sign in again.");
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${uid}/bundle-${purchaseId}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("payment-proofs").upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw up.error;
      await submitPay({ data: { purchaseId, proofPath: path } });
      setDone(true);
      setTimeout(() => navigate({ to: "/dashboard" }), 1600);
    } catch (e: any) {
      setErr(e?.message ?? "Please upload a valid payment screenshot.");
    } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 max-w-xl mx-auto text-center">
        <h1 className="font-display text-3xl font-bold">Payment verified</h1>
        <p className="mt-3 text-muted-foreground">Your tickets are ready in the dashboard.</p>
      </div>
    );
  }

  if (!state) return <div className="min-h-screen pt-24 px-6 max-w-xl mx-auto text-sm text-muted-foreground">Loading…</div>;
  const { purchase, enrollments } = state;
  const first = enrollments[0]?.program;
  const upiId = (first?.upi_id || "").trim().toLowerCase();
  const validUpi = /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z][a-zA-Z0-9]{1,32}$/.test(upiId);
  const clean = (s: string) => String(s ?? "").replace(/[&=#?/:%]+/g, " ").replace(/[^a-zA-Z0-9 .-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
  const payee = clean(first?.bank_account_holder || "Tejas D Dhoke") || "Tejas D Dhoke";
  const note = `Bundle ${enrollments.length} workshops`;
  const amount = Number(purchase.final_amount_inr).toFixed(2);
  const upiUrl = validUpi ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payee)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}` : "";

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 lg:px-10 max-w-3xl mx-auto">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Back to dashboard
      </Link>
      <h1 className="font-display text-3xl font-bold mt-3">Pay for your bundle</h1>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-widest text-primary flex items-center gap-1"><Sparkles size={12}/> {enrollments.length} workshops</p>
        <div className="mt-2 space-y-1 text-sm">
          {enrollments.map((e: any) => (
            <div key={e.id} className="flex justify-between border-b border-border last:border-0 py-1.5">
              <span>{e.program?.name}</span>
              <span className="text-muted-foreground">₹{e.amount_inr.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Original</span><span className={purchase.discount_amount_inr > 0 ? "line-through" : ""}>₹{purchase.original_amount_inr.toLocaleString("en-IN")}</span></div>
          {purchase.discount_amount_inr > 0 && (
            <div className="flex justify-between text-primary"><span>Bundle discount{purchase.bundle_name ? ` (${purchase.bundle_name})` : ""}</span><span>− ₹{purchase.discount_amount_inr.toLocaleString("en-IN")}</span></div>
          )}
          <div className="flex justify-between text-base font-bold pt-2 border-t border-border"><span>Payable</span><span>₹{purchase.final_amount_inr.toLocaleString("en-IN")}</span></div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 flex flex-col items-center">
        {upiUrl ? (
          <>
            <div id={`pay-qr-bundle-${purchaseId}`} className="p-3 bg-white rounded-lg"><QRCodeCanvas value={upiUrl} size={220} level="Q" marginSize={4} bgColor="#ffffff" fgColor="#000000" /></div>
            <button
              type="button"
              onClick={() => downloadQrPng(`pay-qr-bundle-${purchaseId}`, `bundle-payment-qr-${purchaseId}.png`)}
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline">
              <Download size={12} /> Download QR
            </button>
            <a href={upiUrl} className="mt-2 text-[11px] text-primary underline underline-offset-2">Or tap here to open in your UPI app</a>
          </>
        ) : (
          <p className="text-xs text-destructive">UPI ID missing. Contact admin.</p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Pay ₹{purchase.final_amount_inr.toLocaleString("en-IN")} to <span className="font-mono">{upiId || "—"}</span> ({payee})</p>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Upload payment screenshot</label>
        <div className="mt-2 flex items-center gap-2 text-sm font-medium text-primary"><Upload size={16}/> {file ? "Change screenshot" : "Choose screenshot"}</div>
        <input type="file" accept="image/png,image/jpeg,image/webp"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          className="mt-2 block w-full cursor-pointer rounded-md border border-border bg-background text-sm file:mr-3 file:cursor-pointer file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground" />
        {preview && <img src={preview} alt="" className="mt-4 max-h-72 rounded-md border border-border mx-auto" />}
        {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
        <button disabled={busy || !file} onClick={submit}
          className="mt-5 w-full px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium disabled:opacity-60">
          {busy ? "Verifying payment…" : "I Have Completed the Payment"}
        </button>
        <p className="mt-3 text-[11px] text-muted-foreground">The screenshot must show a successful payment of ₹{purchase.final_amount_inr.toLocaleString("en-IN")} to the official UPI ID.</p>
      </div>
    </div>
  );
}

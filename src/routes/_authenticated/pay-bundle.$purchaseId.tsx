import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Upload, ArrowLeft, Sparkles, Download, Check, Ticket } from "lucide-react";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { useServerFn } from "@tanstack/react-start";
import { getBundlePurchase, submitBundlePayment } from "@/lib/bundles.functions";
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
  const loadSiteContent = useServerFn(getSiteContent);
  const [state, setState] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [validated, setValidated] = useState<ValidatedPaymentProof | null>(null);
  const [preview, setPreview] = useState("");
  const [err, setErr] = useState("");
  const [validating, setValidating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [confirmedTickets, setConfirmedTickets] = useState<string[]>([]);
  const [whatsapp, setWhatsapp] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  

  const reload = () => fetchPurchase({ data: { id: purchaseId } }).then(setState).catch((e) => setErr(e.message));
  useEffect(() => { reload(); }, [purchaseId]);
  useEffect(() => {
    loadSiteContent({ data: { key: "contact" } }).then((v: any) => {
      if (v?.whatsapp) setWhatsapp(String(v.whatsapp));
    }).catch(() => {});
  }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const onPick = async (f: File | null) => {
    setErr(""); setValidated(null);
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
      setFile(null); setValidated(null);
      if (inputRef.current) inputRef.current.value = "";
      setErr(e?.message ?? "Please upload a valid payment screenshot.");
    } finally {
      setValidating(false);
    }
  };

  const submit = async () => {
    if (!file || !validated || !state || busy || validating) return;
    setErr(""); setBusy(true);
    let uploadedPath: string | null = null;
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Please sign in again.");
      const safeName = sanitizeFileName(file.name, validated.ext);
      const path = `${uid}/bundle-${purchaseId}-${Date.now()}-${validated.sha256.slice(0, 12)}-${safeName}`;
      const uploadBlob = new Blob([validated.bytes as BlobPart], { type: validated.mime });
      const up = await supabase.storage.from("payment-proofs").upload(path, uploadBlob, { contentType: validated.mime, upsert: false });
      if (up.error) throw new Error(`Upload failed: ${up.error.message}. Please check your connection and try again.`);
      uploadedPath = path;
      await submitPay({ data: { purchaseId, proofPath: path } });
      // Refetch to get the freshly generated ticket codes for the success page.
      const updated = await fetchPurchase({ data: { id: purchaseId } });
      setState(updated);
      const tickets = (updated?.enrollments ?? []).map((e: any) => e.ticket_code).filter(Boolean);
      setConfirmedTickets(tickets);
      setDone(true);
      // Auto-open WhatsApp addressed to the student's registered number with
      // the confirmation from Tejas D Dhoke — mirrors the wa.me flow used on the
      // Contact page. Falls back to the business number if the student didn't
      // provide a phone.
      const studentNumber = String(updated?.purchase?.phone ?? "").replace(/[^\d]/g, "");
      const businessNumber = String(whatsapp ?? "").replace(/[^\d]/g, "");
      const waNumber = studentNumber || businessNumber;
      if (waNumber) {
        const participant = updated?.purchase?.full_name || "there";
        const workshops = (updated?.enrollments ?? []).map((e: any) => e.program?.name).filter(Boolean).join(", ") || "the workshops";
        const ids = tickets.length ? tickets.join(", ") : purchaseId;
        const first = updated?.enrollments?.[0]?.program;
        const dateStr = first?.event_date ? new Date(first.event_date).toDateString() : "—";
        const timeStr = first?.event_time || "—";
        const venueStr = first?.venue || "—";
        const qrLines = tickets
          .map(
            (t: string) =>
              `• ${t}\n  https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=20&data=${encodeURIComponent(t)}`,
          )
          .join("\n");
        const message =
          `🎉 Hi ${participant},\n\n` +
          `✅ Your payment has been verified.\n` +
          `✅ Your seats have been confirmed.\n\n` +
          `Workshops: ${workshops}\n` +
          `Date: ${dateStr}\n` +
          `Time: ${timeStr}\n` +
          `Venue: ${venueStr}\n\n` +
          (qrLines ? `🎫 Your Workshop Entry QR Codes (tap each link to view / save the image):\n${qrLines}\n\n` : "") +
          `🔍 Present these QR codes to the Workshop Manager at the venue — they will scan them during check-in.\n\n` +
          `Please keep your QR code(s) safe and bring them to the workshop.\n\n` +
          `– Tejas D Dhoke`;
        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      }
    } catch (e: any) {
      if (uploadedPath) {
        await supabase.storage.from("payment-proofs").remove([uploadedPath]).catch(() => {});
      }
      setErr(e?.message ?? "Please upload a valid payment screenshot.");
    } finally { setBusy(false); }
  };

  if (done) {
    const { purchase, enrollments } = state;
    const tickets = confirmedTickets.length
      ? confirmedTickets
      : (enrollments ?? []).map((e: any) => e.ticket_code).filter(Boolean);
    const studentNumber = String(purchase?.phone ?? "").replace(/[^\d]/g, "");
    const businessNumber = String(whatsapp ?? "").replace(/[^\d]/g, "");
    const waNumber = studentNumber || businessNumber;
    const participant = purchase?.full_name || "there";
    const workshops = (enrollments ?? []).map((e: any) => e.program?.name).filter(Boolean).join(", ") || "the workshops";
    const ids = tickets.length ? tickets.join(", ") : purchaseId;
    const firstProgram = enrollments?.[0]?.program;
    const dateStr = firstProgram?.event_date ? new Date(firstProgram.event_date).toDateString() : "—";
    const timeStr = firstProgram?.event_time || "—";
    const venueStr = firstProgram?.venue || "—";
    const verifyLines = typeof window !== "undefined"
      ? tickets.map((t: string) => `${window.location.origin}/verify?code=${encodeURIComponent(t)}`).join("\n")
      : "";
    const waMessage =
      `🎉 Hi ${participant},\n\n` +
      `✅ Your payment has been verified.\n` +
      `✅ Your seats have been confirmed.\n\n` +
      `Workshops: ${workshops}\n` +
      `Date: ${dateStr}\n` +
      `Time: ${timeStr}\n` +
      `Venue: ${venueStr}\n\n` +
      (verifyLines ? `🎫 These QR codes are your workshop entry passes:\n${verifyLines}\n\n` : "") +
      `🔍 These QR codes will be scanned by the Workshop Manager at the venue during check-in.\n\n` +
      `Please keep your QR code(s) safe and present them at the workshop.\n\n` +
      `– Tejas D Dhoke`;
    const waHref = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}` : undefined;
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 lg:px-10 max-w-3xl mx-auto">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <Check className="text-emerald-500" size={28} />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold">Registration Successful</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your payment has been verified and your workshop registrations are confirmed.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-widest text-primary">Bundle Details</p>
          <p className="mt-1 font-display text-xl font-bold">{purchase?.bundle_name || `${enrollments?.length || 0} Workshops`}</p>
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            {enrollments?.map((e: any) => (
              <p key={e.id}>• {e.program?.name} {e.ticket_code ? `· ${e.ticket_code}` : ""}</p>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total paid</span>
            <span className="font-bold">₹{purchase?.final_amount_inr?.toLocaleString("en-IN")}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Registration / Ticket ID(s)</p>
            <p className="mt-1 font-mono text-base flex items-start gap-2">
              <Ticket size={18} className="text-primary shrink-0 mt-0.5" /> {ids}
            </p>
          </div>
        </div>

        {tickets.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {tickets.map((ticket: string, idx: number) => {
              const verifyUrl = typeof window !== "undefined"
                ? `${window.location.origin}/verify?code=${encodeURIComponent(ticket)}`
                : "";
              const qrId = `ticket-qr-success-${idx}`;
              return (
              <div key={ticket} className="rounded-2xl border border-dashed border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-5 text-center flex flex-col items-center justify-center">
                <p className="text-xs uppercase tracking-widest text-primary">Ticket {idx + 1}</p>
                <p className="mt-1 font-mono text-sm">{ticket}</p>
                <div id={qrId} className="mt-3 bg-white p-3 rounded-lg flex items-center justify-center w-full max-w-[180px]">
                  <QRCodeCanvas value={verifyUrl} size={160} level="Q" marginSize={4} bgColor="#ffffff" fgColor="#000000" className="w-full h-auto" />
                </div>
                <button
                  type="button"
                  onClick={() => downloadQrPng(qrId, `ticket-${ticket}.png`)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-xs font-medium">
                  <Download size={12} /> Download QR
                </button>
              </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <a
            href={waHref}
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
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Upload payment screenshot (.jpg, .jpeg, .png, .webp — max 8 MB)</label>
        <div className="mt-2 flex items-center gap-2 text-sm font-medium text-primary"><Upload size={16}/> {file ? "Change screenshot" : "Choose screenshot"}</div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,.jpg,.jpeg,.png,.webp"
          disabled={busy}
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          className="mt-2 block w-full cursor-pointer rounded-md border border-border bg-background text-sm file:mr-3 file:cursor-pointer file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground disabled:opacity-60" />
        {validating && <p className="mt-2 text-xs text-muted-foreground">Checking your screenshot…</p>}
        {preview && <img src={preview} alt="" className="mt-4 max-h-72 rounded-md border border-border mx-auto" />}
        {err && <p className="mt-3 text-sm text-destructive whitespace-pre-line">{err}</p>}
        <button disabled={busy || validating || !file || !validated} onClick={submit}
          className="mt-5 w-full px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
          <WhatsAppIcon size={16} />
          {busy ? "Uploading & verifying…" : validating ? "Validating…" : "I Have Completed the Payment"}
        </button>
        <p className="mt-3 text-[11px] text-muted-foreground">The screenshot must show a successful payment of ₹{purchase.final_amount_inr.toLocaleString("en-IN")} to the official UPI ID.</p>
      </div>
    </div>
  );
}

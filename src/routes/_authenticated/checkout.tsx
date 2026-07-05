import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/workshop-cart";
import { computeCartPricing, createBundleCheckout, type PricingResult } from "@/lib/bundles.functions";

export const Route = createFileRoute("/_authenticated/checkout")({ component: CheckoutPage });

const initialForm = {
  fullName: "", email: "", phone: "", gender: "Female",
  address: "", city: "", state: "", emergencyContact: "",
};

function CheckoutPage() {
  const { items, remove, toggleSilver, clear } = useCart();
  const navigate = useNavigate();
  const compute = useServerFn(computeCartPricing);
  const checkout = useServerFn(createBundleCheckout);

  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [f, setF] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ purchaseId: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setF((s) => ({ ...s, email: data.user!.email! }));
    });
  }, []);

  useEffect(() => {
    if (items.length === 0) { setPricing(null); return; }
    compute({ data: { selections: items } }).then(setPricing).catch((e) => setErr(e.message ?? "Pricing failed"));
  }, [JSON.stringify(items)]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const res = await checkout({ data: {
        selections: items,
        fullName: f.fullName, email: f.email, phone: f.phone, gender: f.gender,
        address: f.address, city: f.city, state: f.state, emergencyContact: f.emergencyContact,
      }});
      clear();
      setDone({ purchaseId: res.purchaseId });
    } catch (e: any) {
      setErr(e.message ?? "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 max-w-xl mx-auto text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center">
          <Check className="text-primary" size={28} />
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold">Registered</h1>
        <p className="mt-2 text-muted-foreground">Complete a single UPI payment for all your selected workshops on the next screen.</p>
        <button onClick={() => navigate({ to: "/pay-bundle/$purchaseId", params: { purchaseId: done.purchaseId } })}
          className="mt-6 w-full px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium">
          Continue to payment
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 max-w-2xl mx-auto text-center">
        <h1 className="font-display text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Add at least one workshop to check out. Add 2 or more to unlock bundle offers.</p>
        <Link to="/workshops" className="mt-6 inline-block px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm">Browse workshops</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 lg:px-10 max-w-5xl mx-auto">
      <Link to="/workshops" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Continue shopping
      </Link>
      <h1 className="font-display text-4xl font-bold mt-2">Checkout</h1>

      <div className="mt-8 grid lg:grid-cols-[1fr,360px] gap-8">
        <form onSubmit={submit} className="space-y-3 min-w-0">
          <h2 className="font-display text-lg font-bold">Your details</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full name" v={f.fullName} on={(v) => setF({...f, fullName: v})} span2 />
            <Field label="Email" type="email" v={f.email} on={(v) => setF({...f, email: v})} />
            <Field label="Mobile" v={f.phone} on={(v) => setF({...f, phone: v})} />
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Gender</span>
              <select value={f.gender} onChange={(e) => setF({...f, gender: e.target.value})}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm">
                <option>Female</option><option>Male</option><option>Other</option>
              </select>
            </label>
            <Field label="Address" v={f.address} on={(v) => setF({...f, address: v})} span2 />
            <Field label="City" v={f.city} on={(v) => setF({...f, city: v})} />
            <Field label="State" v={f.state} on={(v) => setF({...f, state: v})} />
            <Field label="Emergency contact" v={f.emergencyContact} on={(v) => setF({...f, emergencyContact: v})} span2 />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button disabled={busy || !pricing} type="submit"
            className="mt-2 w-full px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50">
            {busy ? "Submitting…" : `Register & pay ₹${pricing?.finalAmount.toLocaleString("en-IN") ?? "…"}`}
          </button>
        </form>

        <aside className="bg-card border border-border rounded-2xl p-5 h-fit lg:sticky lg:top-24">
          <p className="font-display font-bold text-lg">Order summary</p>
          <div className="mt-3 space-y-3">
            {pricing?.items.map((it) => (
              <div key={it.programId} className="text-sm border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{it.name}</span>
                  <button type="button" onClick={() => remove(it.programId)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>Base ₹{it.basePrice.toLocaleString("en-IN")}{it.silverAddon ? ` + silver ₹${it.silverAddon.toLocaleString("en-IN")}` : ""}</span>
                  <span>₹{it.itemTotal.toLocaleString("en-IN")}</span>
                </div>
                <label className="mt-1 flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={it.silverSeat} onChange={() => toggleSilver(it.programId)} />
                  <Sparkles size={12} className="text-primary" /> Silver seat add-on
                </label>
              </div>
            ))}
          </div>
          {pricing && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Original total</span>
                <span className={pricing.discountAmount > 0 ? "line-through text-muted-foreground" : ""}>₹{pricing.originalAmount.toLocaleString("en-IN")}</span>
              </div>
              {pricing.bundle && (
                <>
                  <div className="rounded-lg bg-primary/10 border border-primary/30 p-2.5 text-xs">
                    <p className="font-semibold text-primary flex items-center gap-1"><Sparkles size={12}/> Bundle Offer Applied</p>
                    <p className="mt-0.5 text-muted-foreground">Register for {items.length} workshops and save ₹{pricing.discountAmount.toLocaleString("en-IN")} with "{pricing.bundle.name}".</p>
                  </div>
                  <div className="flex justify-between text-sm text-primary">
                    <span>Bundle discount</span>
                    <span>− ₹{pricing.discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                </>
              )}
              {!pricing.bundle && items.length >= 2 && (
                <p className="text-[11px] text-muted-foreground">Selected workshops don't currently qualify for a bundle offer.</p>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                <span>Final payable</span>
                <span>₹{pricing.finalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Field({ label, v, on, type = "text", span2 }: { label: string; v: string; on: (v: string) => void; type?: string; span2?: boolean }) {
  return (
    <label className={`block ${span2 ? "col-span-2" : ""}`}>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={v} onChange={(e) => on(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" required />
    </label>
  );
}

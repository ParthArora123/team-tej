import { useEffect, useState } from "react";
import { ShoppingBag, X, Trash2, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCart } from "@/lib/workshop-cart";
import { computeCartPricing, type PricingResult } from "@/lib/bundles.functions";

export function CartButton() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-full hover:bg-muted"
        aria-label="Open cart"
      >
        <ShoppingBag size={18} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
            {count}
          </span>
        )}
      </button>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, remove, toggleSilver, clear } = useCart();
  const navigate = useNavigate();
  const compute = useServerFn(computeCartPricing);
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || items.length === 0) { setPricing(null); return; }
    setLoading(true);
    compute({ data: { selections: items } })
      .then(setPricing)
      .catch(() => setPricing(null))
      .finally(() => setLoading(false));
  }, [open, JSON.stringify(items)]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] bg-background/70 backdrop-blur-sm" onClick={onClose}>
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-card border-l border-border flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <p className="font-display font-bold text-lg flex items-center gap-2"><ShoppingBag size={18}/> Workshop cart</p>
              <button onClick={onClose} className="p-1.5 rounded hover:bg-muted"><X size={18}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center mt-10">Your cart is empty. Add workshops from the Workshops page to unlock bundle offers.</p>
              )}
              {pricing?.items.map((it) => (
                <div key={it.programId} className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{it.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">₹{it.basePrice.toLocaleString("en-IN")}{it.silverAddon ? ` + ₹${it.silverAddon.toLocaleString("en-IN")} silver` : ""}</p>
                    </div>
                    <button onClick={() => remove(it.programId)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={14}/></button>
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={it.silverSeat} onChange={() => toggleSilver(it.programId)} />
                    <Sparkles size={12} className="text-primary" /> Silver seat add-on
                  </label>
                </div>
              ))}
              {loading && <p className="text-xs text-muted-foreground text-center">Calculating…</p>}
            </div>

            {items.length > 0 && pricing && (
              <div className="border-t border-border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className={pricing.discountAmount > 0 ? "line-through text-muted-foreground" : ""}>₹{pricing.originalAmount.toLocaleString("en-IN")}</span>
                </div>
                {pricing.bundle && (
                  <>
                    <div className="rounded-lg bg-primary/10 border border-primary/30 p-2.5 text-xs">
                      <p className="font-semibold text-primary flex items-center gap-1"><Sparkles size={12}/> Bundle Offer Applied</p>
                      <p className="mt-0.5 text-muted-foreground">"{pricing.bundle.name}" — save ₹{pricing.discountAmount.toLocaleString("en-IN")}.</p>
                    </div>
                    <div className="flex justify-between text-sm text-primary">
                      <span>Bundle discount</span>
                      <span>− ₹{pricing.discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-base font-bold pt-1 border-t border-border">
                  <span>Total payable</span>
                  <span>₹{pricing.finalAmount.toLocaleString("en-IN")}</span>
                </div>
                <button
                  onClick={() => { onClose(); navigate({ to: "/checkout" }); }}
                  className="mt-2 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                  Checkout · ₹{pricing.finalAmount.toLocaleString("en-IN")}
                </button>
                <button onClick={clear} className="w-full text-xs text-muted-foreground hover:text-destructive py-1">Clear cart</button>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

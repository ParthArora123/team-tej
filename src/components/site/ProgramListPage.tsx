import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useServerFn } from "@tanstack/react-start";
import { cachedCall, invalidateCachedCall } from "@/lib/public-data-cache";
import { CardGridSkeleton } from "@/components/site/Skeletons";
import { listPrograms } from "@/lib/catalog.functions";
import { EnrollDialog, type EnrollClass } from "@/components/site/EnrollDialog";

export function ProgramListPage({ kind, eyebrow, title, blurb }: {
  kind: string; eyebrow: string; title: string; blurb: string;
}) {
  const fetchPrograms = useServerFn(listPrograms);
  const [rows, setRows] = useState<any[]>([]);
  const [sel, setSel] = useState<EnrollClass | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = () =>
      cachedCall(`programs:${kind}`, () => fetchPrograms({ data: { kind } }))
        .then(setRows)
        .catch(() => setRows([]))
        .finally(() => setLoaded(true));
    load();
    // Refocus should show live seat counts, so bypass the cache here.
    const onFocus = () => {
      invalidateCachedCall(`programs:${kind}`);
      load();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [kind]);

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 lg:px-10 max-w-6xl mx-auto">
      <p className="text-xs uppercase tracking-widest text-primary">{eyebrow}</p>
      <h1 className="font-display text-5xl font-bold mt-2">{title}</h1>
      <p className="text-muted-foreground mt-3 max-w-2xl">{blurb}</p>

      {!loaded && rows.length === 0 && (
        <div className="mt-10">
          <CardGridSkeleton count={3} />
        </div>
      )}

      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rows.map((r, i) => {
          const silverPrice = r.silver_seat_price ?? 1000;
          return (
          <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.05 }}
            className="bg-card border border-border rounded-2xl p-6 hover:-translate-y-1 transition">
            <p className="font-display text-2xl font-bold">{r.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{r.duration}</p>
            <p className="mt-3 text-sm text-muted-foreground">{r.description}</p>
            {r.silver_seat_enabled && (
              <div className="mt-4 rounded-lg border border-primary/40 bg-primary/5 p-3">
                <p className="text-xs font-semibold text-primary">🎥 Silver Seat Offer (Additional ₹{silverPrice.toLocaleString("en-IN")})</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  We also have a Silver Seat Offer, where we'll shoot and professionally edit your solo dance video using our professional camera, giving you a high-quality video that you can use for your social media, portfolio, or personal memories.
                </p>
              </div>
            )}
            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="font-display text-2xl">₹{r.price_inr.toLocaleString("en-IN")}</p>
                {r.silver_seat_enabled && (
                  <p className="text-[11px] text-primary mt-0.5">+ ₹{silverPrice.toLocaleString("en-IN")} for Silver Seat</p>
                )}
              </div>
              <button onClick={() => setSel({ id: r.id, name: r.name, price: r.price_inr, duration: r.duration ?? "", silverSeatEnabled: !!r.silver_seat_enabled, silverSeatPrice: silverPrice, allowSingle: r.allow_single !== false, allowBoth: !!r.allow_both, bothPrice: r.both_price ?? null, workshop1Name: r.workshop1_name ?? null, workshop2Name: r.workshop2_name ?? null, eventTime: (r as any).event_time ?? null })}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Enroll</button>
            </div>
          </motion.div>
          );
        })}
        {rows.length === 0 && <p className="text-muted-foreground col-span-full">Programs will be added soon.</p>}
      </div>

      <EnrollDialog klass={sel} onClose={() => setSel(null)} />
    </div>
  );
}

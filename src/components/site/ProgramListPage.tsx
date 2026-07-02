import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useServerFn } from "@tanstack/react-start";
import { listPrograms } from "@/lib/catalog.functions";
import { EnrollDialog, type EnrollClass } from "@/components/site/EnrollDialog";

export function ProgramListPage({ kind, eyebrow, title, blurb }: {
  kind: string; eyebrow: string; title: string; blurb: string;
}) {
  const fetchPrograms = useServerFn(listPrograms);
  const [rows, setRows] = useState<any[]>([]);
  const [sel, setSel] = useState<EnrollClass | null>(null);

  useEffect(() => {
    const load = () => fetchPrograms({ data: { kind } }).then(setRows);
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [kind]);

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 lg:px-10 max-w-6xl mx-auto">
      <p className="text-xs uppercase tracking-widest text-primary">{eyebrow}</p>
      <h1 className="font-display text-5xl font-bold mt-2">{title}</h1>
      <p className="text-muted-foreground mt-3 max-w-2xl">{blurb}</p>

      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rows.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.05 }}
            className="bg-card border border-border rounded-2xl p-6 hover:-translate-y-1 transition">
            <p className="font-display text-2xl font-bold">{r.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{r.duration}</p>
            <p className="mt-3 text-sm text-muted-foreground">{r.description}</p>
            <div className="mt-5 flex items-end justify-between">
              <p className="font-display text-2xl">₹{r.price_inr.toLocaleString("en-IN")}</p>
              <button onClick={() => setSel({ id: r.id, name: r.name, price: r.price_inr, duration: r.duration ?? "" })}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Enroll</button>
            </div>
          </motion.div>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground col-span-full">Programs will be added soon.</p>}
      </div>

      <EnrollDialog klass={sel} onClose={() => setSel(null)} />
    </div>
  );
}

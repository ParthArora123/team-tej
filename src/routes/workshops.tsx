import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Calendar, MapPin, User, Users, Clock } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { listPrograms } from "@/lib/catalog.functions";
import { EnrollDialog, type EnrollClass } from "@/components/site/EnrollDialog";

export const Route = createFileRoute("/workshops")({ component: WorkshopsPage });

function WorkshopsPage() {
  const fetchPrograms = useServerFn(listPrograms);
  const [rows, setRows] = useState<any[]>([]);
  const [sel, setSel] = useState<EnrollClass | null>(null);

  const load = () => fetchPrograms({ data: { kind: "workshop" } }).then(setRows);
  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 lg:px-10 max-w-6xl mx-auto">
      <p className="text-xs uppercase tracking-widest text-primary">Workshops</p>
      <h1 className="font-display text-5xl font-bold mt-2">Register for a workshop</h1>
      <p className="text-muted-foreground mt-3 max-w-2xl">
        Browse upcoming intensives. Register, pay via UPI, and get your ticket after admin verification.
      </p>

      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rows.map((r, i) => {
          const seatsLeft = r.capacity != null ? Math.max(0, r.capacity - (r.seats_taken ?? 0)) : null;
          const full = seatsLeft === 0;
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
              {r.banner_url && (
                <div className="aspect-video overflow-hidden bg-muted">
                  <img src={r.banner_url} alt={r.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col">
                {r.category && <p className="text-[10px] uppercase tracking-widest text-primary">{r.category}</p>}
                <p className="font-display text-2xl font-bold mt-1">{r.name}</p>
                {r.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{r.description}</p>}

                <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  {r.event_date && <p className="flex items-center gap-2"><Calendar size={12}/>{new Date(r.event_date).toDateString()} {r.event_time && `· ${r.event_time}`}</p>}
                  {r.venue && <p className="flex items-center gap-2"><MapPin size={12}/>{r.venue}</p>}
                  {r.instructor && <p className="flex items-center gap-2"><User size={12}/>{r.instructor}</p>}
                  {r.duration && <p className="flex items-center gap-2"><Clock size={12}/>{r.duration}</p>}
                  {seatsLeft != null && <p className="flex items-center gap-2"><Users size={12}/>{seatsLeft} of {r.capacity} seats left</p>}
                </div>

                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <p className="font-display text-2xl">₹{r.price_inr.toLocaleString("en-IN")}</p>
                    {r.silver_seat_enabled && (
                      <p className="text-[11px] text-primary mt-0.5">+ ₹1,000 for Silver Seat</p>
                    )}
                  </div>
                  <button
                    disabled={full}
                    onClick={() => setSel({ id: r.id, name: r.name, price: r.price_inr, duration: r.duration ?? "", silverSeatEnabled: !!r.silver_seat_enabled })}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50">
                    {full ? "Full" : "Register"}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {rows.length === 0 && <p className="text-muted-foreground col-span-full">No workshops published yet — check back soon.</p>}
      </div>

      <EnrollDialog klass={sel} onClose={() => setSel(null)} />
    </div>
  );
}

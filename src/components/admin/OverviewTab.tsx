import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, useInView, useReducedMotion } from "motion/react";
import { adminOverviewAnalytics } from "@/lib/analytics.functions";
import type { OverviewAnalytics } from "@/lib/analytics.server";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Premium glass surface shared by every panel in the overview. */
function Glass({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl ${className}`}
      style={{ boxShadow: "0 24px 60px -30px rgba(0,0,0,.85), inset 0 1px 0 rgba(255,255,255,.08)" }}
    >
      {children}
    </div>
  );
}

function useCount(value: number, active: boolean, reduce: boolean | null) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (reduce) { setN(value); return; }
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 900);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, active, reduce]);
  return n;
}

function Kpi({
  label, value, money, hint, accent,
}: { label: string; value: number; money?: boolean; hint?: string; accent?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const n = useCount(value, inView, reduce);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Glass className="p-5 h-full">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full blur-3xl opacity-40"
          style={{ background: accent ?? "rgba(120,140,255,.45)" }}
        />
        <p className="relative text-[10px] uppercase tracking-[0.18em] text-white/50">{label}</p>
        <p className="relative mt-2 font-display text-3xl font-bold text-white tabular-nums">
          {money ? inr(n) : n.toLocaleString("en-IN")}
        </p>
        {hint && <p className="relative mt-1 text-[11px] text-white/40">{hint}</p>}
      </Glass>
    </motion.div>
  );
}

/** GPU-cheap "3D" column chart: CSS-transformed gradient bars, animate once in view. */
function Bars({
  data, color, money, title, subtitle, empty,
}: {
  data: number[]; color: string; money?: boolean; title: string; subtitle?: string; empty: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const max = Math.max(...data, 1);
  const total = data.reduce((s, v) => s + v, 0);
  const [hover, setHover] = useState<number | null>(null);

  return (
    <Glass className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-[11px] text-white/45">{subtitle}</p>}
        </div>
        <p className="text-sm text-white/70 tabular-nums">{money ? inr(total) : total.toLocaleString("en-IN")}</p>
      </div>

      {total === 0 ? (
        <p className="mt-8 mb-6 text-center text-sm text-white/40">{empty}</p>
      ) : (
        <div
          ref={ref}
          className="mt-6 flex h-52 items-end gap-1.5 sm:gap-2"
          style={{ perspective: 900 }}
        >
          {data.map((v, i) => {
            const prev = i > 0 ? data[i - 1]! : 0;
            const pct = prev > 0 ? Math.round(((v - prev) / prev) * 100) : null;
            const h = (v / max) * 100;
            return (
              <div
                key={i}
                className="group relative flex flex-1 flex-col items-center justify-end h-full"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onTouchStart={() => setHover(i)}
              >
                {hover === i && (
                  <div className="pointer-events-none absolute bottom-full z-20 mb-2 w-max max-w-[10rem] rounded-lg border border-white/15 bg-black/85 px-2.5 py-1.5 text-[11px] text-white shadow-xl backdrop-blur">
                    <p className="font-semibold">{MONTHS[i]}</p>
                    <p className="text-white/75 tabular-nums">{money ? inr(v) : `${v} people`}</p>
                    {pct !== null && v !== prev && (
                      <p className={pct >= 0 ? "text-emerald-300" : "text-rose-300"}>
                        {pct >= 0 ? "+" : ""}{pct}% vs {MONTHS[i - 1]}
                      </p>
                    )}
                  </div>
                )}
                <motion.div
                  initial={{ height: 0 }}
                  animate={inView ? { height: `${Math.max(h, v > 0 ? 4 : 1.5)}%` } : { height: 0 }}
                  transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full rounded-t-md transform-gpu origin-bottom"
                  style={{
                    background: `linear-gradient(180deg, ${color}, color-mix(in oklab, ${color} 35%, transparent))`,
                    boxShadow: `0 0 18px -4px ${color}, inset -3px 0 0 rgba(0,0,0,.25), inset 3px 0 0 rgba(255,255,255,.18)`,
                    transform: "rotateX(6deg)",
                  }}
                />
                <span className="mt-2 text-[9px] uppercase tracking-wide text-white/40">{MONTHS[i]!.slice(0, 1)}</span>
              </div>
            );
          })}
        </div>
      )}
    </Glass>
  );
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#34d399",
  payment_submitted: "#60a5fa",
  awaiting_payment: "#fbbf24",
  rejected: "#fb7185",
};

function Donut({ statuses }: { statuses: OverviewAnalytics["statuses"] }) {
  const total = statuses.reduce((s, x) => s + x.count, 0);
  const [active, setActive] = useState<string | null>(null);

  const gradient = useMemo(() => {
    if (!total) return "conic-gradient(rgba(255,255,255,.08) 0 100%)";
    let acc = 0;
    const stops = statuses.map((s) => {
      const from = (acc / total) * 100;
      acc += s.count;
      const to = (acc / total) * 100;
      const c = STATUS_COLORS[s.status] ?? "#a78bfa";
      return `${c} ${from}% ${to}%`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [statuses, total]);

  const shown = statuses.find((s) => s.status === active) ?? null;

  return (
    <Glass className="p-5">
      <h3 className="font-display text-lg font-semibold text-white">Registration &amp; payment status</h3>
      <p className="text-[11px] text-white/45">Live split of every registration this year</p>

      {total === 0 ? (
        <p className="mt-10 mb-8 text-center text-sm text-white/40">No registrations for the selected year.</p>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <div className="relative shrink-0" style={{ perspective: 800 }}>
            <motion.div
              initial={{ opacity: 0, rotate: -30, scale: 0.9 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="h-40 w-40 rounded-full transform-gpu"
              style={{
                background: gradient,
                transform: "rotateX(52deg)",
                boxShadow: "0 26px 50px -18px rgba(0,0,0,.9)",
                maskImage: "radial-gradient(circle, transparent 52%, #000 53%)",
                WebkitMaskImage: "radial-gradient(circle, transparent 52%, #000 53%)",
              }}
            />
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="font-display text-2xl font-bold text-white tabular-nums">
                  {shown ? shown.count : total}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-white/45">
                  {shown ? shown.label : "Total"}
                </p>
              </div>
            </div>
          </div>

          <ul className="w-full space-y-2">
            {statuses.map((s) => (
              <li key={s.status}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(s.status)}
                  onMouseLeave={() => setActive(null)}
                  onClick={() => setActive((a) => (a === s.status ? null : s.status))}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                    active === s.status ? "border-white/25 bg-white/10" : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <span className="flex items-center gap-2 text-white/80">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: STATUS_COLORS[s.status] ?? "#a78bfa", boxShadow: `0 0 10px ${STATUS_COLORS[s.status] ?? "#a78bfa"}` }}
                    />
                    {s.label}
                  </span>
                  <span className="tabular-nums text-white/60">
                    {s.count} · {Math.round((s.count / total) * 100)}%
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Glass>
  );
}

function WorkshopTable({ rows }: { rows: OverviewAnalytics["workshops"] }) {
  const [sort, setSort] = useState<"revenue" | "registrations" | "footfall">("revenue");
  const sorted = useMemo(() => [...rows].sort((a, b) => b[sort] - a[sort]), [rows, sort]);
  const max = Math.max(...sorted.map((r) => r[sort]), 1);

  return (
    <Glass className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-white">Workshop performance</h3>
          <p className="text-[11px] text-white/45">Compare reach, conversion and revenue</p>
        </div>
        <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
          {(["revenue", "registrations", "footfall"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSort(k)}
              className={`rounded-full px-3 py-1 text-[11px] capitalize transition-colors ${
                sort === k ? "bg-white/15 text-white" : "text-white/50"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-10 mb-8 text-center text-sm text-white/40">No workshops for the selected year.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {sorted.map((r, i) => (
            <motion.li
              key={r.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: Math.min(i * 0.04, 0.4) }}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-white">{r.name}</p>
                <p className="text-sm tabular-nums text-white/70">{inr(r.revenue)}</p>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(r[sort] / max) * 100}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg,#a78bfa,#38bdf8)", boxShadow: "0 0 12px -2px #7dd3fc" }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-white/50 tabular-nums">
                <span>{r.registrations} registrations</span>
                <span>{r.confirmed} confirmed</span>
                <span>{r.footfall} footfall</span>
                {r.eventDate && <span>{new Date(r.eventDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>}
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </Glass>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl border border-white/10 bg-white/[0.05] ${className}`} />;
}

export function OverviewTab() {
  const load = useServerFn(adminOverviewAnalytics);
  const [year, setYear] = useState<number | null>(null);
  const [data, setData] = useState<OverviewAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    load({ data: { year } })
      .then((d) => { if (!cancelled) setData(d as OverviewAnalytics); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? "Could not load analytics"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [year]);

  const showSkeleton = loading && !data;

  return (
    <div
      className="mt-8 relative overflow-hidden rounded-3xl p-5 sm:p-7"
      style={{
        background:
          "radial-gradient(1200px 500px at 10% -10%, rgba(124,58,237,.28), transparent 60%), radial-gradient(900px 480px at 95% 0%, rgba(14,165,233,.22), transparent 55%), linear-gradient(180deg,#0a0a14,#0b1020)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(120% 80% at 50% 0%, #000 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(120% 80% at 50% 0%, #000 30%, transparent 75%)",
        }}
      />

      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">Command center</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">Overview</h2>
        </div>
        <label className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/50">
          Year
          <select
            value={data?.year ?? ""}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-sm normal-case tracking-normal text-white outline-none [&>option]:text-black"
          >
            {(data?.years ?? []).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p className="relative mt-6 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </p>
      )}

      {showSkeleton ? (
        <div className="relative mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} className="h-28" />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <SkeletonBlock className="h-80" />
            <SkeletonBlock className="h-80" />
          </div>
        </div>
      ) : data ? (
        <div className={`relative mt-6 space-y-5 transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Kpi label="Total footfall" value={data.kpis.footfall} hint="Confirmed participants at completed workshops" accent="rgba(56,189,248,.5)" />
            <Kpi label="Total registrations" value={data.kpis.registrations} accent="rgba(167,139,250,.5)" />
            <Kpi label="Total revenue" value={data.kpis.revenue} money hint="Confirmed payments only" accent="rgba(52,211,153,.45)" />
            <Kpi label="Confirmed paid" value={data.kpis.confirmed} accent="rgba(52,211,153,.4)" />
            <Kpi label="Workshops conducted" value={data.kpis.workshopsConducted} accent="rgba(251,191,36,.4)" />
            <Kpi label="Upcoming workshops" value={data.kpis.upcomingWorkshops} accent="rgba(244,114,182,.4)" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Bars
              title={`Yearly footfall · ${data.year}`}
              subtitle="Attendance by month"
              data={data.months.map((m) => m.footfall)}
              color="#38bdf8"
              empty="No attendance recorded for the selected year."
            />
            <Bars
              title={`Yearly revenue · ${data.year}`}
              subtitle="Confirmed payments by month"
              data={data.months.map((m) => m.revenue)}
              color="#a78bfa"
              money
              empty="No revenue for the selected year."
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Donut statuses={data.statuses} />
            <WorkshopTable rows={data.workshops} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

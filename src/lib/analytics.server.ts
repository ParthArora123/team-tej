/**
 * Admin overview analytics — a single aggregation source so KPIs, charts and
 * the workshop breakdown always reconcile. Reads existing tables only
 * (programs + enrollments); no new schema, no synthetic data.
 */

export type MonthPoint = { month: number; footfall: number; revenue: number; registrations: number };

export type WorkshopPerf = {
  id: string;
  name: string;
  eventDate: string | null;
  registrations: number;
  confirmed: number;
  footfall: number;
  revenue: number;
};

export type OverviewAnalytics = {
  years: number[];
  year: number | null;
  kpis: {
    footfall: number;
    registrations: number;
    revenue: number;
    confirmed: number;
    workshopsConducted: number;
    upcomingWorkshops: number;
  };
  months: MonthPoint[];
  statuses: Array<{ status: string; label: string; count: number; amount: number }>;
  workshops: WorkshopPerf[];
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed / paid",
  payment_submitted: "Payment submitted",
  awaiting_payment: "Awaiting payment",
  rejected: "Rejected / cancelled",
};

/** Date used to bucket a registration: the workshop's event date, else signup date. */
function bucketDate(programDate: string | null | undefined, createdAt: string | null | undefined) {
  const raw = programDate || createdAt;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function computeOverviewAnalytics(year?: number | null): Promise<OverviewAnalytics> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [progRes, enrRes] = await Promise.all([
    supabaseAdmin.from("programs").select("id, name, kind, event_date, created_at, published"),
    supabaseAdmin
      .from("enrollments")
      .select("id, status, amount_inr, created_at, program_id, approved_at"),
  ]);

  const programs = (progRes.data ?? []) as any[];
  const enrollments = (enrRes.data ?? []) as any[];
  const progById = new Map(programs.map((p) => [p.id, p]));

  // Available years across both datasets.
  const yearSet = new Set<number>();
  for (const p of programs) {
    const d = bucketDate(p.event_date, p.created_at);
    if (d) yearSet.add(d.getUTCFullYear());
  }
  for (const e of enrollments) {
    const p = progById.get(e.program_id);
    const d = bucketDate(p?.event_date, e.created_at);
    if (d) yearSet.add(d.getUTCFullYear());
  }
  const years = [...yearSet].sort((a, b) => b - a);
  const activeYear = year && yearSet.has(year) ? year : (years[0] ?? new Date().getUTCFullYear());

  const now = new Date();

  const months: MonthPoint[] = Array.from({ length: 12 }, (_, i) => ({
    month: i,
    footfall: 0,
    revenue: 0,
    registrations: 0,
  }));

  const statusMap = new Map<string, { count: number; amount: number }>();
  const perf = new Map<string, WorkshopPerf>();

  const yearPrograms = programs.filter((p) => {
    const d = bucketDate(p.event_date, p.created_at);
    return d?.getUTCFullYear() === activeYear;
  });

  for (const p of yearPrograms) {
    perf.set(p.id, {
      id: p.id,
      name: p.name ?? "Untitled",
      eventDate: p.event_date ?? null,
      registrations: 0,
      confirmed: 0,
      footfall: 0,
      revenue: 0,
    });
  }

  let footfall = 0;
  let registrations = 0;
  let revenue = 0;
  let confirmed = 0;

  for (const e of enrollments) {
    const p = progById.get(e.program_id);
    const d = bucketDate(p?.event_date, e.created_at);
    if (!d || d.getUTCFullYear() !== activeYear) continue;

    const m = d.getUTCMonth();
    const isConfirmed = e.status === "confirmed";
    const amount = isConfirmed ? Number(e.amount_inr ?? 0) : 0;
    // Footfall = confirmed participants of a workshop that has already happened.
    const happened = p?.event_date ? new Date(p.event_date) <= now : false;
    const attended = isConfirmed && happened;

    registrations += 1;
    months[m]!.registrations += 1;
    if (isConfirmed) {
      confirmed += 1;
      revenue += amount;
      months[m]!.revenue += amount;
    }
    if (attended) {
      footfall += 1;
      months[m]!.footfall += 1;
    }

    const s = statusMap.get(e.status) ?? { count: 0, amount: 0 };
    s.count += 1;
    s.amount += Number(e.amount_inr ?? 0);
    statusMap.set(e.status, s);

    if (p) {
      const row =
        perf.get(p.id) ??
        ({
          id: p.id,
          name: p.name ?? "Untitled",
          eventDate: p.event_date ?? null,
          registrations: 0,
          confirmed: 0,
          footfall: 0,
          revenue: 0,
        } as WorkshopPerf);
      row.registrations += 1;
      if (isConfirmed) {
        row.confirmed += 1;
        row.revenue += amount;
      }
      if (attended) row.footfall += 1;
      perf.set(p.id, row);
    }
  }

  const workshopsConducted = yearPrograms.filter(
    (p) => p.event_date && new Date(p.event_date) <= now,
  ).length;
  const upcomingWorkshops = yearPrograms.filter(
    (p) => p.event_date && new Date(p.event_date) > now,
  ).length;

  const statuses = [...statusMap.entries()]
    .map(([status, v]) => ({
      status,
      label: STATUS_LABELS[status] ?? status,
      count: v.count,
      amount: v.amount,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    years: years.length ? years : [activeYear],
    year: activeYear,
    kpis: { footfall, registrations, revenue, confirmed, workshopsConducted, upcomingWorkshops },
    months,
    statuses,
    workshops: [...perf.values()].sort((a, b) => b.revenue - a.revenue),
  };
}

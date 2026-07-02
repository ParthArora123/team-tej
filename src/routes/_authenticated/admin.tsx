import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import {
  listAllEnrollments, approveEnrollment, adminSaveWorkshop, adminSetPublished,
  adminDeleteWorkshop, adminListWorkshops, adminStats, adminScanTicket, checkIsAdmin,
  adminListTeam, adminSetUserAdmin,
} from "@/lib/enrollment.functions";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminPage });

type Tab = "overview" | "workshops" | "approvals" | "students" | "team" | "scan";

function AdminPage() {
  const navigate = useNavigate();
  const fetchStats = useServerFn(adminStats);
  const fetchAll = useServerFn(listAllEnrollments);
  const approve = useServerFn(approveEnrollment);
  const fetchWorkshops = useServerFn(adminListWorkshops);
  const saveWorkshop = useServerFn(adminSaveWorkshop);
  const setPublished = useServerFn(adminSetPublished);
  const delWorkshop = useServerFn(adminDeleteWorkshop);
  const scan = useServerFn(adminScanTicket);
  const adminCheck = useServerFn(checkIsAdmin);

  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<any>(null);
  const [enrs, setEnrs] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);

  useEffect(() => {
    adminCheck().then((r) => { if (!r.isAdmin) navigate({ to: "/dashboard" }); else reload(); });
  }, []);
  const reload = async () => {
    setStats(await fetchStats());
    setEnrs(await fetchAll());
    setWorkshops(await fetchWorkshops());
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 lg:px-10 max-w-6xl mx-auto">
      <p className="text-xs uppercase tracking-widest text-primary">Admin</p>
      <h1 className="font-display text-4xl font-bold mt-1">Control room</h1>

      <div className="mt-6 flex gap-2 flex-wrap">
        {(["overview","workshops","approvals","students","team","scan"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm capitalize ${tab===t?"bg-primary text-primary-foreground":"bg-muted"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && stats && (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total workshops" value={stats.totalWorkshops} />
          <StatCard label="Published" value={stats.activeWorkshops} />
          <StatCard label="Total registrations" value={stats.totalRegs} />
          <StatCard label="Pending payment approval" value={stats.pending} accent />
          <StatCard label="Approved" value={stats.approved} />
          <StatCard label="Rejected" value={stats.rejected} />
          <StatCard label="Awaiting payment" value={stats.awaiting} />
          <StatCard label="Revenue (₹)" value={stats.revenue.toLocaleString("en-IN")} />
        </div>
      )}

      {tab === "workshops" && (
        <WorkshopsTab rows={workshops} onSave={saveWorkshop} onDel={delWorkshop} onPub={setPublished} reload={reload} />
      )}

      {tab === "approvals" && (
        <div className="mt-8 grid gap-3">
          {enrs.length === 0 && <p className="text-muted-foreground">No registrations yet.</p>}
          {enrs.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="text-sm">
                  <p className="font-medium">{r.program?.name} · ₹{r.amount_inr}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.full_name ?? r.profile?.full_name} · {r.email ?? r.profile?.email} · {r.phone ?? r.profile?.phone}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[r.gender, r.age && `${r.age}y`, r.city, r.state].filter(Boolean).join(" · ")}
                  </p>
                  {r.emergency_contact && <p className="text-[11px] text-muted-foreground">Emergency: {r.emergency_contact}</p>}
                  <p className="text-[11px] mt-1">Status: <span className="text-primary">{r.status}</span> {r.ticket_code ? `· ${r.ticket_code}` : ""}</p>
                </div>
                {r.status === "payment_submitted" && (
                  <div className="flex gap-2">
                    <button onClick={async () => { await approve({ data: { enrollmentId: r.id, approve: true }}); reload(); }}
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm">Approve & issue ticket</button>
                    <button onClick={async () => { await approve({ data: { enrollmentId: r.id, approve: false }}); reload(); }}
                      className="px-4 py-2 rounded-lg bg-destructive text-white text-sm">Reject</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "students" && <StudentsTab rows={enrs} />}

      {tab === "scan" && <ScanTab onScan={scan} />}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: any; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border ${accent ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

const emptyWs = {
  id: undefined as string | undefined,
  kind: "workshop", name: "", description: "", banner_url: "",
  event_date: "", event_time: "", venue: "", instructor: "",
  duration: "", capacity: "", price_inr: "", registration_closes_on: "",
  category: "", style: "", published: false,
  upi_id: "", clear_upi: false, has_upi: false,
};

function WorkshopsTab({ rows, onSave, onDel, onPub, reload }: any) {
  const [f, setF] = useState<any>(emptyWs);
  const [msg, setMsg] = useState("");

  const edit = (r: any) => setF({
    id: r.id, kind: r.kind, name: r.name ?? "", description: r.description ?? "",
    banner_url: r.banner_url ?? "", event_date: r.event_date ?? "", event_time: r.event_time ?? "",
    venue: r.venue ?? "", instructor: r.instructor ?? "", duration: r.duration ?? "",
    capacity: r.capacity ?? "", price_inr: r.price_inr ?? "",
    registration_closes_on: r.registration_closes_on ?? "", category: r.category ?? "",
    style: r.style ?? "", published: !!r.published,
    upi_id: "", clear_upi: false, has_upi: !!r.has_upi,
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave({ data: {
        ...f, price_inr: Number(f.price_inr),
        capacity: f.capacity ? Number(f.capacity) : undefined,
        upi_id: f.upi_id?.trim() || undefined,
        clear_upi: !!f.clear_upi,
      }});
      setMsg("Saved."); setF(emptyWs); reload();
    } catch (e: any) { setMsg(e.message); }
  };

  return (
    <div className="mt-8 grid lg:grid-cols-[1fr_1fr] gap-6">
      <form onSubmit={save} className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <p className="font-display text-lg font-bold">{f.id ? "Edit workshop" : "Add workshop"}</p>
        <In placeholder="Workshop name *" v={f.name} on={(v) => setF({ ...f, name: v })} required />
        <textarea placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" rows={3} />
        <In placeholder="Banner image URL (https://…)" v={f.banner_url} on={(v) => setF({ ...f, banner_url: v })} />
        <div className="grid grid-cols-2 gap-2">
          <In type="date" placeholder="Event date" v={f.event_date} on={(v) => setF({ ...f, event_date: v })} />
          <In placeholder="Time (e.g. 4:00 PM)" v={f.event_time} on={(v) => setF({ ...f, event_time: v })} />
          <In placeholder="Venue" v={f.venue} on={(v) => setF({ ...f, venue: v })} />
          <In placeholder="Instructor" v={f.instructor} on={(v) => setF({ ...f, instructor: v })} />
          <In placeholder="Duration (e.g. 2 hrs)" v={f.duration} on={(v) => setF({ ...f, duration: v })} />
          <In placeholder="Category (e.g. Hip-Hop)" v={f.category} on={(v) => setF({ ...f, category: v })} />
          <In type="number" placeholder="Capacity" v={f.capacity} on={(v) => setF({ ...f, capacity: v })} />
          <In type="number" placeholder="Fee (₹) *" v={f.price_inr} on={(v) => setF({ ...f, price_inr: v })} required />
          <In type="date" placeholder="Registration closes" v={f.registration_closes_on} on={(v) => setF({ ...f, registration_closes_on: v })} />
          <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}
            className="px-3 py-2 rounded-lg bg-muted border border-border text-sm">
            <option value="workshop">Workshop</option>
            <option value="nritya_sadhana">Nritya Sadhana</option>
            <option value="zero_to_hero">Zero to Hero</option>
            <option value="online_training">Online Training</option>
          </select>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/40 p-3 space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Payment · UPI</p>
          <In placeholder={f.has_upi ? "UPI already saved · enter to replace (e.g. tejas@upi)" : "UPI ID (e.g. tejas@upi)"}
            v={f.upi_id} on={(v) => setF({ ...f, upi_id: v })} />
          <p className="text-[11px] text-muted-foreground">Stored encrypted at rest. Shown only on the payment page.</p>
          {f.has_upi && (
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={!!f.clear_upi} onChange={(e) => setF({ ...f, clear_upi: e.target.checked })} />
              Remove saved UPI and fall back to default
            </label>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />
          Publish (visible to customers)
        </label>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
            {f.id ? "Update" : "Save"}
          </button>
          {f.id && <button type="button" onClick={() => setF(emptyWs)} className="px-4 py-2 rounded-lg bg-muted text-sm">Cancel</button>}
        </div>
        {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
      </form>

      <div className="space-y-3">
        {rows.map((r: any) => (
          <div key={r.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.event_date ?? "—"} · {r.venue ?? "—"} · ₹{r.price_inr} · {r.seats_taken ?? 0}/{r.capacity ?? "∞"} seats
                </p>
                <p className="text-[11px] mt-1 flex flex-wrap gap-2">
                  <span className={r.published ? "text-emerald-400" : "text-amber-400"}>
                    {r.published ? "Published" : "Draft"}
                  </span>
                  <span className={r.has_upi ? "text-emerald-400" : "text-muted-foreground"}>
                    {r.has_upi ? "UPI set 🔒" : "No UPI"}
                  </span>
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => edit(r)} className="px-3 py-1 text-xs rounded bg-muted">Edit</button>
                <button onClick={async () => { await onPub({ data: { id: r.id, published: !r.published }}); reload(); }}
                  className="px-3 py-1 text-xs rounded bg-muted">{r.published ? "Unpublish" : "Publish"}</button>
                <button onClick={async () => { if (confirm("Delete?")) { await onDel({ data: { id: r.id }}); reload(); }}}
                  className="px-3 py-1 text-xs rounded bg-destructive text-white">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground text-sm">No workshops yet.</p>}
      </div>
    </div>
  );
}

function In({ v, on, ...p }: { v: string; on: (v: string) => void; [k: string]: any }) {
  return <input value={v} onChange={(e) => on(e.target.value)} {...p}
    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" />;
}

function StudentsTab({ rows }: { rows: any[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [prog, setProg] = useState<string>("all");

  const programs = Array.from(new Set(rows.map((r) => r.program?.name).filter(Boolean))) as string[];

  const filtered = rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (prog !== "all" && r.program?.name !== prog) return false;
    if (!q.trim()) return true;
    const hay = `${r.full_name ?? ""} ${r.email ?? ""} ${r.phone ?? ""} ${r.ticket_code ?? ""} ${r.city ?? ""} ${r.state ?? ""}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  const cols = [
    ["Registered", (r: any) => new Date(r.created_at).toLocaleString("en-IN")],
    ["Full name", (r: any) => r.full_name ?? ""],
    ["Email", (r: any) => r.email ?? ""],
    ["Phone", (r: any) => r.phone ?? ""],
    ["Age", (r: any) => r.age ?? ""],
    ["Gender", (r: any) => r.gender ?? ""],
    ["City", (r: any) => r.city ?? ""],
    ["State", (r: any) => r.state ?? ""],
    ["Address", (r: any) => r.address ?? ""],
    ["Emergency contact", (r: any) => r.emergency_contact ?? ""],
    ["Medical info", (r: any) => r.medical_info ?? ""],
    ["Workshop", (r: any) => r.program?.name ?? ""],
    ["Workshop date", (r: any) => r.program?.event_date ?? ""],
    ["Amount (INR)", (r: any) => r.amount_inr ?? 0],
    ["Status", (r: any) => r.status ?? ""],
    ["Ticket code", (r: any) => r.ticket_code ?? ""],
  ] as const;

  const exportCsv = () => {
    const esc = (v: any) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = cols.map(([h]) => esc(h)).join(",");
    const body = filtered.map((r) => cols.map(([, get]) => esc(get(r))).join(",")).join("\n");
    // BOM so Excel picks up UTF-8 (₹, é, etc.)
    const csv = "\ufeff" + header + "\n" + body;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `team-tej-students-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, ticket…"
          className="flex-1 min-w-[220px] px-3 py-2 rounded-lg bg-muted border border-border text-sm" />
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-muted border border-border text-sm">
          <option value="all">All statuses</option>
          <option value="awaiting_payment">Awaiting payment</option>
          <option value="payment_submitted">Payment submitted</option>
          <option value="confirmed">Confirmed</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={prog} onChange={(e) => setProg(e.target.value)}
          className="px-3 py-2 rounded-lg bg-muted border border-border text-sm">
          <option value="all">All workshops</option>
          {programs.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={exportCsv} disabled={filtered.length === 0}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-40">
          Export to Excel ({filtered.length})
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
            <tr>
              {cols.map(([h]) => <th key={h} className="text-left px-3 py-2 whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border/60 hover:bg-muted/30">
                {cols.map(([h, get]) => (
                  <td key={h} className="px-3 py-2 whitespace-nowrap">{String(get(r) ?? "")}</td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={cols.length} className="px-3 py-6 text-center text-muted-foreground">No students match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">Export downloads a UTF-8 CSV that opens directly in Excel or Google Sheets.</p>
    </div>
  );
}

function ScanTab({ onScan }: { onScan: any }) {
  const [code, setCode] = useState("");
  const [res, setRes] = useState<any>(null);
  const [err, setErr] = useState("");

  const doScan = async (ticket: string) => {
    setErr(""); setRes(null);
    try {
      const r = await onScan({ data: { ticket } });
      if (!r) setErr("No ticket found."); else setRes(r);
    } catch (e: any) { setErr(e.message); }
  };

  return (
    <div className="mt-8 max-w-xl">
      <p className="text-sm text-muted-foreground">Enter or paste a ticket code (TTJ-XXXXXX). If you scan a ticket QR with your phone, it opens the verify page — you can also paste the code here for a full details lookup.</p>
      <div className="mt-4 flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="TTJ-XXXXXX"
          className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm" />
        <button onClick={() => doScan(code)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Scan</button>
      </div>
      {err && <p className="mt-3 text-xs text-destructive">{err}</p>}
      {res && (
        <div className="mt-5 bg-card border border-border rounded-xl p-5">
          <p className="text-xs uppercase tracking-widest text-emerald-400">Valid ticket</p>
          <p className="font-display text-2xl mt-1">{res.program?.name}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {res.full_name}</p>
            <p><span className="text-muted-foreground">Phone:</span> {res.phone}</p>
            <p><span className="text-muted-foreground">Email:</span> {res.email}</p>
            <p><span className="text-muted-foreground">Age / Gender:</span> {res.age} · {res.gender}</p>
            <p className="col-span-2"><span className="text-muted-foreground">City/State:</span> {res.city}, {res.state}</p>
            <p><span className="text-muted-foreground">Ticket:</span> <span className="font-mono">{res.ticket_code}</span></p>
            <p><span className="text-muted-foreground">Amount:</span> ₹{res.amount_inr}</p>
          </div>
          <div className="mt-4 inline-block bg-white p-2 rounded">
            <QRCodeSVG value={res.ticket_code ?? ""} size={100} />
          </div>
        </div>
      )}
    </div>
  );
}

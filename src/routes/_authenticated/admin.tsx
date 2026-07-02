import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import {
  listAllEnrollments, adminSaveWorkshop, adminSetPublished,
  adminDeleteWorkshop, adminListWorkshops, adminStats, adminScanTicket, checkIsAdmin,
  adminListTeam, adminSetUserAdmin, adminAddTeamByEmail, approveEnrollment, adminGetProofUrl,
} from "@/lib/enrollment.functions";
import {
  adminListTeamProfiles, adminSaveTeamProfile, adminDeleteTeamProfile,
  adminSetTeamProfilePublished, adminReorderTeamProfile, adminUploadTeamPhoto,
} from "@/lib/team.functions";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminPage });

type Tab = "overview" | "workshops" | "profiles" | "students" | "team" | "scan";

const adminTabs: Array<{ id: Tab; label: string; emphasis?: boolean }> = [
  { id: "overview", label: "Overview" },
  { id: "team", label: "Team roles" },
  { id: "profiles", label: "Home profiles" },
  { id: "workshops", label: "Workshops" },
  { id: "students", label: "Students" },
  { id: "scan", label: "Scan" },
];



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
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl font-bold">Control room</h1>
        <button
          type="button"
          onClick={() => setTab("team")}
          className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium"
        >
          Manage team roles
        </button>
      </div>

      <div className="mt-6 flex gap-2 flex-wrap">
        {adminTabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm ${tab===t.id?"bg-primary text-primary-foreground":t.emphasis?"bg-primary/10 text-primary border border-primary/30":"bg-muted"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && stats && (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total workshops" value={stats.totalWorkshops} />
          <StatCard label="Published" value={stats.activeWorkshops} />
          <StatCard label="Total registrations" value={stats.totalRegs} />
          <StatCard label="Confirmed (paid)" value={stats.approved} accent />
          <StatCard label="Awaiting payment" value={stats.awaiting} />
          <StatCard label="Revenue (₹)" value={stats.revenue.toLocaleString("en-IN")} />
        </div>
      )}

      {tab === "workshops" && (
        <WorkshopsTab rows={workshops} onSave={saveWorkshop} onDel={delWorkshop} onPub={setPublished} reload={reload} />
      )}

      {tab === "approvals" && <ApprovalsTab rows={enrs} onApprove={approve} reload={reload} />}


      {tab === "students" && <StudentsTab rows={enrs} />}

      {tab === "team" && <TeamTab />}

      {tab === "profiles" && <ProfilesTab />}

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

function TeamTab() {
  const list = useServerFn(adminListTeam);
  const setRole = useServerFn(adminSetUserAdmin);
  const addByEmail = useServerFn(adminAddTeamByEmail);
  const [rows, setRows] = useState<any[]>([]);
  const [me, setMe] = useState<string>("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string>("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const team = await list();
      setRows(team);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) =>
      supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? ""))
    );
  }, []);

  // Team = admin users only. Toggle to show every signed-up user when granting new admin.
  const scoped = showAll ? rows : rows.filter((r) => r.is_admin);
  const filtered = scoped.filter((r) => {
    if (!q.trim()) return true;
    const hay = `${r.full_name ?? ""} ${r.email ?? ""} ${r.phone ?? ""}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  const toggle = async (r: any) => {
    setErr(""); setMsg(""); setBusy(r.id);
    try {
      await setRole({ data: { userId: r.id, makeAdmin: !r.is_admin } });
      await load();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(""); }
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setMsg(""); setInviting(true);
    try {
      await addByEmail({ data: { email: inviteEmail } });
      setMsg(`${inviteEmail} is now an admin.`);
      setInviteEmail("");
      await load();
    } catch (e: any) { setErr(e.message); }
    finally { setInviting(false); }
  };

  const adminCount = rows.filter((r) => r.is_admin).length;

  return (
    <div className="mt-8 space-y-6">
      <form onSubmit={invite} className="rounded-xl border border-border bg-card p-4">
        <label className="block text-sm font-medium mb-2">Add team member by email</label>
        <div className="flex flex-wrap gap-2">
          <input
            type="email" required value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="teammate@example.com"
            className="flex-1 min-w-[240px] px-3 py-2 rounded-lg bg-muted border border-border text-sm"
          />
          <button type="submit" disabled={inviting}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-40">
            {inviting ? "Adding…" : "Grant admin"}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          The person must sign in once before you can grant them admin.
        </p>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search team…"
          className="flex-1 min-w-[240px] px-3 py-2 rounded-lg bg-muted border border-border text-sm" />
        <button type="button" onClick={() => setShowAll((v) => !v)}
          className="px-3 py-2 rounded-lg border border-border text-xs">
          {showAll ? "Show team only" : "Show all users"}
        </button>
        <p className="text-xs text-muted-foreground">
          {adminCount} team · {rows.length} signed-up
        </p>
      </div>

      {err && <p className="text-xs text-destructive">{err}</p>}
      {msg && <p className="text-xs text-primary">{msg}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading team…</p>}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
            <tr>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Email</th>
              <th className="text-left px-3 py-2">Phone</th>
              <th className="text-left px-3 py-2">Role</th>
              <th className="text-right px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const self = r.id === me;
              return (
                <tr key={r.id} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.full_name || <span className="text-muted-foreground">—</span>}
                    {self && <span className="ml-2 text-[10px] uppercase tracking-widest text-primary">you</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.email}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.phone || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.is_admin
                      ? <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs">Admin</span>
                      : <span className="px-2 py-0.5 rounded-full bg-muted text-xs">User</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    <button onClick={() => toggle(r)} disabled={busy === r.id || (self && r.is_admin)}
                      title={self && r.is_admin ? "You cannot remove your own admin role" : ""}
                      className={`px-3 py-1.5 rounded-lg text-xs disabled:opacity-40 ${
                        r.is_admin ? "bg-destructive text-white" : "bg-primary text-primary-foreground"
                      }`}>
                      {busy === r.id ? "…" : r.is_admin ? "Revoke admin" : "Make admin"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                {showAll ? "No users match." : "No team members yet. Add one by email above."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Registered students appear in the Students tab — not here.
      </p>
    </div>
  );
}

type ProfileForm = {
  id?: string;
  name: string;
  designation: string;
  short_description: string;
  biography: string;
  photo_url: string;
  photo_path: string;
  achievements: string;
  dance_styles: string;
  experience: string;
  socials: string; // JSON textarea
  sort_order: string;
  published: boolean;
};

const emptyProfile: ProfileForm = {
  name: "", designation: "", short_description: "", biography: "",
  photo_url: "", photo_path: "", achievements: "", dance_styles: "",
  experience: "", socials: "", sort_order: "0", published: true,
};

function ProfilesTab() {
  const list = useServerFn(adminListTeamProfiles);
  const save = useServerFn(adminSaveTeamProfile);
  const del = useServerFn(adminDeleteTeamProfile);
  const setPub = useServerFn(adminSetTeamProfilePublished);
  const reorder = useServerFn(adminReorderTeamProfile);
  const upload = useServerFn(adminUploadTeamPhoto);

  const [rows, setRows] = useState<any[]>([]);
  const [f, setF] = useState<ProfileForm>(emptyProfile);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setRows(await list()); } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const edit = (r: any) => setF({
    id: r.id, name: r.name ?? "", designation: r.designation ?? "",
    short_description: r.short_description ?? "", biography: r.biography ?? "",
    photo_url: r.photo_url && !r.photo_path ? r.photo_url : "",
    photo_path: r.photo_path ?? "",
    achievements: (r.achievements ?? []).join("\n"),
    dance_styles: (r.dance_styles ?? []).join(", "),
    experience: r.experience ?? "",
    socials: r.socials ? JSON.stringify(r.socials, null, 2) : "",
    sort_order: String(r.sort_order ?? 0),
    published: !!r.published,
  });

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setMsg("");
    let socialsObj: Record<string, string> = {};
    if (f.socials.trim()) {
      try { socialsObj = JSON.parse(f.socials); }
      catch { setErr("Social links must be valid JSON, e.g. { \"instagram\": \"https://…\" }"); return; }
    }
    try {
      await save({ data: {
        id: f.id,
        name: f.name.trim(),
        designation: f.designation.trim() || null,
        short_description: f.short_description.trim() || null,
        biography: f.biography.trim() || null,
        photo_url: f.photo_url.trim() || null,
        photo_path: f.photo_path.trim() || null,
        achievements: f.achievements.split("\n").map((s) => s.trim()).filter(Boolean),
        dance_styles: f.dance_styles.split(",").map((s) => s.trim()).filter(Boolean),
        experience: f.experience.trim() || null,
        socials: socialsObj,
        sort_order: Number(f.sort_order) || 0,
        published: f.published,
      }});
      setMsg("Saved.");
      setF(emptyProfile);
      await load();
    } catch (e: any) { setErr(e.message); }
  };

  const onFile = async (file: File) => {
    setErr(""); setMsg(""); setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      let bin = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const b64 = btoa(bin);
      const res = await upload({ data: {
        profileId: f.id, filename: file.name, contentType: file.type || "image/jpeg", dataBase64: b64,
      }});
      setF((prev) => ({ ...prev, photo_path: res.path, photo_url: res.url ?? prev.photo_url }));
      if (f.id) { setMsg("Photo uploaded."); await load(); }
    } catch (e: any) { setErr(e.message); }
    finally { setUploading(false); }
  };

  return (
    <div className="mt-8 grid lg:grid-cols-[1fr_1fr] gap-6">
      <form onSubmit={onSave} className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <p className="font-display text-lg font-bold">{f.id ? "Edit profile" : "Add profile"}</p>

        <In placeholder="Name *" v={f.name} on={(v) => setF({ ...f, name: v })} required />
        <In placeholder="Designation (e.g. Founder · Artistic Director)" v={f.designation} on={(v) => setF({ ...f, designation: v })} />
        <textarea placeholder="Short description (shown on Home)" value={f.short_description}
          onChange={(e) => setF({ ...f, short_description: e.target.value })} rows={2}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" />
        <textarea placeholder="Full biography" value={f.biography}
          onChange={(e) => setF({ ...f, biography: e.target.value })} rows={4}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" />

        <div className="rounded-lg border border-border/60 bg-muted/40 p-3 space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Profile photo</p>
          {(f.photo_url || f.photo_path) && (
            <div className="flex items-center gap-3">
              {f.photo_url && <img src={f.photo_url} alt="" className="h-20 w-20 rounded-lg object-cover border border-border" />}
              <p className="text-[11px] text-muted-foreground break-all">{f.photo_path || f.photo_url}</p>
            </div>
          )}
          <input type="file" accept="image/*"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) onFile(file); }}
            className="block w-full text-xs" />
          {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
          <p className="text-[11px] text-muted-foreground">Or paste an external image URL below.</p>
          <In placeholder="Photo URL (external)" v={f.photo_url} on={(v) => setF({ ...f, photo_url: v, photo_path: v ? "" : f.photo_path })} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <In placeholder="Experience (e.g. 12+ years)" v={f.experience} on={(v) => setF({ ...f, experience: v })} />
          <In type="number" placeholder="Sort order" v={f.sort_order} on={(v) => setF({ ...f, sort_order: v })} />
        </div>
        <In placeholder="Dance styles (comma separated)" v={f.dance_styles} on={(v) => setF({ ...f, dance_styles: v })} />
        <textarea placeholder="Achievements (one per line)" value={f.achievements}
          onChange={(e) => setF({ ...f, achievements: e.target.value })} rows={3}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm" />
        <textarea placeholder='Social links JSON, e.g. {"instagram":"https://…","youtube":"https://…"}'
          value={f.socials} onChange={(e) => setF({ ...f, socials: e.target.value })} rows={3}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm font-mono" />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />
          Publish on Home page
        </label>

        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
            {f.id ? "Update" : "Save"}
          </button>
          {f.id && <button type="button" onClick={() => setF(emptyProfile)} className="px-4 py-2 rounded-lg bg-muted text-sm">Cancel</button>}
        </div>
        {msg && <p className="text-xs text-primary">{msg}</p>}
        {err && <p className="text-xs text-destructive">{err}</p>}
      </form>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Loading profiles…</p>}
        {!loading && rows.length === 0 && <p className="text-sm text-muted-foreground">No profiles yet. Add one on the left.</p>}
        {rows.map((r, i) => (
          <div key={r.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {r.photo_url
                  ? <img src={r.photo_url} alt={r.name} className="h-16 w-16 rounded-lg object-cover border border-border" />
                  : <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center font-display text-2xl text-primary">{r.name?.charAt(0)?.toUpperCase()}</div>}
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.designation ?? "—"}</p>
                  <p className="text-[11px] mt-1">
                    <span className={r.published ? "text-emerald-400" : "text-amber-400"}>
                      {r.published ? "Published" : "Draft"}
                    </span>
                    <span className="text-muted-foreground"> · order {r.sort_order ?? 0}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1">
                  <button disabled={i === 0} onClick={async () => { await reorder({ data: { id: r.id, direction: "up" }}); load(); }}
                    className="px-2 py-1 text-xs rounded bg-muted disabled:opacity-40">↑</button>
                  <button disabled={i === rows.length - 1} onClick={async () => { await reorder({ data: { id: r.id, direction: "down" }}); load(); }}
                    className="px-2 py-1 text-xs rounded bg-muted disabled:opacity-40">↓</button>
                </div>
                <button onClick={() => edit(r)} className="px-3 py-1 text-xs rounded bg-muted">Edit</button>
                <button onClick={async () => { await setPub({ data: { id: r.id, published: !r.published }}); load(); }}
                  className="px-3 py-1 text-xs rounded bg-muted">{r.published ? "Unpublish" : "Publish"}</button>
                <button onClick={async () => { if (confirm("Delete this profile?")) { await del({ data: { id: r.id }}); load(); } }}
                  className="px-3 py-1 text-xs rounded bg-destructive text-white">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function ApprovalsTab({ rows, onApprove, reload }: { rows: any[]; onApprove: any; reload: () => void }) {
  const pending = rows.filter((r) => r.status === "payment_submitted");
  const [busy, setBusy] = useState<string | null>(null);
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const getProof = useServerFn(adminGetProofUrl);

  useEffect(() => {
    (async () => {
      const next: Record<string, string> = {};
      for (const r of pending) {
        if (r.payment_proof_path && !proofUrls[r.id]) {
          try {
            const { url } = await getProof({ data: { path: r.payment_proof_path } });
            next[r.id] = url;
          } catch {}
        }
      }
      if (Object.keys(next).length) setProofUrls((prev) => ({ ...prev, ...next }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending.length]);

  const act = async (id: string, approve: boolean) => {
    setBusy(id);
    try {
      await onApprove({ data: { enrollmentId: id, approve } });
      await reload();
    } catch (e: any) {
      alert(e.message ?? "Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-8 space-y-3">
      <p className="text-sm text-muted-foreground">
        Review each uploaded payment screenshot, then approve to issue the ticket and increment seats.
      </p>
      {pending.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
          No payments awaiting verification.
        </div>
      )}
      {pending.map((r) => (
        <div key={r.id} className="bg-card border border-border rounded-2xl p-5 grid gap-4 md:grid-cols-[1fr_240px]">
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold">{r.full_name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{r.email} · {r.phone}</p>
            <p className="text-sm mt-2">{r.program?.name ?? "Workshop"} · ₹{(r.amount_inr ?? 0).toLocaleString("en-IN")}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Submitted {r.payment_confirmed_at ? new Date(r.payment_confirmed_at).toLocaleString() : "—"}</p>
            <div className="flex gap-2 mt-4">
              <button disabled={busy === r.id} onClick={() => act(r.id, true)}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium disabled:opacity-50">
                Approve & issue ticket
              </button>
              <button disabled={busy === r.id} onClick={() => act(r.id, false)}
                className="px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium disabled:opacity-50">
                Reject
              </button>
            </div>
          </div>
          <div>
            {proofUrls[r.id] ? (
              <a href={proofUrls[r.id]} target="_blank" rel="noreferrer" className="block">
                <img src={proofUrls[r.id]} alt="Payment proof" className="w-full h-auto max-h-64 object-contain rounded-md border border-border bg-muted" />
                <span className="mt-1 block text-[11px] text-primary underline">Open full size</span>
              </a>
            ) : (
              <div className="w-full h-40 rounded-md border border-dashed border-border grid place-items-center text-xs text-muted-foreground">
                {r.payment_proof_path ? "Loading screenshot…" : "No screenshot"}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

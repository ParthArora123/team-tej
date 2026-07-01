import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import {
  listAllEnrollments, approveEnrollment, adminSaveWorkshop, adminSetPublished,
  adminDeleteWorkshop, adminListWorkshops, adminStats, adminScanTicket, checkIsAdmin,
} from "@/lib/enrollment.functions";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminPage });

type Tab = "overview" | "workshops" | "approvals" | "scan";

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
        {(["overview","workshops","approvals","scan"] as Tab[]).map((t) => (
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
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave({ data: {
        ...f, price_inr: Number(f.price_inr),
        capacity: f.capacity ? Number(f.capacity) : undefined,
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
                <p className="text-[11px] mt-1">
                  <span className={r.published ? "text-emerald-400" : "text-amber-400"}>
                    {r.published ? "Published" : "Draft"}
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

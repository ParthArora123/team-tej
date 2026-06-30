import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAllEnrollments, approveEnrollment, adminCreateProgram, adminCreateEvent, checkIsAdmin } from "@/lib/enrollment.functions";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminPage });

function AdminPage() {
  const navigate = useNavigate();
  const fetchAll = useServerFn(listAllEnrollments);
  const approve = useServerFn(approveEnrollment);
  const addProg = useServerFn(adminCreateProgram);
  const addEvt = useServerFn(adminCreateEvent);
  const adminCheck = useServerFn(checkIsAdmin);

  const [rows, setRows] = useState<any[]>([]);
  const [tab, setTab] = useState<"approvals"|"add-program"|"add-event">("approvals");

  useEffect(() => {
    adminCheck().then((r) => { if (!r.isAdmin) navigate({ to: "/dashboard" }); else reload(); });
  }, []);
  const reload = async () => setRows(await fetchAll());

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 lg:px-10 max-w-6xl mx-auto">
      <p className="text-xs uppercase tracking-widest text-primary">Admin</p>
      <h1 className="font-display text-4xl font-bold mt-1">Control room</h1>

      <div className="mt-6 flex gap-2 flex-wrap">
        {(["approvals","add-program","add-event"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm ${tab===t?"bg-primary text-primary-foreground":"bg-muted"}`}>
            {t.replace("-"," ")}
          </button>
        ))}
      </div>

      {tab === "approvals" && (
        <div className="mt-8 grid gap-3">
          {rows.length === 0 && <p className="text-muted-foreground">No enrollments yet.</p>}
          {rows.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium">{r.program?.name} · ₹{r.amount_inr}</p>
                <p className="text-xs text-muted-foreground">
                  {r.profile?.full_name ?? "—"} · {r.profile?.email} · {r.profile?.phone}
                </p>
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
          ))}
        </div>
      )}

      {tab === "add-program" && <ProgramForm onSave={addProg} />}
      {tab === "add-event" && <EventForm onSave={addEvt} />}
    </div>
  );
}

function ProgramForm({ onSave }: { onSave: (a: any) => Promise<any> }) {
  const [f, setF] = useState({ kind:"workshop", name:"", description:"", duration:"", price_inr:0, style:"", seats:0 });
  const [msg, setMsg] = useState("");
  return (
    <form className="mt-8 grid gap-3 max-w-xl" onSubmit={async (e) => {
      e.preventDefault();
      try { await onSave({ data: { ...f, price_inr: Number(f.price_inr), seats: Number(f.seats) || undefined } }); setMsg("Saved."); }
      catch (e:any) { setMsg(e.message); }
    }}>
      <select className="px-3 py-2 rounded-lg bg-muted border border-border" value={f.kind} onChange={(e)=>setF({...f, kind:e.target.value})}>
        <option value="workshop">Workshop</option>
        <option value="nritya_sadhana">Nritya Sadhana</option>
        <option value="zero_to_hero">Zero to Hero</option>
        <option value="online_training">Online Training</option>
      </select>
      <input placeholder="Name" className="px-3 py-2 rounded-lg bg-muted border border-border" value={f.name} onChange={(e)=>setF({...f, name:e.target.value})} required />
      <textarea placeholder="Description" className="px-3 py-2 rounded-lg bg-muted border border-border" value={f.description} onChange={(e)=>setF({...f, description:e.target.value})} />
      <input placeholder="Duration" className="px-3 py-2 rounded-lg bg-muted border border-border" value={f.duration} onChange={(e)=>setF({...f, duration:e.target.value})} />
      <input type="number" placeholder="Price INR" className="px-3 py-2 rounded-lg bg-muted border border-border" value={f.price_inr} onChange={(e)=>setF({...f, price_inr: e.target.value as any})} />
      <input placeholder="Style" className="px-3 py-2 rounded-lg bg-muted border border-border" value={f.style} onChange={(e)=>setF({...f, style:e.target.value})} />
      <input type="number" placeholder="Seats (optional)" className="px-3 py-2 rounded-lg bg-muted border border-border" value={f.seats} onChange={(e)=>setF({...f, seats: e.target.value as any})} />
      <button className="px-4 py-3 rounded-lg bg-primary text-primary-foreground">Add program</button>
      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
    </form>
  );
}

function EventForm({ onSave }: { onSave: (a: any) => Promise<any> }) {
  const [f, setF] = useState({ title:"", venue:"", event_date:"", description:"" });
  const [msg, setMsg] = useState("");
  return (
    <form className="mt-8 grid gap-3 max-w-xl" onSubmit={async (e) => {
      e.preventDefault();
      try { await onSave({ data: f }); setMsg("Event added."); }
      catch (e:any) { setMsg(e.message); }
    }}>
      <input placeholder="Title" className="px-3 py-2 rounded-lg bg-muted border border-border" value={f.title} onChange={(e)=>setF({...f, title:e.target.value})} required />
      <input placeholder="Venue" className="px-3 py-2 rounded-lg bg-muted border border-border" value={f.venue} onChange={(e)=>setF({...f, venue:e.target.value})} />
      <input type="datetime-local" className="px-3 py-2 rounded-lg bg-muted border border-border" value={f.event_date} onChange={(e)=>setF({...f, event_date:e.target.value})} required />
      <textarea placeholder="Description" className="px-3 py-2 rounded-lg bg-muted border border-border" value={f.description} onChange={(e)=>setF({...f, description:e.target.value})} />
      <button className="px-4 py-3 rounded-lg bg-primary text-primary-foreground">Add event</button>
      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
    </form>
  );
}

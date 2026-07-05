import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import {
  adminListContactMessages,
  adminSetContactMessageRead,
  adminDeleteContactMessage,
} from "@/lib/contact.functions";

type Msg = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: boolean;
  created_at: string;
};

export function MessagesTab() {
  const list = useServerFn(adminListContactMessages);
  const setRead = useServerFn(adminSetContactMessageRead);
  const del = useServerFn(adminDeleteContactMessage);
  const [rows, setRows] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setRows(await list() as Msg[]); } catch (e: any) { toast.error(e.message ?? "Failed to load"); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleRead = async (m: Msg) => {
    try { await setRead({ data: { id: m.id, read: !m.read } }); load(); } catch (e: any) { toast.error(e.message); }
  };
  const remove = async (m: Msg) => {
    if (!confirm(`Delete message from ${m.name}?`)) return;
    try { await del({ data: { id: m.id } }); toast.success("Deleted"); load(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Contact messages</h2>
          <p className="text-sm text-muted-foreground">Messages submitted through the website contact form.</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {rows.filter((r) => !r.read).length} unread · {rows.length} total
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground">
          No messages yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((m) => (
            <li key={m.id}
              className={`rounded-xl border p-4 ${m.read ? "border-border bg-card" : "border-primary/50 bg-primary/5"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display text-lg font-bold">{m.name}</p>
                    <a href={`mailto:${m.email}`} className="text-sm text-primary underline underline-offset-2">{m.email}</a>
                    {!m.read && <span className="text-[10px] uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded-full">New</span>}
                  </div>
                  {m.subject && <p className="text-sm mt-1 text-muted-foreground">Subject: <span className="text-foreground">{m.subject}</span></p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(m.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => toggleRead(m)}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:border-primary transition">
                    {m.read ? <><Mail size={12}/> Mark unread</> : <><MailOpen size={12}/> Mark read</>}
                  </button>
                  <button onClick={() => remove(m)}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition">
                    <Trash2 size={12}/> Delete
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm whitespace-pre-wrap leading-relaxed">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

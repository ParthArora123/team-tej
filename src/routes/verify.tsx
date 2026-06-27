import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Check, ShieldCheck, Ticket as TicketIcon, AlertTriangle } from "lucide-react";

type TicketData = {
  id?: string;
  class?: string;
  duration?: string;
  amount?: number;
  student?: string;
  email?: string;
  phone?: string;
  age?: string;
  level?: string;
  issuer?: string;
  issued?: string;
  status?: string;
};

export const Route = createFileRoute("/verify")({
  validateSearch: (s: Record<string, unknown>) => ({
    d: typeof s.d === "string" ? s.d : "",
  }),
  head: () => ({
    meta: [
      { title: "Verify Ticket — Team Tej" },
      { name: "description", content: "Verify a Team Tej enrollment ticket by scanning the QR." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Verify,
});

function decode(d: string): TicketData | null {
  if (!d) return null;
  try {
    const json =
      typeof atob !== "undefined"
        ? decodeURIComponent(escape(atob(d.replace(/-/g, "+").replace(/_/g, "/"))))
        : Buffer.from(d, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function Verify() {
  const { d } = Route.useSearch();
  const data = decode(d);

  if (!data) {
    return (
      <section className="max-w-xl mx-auto px-6 lg:px-10 py-24">
        <div className="rounded-2xl border border-destructive/40 bg-card p-8 text-center">
          <AlertTriangle className="mx-auto text-destructive" size={32} />
          <h1 className="mt-3 font-display text-2xl font-bold">Invalid ticket</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This QR code couldn't be verified. Please ask the student to re-share their ticket.
          </p>
        </div>
      </section>
    );
  }

  const rows: [string, string | undefined][] = [
    ["Student", data.student],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Age", data.age],
    ["Level", data.level],
    ["Class", data.class],
    ["Duration", data.duration],
    ["Amount", data.amount != null ? `₹${Number(data.amount).toLocaleString("en-IN")}` : undefined],
    ["Ticket ID", data.id],
    ["Issued", data.issued ? new Date(data.issued).toLocaleString("en-IN") : undefined],
  ];

  return (
    <section className="max-w-xl mx-auto px-6 lg:px-10 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-7"
      >
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck size={18} />
          <span className="text-xs uppercase tracking-widest font-semibold">
            Team Tej · Ticket Verified
          </span>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center">
            <Check className="text-primary" size={22} />
          </div>
          <div>
            <p className="font-display text-2xl font-bold leading-tight">
              {data.student || "Registered Student"}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.status || "PAID"} · {data.issuer || "Team Tej Dance Co"}
            </p>
          </div>
        </div>

        <div className="my-5 border-t border-dashed border-border" />

        <dl className="grid grid-cols-3 gap-y-3 text-sm">
          {rows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="col-span-1 text-muted-foreground">{k}</dt>
                <dd className="col-span-2 font-medium break-words">{v}</dd>
              </div>
            ))}
        </dl>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <TicketIcon size={14} className="text-primary" />
          Show this screen at the studio entrance.
        </div>
      </motion.div>
    </section>
  );
}

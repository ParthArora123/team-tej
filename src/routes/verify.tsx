import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, ShieldCheck, Ticket as TicketIcon, AlertTriangle, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { verifyTicket } from "@/lib/verify.functions";

export const Route = createFileRoute("/verify")({
  validateSearch: (s: Record<string, unknown>) => ({
    d: typeof s.d === "string" ? s.d : "",
    code: typeof s.code === "string" ? s.code : "",
  }),
  head: () => ({
    meta: [
      { title: "Verify Ticket — Tejas Dhoke" },
      { name: "description", content: "Verify a Tejas Dhoke enrollment ticket by scanning the QR." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Verify,
});

// Extract just the ticket code from either ?code=TTJ-XXXX (new format)
// or from a legacy base64 ?d= payload (only the id field is used; every other
// field is looked up server-side from the database).
function extractCode(d: string, code: string): string | null {
  if (code) return code.trim();
  if (!d) return null;
  try {
    const b64 = d.replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof atob !== "undefined"
        ? decodeURIComponent(escape(atob(b64)))
        : Buffer.from(b64, "base64").toString("utf-8");
    const parsed = JSON.parse(json);
    return typeof parsed?.id === "string" ? parsed.id : null;
  } catch {
    return null;
  }
}

function Verify() {
  const { d, code } = Route.useSearch();
  const verify = useServerFn(verifyTicket);
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "invalid" }
    | { status: "valid"; data: any }
  >({ status: "loading" });

  useEffect(() => {
    const ticketCode = extractCode(d, code);
    if (!ticketCode) {
      setState({ status: "invalid" });
      return;
    }
    verify({ data: { code: ticketCode } })
      .then((r: any) => {
        if (r.valid) setState({ status: "valid", data: r });
        else setState({ status: "invalid" });
      })
      .catch(() => setState({ status: "invalid" }));
  }, [d, code]);

  if (state.status === "loading") {
    return (
      <section className="max-w-xl mx-auto px-6 lg:px-10 py-24 text-center">
        <Loader2 className="mx-auto animate-spin text-primary" size={28} />
        <p className="mt-3 text-sm text-muted-foreground">Verifying ticket…</p>
      </section>
    );
  }

  if (state.status === "invalid") {
    return (
      <section className="max-w-xl mx-auto px-6 lg:px-10 py-24">
        <div className="rounded-2xl border border-destructive/40 bg-card p-8 text-center">
          <AlertTriangle className="mx-auto text-destructive" size={32} />
          <h1 className="mt-3 font-display text-2xl font-bold">Invalid ticket</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This QR code couldn't be verified. Ask the student to re-share their ticket from their dashboard.
          </p>
        </div>
      </section>
    );
  }

  const t = state.data;
  const rows: [string, string | undefined][] = [
    ["Student", t.student],
    ["Class", t.program?.name],
    ["Duration", t.program?.duration],
    ["Venue", t.program?.venue],
    ["Event date", t.program?.event_date ? new Date(t.program.event_date).toDateString() : undefined],
    ["Amount", t.amount != null ? `₹${Number(t.amount).toLocaleString("en-IN")}` : undefined],
    ["Ticket ID", t.ticket_code],
    ["Approved", t.approved_at ? new Date(t.approved_at).toLocaleString("en-IN") : undefined],
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
            Tejas Dhoke · Ticket Verified
          </span>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center">
            <Check className="text-primary" size={22} />
          </div>
          <div>
            <p className="font-display text-2xl font-bold leading-tight">
              {t.student || "Registered Student"}
            </p>
            <p className="text-xs text-muted-foreground">CONFIRMED · Tejas Dhoke Dance Co</p>
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

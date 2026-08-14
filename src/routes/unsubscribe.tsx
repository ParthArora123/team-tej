import { useEffect, useState } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search['token'] === "string" ? (search['token'] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Unsubscribe — Tejas D Dhoke" },
      { name: "description", content: "Manage your email preferences for updates from Tejas D Dhoke." },
      { property: "og:title", content: "Unsubscribe — Tejas D Dhoke" },
      { property: "og:description", content: "Manage your email preferences for updates from Tejas D Dhoke." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UnsubscribePage,
});

type State = "loading" | "valid" | "invalid" | "used" | "done" | "error";

function UnsubscribePage() {
  const { token } = useSearch({ from: "/unsubscribe" });
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok || body?.valid === false) {
          setState(body?.reason === "used" || body?.used ? "used" : "invalid");
          return;
        }
        setState(body?.used ? "used" : "valid");
      })
      .catch(() => setState("error"));
  }, [token]);

  const confirm = async () => {
    setBusy(true);
    try {
      const r = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setState(r.ok ? "done" : "error");
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-svh flex items-center justify-center px-5 py-20 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Email preferences</p>
        <h1 className="mt-3 text-2xl font-display font-bold">Unsubscribe</h1>

        {state === "loading" && (
          <p className="mt-4 text-sm text-muted-foreground">Checking your link…</p>
        )}
        {state === "valid" && (
          <>
            <p className="mt-4 text-sm text-muted-foreground">
              Confirm that you no longer wish to receive emails from Tejas D Dhoke.
            </p>
            <button
              onClick={confirm}
              disabled={busy}
              className="mt-6 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-60"
            >
              {busy ? "Please wait…" : "Confirm unsubscribe"}
            </button>
          </>
        )}
        {state === "used" && (
          <p className="mt-4 text-sm text-muted-foreground">
            You have already been unsubscribed. No further emails will be sent.
          </p>
        )}
        {state === "done" && (
          <p className="mt-4 text-sm text-muted-foreground">
            You&apos;re unsubscribed. We won&apos;t email you again.
          </p>
        )}
        {state === "invalid" && (
          <p className="mt-4 text-sm text-muted-foreground">
            This unsubscribe link is invalid or has expired.
          </p>
        )}
        {state === "error" && (
          <p className="mt-4 text-sm text-destructive">
            Something went wrong. Please try again later.
          </p>
        )}
      </div>
    </main>
  );
}

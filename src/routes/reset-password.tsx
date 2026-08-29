import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useServerFn } from "@tanstack/react-start";
import { validateResetToken, submitPasswordReset } from "@/lib/password-reset.functions";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>): { token?: string } =>
    typeof s.token === "string" && s.token ? { token: s.token } : {},
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset Password | Tejas D Dhoke" },
      { name: "description", content: "Set a new password for your Tejas D Dhoke account and get back to your classes and workshops." },
      { property: "og:title", content: "Reset Password | Tejas D Dhoke" },
      { property: "og:description", content: "Set a new password for your Tejas D Dhoke account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const INVALID_MSG =
  "Your password reset link is invalid or has expired. Please request a new password reset link.";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const check = useServerFn(validateResetToken);
  const submitReset = useServerFn(submitPasswordReset);

  const [state, setState] = useState<"checking" | "valid" | "invalid" | "done">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!token) { setState("invalid"); return; }
    check({ data: { token } })
      .then((r) => { if (!cancelled) setState(r.valid ? "valid" : "invalid"); })
      .catch(() => { if (!cancelled) setState("invalid"); });
    return () => { cancelled = true; };
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (!password || !confirm) { setErr("Please fill in both password fields."); return; }
    if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setErr("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await submitReset({ data: { token: token!, password } });
      if (!res.ok) {
        setErr(res.error ?? INVALID_MSG);
        if (res.error === INVALID_MSG) setState("invalid");
        return;
      }
      setState("done");
      setMsg("Password reset successfully. You can now log in with your new password.");
      setTimeout(() => navigate({ to: "/auth" }), 4000);
    } catch (e: any) {
      setErr(e?.message ?? "Could not update your password. Please request a new reset link.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-8"
      >
        <p className="text-xs uppercase tracking-widest text-primary">Tejas D Dhoke</p>
        <h1 className="font-display text-3xl font-bold mt-2">Set a new password</h1>

        {state === "checking" && (
          <p className="text-sm text-muted-foreground mt-2">Verifying your reset link…</p>
        )}

        {state === "invalid" && (
          <>
            <p className="text-sm text-muted-foreground mt-2">{INVALID_MSG}</p>
            <Link to="/forgot-password"
              className="mt-6 block w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-center">
              Request a new link
            </Link>
            <Link to="/auth" className="block text-center text-xs text-muted-foreground mt-4">← Back to sign in</Link>
          </>
        )}

        {state === "valid" && (
          <>
            <p className="text-sm text-muted-foreground mt-1">Choose a new password for your account.</p>
            <form onSubmit={submit} className="mt-6 space-y-3">
              <input type="password" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              <input type="password" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
              {err && <p className="text-xs text-destructive">{err}</p>}
              {msg && <p className="text-xs text-primary">{msg}</p>}
              <button disabled={loading} className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-60">
                {loading ? "Updating…" : "Reset Password"}
              </button>
            </form>
            <Link to="/auth" className="block text-center text-xs text-muted-foreground mt-4">← Back to sign in</Link>
          </>
        )}
      </motion.div>
    </div>
  );
}

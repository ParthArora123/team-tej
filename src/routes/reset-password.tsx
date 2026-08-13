import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
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

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setErr("Passwords do not match."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg("Password updated successfully. Redirecting…");
      setTimeout(() => navigate({ to: "/dashboard" }), 1200);
    } catch (e: any) {
      setErr(e.message ?? "Could not update your password. Please request a new reset link.");
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
        <p className="text-sm text-muted-foreground mt-1">
          {ready
            ? "Choose a new password for your account."
            : "Open this page from the reset link in your email to continue."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input type="password" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
            placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <input type="password" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
            placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
          {err && <p className="text-xs text-destructive">{err}</p>}
          {msg && <p className="text-xs text-primary">{msg}</p>}
          <button disabled={loading || !ready} className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-60">
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>

        <Link to="/auth" className="block text-center text-xs text-muted-foreground mt-4">← Back to sign in</Link>
      </motion.div>
    </div>
  );
}

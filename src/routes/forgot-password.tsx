import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { useServerFn } from "@tanstack/react-start";
import { requestPasswordReset } from "@/lib/password-reset.functions";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({
    meta: [
      { title: "Forgot Password | Tejas D Dhoke" },
      { name: "description", content: "Request a secure password reset link for your Tejas D Dhoke account." },
      { property: "og:title", content: "Forgot Password | Tejas D Dhoke" },
      { property: "og:description", content: "Request a secure password reset link for your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function ForgotPasswordPage() {
  const send = useServerFn(requestPasswordReset);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null); setLoading(true);
    try {
      await send({ data: { email } });
      setMsg("If an account exists for that email, a password reset link is on its way. Check your inbox and spam folder. The link expires in 30 minutes.");
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-8"
      >
        <p className="text-xs uppercase tracking-widest text-primary">Tejas D Dhoke</p>
        <h1 className="font-display text-3xl font-bold mt-2">Reset password</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your registered email and we'll send you a secure reset link.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input type="email" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
            placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {err && <p className="text-xs text-destructive">{err}</p>}
          {msg && <p className="text-xs text-primary">{msg}</p>}
          <button disabled={loading} className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-60">
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <Link to="/auth" className="block text-center text-sm text-muted-foreground hover:text-foreground mt-4">
          ← Back to sign in
        </Link>
      </motion.div>
    </div>
  );
}

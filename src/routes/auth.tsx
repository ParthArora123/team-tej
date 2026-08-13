import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string } =>
    typeof s.next === "string" && s.next ? { next: s.next } : {},
  head: () => ({
    meta: [
      { title: "Sign in — Tejas Dhoke" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});


// Only follow same-origin relative paths, and never bounce back to /auth itself.
function safeNext(next: string): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  if (next.startsWith("/auth")) return null;
  return next;
}

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const nextPath = safeNext(next ?? "");

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        if (nextPath) window.location.assign(nextPath);
        else navigate({ to: "/dashboard" });
      }
    });
  }, []);

  const switchMode = (m: "signin" | "signup" | "forgot") => {
    setMode(m); setErr(null); setMsg(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null); setMsg(null);
    try {
      const emailRedirect = nextPath
        ? `${window.location.origin}${nextPath}`
        : window.location.origin;

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMsg("If an account exists for that email, a password reset link is on its way. Check your inbox and spam folder.");
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: emailRedirect, data: { full_name: name, phone } },
        });
        if (error) throw error;
        if (!data.session) {
          // Fallback if confirmation is still required on the account.
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) {
            setMsg("Account created. Please check your email to confirm, then sign in.");
            return;
          }
        }
        setMsg("Account created. Signing you in…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMsg("Signed in successfully. Redirecting…");
      }
      if (nextPath) window.location.assign(nextPath);
      else navigate({ to: "/dashboard" });
    } catch (e: any) {
      setErr(e.message ?? "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };


  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-8"
      >
        <p className="text-xs uppercase tracking-widest text-primary">Tejas D Dhoke</p>
        <h1 className="font-display text-3xl font-bold mt-2">
          {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "signin"
            ? "Sign in to enroll and track your tickets."
            : mode === "signup"
              ? "Sign up to enroll in classes & workshops."
              : "Enter your email and we'll send you a secure reset link."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <>
              <input className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
              <input className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </>
          )}
          <input type="email" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
            placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {mode !== "forgot" && (
            <input type="password" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
              placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          )}
          {mode === "signin" && (
            <button type="button" onClick={() => switchMode("forgot")}
              className="block ml-auto text-xs text-primary hover:underline">
              Forgot password?
            </button>
          )}
          {err && <p className="text-xs text-destructive">{err}</p>}
          {msg && <p className="text-xs text-primary">{msg}</p>}
          <button disabled={loading} className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-60">
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </button>
        </form>

        {mode === "forgot" ? (
          <button onClick={() => switchMode("signin")}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground w-full">
            ← Back to sign in
          </button>
        ) : (
          <button onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground w-full">
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        )}
        <Link to="/" className="block text-center text-xs text-muted-foreground mt-3">← Back to home</Link>
      </motion.div>
    </div>
  );
}

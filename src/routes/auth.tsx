import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/dashboard" }); });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name, phone } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      setErr(e.message ?? "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-8"
      >
        <p className="text-xs uppercase tracking-widest text-primary">Team Tej</p>
        <h1 className="font-display text-3xl font-bold mt-2">
          {mode === "signin" ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "signin" ? "Sign in to enroll and track your tickets." : "Sign up to enroll in classes & workshops."}
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
          <input type="password" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
            placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          {err && <p className="text-xs text-destructive">{err}</p>}
          <button disabled={loading} className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium">
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground w-full">
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
        <Link to="/" className="block text-center text-xs text-muted-foreground mt-3">← Back to home</Link>
      </motion.div>
    </div>
  );
}

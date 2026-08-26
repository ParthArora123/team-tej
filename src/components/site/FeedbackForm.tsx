import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Star, Send, Check } from "lucide-react";
import { submitFeedback } from "@/lib/testimonials.functions";
import { supabase } from "@/integrations/supabase/client";

export function FeedbackForm() {
  const submit = useServerFn(submitFeedback);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [story, setStory] = useState("");
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) return;
      const meta = (u.user_metadata ?? {}) as Record<string, any>;
      setName(meta.full_name || meta.name || u.email?.split("@")[0] || "");
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErr(null);
    if (story.trim().length < 3) { setErr("Please share a few words about your experience."); return; }
    setBusy(true);
    try {
      await submit({ data: {
        name: normalizeName(name) || "Anonymous",
        role: role.trim() || null,
        story: story.trim(),
        rating,
        avatar_url: null,
      }});
      setDone(true);
      setStory("");
      setTimeout(() => setDone(false), 4000);
    } catch (e: any) {
      setErr(e?.message || "Could not submit feedback.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-12 rounded-2xl border border-border bg-card p-6 lg:p-8">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-widest text-primary">Share your experience</p>
        <h2 className="font-display text-2xl lg:text-3xl font-bold mt-1">Leave feedback</h2>
        <p className="text-sm text-muted-foreground mt-1">Your review appears instantly on the homepage under "What movers say".</p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="block text-xs text-muted-foreground mb-1">Your name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <label className="text-sm">
            <span className="block text-xs text-muted-foreground mb-1">Role (optional)</span>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              maxLength={120}
              placeholder="Student · Mumbai"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
        </div>

        <div>
          <span className="block text-xs text-muted-foreground mb-2">Rating</span>
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onMouseEnter={() => setHover(n)}
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className="p-1"
              >
                <Star
                  size={26}
                  className={(hover || rating) >= n ? "fill-primary text-primary" : "text-muted-foreground/50"}
                />
              </button>
            ))}
          </div>
        </div>

        <label className="text-sm">
          <span className="block text-xs text-muted-foreground mb-1">Your feedback</span>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            maxLength={2000}
            required
            rows={4}
            placeholder="Tell us what stood out…"
            className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
          />
        </label>

        {err && <p className="text-xs text-destructive">{err}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
          >
            {done ? <Check size={16} /> : <Send size={16} />}
            {done ? "Thanks for sharing!" : busy ? "Submitting…" : "Submit feedback"}
          </button>
        </div>
      </form>
    </section>
  );
}

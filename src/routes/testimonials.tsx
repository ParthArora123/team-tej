import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Quote, Play, Video } from "lucide-react";

export const Route = createFileRoute("/testimonials")({
  head: () => ({
    meta: [
      { title: "Testimonials — Tejas D Dhoke" },
      {
        name: "description",
        content:
          "Stories from Tejas D Dhoke dancers — share your own video testimonial about your journey.",
      },
      { property: "og:title", content: "Testimonials — Tejas D Dhoke" },
      {
        property: "og:description",
        content: "Hear from the movers who built their craft at Tejas D Dhoke.",
      },
    ],
  }),
  component: Testimonials,
});

interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  video: string; // data URL
  createdAt: number;
}

const STORAGE_KEY = "tt_testimonials_v1";
const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

const seed: Testimonial[] = [

];

function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>(seed);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [video, setVideo] = useState<string>("");
  const [videoName, setVideoName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Testimonial[] = JSON.parse(raw);
        setItems([...parsed, ...seed]);
      }
    } catch {}
  }, []);

  const persist = (list: Testimonial[]) => {
    const user = list.filter((t) => !t.id.startsWith("seed-"));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      setError("Storage full — try a shorter clip.");
    }
  };

  const onPick = (f: File | null) => {
    setError("");
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setError("Please choose a video file.");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("Video must be under 500 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setVideo(String(reader.result || ""));
      setVideoName(f.name);
    };
    reader.readAsDataURL(f);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !quote.trim()) {
      setError("Add your name and a short story.");
      return;
    }

    const next: Testimonial = {
      id: "u-" + Date.now().toString(36),
      name: name.trim(),
      role: role.trim() || "Student",
      quote: quote.trim(),
      video,
      createdAt: Date.now(),
    };
    const updated = [next, ...items];
    setItems(updated);
    persist(updated);
    setName("");
    setRole("");
    setQuote("");
    setVideo("");
    setVideoName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const remove = (id: string) => {
    const updated = items.filter((t) => t.id !== id);
    setItems(updated);
    persist(updated);
  };

  return (
    <>
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs uppercase tracking-widest text-primary">Testimonials</p>
          <h1 className="mt-3 font-display text-5xl lg:text-7xl font-bold leading-[1.05] max-w-4xl">
            Words from<br />the floor.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            Real stories from students and workshop alumni. Share your own — record a
            short clip, drop a few lines, and we'll add it to the wall.
          </p>
        </motion.div>
      </section>

      {/* Upload */}
      <section className="max-w-3xl mx-auto px-6 lg:px-10 pb-16">
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border bg-card p-6 sm:p-8"
        >
          <div className="flex items-center gap-2 text-primary">
            <Video size={18} />
            <span className="text-xs uppercase tracking-widest font-semibold">
              Share your story
            </span>
          </div>

          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Batch / role
              </span>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Fusion · 1 year"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none text-sm"
              />
            </label>
          </div>

          <label className="block mt-3">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Your story
            </span>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="What changed for you at Tejas D Dhoke?"
              rows={3}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none text-sm resize-none"
            />
          </label>

          <div className="mt-3">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Video (optional, max 500 MB)
            </span>
            <div className="mt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted hover:bg-secondary text-sm border border-border"
              >
                <Upload size={14} /> {videoName ? "Change video" : "Choose video"}
              </button>
              {videoName && (
                <span className="text-xs text-muted-foreground truncate">{videoName}</span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => onPick(e.target.files?.[0] || null)}
              />
            </div>
            {video && (
              <video
                src={video}
                controls
                preload="metadata"
                className="mt-3 w-full max-h-64 rounded-lg bg-jet"
              />
            )}
          </div>

          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            className="mt-5 w-full sm:w-auto px-5 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition text-sm"
          >
            Post testimonial
          </button>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Video is optional. Any uploaded videos are stored locally in your browser for this demo.
          </p>
        </motion.form>
      </section>

      {/* Wall */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-24 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {items.map((t, i) => (
            <motion.article
              key={t.id}
              layout
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 6) * 0.05 }}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl border border-border bg-card overflow-hidden hover:border-primary transition-colors"
            >
              {t.video ? (
                <video
                  src={t.video}
                  controls
                  preload="none"
                  className="w-full aspect-video bg-jet object-contain"
                />
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
                  <Play className="text-primary/60" size={36} />
                </div>
              )}
              <div className="p-5">
                <Quote className="text-primary" size={16} />
                <p className="mt-2 text-sm leading-relaxed">{t.quote}</p>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="font-display font-bold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                  {!t.id.startsWith("seed-") && (
                    <button
                      onClick={() => remove(t.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive"
                      aria-label="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </section>
    </>
  );
}

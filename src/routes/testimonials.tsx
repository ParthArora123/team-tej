import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Quote, Play, Video, Loader2 } from "lucide-react";
import {
  getTestimonials,
  submitTestimonial,
  createTestimonialUploadUrl,
} from "@/lib/testimonials.functions";

export const Route = createFileRoute("/testimonials")({
  head: () => ({
    meta: [
      { title: "Stories — Tejas D Dhoke" },
      {
        name: "description",
        content:
          "Stories from Tejas D Dhoke dancers — share your own video testimonial about your journey.",
      },
      { property: "og:title", content: "Stories — Tejas D Dhoke" },
      {
        property: "og:description",
        content: "Hear from the movers who built their craft at Tejas D Dhoke.",
      },
    ],
    links: [{ rel: "canonical", href: "https://tejasdhoke.com/testimonials" }],
  }),
  component: Testimonials,
});

interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  video_url?: string;
  createdAt: number;
}

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

function Testimonials() {
  const load = useServerFn(getTestimonials);
  const submit = useServerFn(submitTestimonial);
  const createUploadUrl = useServerFn(createTestimonialUploadUrl);

  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [videoRef, setVideoRef] = useState(""); // "bucket:key" storage ref
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(""); // signed playback URL
  const [videoName, setVideoName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    load({ data: undefined })
      .then((rows) => {
        if (mounted) setItems(rows);
      })
      .catch((e) => {
        if (mounted) setError(e?.message || "Could not load stories");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [load]);

  const reset = () => {
    setName("");
    setRole("");
    setQuote("");
    setVideoRef("");
    setVideoPreviewUrl("");
    setVideoName("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const onPick = async (f: File | null) => {
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

    setUploading(true);
    try {
      const { bucket, path, token, ref } = await createUploadUrl({
        data: { filename: f.name, contentType: f.type },
      });
      const { error: upErr } = await import("@/integrations/supabase/client").then(
        ({ supabase }) => supabase.storage.from(bucket).uploadToSignedUrl(path, token, f, {
          contentType: f.type,
          upsert: false,
        })
      );
      if (upErr) throw upErr;
      setVideoRef(ref);
      setVideoName(f.name);
      // Generate a temporary local preview for the form.
      setVideoPreviewUrl(URL.createObjectURL(f));
    } catch (e: any) {
      setError(e?.message || "Video upload failed. Please try again.");
      setVideoRef("");
      setVideoName("");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !quote.trim()) {
      setError("Add your name and a short story.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submit({
        data: {
          name: name.trim(),
          role: role.trim() || "Student",
          quote: quote.trim(),
          video_url: videoRef || undefined,
        },
      });
      const updated = await load({ data: undefined });
      setItems(updated);
      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 4000);
    } catch (e: any) {
      setError(e?.message || "Could not post your story.");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    // Only admins can delete stories in the backend; the client removes from local UI optimistically.
    setItems((prev) => prev.filter((t) => t.id !== id));
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
          onSubmit={handleSubmit}
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
                disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted hover:bg-secondary text-sm border border-border disabled:opacity-60"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {videoName ? "Change video" : "Choose video"}
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
            {(videoPreviewUrl || videoRef) && (
              <video
                src={videoPreviewUrl || undefined}
                controls
                preload="metadata"
                className="mt-3 w-full max-h-64 rounded-lg bg-jet object-contain"
              />
            )}
          </div>

          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
          {success && (
            <p className="mt-3 text-xs text-green-600">Your story has been posted. Thank you!</p>
          )}

          <button
            type="submit"
            disabled={submitting || uploading}
            className="mt-5 w-full sm:w-auto px-5 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition text-sm disabled:opacity-60 inline-flex items-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Posting…" : "Post testimonial"}
          </button>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Video is optional. Approved stories are shared across the site.
          </p>
        </motion.form>
      </section>

      {/* Wall */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-24 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading && (
          <div className="md:col-span-2 lg:col-span-3 flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 text-center py-16 text-muted-foreground">
            No stories yet. Be the first to share yours.
          </div>
        )}
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
              {t.video_url ? (
                <video
                  src={t.video_url}
                  controls
                  preload="none"
                  className="w-full aspect-video bg-jet object-contain"
                />
              ) : null}

              <div className="p-5">
                <Quote className="text-primary" size={16} />
                <p className="mt-2 text-sm leading-relaxed">{t.quote}</p>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="font-display font-bold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                  <button
                    onClick={() => remove(t.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive"
                    aria-label="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </section>
    </>
  );
}

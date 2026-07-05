import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { Mail, Phone, MapPin, MessageCircle, Send, Check } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { submitContactMessage } from "@/lib/contact.functions";
import { getSiteContent } from "@/lib/site-content.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Tejas D Dhoke" },
      {
        name: "description",
        content:
          "Get in touch with Tejas D Dhoke for classes, performance bookings, or collaborations.",
      },
      { property: "og:title", content: "Contact — Tejas D Dhoke" },
      {
        property: "og:description",
        content: "Reach out for classes, bookings, or collabs.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const send = useServerFn(submitContactMessage);
  const loadContent = useServerFn(getSiteContent);
  const [info, setInfo] = useState<any>({
    email: "hello@teamtej.com", phone: "+91 98765 43210", whatsapp: "+91 98765 43210",
    address: "12 Linking Road, Bandra West, Mumbai 400050",
    hours_line1: "Monday – Saturday · 9:00 AM – 10:00 PM",
    hours_line2: "Sunday · By appointment",
  });
  useEffect(() => {
    loadContent({ data: { key: "contact" } }).then((v: any) => v && setInfo({ ...info, ...v })).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      subject: String(fd.get("subject") ?? "").trim() || null,
      message: String(fd.get("message") ?? "").trim(),
    };
    if (!payload.name || !payload.email || !payload.message) {
      toast.error("Name, email, and message are required.");
      return;
    }
    setBusy(true);
    try {
      await send({ data: payload });
      setSent(true);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send message. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <p className="text-xs uppercase tracking-widest text-primary">Contact</p>
        <h1 className="mt-3 font-display text-5xl lg:text-7xl font-bold leading-[1.05] text-balance max-w-4xl">
          Let's talk movement.
        </h1>
      </motion.div>

      <div className="mt-16 grid lg:grid-cols-5 gap-12 lg:gap-20">
        <div className="lg:col-span-2 space-y-8">
          {[
            { icon: Mail, label: "Email", value: "hello@teamtej.com" },
            { icon: Phone, label: "Phone", value: "+91 98765 43210" },
            { icon: MapPin, label: "Studio", value: "12 Linking Road, Bandra West, Mumbai 400050" },
          ].map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-4"
            >
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <c.icon size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {c.label}
                </p>
                <p className="mt-1 text-base">{c.value}</p>
              </div>
            </motion.div>
          ))}

          <div className="pt-6 border-t border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Studio hours
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Monday – Saturday · 9:00 AM – 10:00 PM<br />
              Sunday · By appointment
            </p>
          </div>
        </div>

        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-3 p-8 lg:p-10 rounded-2xl border border-border bg-card space-y-5"
        >
          {sent ? (
            <div className="py-10 text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center">
                <Check className="text-primary" size={28} />
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold">Message sent.</h3>
              <p className="mt-2 text-muted-foreground">We'll be in touch within 24 hours.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Name" name="name" required />
                <Field label="Email" name="email" type="email" required />
              </div>
              <Field label="Subject" name="subject" />
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  maxLength={4000}
                  className="mt-2 w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary outline-none transition resize-none"
                  placeholder="Tell us what you're after — a class, a booking, a collab..."
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-60"
              >
                <Send size={16} /> {busy ? "Sending..." : "Send message"}
              </button>
            </>
          )}
        </motion.form>
      </div>
    </section>
  );
}

function Field({
  label,
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <input
        {...rest}
        className="mt-2 w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary outline-none transition"
      />
    </div>
  );
}

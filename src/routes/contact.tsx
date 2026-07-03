import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { Mail, Phone, MapPin, Send, Check } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Tejas Dhoke" },
      {
        name: "description",
        content:
          "Get in touch with Tejas Dhoke for classes, performance bookings, or collaborations.",
      },
      { property: "og:title", content: "Contact — Tejas Dhoke" },
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

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
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
                  required
                  rows={5}
                  className="mt-2 w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary outline-none transition resize-none"
                  placeholder="Tell us what you're after — a class, a booking, a collab..."
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
              >
                <Send size={16} /> Send message
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

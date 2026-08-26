import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { Mail, Phone, MapPin, MessageCircle, Send, Check } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { cachedCall } from "@/lib/public-data-cache";
import { toast } from "sonner";
import { submitContactMessage } from "@/lib/contact.functions";
import { isValidName, normalizeName, NAME_ERROR_MESSAGE, NAME_MAX_LENGTH } from "@/lib/name-validation";
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
    links: [{ rel: "canonical", href: "https://tejasdhoke.com/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [messageText, setMessageText] = useState("");
  const send = useServerFn(submitContactMessage);
  const loadContent = useServerFn(getSiteContent);
  const [info, setInfo] = useState<any>({
    email: "hello@teamtej.com", phone: "+91 98765 43210", whatsapp: "+91 98765 43210",
    address: "12 Linking Road, Bandra West, Mumbai 400050",
    hours_line1: "Monday – Saturday · 9:00 AM – 10:00 PM",
    hours_line2: "Sunday · By appointment",
  });
  useEffect(() => {
    cachedCall("siteContent:contact", () => loadContent({ data: { key: "contact" } })).then((v: any) => v && setInfo({ ...info, ...v })).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const waNumber = String(info.whatsapp ?? "").replace(/[^\d]/g, "");
  const waText = messageText.trim() || "Hi! I would like to know more about your dance classes and workshops.";
  const waHref = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}` : undefined;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: normalizeName(String(fd.get("name") ?? "")),
      email: String(fd.get("email") ?? "").trim(),
      subject: String(fd.get("subject") ?? "").trim() || null,
      message: String(fd.get("message") ?? "").trim(),
    };
    if (!payload.name || !payload.email || !payload.message) {
      toast.error("Name, email, and message are required.");
      return;
    }
    if (!isValidName(payload.name)) {
      toast.error(NAME_ERROR_MESSAGE);
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
    <section className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-28 pb-32">
      <div
        aria-hidden
        className="absolute -top-10 right-0 h-[520px] w-[520px] max-w-full rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: "var(--gradient-primary)" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative"
      >
        <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-primary">
          <span aria-hidden className="h-px w-8 bg-primary/60" />
          Contact
        </p>
        <h1 className="mt-5 font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.02] text-balance max-w-4xl">
          Let's talk <span className="gradient-text">movement</span>.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Classes, bookings, collaborations — we usually reply within a day.
        </p>
      </motion.div>

      <div className="mt-16 grid lg:grid-cols-5 gap-10 lg:gap-16">
        <div className="lg:col-span-2 space-y-4">
          {[
            { icon: Mail, label: "Email", value: info.email, href: info.email ? `mailto:${info.email}` : undefined },
            { icon: Phone, label: "Phone", value: info.phone, href: info.phone ? `tel:${String(info.phone).replace(/[^+\d]/g, "")}` : undefined },
            { icon: MessageCircle, label: "WhatsApp", value: info.whatsapp, href: waHref, isWa: true },
            { icon: MapPin, label: "Studio", value: info.address },
          ].filter((c) => c.value).map((c: any, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="group flex gap-4 p-5 rounded-2xl glass-card hover-lift"
            >
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "color-mix(in oklab, var(--primary) 15%, transparent)",
                  color: "var(--primary)",
                }}
              >
                <c.icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {c.label}
                </p>
                {c.href ? (
                  <a
                    href={c.href}
                    target={c.isWa ? "_blank" : undefined}
                    rel={c.isWa ? "noreferrer" : undefined}
                    className="mt-1 inline-flex items-center gap-2 text-base hover:text-primary transition break-words"
                  >
                    <span>{c.value}</span>
                    {c.isWa && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#25D366]/15 text-[#25D366]">
                        <MessageCircle size={12} /> Chat
                      </span>
                    )}
                  </a>
                ) : (
                  <p className="mt-1 text-base">{c.value}</p>
                )}
              </div>
            </motion.div>
          ))}

          <div className="p-5 rounded-2xl border border-border/60">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Studio hours
            </p>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {info.hours_line1}{info.hours_line2 ? <><br />{info.hours_line2}</> : null}
            </p>
          </div>
        </div>

        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="lg:col-span-3 relative p-8 lg:p-10 rounded-3xl glass-card space-y-5"
        >
          <div
            aria-hidden
            className="absolute -top-px left-8 right-8 h-px opacity-70"
            style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }}
          />
          {sent ? (
            <div className="py-12 text-center">
              <div
                className="mx-auto h-16 w-16 rounded-full flex items-center justify-center"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
              >
                <Check className="text-primary-foreground" size={30} />
              </div>
              <h3 className="mt-6 font-display text-3xl font-bold">Message sent.</h3>
              <p className="mt-2 text-muted-foreground">We'll be in touch within 24 hours.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Name" name="name" required maxLength={NAME_MAX_LENGTH} title={NAME_ERROR_MESSAGE} />
                <Field label="Email" name="email" type="email" required />
              </div>
              <Field label="Subject" name="subject" />
              <div>
                <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  maxLength={4000}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="mt-2 w-full bg-background/40 backdrop-blur-md border border-border rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
                  placeholder="Tell us what you're after — a class, a booking, a collab..."
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="shine-sweep inline-flex items-center gap-2 h-12 px-8 rounded-full font-medium tracking-wide text-primary-foreground disabled:opacity-60 transition-all hover:-translate-y-0.5 hover:brightness-110"
                  style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
                >
                  <Send size={16} /> {busy ? "Sending..." : "Send message"}
                </button>
                {waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-border bg-background/40 backdrop-blur-md text-sm hover:border-primary/40 hover:text-primary transition"
                  >
                    <MessageCircle size={15} /> WhatsApp instead
                  </a>
                )}
              </div>
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
      <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </label>
      <input
        {...rest}
        className="mt-2 w-full bg-background/40 backdrop-blur-md border border-border rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
      />
    </div>
  );
}

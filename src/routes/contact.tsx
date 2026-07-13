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
            { icon: Mail, label: "Email", value: info.email, href: info.email ? `mailto:${info.email}` : undefined },
            { icon: Phone, label: "Phone", value: info.phone, href: info.phone ? `tel:${String(info.phone).replace(/[^+\d]/g, "")}` : undefined },
            { icon: MessageCircle, label: "WhatsApp", value: info.whatsapp, href: info.whatsapp ? `https://wa.me/${String(info.whatsapp).replace(/[^\d]/g, "")}` : undefined },
            { icon: MapPin, label: "Studio", value: info.address },
          ].filter((c) => c.value).map((c, i) => (
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
                {c.href ? (
                  <a href={c.href} target={c.label === "WhatsApp" ? "_blank" : undefined} rel="noreferrer"
                    className="mt-1 text-base hover:text-primary transition break-words">{c.value}</a>
                ) : (
                  <p className="mt-1 text-base">{c.value}</p>
                )}
              </div>
            </motion.div>
          ))}

          <div className="pt-6 border-t border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Studio hours
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {info.hours_line1}{info.hours_line2 ? <><br />{info.hours_line2}</> : null}
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

const DEFAULT_WA_MESSAGE = "Hi! I would like to know more about your dance classes and workshops.";

function buildWhatsAppUrl(number: string, text: string) {
  const digits = String(number ?? "").replace(/[^\d]/g, "");
  const body = (text ?? "").trim() || DEFAULT_WA_MESSAGE;
  return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.004 2.003c-5.523 0-10 4.477-10 10 0 1.762.463 3.484 1.343 5.001L2 22l5.13-1.343A9.96 9.96 0 0 0 12.005 22c5.523 0 10-4.477 10-10s-4.478-9.997-10-9.997zm5.831 15.83A8.28 8.28 0 0 1 12.005 20.3a8.26 8.26 0 0 1-4.22-1.156l-.303-.18-3.045.797.813-2.966-.198-.306a8.263 8.263 0 0 1-1.263-4.383c0-4.573 3.723-8.296 8.301-8.296a8.238 8.238 0 0 1 5.867 2.433 8.226 8.226 0 0 1 2.433 5.866c0 4.573-3.723 8.296-8.301 8.296z"/>
    </svg>
  );
}


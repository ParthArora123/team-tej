import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, Mail, ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";

const explore = [
  { to: "/", label: "Home" },
  { to: "/workshops", label: "Workshops" },
  { to: "/" as const, hash: "showcase" as const, label: "Viral Choreographies" },
  { to: "/about", label: "About" },
] as const;

const connect = [
  { href: "https://instagram.com/tejasdhoke", label: "Instagram", icon: Instagram, external: true },
  { href: "https://youtube.com/@tejasdhoke", label: "YouTube", icon: Youtube, external: true },
  { href: "https://wa.me/919876543210", label: "WhatsApp", icon: WhatsAppIcon, external: true },
  { href: "mailto:hello@teamtej.com", label: "Email", icon: Mail, external: false },
] as const;

export function Footer() {
  return (
    <footer className="relative mt-24 md:mt-32 overflow-hidden">
      {/* Subtle top divider — anchors the footer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--border), transparent)" }}
      />

      {/* Soft warm light wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[40rem] w-[40rem] rounded-full opacity-30 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--beige) 55%, transparent), transparent 70%)",
        }}
      />


      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pb-8">
        {/* Main CTA Card — warm invitation */}
        <div className="relative rounded-[2rem] md:rounded-[2.5rem] border border-border bg-surface/70 backdrop-blur-sm p-10 md:p-14 lg:p-18 text-center shadow-[0_24px_70px_-30px_rgba(0,0,0,0.08)]">
          {/* Soft gradient wash behind the card */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-40"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in oklab, var(--beige) 50%, transparent), transparent 65%), radial-gradient(ellipse 70% 50% at 80% 100%, color-mix(in oklab, var(--platinum) 35%, transparent), transparent 60%)",
            }}
          />
          <div className="relative">
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-foreground">
              COME DANCE WITH US.
            </h2>
            <p className="mt-4 text-[15px] md:text-[17px] text-muted-foreground max-w-md mx-auto leading-relaxed">
              Learn. Connect. Create unforgettable moments.
            </p>
            <Link
              to="/workshops"
              className="group mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3.5 text-[14px] font-semibold transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5"
            >
              Register for a Workshop
              <ArrowRight
                size={16}
                strokeWidth={2.5}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>

        {/* Main footer grid */}
        <div className="mt-16 md:mt-20 grid gap-12 md:grid-cols-12">
          {/* Brand area */}
          <div className="md:col-span-5">
            <Link to="/" className="group inline-flex items-center gap-2.5">
              <span
                aria-hidden
                className="relative inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: "var(--gradient-primary)" }}
              >
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full blur-md opacity-70"
                  style={{ background: "var(--gradient-primary)" }}
                />
              </span>
              <span className="font-display font-bold text-lg tracking-tight">Tejas D Dhoke</span>
            </Link>
            <p className="mt-3 text-[14px] text-muted-foreground leading-relaxed">
              Dance • Choreography • Workshops
            </p>
            <p className="mt-5 text-[14px] text-muted-foreground max-w-sm leading-relaxed">
              Training movers, choreographing stages, and shaping India's next generation of
              performers.
            </p>
          </div>

          {/* Explore */}
          <div className="md:col-span-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-4">Explore</p>
            <ul className="space-y-2.5 text-[14px]">
              {explore.map((l) => (
                <li key={`${l.to}${(l as any).hash ?? ""}`}>
                  <Link
                    to={l.to as any}
                    hash={(l as any).hash}
                    className="group inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="relative">
                      {l.label}
                      <span className="absolute left-0 -bottom-px h-px w-0 bg-foreground transition-all duration-300 group-hover:w-full" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div className="md:col-span-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-4">Connect</p>
            <ul className="space-y-2.5 text-[14px]">
              {connect.map((c) => {
                const Icon = c.icon;
                return (
                  <li key={c.label}>
                    <a
                      href={c.href}
                      target={c.external ? "_blank" : undefined}
                      rel={c.external ? "noopener noreferrer" : undefined}
                      className="group inline-flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-background/70 group-hover:border-primary/30 transition-colors">
                        <Icon size={13} />
                      </span>
                      <span className="relative">
                        {c.label}
                        <span className="absolute left-0 -bottom-px h-px w-0 bg-foreground transition-all duration-300 group-hover:w-full" />
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Large editorial brand mark — subtle, premium */}
        <div className="mt-16 md:mt-20 overflow-hidden">
          <p
            className="font-display text-[13vw] sm:text-[10vw] md:text-[8vw] lg:text-[7vw] leading-[0.85] tracking-tighter text-foreground/[0.06] text-center select-none"
            aria-hidden
          >
            TEJAS D DHOKE
          </p>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 md:mt-16 border-t border-border">
          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>© 2026 Tejas D Dhoke</span>
            <span className="flex items-center gap-2">
              <span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span>
              <span aria-hidden>·</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Terms & Conditions</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, Mail, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-32">
      {/* Aurora divider */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--primary), var(--accent-cyan), transparent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-40 opacity-30 blur-3xl"
        style={{ background: "radial-gradient(60% 100% at 50% 100%, var(--primary), transparent 70%)" }}
      />

      <div className="border-t border-border/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 grid gap-12 md:grid-cols-12">
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
              <span className="font-display font-bold text-base tracking-tight">Tejas D Dhoke</span>
            </Link>
            <p className="mt-5 text-[15px] text-muted-foreground max-w-sm leading-relaxed">
              A fusion dance company training movers, choreographing stages, and shaping India's
              next generation of performers.
            </p>
            <Link
              to="/contact"
              className="mt-7 group inline-flex items-center gap-2 text-sm font-medium"
            >
              <span className="gradient-text">Get in touch</span>
              <ArrowUpRight size={14} className="text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="md:col-span-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-4">Explore</p>
            <ul className="space-y-2.5 text-[14px]">
              <li><Link to="/workshops" className="text-muted-foreground hover:text-foreground transition-colors">Workshops</Link></li>
              <li><Link to="/zero-to-hero" className="text-muted-foreground hover:text-foreground transition-colors">Zero to Hero</Link></li>
              <li><Link to="/online-trainings" className="text-muted-foreground hover:text-foreground transition-colors">Online Trainings</Link></li>
              <li><Link to="/testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-4">Company</p>
            <ul className="space-y-2.5 text-[14px]">
              <li><Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-4">Follow</p>
            <div className="flex gap-2">
              <a href="#" aria-label="Instagram" className="p-2.5 rounded-full border border-border bg-background/70 hover:border-primary/50 hover:text-primary hover:-translate-y-0.5 transition">
                <Instagram size={15} />
              </a>
              <a href="#" aria-label="YouTube" className="p-2.5 rounded-full border border-border bg-background/70 hover:border-primary/50 hover:text-primary hover:-translate-y-0.5 transition">
                <Youtube size={15} />
              </a>
              <a href="mailto:hello@teamtej.com" aria-label="Email" className="p-2.5 rounded-full border border-border bg-background/70 hover:border-primary/50 hover:text-primary hover:-translate-y-0.5 transition">
                <Mail size={15} />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-border/60">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-wrap gap-2 justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>© {new Date().getFullYear()} Tejas D Dhoke Dance Company</span>
            <span>Crafted with movement.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

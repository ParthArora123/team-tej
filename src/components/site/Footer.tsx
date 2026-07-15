import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, Mail, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }}
      />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: "var(--gradient-primary)" }}
            />
            <span className="font-display font-bold text-base tracking-tight">Tejas D Dhoke</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground max-w-sm leading-relaxed">
            A fusion dance company training movers, choreographing stages, and shaping India&apos;s
            next generation of performers.
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium gradient-text hover:gap-2.5 transition-all"
          >
            Get in touch <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="md:col-span-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">Explore</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/workshops" className="hover:text-primary transition-colors">Workshops</Link></li>
            <li><Link to="/zero-to-hero" className="hover:text-primary transition-colors">Zero to Hero</Link></li>
            <li><Link to="/online-trainings" className="hover:text-primary transition-colors">Online Trainings</Link></li>
            <li><Link to="/testimonials" className="hover:text-primary transition-colors">Testimonials</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">Company</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/about" className="hover:text-primary transition-colors">About</Link></li>
            <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">Follow</p>
          <div className="flex gap-2">
            <a href="#" aria-label="Instagram" className="p-2 rounded-full border border-border hover:border-primary hover:text-primary transition">
              <Instagram size={15} />
            </a>
            <a href="#" aria-label="YouTube" className="p-2 rounded-full border border-border hover:border-primary hover:text-primary transition">
              <Youtube size={15} />
            </a>
            <a href="mailto:hello@teamtej.com" aria-label="Email" className="p-2 rounded-full border border-border hover:border-primary hover:text-primary transition">
              <Mail size={15} />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-wrap gap-2 justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Tejas D Dhoke Dance Company</span>
          <span>Crafted with movement.</span>
        </div>
      </div>
    </footer>
  );
}

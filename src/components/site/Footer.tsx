import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border mt-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="font-display font-bold text-lg">TEAM TEJ</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground max-w-sm">
            A fusion dance company training movers, choreographing stages, and shaping
            India's next generation of performers.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
            Explore
          </p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/classes" className="hover:text-primary transition">Classes</Link></li>
            <li><Link to="/events" className="hover:text-primary transition">Events</Link></li>
            <li><Link to="/about" className="hover:text-primary transition">About</Link></li>
            <li><Link to="/contact" className="hover:text-primary transition">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
            Follow
          </p>
          <div className="flex gap-3">
            <a href="#" className="p-2 rounded-full border border-border hover:border-primary hover:text-primary transition" aria-label="Instagram">
              <Instagram size={16} />
            </a>
            <a href="#" className="p-2 rounded-full border border-border hover:border-primary hover:text-primary transition" aria-label="YouTube">
              <Youtube size={16} />
            </a>
            <a href="mailto:hello@teamtej.com" className="p-2 rounded-full border border-border hover:border-primary hover:text-primary transition" aria-label="Email">
              <Mail size={16} />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-wrap gap-2 justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Team Tej Dance Company</span>
          <span>Crafted with movement.</span>
        </div>
      </div>
    </footer>
  );
}

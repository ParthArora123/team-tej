import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { to: "/", label: "Home" },
  { to: "/workshops", label: "Workshops" },
  { to: "/zero-to-hero", label: "Zero to Hero" },
  { to: "/online-trainings", label: "Online" },
  { to: "/testimonials", label: "Stories" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-background/75 border-b border-border shadow-[0_8px_30px_-12px_rgb(0_0_0_/_0.15)]"
          : "backdrop-blur-md bg-background/40 border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-full transition-transform group-hover:scale-125"
            style={{ background: "var(--gradient-primary)" }}
          />
          <span className="font-display font-bold tracking-tight text-[15px]">Tejas D Dhoke</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="relative px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors group"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
              <span
                aria-hidden
                className="absolute left-3 right-3 -bottom-0.5 h-px scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
                style={{ background: "var(--gradient-primary)" }}
              />
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <ThemeToggle />
          {signedIn ? (
            <Link
              to="/dashboard"
              className="text-[13px] font-medium px-4 py-2 rounded-full text-primary-foreground hover:opacity-90 transition-opacity"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/auth"
              className="text-[13px] font-medium px-4 py-2 rounded-full text-primary-foreground hover:opacity-90 transition-opacity"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              Sign in
            </Link>
          )}
        </div>

        <div className="flex lg:hidden items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setOpen((o) => !o)}
            className="p-2 rounded-full hover:bg-muted/60"
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl px-6 py-4 flex flex-col gap-1"
        >
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="text-[15px] py-2 px-2 rounded-lg hover:bg-muted/60"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to={signedIn ? "/dashboard" : "/auth"}
            onClick={() => setOpen(false)}
            className="mt-2 text-[15px] py-2 px-4 rounded-full text-primary-foreground font-medium text-center"
            style={{ background: "var(--gradient-primary)" }}
          >
            {signedIn ? "My dashboard" : "Sign in"}
          </Link>
        </motion.div>
      )}
    </motion.header>
  );
}

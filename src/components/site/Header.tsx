import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";


const links = [
  { to: "/", label: "Home" },
  { to: "/workshops", label: "Workshops" },
  // { to: "/nritya-sadhana", label: "Nritya Sadhana" }, // Temporarily hidden — route stays active
  { to: "/zero-to-hero", label: "Zero to Hero" },
  { to: "/online-trainings", label: "Online Trainings" },
  { to: "/testimonials", label: "Testimonials" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="h-2 w-2 rounded-full bg-primary group-hover:scale-150 transition-transform" />
          <span className="font-display font-bold tracking-tight text-lg">Tejas&nbsp;D&nbsp;Dhoke</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <CartButton />
          {signedIn ? (
            <Link to="/dashboard" className="text-sm font-medium px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90">
              My dashboard
            </Link>
          ) : (
            <Link to="/auth" className="text-sm font-medium px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90">
              Sign in
            </Link>
          )}
        </div>

        <div className="flex lg:hidden items-center gap-1">
          <CartButton />

        <button onClick={() => setOpen((o) => !o)} className="lg:hidden p-2" aria-label="Toggle menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        </div>
      </div>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="lg:hidden border-t border-border bg-background/95 px-6 py-4 flex flex-col gap-3"
        >
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-base py-1">
              {l.label}
            </Link>
          ))}
          <Link to={signedIn ? "/dashboard" : "/auth"} onClick={() => setOpen(false)} className="text-base py-1 text-primary">
            {signedIn ? "My dashboard" : "Sign in"}
          </Link>
        </motion.div>
      )}
    </motion.header>
  );
}

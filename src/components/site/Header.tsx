import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
      className="fixed top-0 inset-x-0 z-50 pointer-events-none"
    >
      <div className={`mx-auto flex items-center justify-between gap-3 px-3 pointer-events-auto transition-all duration-500 ${
        scrolled ? "mt-3 max-w-6xl" : "mt-4 max-w-7xl"
      }`}>
        {/* Brand pill */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-background/60 backdrop-blur-xl px-4 h-11 shadow-[0_8px_30px_-12px_rgb(0_0_0_/_0.35)]"
        >
          <span
            aria-hidden
            className="relative inline-block h-2.5 w-2.5 rounded-full transition-transform group-hover:scale-125"
            style={{ background: "var(--gradient-primary)" }}
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-full blur-md opacity-70"
              style={{ background: "var(--gradient-primary)" }}
            />
          </span>
          <span className="font-display tracking-tight text-[14px] leading-none">
            Tejas <span className="opacity-60">D Dhoke</span>
          </span>
        </Link>

        {/* Nav pill */}
        <nav className="hidden lg:flex items-center gap-0.5 rounded-full border border-white/10 bg-background/60 backdrop-blur-xl px-1.5 h-11 shadow-[0_8px_30px_-12px_rgb(0_0_0_/_0.35)]">
          {links.map((l) => {
            const active = isActive(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className="relative px-3.5 h-8 flex items-center rounded-full text-[12.5px] tracking-wide text-muted-foreground hover:text-foreground transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "linear-gradient(135deg, color-mix(in oklab, var(--primary) 22%, transparent), color-mix(in oklab, var(--accent-cyan) 18%, transparent))",
                      border: "1px solid color-mix(in oklab, var(--primary) 35%, transparent)",
                    }}
                  />
                )}
                <span className={`relative ${active ? "text-foreground" : ""}`}>{l.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions pill */}
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-background/60 backdrop-blur-xl px-1.5 h-11 shadow-[0_8px_30px_-12px_rgb(0_0_0_/_0.35)]">
          <ThemeToggle />
          {signedIn ? (
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex items-center h-8 px-4 rounded-full text-[12.5px] font-medium text-primary-foreground hover:brightness-110 transition"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/auth"
              className="hidden sm:inline-flex items-center h-8 px-4 rounded-full text-[12.5px] font-medium text-primary-foreground hover:brightness-110 transition"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              Sign in
            </Link>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden p-2 rounded-full hover:bg-muted/40"
            aria-label="Toggle menu"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="lg:hidden pointer-events-auto mx-3 mt-2 rounded-3xl border border-white/10 bg-background/85 backdrop-blur-2xl p-3 shadow-[0_20px_60px_-20px_rgb(0_0_0_/_0.55)]"
          >
            <div className="flex flex-col">
              {links.map((l, i) => {
                const active = isActive(l.to);
                return (
                  <motion.div
                    key={l.to}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * i }}
                  >
                    <Link
                      to={l.to}
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-between text-[15px] py-2.5 px-3 rounded-xl transition ${
                        active
                          ? "text-foreground bg-primary/10 border border-primary/25"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`}
                    >
                      <span className="font-display tracking-tight">{l.label}</span>
                      <span
                        aria-hidden
                        className={`h-1.5 w-1.5 rounded-full transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
                        style={{ background: "var(--gradient-primary)" }}
                      />
                    </Link>
                  </motion.div>
                );
              })}
              <Link
                to={signedIn ? "/dashboard" : "/auth"}
                onClick={() => setOpen(false)}
                className="mt-3 text-[14px] py-3 px-4 rounded-full text-primary-foreground font-medium text-center tracking-wide"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
              >
                {signedIn ? "My dashboard" : "Sign in"}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

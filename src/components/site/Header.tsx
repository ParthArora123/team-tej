import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
// Supabase is imported lazily inside the effect so the auth bundle never
// blocks first paint of the header.

const links = [
  { to: "/", label: "Home" },
  { to: "/workshops", label: "Workshops" },
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
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    void import("@/integrations/supabase/client").then(({ supabase }) => {
      if (cancelled) return;
      void supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
      unsubscribe = () => sub.subscription.unsubscribe();
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);

  // Shared warm-glass surface for the bar (soft cream, hairline beige border)
  const barSurface = scrolled
    ? "bg-[color-mix(in_oklab,var(--background)_88%,transparent)] border-border shadow-[0_10px_34px_-22px_rgb(0_0_0_/_0.45)]"
    : "bg-[color-mix(in_oklab,var(--background)_58%,transparent)] border-[color-mix(in_oklab,var(--border)_70%,transparent)] shadow-[0_8px_28px_-24px_rgb(0_0_0_/_0.35)]";

  return (
    <header className="fixed top-0 inset-x-0 z-50 pointer-events-none">
      <div
        className={`mx-auto pointer-events-auto transition-all duration-500 ease-out px-3 ${
          scrolled ? "mt-2.5 max-w-6xl" : "mt-4 max-w-7xl"
        }`}
      >
        <div
          className={`flex items-center justify-between gap-4 rounded-full border backdrop-blur-xl backdrop-saturate-150 pl-5 pr-2 h-14 transition-[background-color,border-color,box-shadow] duration-500 ${barSurface}`}
        >
          {/* Brand */}
          <Link to="/" className="group flex items-baseline gap-2 shrink-0">
            <span className="font-display text-[15px] leading-none tracking-[0.14em] uppercase text-black transition-opacity duration-300 group-hover:opacity-70">
              Tejas
            </span>
            <span className="font-display text-[15px] leading-none tracking-[0.14em] uppercase text-black transition-opacity duration-300 group-hover:opacity-70">
              D Dhoke
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((l) => {
              const active = isActive(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`relative px-3.5 h-9 flex items-center rounded-full text-[12.5px] tracking-[0.06em] uppercase transition-colors duration-300 ${
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                      className="absolute inset-0 rounded-full border border-border bg-[color-mix(in_oklab,var(--surface)_85%,transparent)]"
                    />
                  )}
                  <span className="relative">{l.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              to={signedIn ? "/dashboard" : "/auth"}
              className="hidden sm:inline-flex items-center h-10 px-5 rounded-full text-[12px] font-medium tracking-[0.08em] uppercase text-primary-foreground bg-foreground transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_12px_28px_-14px_rgb(0_0_0_/_0.55)]"
            >
              {signedIn ? "Dashboard" : "Sign in"}
            </Link>
            <button
              onClick={() => setOpen((o) => !o)}
              className="lg:hidden h-10 w-10 grid place-items-center rounded-full border border-border bg-[color-mix(in_oklab,var(--surface)_70%,transparent)] text-foreground transition-colors duration-300 hover:bg-surface"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden pointer-events-auto mx-3 mt-2 overflow-hidden rounded-3xl border border-border bg-[color-mix(in_oklab,var(--background)_94%,transparent)] backdrop-blur-xl p-3 shadow-[0_24px_60px_-30px_rgb(0_0_0_/_0.5)]"
          >
            <div className="flex flex-col gap-0.5">
              {links.map((l, i) => {
                const active = isActive(l.to);
                return (
                  <motion.div
                    key={l.to}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.025 * i, duration: 0.2 }}
                  >
                    <Link
                      to={l.to}
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-between text-[14px] py-3 px-4 rounded-2xl transition-colors duration-300 ${
                        active
                          ? "text-foreground bg-surface border border-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-[color-mix(in_oklab,var(--surface)_60%,transparent)]"
                      }`}
                    >
                      <span className="font-display tracking-[0.1em] uppercase">{l.label}</span>
                      <span
                        aria-hidden
                        className={`h-1.5 w-1.5 rounded-full bg-foreground transition-opacity duration-300 ${
                          active ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    </Link>
                  </motion.div>
                );
              })}
              <Link
                to={signedIn ? "/dashboard" : "/auth"}
                onClick={() => setOpen(false)}
                className="mt-3 text-[13px] py-3.5 px-4 rounded-full bg-foreground text-primary-foreground font-medium text-center tracking-[0.1em] uppercase transition-transform duration-300 active:scale-[0.98]"
              >
                {signedIn ? "My dashboard" : "Sign in"}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

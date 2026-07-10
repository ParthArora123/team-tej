import { useEffect, useRef } from "react";

/**
 * ParticleField — GPU-friendly 2D canvas of floating glowing particles.
 * Fixed, behind content, respects reduced motion & throttles when off-screen.
 */
export function ParticleField({ density = 60 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;
    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number };
    let particles: P[] = [];

    // Read primary color once (fallback to warm amber if var missing)
    const primary =
      getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() ||
      "oklch(0.78 0.16 65)";

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(density, Math.round((w * h) / 22000));
      particles = new Array(count).fill(0).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -0.05 - Math.random() * 0.15,
        r: 0.6 + Math.random() * 1.8,
        a: 0.2 + Math.random() * 0.55,
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    let running = true;
    const io = new IntersectionObserver(([e]) => (running = e.isIntersecting), { threshold: 0 });
    io.observe(canvas);

    const step = () => {
      if (running && !reduce) {
        ctx.clearRect(0, 0, w, h);
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;

          ctx.beginPath();
          ctx.fillStyle = `color-mix(in oklab, ${primary} ${Math.round(p.a * 100)}%, transparent)`;
          ctx.shadowColor = primary;
          ctx.shadowBlur = 12;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
      io.disconnect();
    };
  }, [density]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}

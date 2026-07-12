import { useEffect, useState, type ReactNode } from "react";

/**
 * Mounts children only after the browser is idle (post first paint / LCP).
 * Use to hold back non-critical ambient layers so they don't compete with
 * hero rendering on initial load.
 */
export function DeferMount({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const schedule = () => {
      if (cancelled) return;
      const ric: any = (window as any).requestIdleCallback;
      if (typeof ric === "function") {
        ric(() => !cancelled && setReady(true), { timeout: 1500 });
      } else {
        setTimeout(() => !cancelled && setReady(true), 300);
      }
    };
    if (delay > 0) {
      const t = setTimeout(schedule, delay);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }
    schedule();
    return () => {
      cancelled = true;
    };
  }, [delay]);
  if (!ready) return null;
  return <>{children}</>;
}

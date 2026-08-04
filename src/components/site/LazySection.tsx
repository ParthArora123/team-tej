import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders children only once the placeholder scrolls near the viewport.
 * Combined with React.lazy this keeps below-the-fold code (and its media)
 * off the critical path without changing the rendered design.
 */
export function LazySection({
  children,
  minHeight = 320,
  rootMargin = "400px",
  fallback = null,
}: {
  children: ReactNode;
  minHeight?: number;
  rootMargin?: string;
  fallback?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} style={visible ? undefined : { minHeight }}>
      {visible ? <Suspense fallback={fallback}>{children}</Suspense> : fallback}
    </div>
  );
}

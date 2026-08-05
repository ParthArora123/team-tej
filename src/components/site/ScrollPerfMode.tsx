import { useEffect } from "react";

/**
 * Flags `<html data-scrolling="1">` while the user is actively scrolling so
 * CSS can suspend expensive blur/backdrop-filter layers for those frames.
 * Restores ~140ms after the last scroll event, so the design is unchanged
 * whenever the page is at rest.
 */
export function ScrollPerfMode() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = false;

    const onScroll = () => {
      if (!active) {
        active = true;
        root.setAttribute("data-scrolling", "1");
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        active = false;
        root.removeAttribute("data-scrolling");
      }, 140);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer) clearTimeout(timer);
      root.removeAttribute("data-scrolling");
    };
  }, []);

  return null;
}

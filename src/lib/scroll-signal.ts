/**
 * One passive scroll listener for the whole app, coalesced to a single
 * requestAnimationFrame tick.
 *
 * Every component that used to attach its own `scroll` listener and read
 * `window.scrollY` inside it forced a style/layout read on every scroll event
 * (dozens per second, multiplied by the number of listeners). That was the
 * single largest main-thread cost while scrolling. Here the position is read
 * once per frame and broadcast to all subscribers.
 */
type Listener = (scrollY: number) => void;

const listeners = new Set<Listener>();
let frame = 0;
let attached = false;

function flush() {
  frame = 0;
  const y = window.scrollY;
  listeners.forEach((fn) => fn(y));
}

function onScroll() {
  if (frame) return;
  frame = requestAnimationFrame(flush);
}

export function onScrollY(listener: Listener): () => void {
  if (typeof window === "undefined") return () => {};
  listeners.add(listener);
  if (!attached) {
    attached = true;
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  // Prime with the current position without waiting for a scroll event.
  listener(window.scrollY);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && attached) {
      attached = false;
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}

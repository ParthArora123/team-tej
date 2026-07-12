import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Quote } from "lucide-react";

type Testimonial = {
  name: string;
  role?: string;
  quote: string;
  avatar?: string;
};

const DEFAULTS: Testimonial[] = [
  {
    name: "Ananya S.",
    role: "Student · Mumbai",
    quote:
      "Tejas doesn't just teach steps — he teaches expression. I walked in shy and left owning the stage.",
  },
  {
    name: "Rohan M.",
    role: "Choreography Client",
    quote:
      "The wedding choreography was cinematic. Every guest said it looked like a film sequence.",
  },
  {
    name: "Priya K.",
    role: "Workshop attendee · Delhi",
    quote:
      "The energy in his room is unreal. Two hours felt like ten minutes. I'm hooked.",
  },
  {
    name: "Karan D.",
    role: "Nritya Sadhana member",
    quote:
      "From zero-training to my first stage in six months. The community carries you.",
  },
];

/**
 * TestimonialsCarousel — premium glassmorphism auto-rotating carousel.
 */
export function TestimonialsCarousel({ items }: { items?: Testimonial[] }) {
  const list = items && items.length > 0 ? items : DEFAULTS;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 6000);
    return () => clearInterval(t);
  }, [list.length]);

  const current = list[idx];

  return (
    <section className="max-w-6xl mx-auto px-6 lg:px-10 py-24">
      <div className="mb-10 text-center">
        <p className="text-xs uppercase tracking-widest text-primary">Voices</p>
        <h2 className="mt-3 font-display text-4xl lg:text-5xl font-bold text-balance">
          What movers say.
        </h2>
      </div>

      <div className="relative">
        {/* glow backdrop */}
        <div
          aria-hidden
          className="absolute -inset-6 rounded-[2rem] blur-3xl opacity-60 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 60% at 20% 20%, color-mix(in oklab, var(--primary) 35%, transparent), transparent), radial-gradient(60% 60% at 80% 80%, #7A3BFF44, transparent)",
          }}
        />

        <div
          className="relative rounded-[2rem] border border-white/10 p-8 lg:p-14 min-h-[280px] flex items-center overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--card) 60%, transparent), color-mix(in oklab, var(--card) 25%, transparent))",
            backdropFilter: "blur(24px) saturate(140%)",
          }}
        >
          <Quote
            aria-hidden
            className="absolute top-6 left-6 h-10 w-10 text-primary/40"
          />

          <AnimatePresence mode="wait">
            <motion.blockquote
              key={idx}
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full text-center px-4"
            >
              <p className="font-display text-2xl lg:text-3xl leading-snug text-balance">
                “{current.quote}”
              </p>
              <footer className="mt-6 flex items-center justify-center gap-3">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="h-12 w-12 rounded-full grid place-items-center font-display font-bold text-primary-foreground shadow-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--primary), #7A3BFF)",
                  }}
                >
                  {current.avatar ? (
                    <img
                      src={current.avatar}
                      alt={current.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    current.name.charAt(0)
                  )}
                </motion.div>
                <div className="text-left">
                  <p className="font-medium text-sm">{current.name}</p>
                  {current.role && (
                    <p className="text-xs text-muted-foreground">
                      {current.role}
                    </p>
                  )}
                </div>
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        {/* dots */}
        <div className="mt-6 flex justify-center gap-2">
          {list.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show testimonial ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-8 bg-primary" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

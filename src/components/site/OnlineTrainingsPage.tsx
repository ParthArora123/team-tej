import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useServerFn } from "@tanstack/react-start";
import { cachedCall, invalidateCachedCall } from "@/lib/public-data-cache";
import { CardSkeleton } from "@/components/site/Skeletons";
import { listPrograms } from "@/lib/catalog.functions";
import { EnrollDialog, type EnrollClass } from "@/components/site/EnrollDialog";
import {
  ArrowUpRight,
  Check,
  Clock,
  Calendar,
  Users,
  Sparkles,
  Star,
  Trophy,
  Video,
  Award,
} from "lucide-react";

const dProFeatures = [
  "Live Classes",
  "1-on-1 Feedback",
  "Tutorials of All Our Choreographies",
];

const dProBatches = [
  {
    time: "8:00 PM Live Class",
    duration: "1 Month",
    fees: "₹1,499/month",
    schedule: "Monday to Friday",
    sessions: "1-hour sessions",
    link: "https://studio.dancefit.in/l/aefa32a9ff",
  },
  {
    time: "9:00 PM Live Class",
    duration: "1 Month",
    fees: "₹1,499/month",
    schedule: "Monday to Friday",
    sessions: "1-hour sessions",
    link: "https://studio.dancefit.in/l/7315b416b4",
  },
];

const beginnerIncludes = [
  "Rhythm, timing & musicality",
  "Body coordination & movement techniques",
  "Practical assignments & weekly challenges",
];

const beginnerBonuses = [
  "Wedding Survival Kit",
  "Party Dance Kit",
  "Dance Fitness Pack",
  "Practice Tracker",
  "Curated Music Playlist",
  "Monthly Live Q&A",
  "Community Support & Mentorship",
  "Certificate on Completion",
  "Exclusive Live Boot Camps",
];

const programDetails = [
  { icon: Trophy, label: "4 Live Boot Camps", sub: "every month" },
  { icon: Video, label: "12 Live Classes", sub: "across 3 months" },
  { icon: Clock, label: "3 Months", sub: "duration" },
  { icon: Award, label: "Certificate", sub: "on completion" },
];

function CtaButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        "ed-cta inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white",
        className,
      ].join(" ")}
    >
      {children} <ArrowUpRight size={16} />
    </a>
  );
}

function DProCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="df-border-card bg-card rounded-2xl p-6 sm:p-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
        <div className="lg:max-w-sm">
          <p className="text-xs uppercase tracking-widest text-primary inline-flex items-center gap-1.5">
            <Sparkles size={12} /> Premium Online Training
          </p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold">D Pro</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            An intensive online training program for dancers who want live classes, personal feedback, and full access to every choreography we teach.
          </p>
          <ul className="mt-5 space-y-2">
            {dProFeatures.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Check size={16} className="text-primary shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 w-full lg:w-auto">
          {dProBatches.map((b) => (
            <div
              key={b.time}
              className="rounded-xl border border-border bg-muted/40 p-5 flex flex-col"
            >
              <p className="font-display text-xl font-bold">{b.time}</p>
              <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Clock size={14} className="text-primary shrink-0" /> {b.duration}
                </p>
                <p className="flex items-center gap-2">
                  <Calendar size={14} className="text-primary shrink-0" /> {b.schedule}
                </p>
                <p className="flex items-center gap-2">
                  <Users size={14} className="text-primary shrink-0" /> {b.sessions}
                </p>
              </div>
              <p className="mt-4 font-display text-2xl font-bold text-foreground">
                ₹1,499<span className="text-sm font-medium text-muted-foreground">/month</span>
              </p>
              <CtaButton href={b.link} className="mt-4">
                Register Now
              </CtaButton>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function BeginnerCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="df-border-card bg-card rounded-2xl p-6 sm:p-8"
    >
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
            “Always wanted to dance with confidence but didn’t know where to start?”
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            This program is specially designed for absolute beginners. Learn step by step from basic rhythm and body movement to freestyle, choreography, and stage presence, all from the comfort of your home!
          </p>

          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
              What’s Included
            </h3>
            <ul className="mt-3 space-y-2">
              {beginnerIncludes.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <Check size={16} className="mt-0.5 text-primary shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <div className="rounded-xl border border-border bg-muted/40 p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary inline-flex items-center gap-1.5">
              <Star size={14} /> Bonus Resources
            </h3>
            <ul className="mt-3 grid sm:grid-cols-2 gap-x-4 gap-y-2">
              {beginnerBonuses.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <Star size={14} className="mt-0.5 text-primary shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {programDetails.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="rounded-lg border border-border bg-muted/40 p-3 text-center"
              >
                <Icon size={18} className="mx-auto text-primary" />
                <p className="mt-1.5 text-xs font-semibold text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Monthly Plan</p>
            <p className="mt-1 font-display text-3xl font-bold text-foreground">
              ₹1,200<span className="text-sm font-medium text-muted-foreground">/month</span>
            </p>
            <p className="text-xs text-muted-foreground">× 3 months = ₹3,600</p>
          </div>
          <CtaButton href="https://studio.dancefit.in/l/d905703c0d" className="mt-5">
            Enroll – Monthly Plan
          </CtaButton>
        </div>

        <div className="rounded-xl border border-border p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
            Save ₹600
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">One-Time Payment</p>
            <p className="mt-1 font-display text-3xl font-bold text-foreground">₹3,000</p>
            <p className="text-xs text-muted-foreground">One-Time Payment</p>
          </div>
          <CtaButton href="https://studio.dancefit.in/l/41aa93491f" className="mt-5">
            Enroll – One-Time Payment
          </CtaButton>
        </div>
      </div>

      <p className="mt-6 text-center text-sm font-medium text-muted-foreground">
        “No experience required, just bring your passion to dance!”
      </p>
    </motion.div>
  );
}

export function OnlineTrainingsPage() {
  const fetchPrograms = useServerFn(listPrograms);
  const [rows, setRows] = useState<any[]>([]);
  const [sel, setSel] = useState<EnrollClass | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = () =>
      cachedCall(`programs:online_training`, () => fetchPrograms({ data: { kind: "online_training" } }))
        .then(setRows)
        .catch(() => setRows([]))
        .finally(() => setLoaded(true));
    load();
    const onFocus = () => {
      invalidateCachedCall(`programs:online_training`);
      load();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchPrograms]);

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 lg:px-10 max-w-6xl mx-auto">
      <p className="text-xs uppercase tracking-widest text-primary">Online Trainings</p>
      <h1 className="font-display text-5xl font-bold mt-2">Train with us, from anywhere</h1>
      <p className="text-muted-foreground mt-3 max-w-2xl">
        Self-paced video modules with live monthly feedback from our faculty.
      </p>

      <div className="mt-10 grid gap-6">
        <DProCard />
        <BeginnerCard />
      </div>

      {rows.length > 0 && (
        <>
          <h2 className="mt-16 font-display text-3xl font-bold">More online programs</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rows.map((r, i) => {
              const silverPrice = r.silver_seat_price ?? 1000;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-2xl p-6 hover:-translate-y-1 transition"
                >
                  <p className="font-display text-2xl font-bold">{r.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.duration}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{r.description}</p>
                  {r.silver_seat_enabled && (
                    <div className="mt-4 rounded-lg border border-primary/40 bg-primary/5 p-3">
                      <p className="text-xs font-semibold text-primary">
                        Silver Seat Offer (Additional ₹{silverPrice.toLocaleString("en-IN")})
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        We also have a Silver Seat Offer, where we’ll shoot and professionally edit your solo dance video using our professional camera, giving you a high-quality video that you can use for your social media, portfolio, or personal memories.
                      </p>
                    </div>
                  )}
                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="font-display text-2xl">₹{r.price_inr.toLocaleString("en-IN")}</p>
                      {r.silver_seat_enabled && (
                        <p className="text-[11px] text-primary mt-0.5">
                          + ₹{silverPrice.toLocaleString("en-IN")} for Silver Seat
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setSel({
                          id: r.id,
                          name: r.name,
                          price: r.price_inr,
                          duration: r.duration ?? "",
                          silverSeatEnabled: !!r.silver_seat_enabled,
                          silverSeatPrice: silverPrice,
                          allowSingle: r.allow_single !== false,
                          allowBoth: !!r.allow_both,
                          bothPrice: r.both_price ?? null,
                          workshop1Name: r.workshop1_name ?? null,
                          workshop2Name: r.workshop2_name ?? null,
                          eventTime: (r as any).event_time ?? null,
                        })
                      }
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
                    >
                      Enroll
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {!loaded && rows.length === 0 && (
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }, (_, i) => (
            <CardSkeleton key={`sk-${i}`} />
          ))}
        </div>
      )}

      <EnrollDialog klass={sel} onClose={() => setSel(null)} />
    </div>
  );
}

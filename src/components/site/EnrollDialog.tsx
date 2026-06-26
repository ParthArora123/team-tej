import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { X, Check, Copy, Ticket, Download } from "lucide-react";

export interface EnrollClass {
  name: string;
  price: number;
  duration: string;
}

interface Props {
  klass: EnrollClass | null;
  onClose: () => void;
}

const UPI_ID = "teamtej@upi";
const PAYEE = "Team Tej Dance Co";

type Step = "details" | "pay" | "ticket";

interface StudentDetails {
  name: string;
  email: string;
  phone: string;
  age: string;
  experience: string;
}

const empty: StudentDetails = {
  name: "",
  email: "",
  phone: "",
  age: "",
  experience: "Beginner",
};

function Field({
  label,
  field,
  type = "text",
  placeholder,
  details,
  setDetails,
  errors,
}: {
  label: string;
  field: keyof StudentDetails;
  type?: string;
  placeholder?: string;
  details: StudentDetails;
  setDetails: (d: StudentDetails) => void;
  errors: Partial<Record<keyof StudentDetails, string>>;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={details[field]}
        placeholder={placeholder}
        onChange={(e) => setDetails({ ...details, [field]: e.target.value })}
        className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none text-sm"
      />
      {errors[field] && (
        <span className="text-xs text-destructive mt-1 block">{errors[field]}</span>
      )}
    </label>
  );
}

export function EnrollDialog({ klass, onClose }: Props) {

  const [step, setStep] = useState<Step>("details");
  const [details, setDetails] = useState<StudentDetails>(empty);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof StudentDetails, string>>>({});

  const ticketId = useMemo(
    () => "TTJ-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    [step === "ticket"], // regen on reaching ticket
  );

  if (!klass) return null;

  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(
    PAYEE,
  )}&am=${klass.price}&cu=INR&tn=${encodeURIComponent(
    klass.name + " - " + (details.name || "Enrollment"),
  )}`;

  const copyUpi = async () => {
    await navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const validate = () => {
    const e: Partial<Record<keyof StudentDetails, string>> = {};
    if (!details.name.trim()) e.name = "Required";
    if (!/^\S+@\S+\.\S+$/.test(details.email)) e.email = "Valid email required";
    if (!/^\d{10}$/.test(details.phone.replace(/\D/g, ""))) e.phone = "10-digit phone";
    if (!details.age || +details.age < 4 || +details.age > 90) e.age = "Valid age";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const reset = () => {
    setStep("details");
    setDetails(empty);
    setErrors({});
    onClose();
  };

  const downloadTicket = () => {
    const txt = `TEAM TEJ DANCE CO — ENROLLMENT TICKET
-----------------------------------------
Ticket ID : ${ticketId}
Class     : ${klass.name}
Duration  : ${klass.duration}
Amount    : ₹${klass.price.toLocaleString("en-IN")}

Student   : ${details.name}
Email     : ${details.email}
Phone     : ${details.phone}
Age       : ${details.age}
Level     : ${details.experience}

Status    : PAID
Issued    : ${new Date().toLocaleString("en-IN")}
-----------------------------------------
Show this ticket at the studio on your first day.`;
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ticketId}-${klass.name.replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (

    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
        onClick={reset}
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", damping: 22, stiffness: 220 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl my-8"
        >
          <button
            onClick={reset}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-5">
            {(["details", "pay", "ticket"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`h-6 w-6 rounded-full text-[11px] flex items-center justify-center font-semibold ${
                    step === s
                      ? "bg-primary text-primary-foreground"
                      : i < ["details", "pay", "ticket"].indexOf(step)
                        ? "bg-primary/30 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 2 && <div className="h-px w-6 bg-border" />}
              </div>
            ))}
          </div>

          {step === "details" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-xs uppercase tracking-widest text-primary">
                Student Details
              </p>
              <h3 className="mt-2 text-2xl font-display font-bold">{klass.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {klass.duration} · ₹{klass.price.toLocaleString("en-IN")}
              </p>

              <div className="mt-5 space-y-3">
                <Field label="Full name" field="name" placeholder="Tej Sharma" details={details} setDetails={setDetails} errors={errors} />
                <Field label="Email" field="email" type="email" placeholder="you@email.com" details={details} setDetails={setDetails} errors={errors} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone" field="phone" placeholder="98xxxxxxxx" details={details} setDetails={setDetails} errors={errors} />
                  <Field label="Age" field="age" type="number" placeholder="22" details={details} setDetails={setDetails} errors={errors} />
                </div>

                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Experience
                  </span>
                  <select
                    value={details.experience}
                    onChange={(e) => setDetails({ ...details, experience: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none text-sm"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </label>
              </div>

              <button
                onClick={() => validate() && setStep("pay")}
                className="mt-6 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
              >
                Continue to payment
              </button>
            </motion.div>
          )}

          {step === "pay" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-xs uppercase tracking-widest text-primary">
                Pay ₹{klass.price.toLocaleString("en-IN")}
              </p>
              <h3 className="mt-2 text-2xl font-display font-bold">{klass.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Registering: {details.name}
              </p>

              <div className="mt-6 flex flex-col items-center">
                <div className="p-4 bg-white rounded-xl">
                  <QRCodeSVG value={upiUrl} size={200} level="M" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground text-center">
                  Scan with any UPI app — GPay, PhonePe, Paytm
                </p>
              </div>

              <button
                onClick={copyUpi}
                className="mt-5 w-full flex items-center justify-between px-4 py-3 rounded-lg bg-muted hover:bg-secondary transition text-sm"
              >
                <span className="font-mono">{UPI_ID}</span>
                <span className="flex items-center gap-1.5 text-primary">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </span>
              </button>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setStep("details")}
                  className="px-4 py-3 rounded-lg bg-muted hover:bg-secondary text-sm"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("ticket")}
                  className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
                >
                  I've paid — generate ticket
                </button>
              </div>
            </motion.div>
          )}

          {step === "ticket" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center">
                <Check className="text-primary" size={28} />
              </div>
              <h3 className="mt-3 text-xl font-display font-bold text-center">
                Payment received
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Your ticket has been generated.
              </p>

              {/* Ticket */}
              <div className="mt-5 relative overflow-hidden rounded-xl border border-dashed border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-5">
                <div className="absolute -left-3 top-1/2 h-6 w-6 rounded-full bg-background" />
                <div className="absolute -right-3 top-1/2 h-6 w-6 rounded-full bg-background" />

                <div className="flex items-center gap-2 text-primary">
                  <Ticket size={16} />
                  <span className="text-xs uppercase tracking-widest font-semibold">
                    Team Tej · Enrollment Ticket
                  </span>
                </div>

                <div className="mt-3 flex items-start justify-between">
                  <div>
                    <p className="font-display text-lg font-bold leading-tight">
                      {klass.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{klass.duration}</p>
                  </div>
                  <div className="bg-white p-1.5 rounded">
                    <QRCodeSVG value={ticketId} size={56} level="M" />
                  </div>
                </div>

                <div className="my-4 border-t border-dashed border-border" />

                <dl className="grid grid-cols-2 gap-y-2 text-xs">
                  <dt className="text-muted-foreground">Student</dt>
                  <dd className="text-right font-medium">{details.name}</dd>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="text-right">{details.phone}</dd>
                  <dt className="text-muted-foreground">Level</dt>
                  <dd className="text-right">{details.experience}</dd>
                  <dt className="text-muted-foreground">Paid</dt>
                  <dd className="text-right">₹{klass.price.toLocaleString("en-IN")}</dd>
                  <dt className="text-muted-foreground">Ticket ID</dt>
                  <dd className="text-right font-mono">{ticketId}</dd>
                </dl>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={downloadTicket}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition text-sm"
                >
                  <Download size={16} /> Download
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-3 rounded-lg bg-muted hover:bg-secondary text-sm"
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

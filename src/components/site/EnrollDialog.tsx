import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { X, Check, Copy } from "lucide-react";

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

export function EnrollDialog({ klass, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!klass) return null;

  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(
    PAYEE
  )}&am=${klass.price}&cu=INR&tn=${encodeURIComponent(klass.name + " enrollment")}`;

  const copyUpi = async () => {
    await navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", damping: 22, stiffness: 220 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {!confirmed ? (
            <>
              <p className="text-xs uppercase tracking-widest text-primary">
                Enroll
              </p>
              <h3 className="mt-2 text-2xl font-display font-bold">
                {klass.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {klass.duration} · ₹{klass.price.toLocaleString("en-IN")}
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

              <button
                onClick={() => setConfirmed(true)}
                className="mt-3 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
              >
                I've paid — confirm enrollment
              </button>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 text-center"
            >
              <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center">
                <Check className="text-primary" size={28} />
              </div>
              <h3 className="mt-4 text-xl font-display font-bold">You're in.</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We'll confirm your payment and email class details within 12 hours.
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-5 py-2 rounded-full bg-muted hover:bg-secondary text-sm"
              >
                Close
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

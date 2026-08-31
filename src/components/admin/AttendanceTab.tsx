import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, CameraOff, CheckCircle2, RefreshCw, Search, XCircle } from "lucide-react";
import {
  attendanceWorkshops, attendanceRoster, attendanceCheckIn, attendanceUndo,
} from "@/lib/attendance.functions";

type Workshop = { id: string; name: string; event_date: string | null; city: string | null; venue: string | null };
type Row = {
  id: string; enrollment_id: string; participant_id: string | null; participant_label: string | null;
  full_name: string | null; email: string | null; phone: string | null;
  ticket_code: string | null; status: string; amount_inr: number | null;
  checked_in_at: string | null; attendance_method: string | null;
};
type Summary = { registered: number; confirmedPaid: number; present: number; notCheckedIn: number; attendancePct: number };
type Filter = "all" | "present" | "not_checked_in" | "paid" | "pending";

const timeFmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—";

export function AttendanceTab() {
  const listWorkshops = useServerFn(attendanceWorkshops);
  const loadRoster = useServerFn(attendanceRoster);
  const doCheckIn = useServerFn(attendanceCheckIn);
  const doUndo = useServerFn(attendanceUndo);

  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [programId, setProgramId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [manual, setManual] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState("");
  const busyRef = useRef(false);
  const lastCodeRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  useEffect(() => {
    listWorkshops().then((w: any) => {
      setWorkshops(w ?? []);
      if (!programId && w?.[0]) setProgramId(w[0].id);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async (id = programId) => {
    if (!id) return;
    setLoading(true);
    try {
      const r: any = await loadRoster({ data: { programId: id } });
      setRows(r.rows); setSummary(r.summary);
    } finally { setLoading(false); }
  }, [programId, loadRoster]);

  useEffect(() => { if (programId) refresh(programId); }, [programId]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = useCallback(async (payload: { code?: string; enrollmentId?: string; participantId?: string; method: "qr" | "manual" }) => {
    if (!programId || busyRef.current) return;
    busyRef.current = true;
    try {
      const r: any = await doCheckIn({ data: { programId, ...payload } });
      setResult(r);
      if (navigator.vibrate) navigator.vibrate(r.ok ? 60 : [40, 40, 40]);
      if (r.ok) await refresh();
    } catch (e: any) {
      setResult({ ok: false, message: e?.message ?? "Check-in failed" });
    } finally {
      setTimeout(() => { busyRef.current = false; }, 500);
    }
  }, [programId, doCheckIn, refresh]);

  const onDecoded = useCallback((text: string) => {
    const now = Date.now();
    if (lastCodeRef.current.code === text && now - lastCodeRef.current.at < 2500) return;
    lastCodeRef.current = { code: text, at: now };
    submit({ code: text, method: "qr" });
  }, [submit]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "present" && !r.checked_in_at) return false;
      if (filter === "not_checked_in" && r.checked_in_at) return false;
      if (filter === "paid" && r.status !== "confirmed") return false;
      if (filter === "pending" && r.status === "confirmed") return false;
      if (!term) return true;
      return `${r.full_name ?? ""} ${r.email ?? ""} ${r.phone ?? ""} ${r.ticket_code ?? ""} ${r.id}`
        .toLowerCase().includes(term);
    });
  }, [rows, q, filter]);

  const selected = workshops.find((w) => w.id === programId);

  return (
    <div className="mt-8 min-w-0 space-y-6 overflow-x-hidden">
      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0 sm:max-w-sm">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Select workshop</label>
          <select
            value={programId}
            onChange={(e) => { setProgramId(e.target.value); setResult(null); }}
            className="mt-2 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
          >
            {workshops.length === 0 && <option value="">No workshops</option>}
            {workshops.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}{w.event_date ? ` · ${new Date(w.event_date).toLocaleDateString()}` : ""}
              </option>
            ))}
          </select>
          {selected?.venue && <p className="mt-1 truncate text-xs text-muted-foreground">{selected.venue}{selected.city ? `, ${selected.city}` : ""}</p>}
        </div>
        <button
          onClick={() => refresh()}
          className="inline-flex shrink-0 items-center gap-2 self-start px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            ["Registered", summary.registered],
            ["Confirmed paid", summary.confirmedPaid],
            ["Present", summary.present],
            ["Not checked in", summary.notCheckedIn],
            ["Attendance", `${summary.attendancePct}%`],
          ].map(([label, val]) => (
            <div key={label as string} className="min-w-0 rounded-xl border border-border bg-card/70 p-4">
              <p className="truncate text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{val}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-border bg-card/70 p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
            <h3 className="truncate text-sm font-semibold">QR scanner</h3>
            <button
              onClick={() => { setCamError(""); setScanning((s) => !s); }}
              disabled={!programId}
              className="inline-flex shrink-0 items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs disabled:opacity-50"
            >
              {scanning ? <><CameraOff className="h-4 w-4" /> Stop</> : <><Camera className="h-4 w-4" /> Start camera</>}
            </button>
          </div>

          {scanning ? (
            <QrScanner onDecoded={onDecoded} onError={(m) => { setCamError(m); setScanning(false); }} />
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Start the camera and point it at the participant&apos;s ticket QR. Every scan is validated against the database before attendance is marked.
            </p>
          )}
          {camError && (
            <p className="mt-3 text-xs text-destructive">{camError} Use manual check-in below.</p>
          )}

          <div className="mt-5 min-w-0">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Manual ticket entry</label>
            <div className="mt-2 flex min-w-0 gap-2">
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && manual.trim()) { submit({ code: manual.trim(), method: "manual" }); setManual(""); } }}
                placeholder="TTJ-XXXXXX or scan URL"
                className="min-w-0 flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm"
              />
              <button
                onClick={() => { if (manual.trim()) { submit({ code: manual.trim(), method: "manual" }); setManual(""); } }}
                className="shrink-0 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
              >
                Check in
              </button>
            </div>
          </div>

          {result && (
            <div className={`mt-5 min-w-0 rounded-xl border p-4 ${result.ok ? "border-emerald-500/40 bg-emerald-500/10" : result.reason === "already" ? "border-amber-500/40 bg-amber-500/10" : "border-destructive/40 bg-destructive/10"}`}>
              <p className="flex items-center gap-2 text-sm font-semibold">
                {result.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <XCircle className="h-4 w-4 shrink-0" />}
                {result.ok ? "Attendance marked" : result.reason === "already" ? "Already checked in" : "Not marked"}
              </p>
              <div className="mt-2 min-w-0 space-y-0.5 text-xs">
                {result.participant && <p className="break-words"><span className="text-muted-foreground">Participant:</span> {result.participant}</p>}
                {result.workshop && <p className="break-words"><span className="text-muted-foreground">Workshop:</span> {result.workshop}</p>}
                {result.ticket_code && <p className="break-words"><span className="text-muted-foreground">Ticket ID:</span> <span className="font-mono">{result.ticket_code}</span></p>}
                {result.checked_in_at && <p className="break-words"><span className="text-muted-foreground">Check-in:</span> {timeFmt(result.checked_in_at)}</p>}
                {!result.ok && result.message && <p className="break-words text-muted-foreground">{result.message}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 rounded-xl border border-border bg-card/70 p-5">
          <h3 className="text-sm font-semibold">Attendance list</h3>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, ticket, phone, email"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted border border-border text-sm"
              />
            </div>
            <select
              value={filter} onChange={(e) => setFilter(e.target.value as Filter)}
              className="px-3 py-2 rounded-lg bg-muted border border-border text-sm"
            >
              <option value="all">All</option>
              <option value="present">Present</option>
              <option value="not_checked_in">Not checked in</option>
              <option value="paid">Payment confirmed</option>
              <option value="pending">Payment pending</option>
            </select>
          </div>

          <div className="mt-4 max-h-[460px] overflow-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr className="text-left">
                  <th className="p-2">Participant</th>
                  <th className="p-2">Ticket</th>
                  <th className="p-2">Payment</th>
                  <th className="p-2">Attendance</th>
                  <th className="p-2">Time</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="p-2 min-w-0">
                      <p className="truncate font-medium">
                        {r.full_name ?? "—"}
                        {r.participant_label && (
                          <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                            {r.participant_label}
                          </span>
                        )}
                      </p>
                      <p className="truncate text-muted-foreground">{r.phone ?? r.email ?? ""}</p>
                    </td>
                    <td className="p-2 font-mono">{r.ticket_code ?? "—"}</td>
                    <td className="p-2">{r.status === "confirmed" ? "Confirmed" : r.status.replace(/_/g, " ")}</td>
                    <td className="p-2">
                      {r.checked_in_at
                        ? <span className="text-emerald-400">Present</span>
                        : <span className="text-muted-foreground">Not checked in</span>}
                    </td>
                    <td className="p-2">{timeFmt(r.checked_in_at)}</td>
                    <td className="p-2 text-right">
                      {r.checked_in_at ? (
                        <button
                          onClick={async () => {
                            await doUndo({ data: r.participant_id ? { participantId: r.participant_id } : { enrollmentId: r.enrollment_id } });
                            refresh();
                          }}
                          className="px-2 py-1 rounded border border-border hover:bg-muted"
                        >Undo</button>
                      ) : r.status === "confirmed" ? (
                        <button
                          onClick={() => submit(r.participant_id
                            ? { participantId: r.participant_id, method: "manual" }
                            : { enrollmentId: r.enrollment_id, method: "manual" })}
                          className="px-2 py-1 rounded bg-primary text-primary-foreground"
                        >Mark present</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No registrations match.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Lightweight camera QR reader — native BarcodeDetector when available, jsQR fallback. */
function QrScanner({ onDecoded, onError }: { onDecoded: (t: string) => void; onError: (m: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    let detector: any = null;
    let jsQR: any = null;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } }, audio: false,
        });
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        await v.play();
        setReady(true);

        const BD = (window as any).BarcodeDetector;
        if (BD) {
          try {
            const formats = await BD.getSupportedFormats?.();
            if (!formats || formats.includes("qr_code")) detector = new BD({ formats: ["qr_code"] });
          } catch { detector = null; }
        }
        if (!detector) jsQR = (await import("jsqr")).default;

        let lastTick = 0;
        const tick = async (ts: number) => {
          if (stopped) return;
          if (ts - lastTick > 180 && v.readyState >= 2) {
            lastTick = ts;
            try {
              if (detector) {
                const codes = await detector.detect(v);
                if (codes?.[0]?.rawValue) onDecoded(codes[0].rawValue);
              } else {
                const c = canvasRef.current;
                if (c) {
                  const w = 360;
                  const h = Math.round((v.videoHeight / v.videoWidth) * w) || 360;
                  c.width = w; c.height = h;
                  const ctx = c.getContext("2d", { willReadFrequently: true });
                  if (ctx) {
                    ctx.drawImage(v, 0, 0, w, h);
                    const img = ctx.getImageData(0, 0, w, h);
                    const res = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
                    if (res?.data) onDecoded(res.data);
                  }
                }
              }
            } catch { /* frame error, keep scanning */ }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch (e: any) {
        onError(
          e?.name === "NotAllowedError"
            ? "Camera permission denied."
            : e?.name === "NotFoundError"
              ? "No camera found on this device."
              : "Could not start the camera.",
        );
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onDecoded, onError]);

  return (
    <div className="mt-3 relative overflow-hidden rounded-xl bg-black aspect-[4/3]">
      <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-xl border-2 border-white/70" />
      </div>
      {!ready && <p className="absolute inset-0 grid place-items-center text-xs text-white/70">Starting camera…</p>}
    </div>
  );
}

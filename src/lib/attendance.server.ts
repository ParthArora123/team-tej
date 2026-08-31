/**
 * Attendance server helpers — real check-in records used for footfall.
 * Server-only: loaded through attendance.functions.ts handlers.
 */
import { extractTicketCode } from "@/lib/ticket-code";

export async function assertAdmin(context: any) {
  const { data } = await context.supabase
    .from("user_roles").select("id")
    .eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export type AttendanceRow = {
  /** Row key: enrollment id for single registrations, participant id otherwise. */
  id: string;
  enrollment_id: string;
  participant_id: string | null;
  participant_label: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  ticket_code: string | null;
  status: string;
  amount_inr: number | null;
  checked_in_at: string | null;
  attendance_method: string | null;
};

export async function listWorkshops() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("programs")
    .select("id, name, event_date, city, venue")
    .order("event_date", { ascending: false, nullsFirst: false });
  return data ?? [];
}

export async function loadRoster(programId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [enrRes, partRes, attRes] = await Promise.all([
    supabaseAdmin
      .from("enrollments")
      .select("id, full_name, email, phone, ticket_code, status, amount_inr, participant_count, created_at")
      .eq("program_id", programId)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("enrollment_participants")
      .select("id, enrollment_id, position, full_name, email, phone, ticket_code")
      .eq("program_id", programId)
      .order("position", { ascending: true }),
    supabaseAdmin
      .from("attendance")
      .select("enrollment_id, participant_id, checked_in_at, method, status")
      .eq("program_id", programId),
  ]);

  // Attendance is keyed per participant when the registration covers several
  // people, and per registration for the classic single-person flow.
  const attByParticipant = new Map<string, any>();
  const attByEnrollment = new Map<string, any>();
  for (const a of attRes.data ?? []) {
    if ((a as any).participant_id) attByParticipant.set((a as any).participant_id, a);
    else attByEnrollment.set((a as any).enrollment_id, a);
  }

  const partsByEnrollment = new Map<string, any[]>();
  for (const p of partRes.data ?? []) {
    const list = partsByEnrollment.get(p.enrollment_id) ?? [];
    list.push(p);
    partsByEnrollment.set(p.enrollment_id, list);
  }

  const rows: AttendanceRow[] = [];
  for (const e of enrRes.data ?? []) {
    const parts = partsByEnrollment.get(e.id) ?? [];
    if (parts.length > 1) {
      for (const p of parts) {
        const a = attByParticipant.get(p.id);
        rows.push({
          id: p.id,
          enrollment_id: e.id,
          participant_id: p.id,
          participant_label: `Participant ${p.position}`,
          full_name: p.full_name,
          email: p.email ?? e.email,
          phone: p.phone ?? e.phone,
          ticket_code: p.ticket_code,
          status: e.status,
          amount_inr: e.amount_inr,
          checked_in_at: a?.checked_in_at ?? null,
          attendance_method: a?.method ?? null,
        });
      }
      continue;
    }
    const a = attByEnrollment.get(e.id);
    rows.push({
      id: e.id,
      enrollment_id: e.id,
      participant_id: null,
      participant_label: null,
      full_name: e.full_name,
      email: e.email,
      phone: e.phone,
      ticket_code: e.ticket_code,
      status: e.status,
      amount_inr: e.amount_inr,
      checked_in_at: a?.checked_in_at ?? null,
      attendance_method: a?.method ?? null,
    });
  }

  const registered = rows.length;
  const confirmedPaid = rows.filter((r) => r.status === "confirmed").length;
  const present = rows.filter((r) => !!r.checked_in_at).length;
  return {
    rows,
    summary: {
      registered,
      confirmedPaid,
      present,
      notCheckedIn: Math.max(confirmedPaid - present, 0),
      attendancePct: confirmedPaid ? Math.round((present / confirmedPaid) * 1000) / 10 : 0,
    },
  };
}

export async function checkIn(
  input: { programId: string; code?: string; enrollmentId?: string; participantId?: string; method: "qr" | "manual" },
  adminUserId: string,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const enrollmentSelect =
    "id, user_id, full_name, email, phone, ticket_code, status, program_id, participant_count, program:programs(id, name)";

  let participant: any = null;
  let enr: any = null;

  if (input.participantId) {
    const { data } = await supabaseAdmin
      .from("enrollment_participants")
      .select("id, enrollment_id, position, full_name, ticket_code")
      .eq("id", input.participantId).maybeSingle();
    participant = data;
  } else if (input.code) {
    const code = extractTicketCode(input.code);
    const { data } = await supabaseAdmin
      .from("enrollment_participants")
      .select("id, enrollment_id, position, full_name, ticket_code")
      .eq("ticket_code", code).maybeSingle();
    participant = data;
  }

  if (participant) {
    const { data } = await supabaseAdmin
      .from("enrollments").select(enrollmentSelect).eq("id", participant.enrollment_id).maybeSingle();
    enr = data;
  } else if (input.enrollmentId) {
    const { data } = await supabaseAdmin
      .from("enrollments").select(enrollmentSelect).eq("id", input.enrollmentId).maybeSingle();
    enr = data;
  } else if (input.code) {
    const { data } = await supabaseAdmin
      .from("enrollments").select(enrollmentSelect).eq("ticket_code", extractTicketCode(input.code!)).maybeSingle();
    enr = data;
  }

  if (!enr) return { ok: false as const, reason: "not_found", message: "Ticket not found in registrations." };

  const displayName = participant?.full_name ?? enr.full_name;
  const displayTicket = participant?.ticket_code ?? enr.ticket_code;

  if (enr.program_id !== input.programId) {
    return {
      ok: false as const,
      reason: "wrong_workshop",
      message: `This ticket belongs to a different workshop (${(enr as any).program?.name ?? "unknown"}).`,
      participant: displayName,
      ticket_code: displayTicket,
    };
  }
  if (enr.status === "rejected") {
    return { ok: false as const, reason: "cancelled", message: "Registration was rejected / cancelled.", participant: displayName };
  }
  if (enr.status !== "confirmed") {
    return { ok: false as const, reason: "unpaid", message: "Payment is not confirmed yet for this registration.", participant: displayName };
  }

  // A multi-person registration must be scanned per participant, so the
  // registration-level ticket alone can never mark everyone present.
  if (!participant && Number(enr.participant_count ?? 1) > 1) {
    return {
      ok: false as const,
      reason: "needs_participant",
      message: "This registration covers multiple participants. Scan each participant's own QR code.",
      participant: displayName,
      ticket_code: displayTicket,
    };
  }

  const existingQuery = supabaseAdmin.from("attendance").select("checked_in_at");
  const { data: existing } = participant
    ? await existingQuery.eq("participant_id", participant.id).maybeSingle()
    : await existingQuery.eq("enrollment_id", enr.id).is("participant_id", null).maybeSingle();

  if (existing) {
    return {
      ok: false as const,
      reason: "already",
      message: "Already checked in.",
      participant: displayName,
      ticket_code: displayTicket,
      workshop: (enr as any).program?.name ?? null,
      checked_in_at: existing.checked_in_at,
    };
  }

  const { data: inserted, error } = await supabaseAdmin
    .from("attendance")
    .insert({
      enrollment_id: enr.id,
      participant_id: participant?.id ?? null,
      program_id: enr.program_id,
      user_id: enr.user_id,
      ticket_code: displayTicket,
      method: input.method,
      checked_in_by: adminUserId,
    } as any)
    .select("checked_in_at")
    .maybeSingle();

  if (error) {
    if ((error as any).code === "23505") {
      const dupQuery = supabaseAdmin.from("attendance").select("checked_in_at");
      const { data: dup } = participant
        ? await dupQuery.eq("participant_id", participant.id).maybeSingle()
        : await dupQuery.eq("enrollment_id", enr.id).is("participant_id", null).maybeSingle();
      return {
        ok: false as const, reason: "already", message: "Already checked in.",
        participant: displayName, ticket_code: displayTicket,
        workshop: (enr as any).program?.name ?? null,
        checked_in_at: dup?.checked_in_at ?? null,
      };
    }
    throw error;
  }

  return {
    ok: true as const,
    participant: displayName,
    ticket_code: displayTicket,
    workshop: (enr as any).program?.name ?? null,
    checked_in_at: inserted?.checked_in_at ?? new Date().toISOString(),
  };
}

export async function undoCheckIn(input: { enrollmentId?: string; participantId?: string }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (input.participantId) {
    const { error } = await supabaseAdmin
      .from("attendance").delete().eq("participant_id", input.participantId);
    if (error) throw error;
    return { ok: true };
  }
  const { error } = await supabaseAdmin
    .from("attendance").delete().eq("enrollment_id", input.enrollmentId!).is("participant_id", null);
  if (error) throw error;
  return { ok: true };
}

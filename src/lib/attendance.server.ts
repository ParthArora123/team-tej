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
  id: string;
  participant_id?: string | null;
  participant_position?: number;
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
      .select("id, full_name, email, phone, ticket_code, status, amount_inr, created_at, participant_count")
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
  const attByEnrollment = new Map(
    (attRes.data ?? []).filter((a: any) => !a.participant_id).map((a: any) => [a.enrollment_id, a]),
  );
  const attByParticipant = new Map(
    (attRes.data ?? []).filter((a: any) => a.participant_id).map((a: any) => [a.participant_id, a]),
  );
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
      // Multi-person registration → one roster line per participant.
      for (const p of parts) {
        const a = attByParticipant.get(p.id);
        rows.push({
          id: e.id,
          participant_id: p.id,
          participant_position: p.position,
          full_name: p.full_name,
          email: p.email,
          phone: p.phone,
          ticket_code: p.ticket_code ?? (p.position === 1 ? e.ticket_code : null),
          status: e.status,
          amount_inr: p.position === 1 ? e.amount_inr : null,
          checked_in_at: a?.checked_in_at ?? null,
          attendance_method: a?.method ?? null,
        });
      }
      continue;
    }
    const a = attByEnrollment.get(e.id) ?? (parts[0] ? attByParticipant.get(parts[0].id) : undefined);
    rows.push({
      id: e.id,
      participant_id: parts[0]?.id ?? null,
      participant_position: 1,
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
  input: {
    programId: string;
    code?: string;
    enrollmentId?: string;
    participantId?: string;
    method: "qr" | "manual";
  },
  adminUserId: string,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // A scanned code may belong to an individual participant of a multi-person
  // registration; resolve that first so only that person is checked in.
  let participant: any = null;
  if (input.participantId) {
    const { data } = await supabaseAdmin
      .from("enrollment_participants")
      .select("id, enrollment_id, position, full_name, ticket_code")
      .eq("id", input.participantId).maybeSingle();
    participant = data ?? null;
  } else if (input.code) {
    const { data } = await supabaseAdmin
      .from("enrollment_participants")
      .select("id, enrollment_id, position, full_name, ticket_code")
      .eq("ticket_code", extractTicketCode(input.code)).maybeSingle();
    participant = data ?? null;
  }

  let query = supabaseAdmin
    .from("enrollments")
    .select("id, user_id, full_name, email, phone, ticket_code, status, program_id, participant_count, program:programs(id, name)");

  if (participant) query = query.eq("id", participant.enrollment_id);
  else if (input.enrollmentId) query = query.eq("id", input.enrollmentId);
  else query = query.eq("ticket_code", extractTicketCode(input.code!));

  const { data: enr } = await query.maybeSingle();

  const who = participant?.full_name ?? enr?.full_name ?? null;
  const code = participant?.ticket_code ?? enr?.ticket_code ?? null;

  if (!enr) return { ok: false as const, reason: "not_found", message: "Ticket not found in registrations." };
  if (enr.program_id !== input.programId) {
    return {
      ok: false as const,
      reason: "wrong_workshop",
      message: `This ticket belongs to a different workshop (${(enr as any).program?.name ?? "unknown"}).`,
      participant: who,
      ticket_code: code,
    };
  }
  if (enr.status === "rejected") {
    return { ok: false as const, reason: "cancelled", message: "Registration was rejected / cancelled.", participant: who };
  }
  if (enr.status !== "confirmed") {
    return { ok: false as const, reason: "unpaid", message: "Payment is not confirmed yet for this registration.", participant: who };
  }

  // Group booking scanned by the shared registration code (or "Mark present"
  // on the registration): ask which person is being checked in instead of
  // marking the whole registration.
  const { data: groupParts } = await supabaseAdmin
    .from("enrollment_participants")
    .select("id, position, full_name, ticket_code")
    .eq("enrollment_id", enr.id)
    .order("position", { ascending: true });

  if (!participant && (groupParts?.length ?? 0) > 1) {
    const { data: att } = await supabaseAdmin
      .from("attendance").select("participant_id, checked_in_at").eq("enrollment_id", enr.id);
    const byPart = new Map((att ?? []).map((a: any) => [a.participant_id, a.checked_in_at]));
    const list = (groupParts ?? []).map((p: any) => ({
      id: p.id,
      position: p.position,
      full_name: p.full_name,
      ticket_code: p.ticket_code,
      checked_in_at: byPart.get(p.id) ?? null,
    }));
    const done = list.filter((p) => p.checked_in_at).length;
    return {
      ok: false as const,
      reason: "select_participant",
      message: `This ticket covers ${list.length} participants (${done} of ${list.length} checked in). Select who is checking in.`,
      participant: who,
      ticket_code: code,
      workshop: (enr as any).program?.name ?? null,
      enrollment_id: enr.id,
      participants: list,
      checked_in_count: done,
      participant_total: list.length,
    };
  }

  const groupProgress = async () => {
    const total = groupParts?.length ?? 0;
    if (total <= 1) return {};
    const { data: att } = await supabaseAdmin
      .from("attendance").select("id").eq("enrollment_id", enr.id);
    return { checked_in_count: att?.length ?? 0, participant_total: total };
  };

  const findExisting = async () => {
    const q = supabaseAdmin.from("attendance").select("checked_in_at");
    const { data } = participant
      ? await q.eq("participant_id", participant.id).maybeSingle()
      : await q.eq("enrollment_id", enr.id).is("participant_id", null).maybeSingle();
    return data;
  };

  const existing = await findExisting();
  if (existing) {
    return {
      ok: false as const,
      reason: "already",
      message: participant
        ? `${who ?? "This participant"} is already checked in.`
        : "Already checked in.",
      participant: who,
      ticket_code: code,
      workshop: (enr as any).program?.name ?? null,
      checked_in_at: existing.checked_in_at,
      ...(await groupProgress()),
    };
  }


  const { data: inserted, error } = await supabaseAdmin
    .from("attendance")
    .insert({
      enrollment_id: enr.id,
      participant_id: participant?.id ?? null,
      program_id: enr.program_id,
      user_id: enr.user_id,
      ticket_code: code,
      method: input.method,
      checked_in_by: adminUserId,
    })
    .select("checked_in_at")
    .maybeSingle();

  if (error) {
    if ((error as any).code === "23505") {
      const dup = await findExisting();
      return {
        ok: false as const, reason: "already", message: "Already checked in.",
        participant: who, ticket_code: code,
        workshop: (enr as any).program?.name ?? null,
        checked_in_at: dup?.checked_in_at ?? null,
      };
    }
    throw error;
  }

  return {
    ok: true as const,
    participant: who,
    ticket_code: code,
    workshop: (enr as any).program?.name ?? null,
    checked_in_at: inserted?.checked_in_at ?? new Date().toISOString(),
  };
}

export async function undoCheckIn(enrollmentId: string, participantId?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (participantId) {
    const { error } = await supabaseAdmin.from("attendance").delete().eq("participant_id", participantId);
    if (error) throw error;
    return { ok: true };
  }
  const { error } = await supabaseAdmin
    .from("attendance").delete().eq("enrollment_id", enrollmentId).is("participant_id", null);
  if (error) throw error;
  return { ok: true };
}


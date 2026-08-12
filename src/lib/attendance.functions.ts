import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: any) {
  const { data } = await context.supabase
    .from("user_roles").select("id")
    .eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

/** Extract a ticket code from raw QR contents (may be a verify URL or a bare code). */
export function extractTicketCode(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  try {
    const u = new URL(s);
    const q = u.searchParams.get("code");
    if (q) return q.trim().toUpperCase();
  } catch {
    /* not a url */
  }
  const m = s.match(/[A-Za-z]{2,5}-[A-Za-z0-9]{4,}/);
  return (m ? m[0] : s).trim().toUpperCase();
}

/** Workshops available for attendance (all programs, newest event first). */
export const attendanceWorkshops = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("programs")
      .select("id, name, event_date, city, venue")
      .order("event_date", { ascending: false, nullsFirst: false });
    return data ?? [];
  });

type Row = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  ticket_code: string | null;
  status: string;
  amount_inr: number | null;
  checked_in_at: string | null;
  attendance_method: string | null;
};

async function loadRoster(programId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [enrRes, attRes] = await Promise.all([
    supabaseAdmin
      .from("enrollments")
      .select("id, full_name, email, phone, ticket_code, status, amount_inr, created_at")
      .eq("program_id", programId)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("attendance")
      .select("enrollment_id, checked_in_at, method, status")
      .eq("program_id", programId),
  ]);
  const att = new Map(
    (attRes.data ?? []).map((a: any) => [a.enrollment_id, a]),
  );
  const rows: Row[] = (enrRes.data ?? []).map((e: any) => {
    const a = att.get(e.id);
    return {
      id: e.id,
      full_name: e.full_name,
      email: e.email,
      phone: e.phone,
      ticket_code: e.ticket_code,
      status: e.status,
      amount_inr: e.amount_inr,
      checked_in_at: a?.checked_in_at ?? null,
      attendance_method: a?.method ?? null,
    };
  });
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

export const attendanceRoster = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ programId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    return loadRoster(data.programId);
  });

/**
 * Check a participant in. Accepts either a scanned QR payload (`code`) or an
 * enrollment id (manual check-in). Everything is re-validated server side.
 */
export const attendanceCheckIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        programId: z.string().uuid(),
        code: z.string().trim().min(3).max(300).optional(),
        enrollmentId: z.string().uuid().optional(),
        method: z.enum(["qr", "manual"]).default("qr"),
      })
      .refine((v) => !!v.code || !!v.enrollmentId, { message: "Nothing to check in" })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("enrollments")
      .select("id, user_id, full_name, email, phone, ticket_code, status, program_id, program:programs(id, name)");

    if (data.enrollmentId) query = query.eq("id", data.enrollmentId);
    else query = query.eq("ticket_code", extractTicketCode(data.code!));

    const { data: enr } = await query.maybeSingle();

    if (!enr) return { ok: false as const, reason: "not_found", message: "Ticket not found in registrations." };
    if (enr.program_id !== data.programId) {
      return {
        ok: false as const,
        reason: "wrong_workshop",
        message: `This ticket belongs to a different workshop (${(enr as any).program?.name ?? "unknown"}).`,
        participant: enr.full_name,
        ticket_code: enr.ticket_code,
      };
    }
    if (enr.status === "rejected") {
      return { ok: false as const, reason: "cancelled", message: "Registration was rejected / cancelled.", participant: enr.full_name };
    }
    if (enr.status !== "confirmed") {
      return { ok: false as const, reason: "unpaid", message: "Payment is not confirmed yet for this registration.", participant: enr.full_name };
    }

    const { data: existing } = await supabaseAdmin
      .from("attendance")
      .select("checked_in_at")
      .eq("enrollment_id", enr.id)
      .maybeSingle();
    if (existing) {
      return {
        ok: false as const,
        reason: "already",
        message: "Already checked in.",
        participant: enr.full_name,
        ticket_code: enr.ticket_code,
        workshop: (enr as any).program?.name ?? null,
        checked_in_at: existing.checked_in_at,
      };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("attendance")
      .insert({
        enrollment_id: enr.id,
        program_id: enr.program_id,
        user_id: enr.user_id,
        ticket_code: enr.ticket_code,
        method: data.method,
        checked_in_by: context.userId,
      })
      .select("checked_in_at")
      .maybeSingle();

    if (error) {
      // Unique violation = concurrent duplicate scan.
      if ((error as any).code === "23505") {
        const { data: dup } = await supabaseAdmin
          .from("attendance").select("checked_in_at").eq("enrollment_id", enr.id).maybeSingle();
        return {
          ok: false as const, reason: "already", message: "Already checked in.",
          participant: enr.full_name, ticket_code: enr.ticket_code,
          workshop: (enr as any).program?.name ?? null,
          checked_in_at: dup?.checked_in_at ?? null,
        };
      }
      throw error;
    }

    return {
      ok: true as const,
      participant: enr.full_name,
      ticket_code: enr.ticket_code,
      workshop: (enr as any).program?.name ?? null,
      checked_in_at: inserted?.checked_in_at ?? new Date().toISOString(),
    };
  });

/** Undo a check-in (mistake correction). */
export const attendanceUndo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ enrollmentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("attendance").delete().eq("enrollment_id", data.enrollmentId);
    if (error) throw error;
    return { ok: true };
  });

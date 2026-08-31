import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public server function: verifies a ticket by its code against the database.
// Returns only safe fields; a forged/unknown code returns { valid: false }.
export const verifyTicket = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ code: z.string().trim().min(4).max(64) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.toUpperCase();

    // Per-participant tickets (TTJ-XXXXXX-01) resolve to their own person.
    const { data: part } = await supabaseAdmin
      .from("enrollment_participants")
      .select("full_name, position, ticket_code, enrollment_id")
      .eq("ticket_code", code)
      .maybeSingle();

    if (part) {
      const { data: parent } = await supabaseAdmin
        .from("enrollments")
        .select("status, amount_inr, approved_at, registration_type, selected_workshop, participant_count, program:programs(name, duration, event_date, venue, workshop1_name, workshop2_name)")
        .eq("id", part.enrollment_id)
        .maybeSingle();
      if (!parent || parent.status !== "confirmed") return { valid: false as const };
      return {
        valid: true as const,
        ticket_code: part.ticket_code,
        student: part.full_name,
        participant_position: part.position,
        participant_count: parent.participant_count ?? 1,
        amount: parent.amount_inr,
        approved_at: parent.approved_at,
        registration_type: parent.registration_type,
        selected_workshop: parent.selected_workshop,
        program: parent.program,
      };
    }

    const { data: row } = await supabaseAdmin
      .from("enrollments")
      .select("ticket_code, status, full_name, amount_inr, approved_at, registration_type, selected_workshop, program:programs(name, duration, event_date, venue, workshop1_name, workshop2_name)")
      .eq("ticket_code", code)
      .maybeSingle();
    if (!row || row.status !== "confirmed") {
      return { valid: false as const };
    }
    return {
      valid: true as const,
      ticket_code: row.ticket_code,
      student: row.full_name,
      amount: row.amount_inr,
      approved_at: row.approved_at,
      registration_type: row.registration_type,
      selected_workshop: row.selected_workshop,
      program: row.program,
    };
  });

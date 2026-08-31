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
    const cols =
      "ticket_code, status, full_name, amount_inr, approved_at, registration_type, selected_workshop, program:programs(name, duration, event_date, venue, workshop1_name, workshop2_name)";

    // Individual participant tickets of a multi-person registration resolve to
    // that participant only; the parent registration supplies the shared data.
    const { data: part } = await supabaseAdmin
      .from("enrollment_participants")
      .select("full_name, ticket_code, position, enrollment:enrollments(" + cols + ")")
      .eq("ticket_code", code)
      .maybeSingle();

    const row: any = part ? (part as any).enrollment : (
      await supabaseAdmin.from("enrollments").select(cols).eq("ticket_code", code).maybeSingle()
    ).data;

    if (!row || row.status !== "confirmed") {
      return { valid: false as const };
    }
    return {
      valid: true as const,
      ticket_code: part ? (part as any).ticket_code : row.ticket_code,
      student: part ? (part as any).full_name : row.full_name,
      amount: row.amount_inr,
      approved_at: row.approved_at,
      registration_type: row.registration_type,
      selected_workshop: row.selected_workshop,
      program: row.program,
    };
  });


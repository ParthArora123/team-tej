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
    const { data: row } = await supabaseAdmin
      .from("enrollments")
      .select("ticket_code, status, full_name, amount_inr, approved_at, program:programs(name, duration, event_date, venue)")
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
      program: row.program,
    };
  });

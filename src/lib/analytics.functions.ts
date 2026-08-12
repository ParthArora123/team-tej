import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const adminOverviewAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ year: z.number().int().min(2000).max(2100).nullable().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase
      .from("user_roles").select("id")
      .eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("Forbidden");
    const { computeOverviewAnalytics } = await import("@/lib/analytics.server");
    return computeOverviewAnalytics(data.year ?? null);
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createPublicClient } from "@/integrations/supabase/client.public";

export interface PriceTier {
  id: string;
  label: string | null;
  sort_order: number;
  max_registrations: number;
  price_inr: number;
  both_price: number | null;
  remaining: number;
}

export interface ProgramPricing {
  registration_count: number;
  tiers: PriceTier[];
  current:
    | (Omit<PriceTier, "sort_order"> & { sort_order?: number })
    | null;
}

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase
    .from("user_roles").select("id")
    .eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (error || !data) throw new Error("Forbidden");
}

const EMPTY: ProgramPricing = { registration_count: 0, tiers: [], current: null };

/** Public: current applicable early-bird price for a workshop. */
export const getProgramPricing = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ programId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<ProgramPricing> => {
    const { data: res, error } = await (createPublicClient() as any)
      .rpc("get_program_pricing", { _program_id: data.programId });
    if (error) return EMPTY;
    return (res as ProgramPricing) ?? EMPTY;
  });

export const adminListPriceTiers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ programId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: tiers, error }, { data: pricing }] = await Promise.all([
      (supabaseAdmin as any)
        .from("program_price_tiers").select("*")
        .eq("program_id", data.programId)
        .order("sort_order", { ascending: true }),
      (supabaseAdmin as any).rpc("get_program_pricing", { _program_id: data.programId }),
    ]);
    if (error) throw error;
    return {
      tiers: (tiers ?? []) as any[],
      pricing: (pricing as ProgramPricing) ?? EMPTY,
    };
  });

const tierSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().max(80).nullable().optional(),
  max_registrations: z.number().int().min(1).max(100000),
  price_inr: z.number().int().min(0).max(10000000),
  both_price: z.number().int().min(0).max(10000000).nullable().optional(),
});

/** Admin: replace the full tier list for a workshop (add / edit / remove). */
export const adminSavePriceTiers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      programId: z.string().uuid(),
      tiers: z.array(tierSchema).max(20),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const keep = data.tiers.map((t) => t.id).filter(Boolean) as string[];
    let del = db.from("program_price_tiers").delete().eq("program_id", data.programId);
    if (keep.length) del = del.not("id", "in", `(${keep.join(",")})`);
    const { error: dErr } = await del;
    if (dErr) throw dErr;

    if (data.tiers.length) {
      const rows = data.tiers.map((t, i) => ({
        ...(t.id ? { id: t.id } : {}),
        program_id: data.programId,
        label: t.label?.trim() || null,
        sort_order: i,
        max_registrations: t.max_registrations,
        price_inr: t.price_inr,
        both_price: t.both_price ?? null,
      }));
      const { error } = await db.from("program_price_tiers").upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }
    return { ok: true };
  });

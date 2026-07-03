import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function pub() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase
    .from("user_roles").select("id")
    .eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (error || !data) throw new Error("Forbidden");
}

// ============== CELEBRITIES ==============
export const listPublicCelebrities = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (pub() as any)
    .from("celebrities").select("id,name,role,photo_url,sort_order")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
});

export const adminListCelebrities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).from("celebrities").select("*")
      .order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

const celebSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  role: z.string().max(160).optional().nullable(),
  photo_url: z.string().max(1000).optional().nullable(),
  sort_order: z.number().int().optional(),
  published: z.boolean().optional(),
});

export const adminSaveCelebrity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => celebSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    if (id) {
      const { error } = await (supabaseAdmin as any).from("celebrities").update(rest).eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: row, error } = await (supabaseAdmin as any).from("celebrities").insert(rest).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const adminDeleteCelebrity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("celebrities").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============== BRANDS ==============
export const listPublicBrands = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (pub() as any)
    .from("brands").select("id,name,logo_url,sort_order")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
});

export const adminListBrands = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).from("brands").select("*")
      .order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

const brandSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  logo_url: z.string().max(1000).optional().nullable(),
  sort_order: z.number().int().optional(),
  published: z.boolean().optional(),
});

export const adminSaveBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => brandSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    if (id) {
      const { error } = await (supabaseAdmin as any).from("brands").update(rest).eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: row, error } = await (supabaseAdmin as any).from("brands").insert(rest).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const adminDeleteBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("brands").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============== GLOBE LOCATIONS ==============
export const listPublicGlobe = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (pub() as any)
    .from("globe_locations").select("id,city,country,status,event_date,sort_order")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
});

export const adminListGlobe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).from("globe_locations").select("*")
      .order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

const globeSchema = z.object({
  id: z.string().uuid().optional(),
  city: z.string().min(1).max(120),
  country: z.string().min(1).max(120),
  status: z.enum(["conducted", "upcoming"]),
  event_date: z.string().optional().nullable(),
  sort_order: z.number().int().optional(),
  published: z.boolean().optional(),
});

export const adminSaveGlobe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => globeSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const payload: any = { ...rest, event_date: rest.event_date || null };
    if (id) {
      const { error } = await (supabaseAdmin as any).from("globe_locations").update(payload).eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: row, error } = await (supabaseAdmin as any).from("globe_locations").insert(payload).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const adminDeleteGlobe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("globe_locations").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

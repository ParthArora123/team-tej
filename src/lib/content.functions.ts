import { createServerFn } from "@tanstack/react-start";
import { createPublicClient } from "@/integrations/supabase/client.public";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function pub() {
  return createPublicClient();
}

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase
    .from("user_roles").select("id")
    .eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (error || !data) throw new Error("Forbidden");
}

// ============== CELEBRITIES ==============
const CELEB_BUCKET = "team-photos";
const CELEB_TTL = 60 * 60 * 24 * 7; // 7 days

async function decorateCelebrities(rows: any[]): Promise<any[]> {
  if (!rows?.length) return rows ?? [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return Promise.all(rows.map(async (r: any) => {
    if (r.photo_url) return r;
    if (!r.photo_path) return r;
    const { data } = await supabaseAdmin.storage.from(CELEB_BUCKET).createSignedUrl(r.photo_path, CELEB_TTL);
    return { ...r, photo_url: data?.signedUrl ?? null };
  }));
}

export const listPublicCelebrities = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any)
    .from("celebrities").select("id,name,role,photo_url,photo_path,sort_order")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[listPublicCelebrities] Supabase error:", error);
    throw error;
  }
  return decorateCelebrities(data ?? []);
});

export const adminListCelebrities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).from("celebrities").select("*")
      .order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    if (error) throw error;
    return decorateCelebrities(data ?? []);
  });

const celebSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().max(120).optional().nullable(),
  role: z.string().max(160).optional().nullable(),
  photo_url: z.string().max(1000).optional().nullable(),
  photo_path: z.string().max(500).optional().nullable(),
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
    const { data: prev } = await (supabaseAdmin as any).from("celebrities").select("photo_path").eq("id", data.id).maybeSingle();
    if (prev?.photo_path) {
      await supabaseAdmin.storage.from(CELEB_BUCKET).remove([prev.photo_path]);
    }
    const { error } = await (supabaseAdmin as any).from("celebrities").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminUploadCelebrityPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    celebrityId: z.string().uuid().optional(),
    filename: z.string().min(1).max(200),
    contentType: z.string().min(1).max(100),
    dataBase64: z.string().min(1),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!/^image\/(png|jpe?g|webp)$/.test(data.contentType)) {
      throw new Error("Only JPG, PNG, or WebP images are allowed.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    const ext = (data.filename.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const key = `celebrities/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage.from(CELEB_BUCKET).upload(key, bytes, {
      contentType: data.contentType, upsert: false,
    });
    if (upErr) throw upErr;
    if (data.celebrityId) {
      const { data: prev } = await (supabaseAdmin as any).from("celebrities").select("photo_path").eq("id", data.celebrityId).maybeSingle();
      if (prev?.photo_path && prev.photo_path !== key) {
        await supabaseAdmin.storage.from(CELEB_BUCKET).remove([prev.photo_path]);
      }
      await (supabaseAdmin as any).from("celebrities").update({ photo_path: key, photo_url: null }).eq("id", data.celebrityId);
    }
    const { data: signed } = await supabaseAdmin.storage.from(CELEB_BUCKET).createSignedUrl(key, CELEB_TTL);
    return { path: key, url: signed?.signedUrl ?? null };
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
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any)
    .from("globe_locations").select("id,city,country,status,event_date,sort_order")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[listPublicGlobe] Supabase error:", error);
    throw error;
  }
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
  event_date_to:z.string().optional().nullable(),
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

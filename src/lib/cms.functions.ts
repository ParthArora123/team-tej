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

const SIGN_TTL = 60 * 60 * 24 * 7; // 7 days

// image_url may be an absolute URL or a storage key prefixed with `bucket:key`.
async function signIfNeeded(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const [bucket, ...rest] = url.split(":");
  const key = rest.join(":");
  if (!bucket || !key) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage.from(bucket).createSignedUrl(key, SIGN_TTL);
  return data?.signedUrl ?? null;
}

async function decorateRows<T extends { image_url?: string | null; banner_url?: string | null }>(rows: T[], field: "image_url" | "banner_url" = "image_url"): Promise<T[]> {
  if (!rows?.length) return rows ?? [];
  return Promise.all(rows.map(async (r) => ({ ...r, [field]: await signIfNeeded((r as any)[field]) })));
}

// ============== HERO SLIDES ==============
export const listHeroSlides = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (pub() as any).from("hero_slides")
    .select("id,image_url,alt,sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return decorateRows(data ?? []);
});

export const adminListHeroSlides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).from("hero_slides").select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return decorateRows(data ?? []);
  });

const heroSchema = z.object({
  id: z.string().uuid().optional(),
  image_url: z.string().min(1).max(1000),
  alt: z.string().max(240).optional().nullable(),
  sort_order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const adminSaveHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => heroSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    if (id) {
      const { error } = await (supabaseAdmin as any).from("hero_slides").update(rest).eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: row, error } = await (supabaseAdmin as any).from("hero_slides").insert(rest).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const adminDeleteHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await (supabaseAdmin as any).from("hero_slides").select("image_url").eq("id", data.id).maybeSingle();
    if (prev?.image_url && !/^https?:\/\//i.test(prev.image_url)) {
      const [bucket, ...rest] = prev.image_url.split(":");
      if (bucket && rest.length) await supabaseAdmin.storage.from(bucket).remove([rest.join(":")]);
    }
    const { error } = await (supabaseAdmin as any).from("hero_slides").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminReorderHeroSlides = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ order: z.array(z.object({ id: z.string().uuid(), sort_order: z.number().int() })).max(200) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await Promise.all(data.order.map((o) =>
      (supabaseAdmin as any).from("hero_slides").update({ sort_order: o.sort_order }).eq("id", o.id),
    ));
    return { ok: true };
  });

// ============== FEATURED EXPERIENCE ==============
export const getFeaturedExperience = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (pub() as any).from("featured_experience")
    .select("*")
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [decorated] = await decorateRows([data], "banner_url");
  return decorated;
});

export const adminListFeaturedExperiences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).from("featured_experience").select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return decorateRows(data ?? [], "banner_url");
  });

const featuredSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional().default(""),
  banner_url: z.string().max(1000).optional().nullable(),
  city: z.string().max(160).optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  day_schedule: z.any().optional(),
  cta_text: z.string().max(80).optional(),
  cta_link: z.string().max(500).optional(),
  active: z.boolean().optional(),
});

export const adminSaveFeaturedExperience = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => featuredSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const payload: any = {
      ...rest,
      start_date: rest.start_date || null,
      end_date: rest.end_date || null,
      day_schedule: rest.day_schedule ?? [],
    };
    // Enforce single active row: deactivate others when activating this one.
    if (payload.active) {
      await (supabaseAdmin as any).from("featured_experience").update({ active: false }).neq("id", id ?? "00000000-0000-0000-0000-000000000000");
    }
    if (id) {
      const { error } = await (supabaseAdmin as any).from("featured_experience").update(payload).eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: row, error } = await (supabaseAdmin as any).from("featured_experience").insert(payload).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const adminDeleteFeaturedExperience = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await (supabaseAdmin as any).from("featured_experience").select("banner_url").eq("id", data.id).maybeSingle();
    if (prev?.banner_url && !/^https?:\/\//i.test(prev.banner_url)) {
      const [bucket, ...rest] = prev.banner_url.split(":");
      if (bucket && rest.length) await supabaseAdmin.storage.from(bucket).remove([rest.join(":")]);
    }
    const { error } = await (supabaseAdmin as any).from("featured_experience").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============== GALLERY ==============
export const listGalleryItems = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (pub() as any).from("gallery_items")
    .select("id,image_url,caption,sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return decorateRows(data ?? []);
});

export const adminListGalleryItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).from("gallery_items").select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return decorateRows(data ?? []);
  });

const gallerySchema = z.object({
  id: z.string().uuid().optional(),
  image_url: z.string().min(1).max(1000),
  caption: z.string().max(500).optional(),
  sort_order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const adminSaveGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => gallerySchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    if (id) {
      const { error } = await (supabaseAdmin as any).from("gallery_items").update(rest).eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: row, error } = await (supabaseAdmin as any).from("gallery_items").insert(rest).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const adminDeleteGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await (supabaseAdmin as any).from("gallery_items").select("image_url").eq("id", data.id).maybeSingle();
    if (prev?.image_url && !/^https?:\/\//i.test(prev.image_url)) {
      const [bucket, ...rest] = prev.image_url.split(":");
      if (bucket && rest.length) await supabaseAdmin.storage.from(bucket).remove([rest.join(":")]);
    }
    const { error } = await (supabaseAdmin as any).from("gallery_items").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============== SHARED IMAGE UPLOAD ==============
export const adminUploadCmsImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    bucket: z.enum(["hero-images", "gallery", "featured-banners"]),
    filename: z.string().min(1).max(200),
    contentType: z.string().min(1).max(100),
    dataBase64: z.string().min(1),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(data.contentType)) {
      throw new Error("Only JPG, PNG, WebP, or GIF images are allowed.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    const ext = (data.filename.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const key = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage.from(data.bucket).upload(key, bytes, {
      contentType: data.contentType, upsert: false,
    });
    if (upErr) throw upErr;
    const { data: signed } = await supabaseAdmin.storage.from(data.bucket).createSignedUrl(key, SIGN_TTL);
    // Return storage reference (persist this in image_url/banner_url) and a signed URL for immediate preview.
    return { image_url: `${data.bucket}:${key}`, preview_url: signed?.signedUrl ?? null };
  });

// Direct-to-storage signed upload URL for large hero videos (up to 500 MB).
// Client requests a signed URL, then PUTs the file to storage directly.
export const adminCreateHeroVideoUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    filename: z.string().min(1).max(200),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bucket = "hero-videos";
    const ext = (data.filename.split(".").pop() ?? "mp4").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "mp4";
    const key = `hero/${crypto.randomUUID()}.${ext}`;
    const { data: signed, error } = await (supabaseAdmin as any).storage.from(bucket).createSignedUploadUrl(key);
    if (error) throw error;
    return { bucket, key, path: `${bucket}:${key}`, uploadUrl: signed.signedUrl, token: signed.token };
  });


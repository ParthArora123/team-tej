import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const SIGN_TTL = 60 * 60 * 24 * 7; // 7 days

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

// `path` is stored as "bucket:key". Return a signed URL or null.
async function signPath(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const [bucket, ...rest] = path.split(":");
  const key = rest.join(":");
  if (!bucket || !key) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage.from(bucket).createSignedUrl(key, SIGN_TTL);
  return data?.signedUrl ?? null;
}

async function decorateSlide(r: any) {
  return {
    ...r,
    media_url: await signPath(r.media_path),
    poster_url: await signPath(r.poster_path),
  };
}

// ============ PUBLIC ============
export const listWorkshopHeroSlides = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (pub() as any)
    .from("workshop_hero_slides")
    .select("id, media_kind, media_path, poster_path, title, subtitle, description, cta_text, cta_link, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return Promise.all((data ?? []).map(decorateSlide));
});

// ============ ADMIN ============
export const adminListWorkshopHeroSlides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("workshop_hero_slides").select("*").order("sort_order", { ascending: true });
    if (error) throw error;
    return Promise.all((data ?? []).map(decorateSlide));
  });

const slideSchema = z.object({
  id: z.string().uuid().optional(),
  media_kind: z.enum(["image", "video", "gif"]),
  media_path: z.string().min(1).max(500),
  poster_path: z.string().max(500).nullable().optional(),
  title: z.string().max(200).nullable().optional(),
  subtitle: z.string().max(300).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  cta_text: z.string().max(80).nullable().optional(),
  cta_link: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().optional(),
  active: z.boolean().optional(),
  start_at: z.string().nullable().optional(),
  end_at: z.string().nullable().optional(),
});

export const adminSaveWorkshopHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => slideSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const clean: any = { ...rest, start_at: rest.start_at || null, end_at: rest.end_at || null };
    if (id) {
      const { error } = await (supabaseAdmin as any).from("workshop_hero_slides").update(clean).eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: row, error } = await (supabaseAdmin as any).from("workshop_hero_slides").insert(clean).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const adminDeleteWorkshopHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await (supabaseAdmin as any).from("workshop_hero_slides").select("media_path, poster_path").eq("id", data.id).maybeSingle();
    for (const p of [prev?.media_path, prev?.poster_path]) {
      if (!p) continue;
      const [bucket, ...rest] = String(p).split(":");
      if (bucket && rest.length) await supabaseAdmin.storage.from(bucket).remove([rest.join(":")]);
    }
    const { error } = await (supabaseAdmin as any).from("workshop_hero_slides").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminReorderWorkshopHeroSlides = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ ids: z.array(z.string().uuid()).max(200) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (let i = 0; i < data.ids.length; i++) {
      await (supabaseAdmin as any).from("workshop_hero_slides").update({ sort_order: i }).eq("id", data.ids[i]);
    }
    return { ok: true };
  });

// ============ UPLOAD (direct-to-storage signed URL) ============
// Client requests a signed upload URL, then PUTs the file to storage directly.
// This lets us handle very large videos (up to 500 MB) without base64 RPC.
export const adminCreateWorkshopMediaUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    kind: z.enum(["image", "video", "gif"]),
    filename: z.string().min(1).max(200),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bucket = data.kind === "video" ? "workshop-videos" : "workshop-images";
    const ext = (data.filename.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
    const key = `workshops/${crypto.randomUUID()}.${ext}`;
    const { data: signed, error } = await (supabaseAdmin as any).storage.from(bucket).createSignedUploadUrl(key);
    if (error) throw error;
    return { bucket, key, path: `${bucket}:${key}`, uploadUrl: signed.signedUrl, token: signed.token };
  });

export const adminGetSignedMediaUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ path: z.string().min(3).max(500) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    return { url: await signPath(data.path) };
  });

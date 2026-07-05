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

const SIGN_TTL = 60 * 60 * 24 * 7;

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

// ============= SITE CONTENT (key/value) =============
export const getSiteContent = createServerFn({ method: "GET" })
  .inputValidator((i) => z.object({ key: z.enum(["contact", "about", "founder"]) }).parse(i))
  .handler(async ({ data }) => {
    const { data: row, error } = await (pub() as any)
      .from("site_content").select("value").eq("key", data.key).maybeSingle();
    if (error) throw error;
    const value = row?.value ?? null;
    if (value && data.key === "founder" && value.image_url) {
      value.image_url = await signIfNeeded(value.image_url);
    }
    return value;
  });


export const adminSaveSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    key: z.enum(["contact", "about", "founder"]),
    value: z.any(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("site_content")
      .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;
    return { ok: true };
  });


// ============= DANCE STYLES =============
async function decorateStyles(rows: any[]) {
  return Promise.all((rows ?? []).map(async (r) => ({
    ...r,
    image_url: await signIfNeeded(r.image_url),
    video_url: await signIfNeeded(r.video_url),
  })));
}

export const listDanceStyles = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (pub() as any).from("dance_styles")
    .select("id,name,tagline,image_url,video_url,sort_order")
    .eq("active", true).order("sort_order", { ascending: true });
  if (error) throw error;
  return decorateStyles(data ?? []);
});

export const adminListDanceStyles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).from("dance_styles").select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return decorateStyles(data ?? []);
  });

const styleSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  tagline: z.string().max(240).optional().default(""),
  image_url: z.string().max(1000).optional().nullable(),
  video_url: z.string().max(1000).optional().nullable(),
  sort_order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const adminSaveDanceStyle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => styleSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    if (id) {
      const { error } = await (supabaseAdmin as any).from("dance_styles").update(rest).eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: row, error } = await (supabaseAdmin as any).from("dance_styles").insert(rest).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const adminDeleteDanceStyle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await (supabaseAdmin as any).from("dance_styles")
      .select("image_url,video_url").eq("id", data.id).maybeSingle();
    for (const url of [prev?.image_url, prev?.video_url]) {
      if (url && !/^https?:\/\//i.test(url)) {
        const [bucket, ...rest] = url.split(":");
        if (bucket && rest.length) await supabaseAdmin.storage.from(bucket).remove([rest.join(":")]);
      }
    }
    const { error } = await (supabaseAdmin as any).from("dance_styles").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============= MEDIA UPLOAD (image OR video) — writes to workshop-images bucket which is already provisioned =============
export const adminUploadStyleMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    kind: z.enum(["image", "video"]),
    filename: z.string().min(1).max(200),
    contentType: z.string().min(1).max(100),
    dataBase64: z.string().min(1),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.kind === "image" && !/^image\/(png|jpe?g|webp|gif)$/.test(data.contentType)) {
      throw new Error("Image must be JPG, PNG, WebP or GIF.");
    }
    if (data.kind === "video" && !/^video\/(mp4|webm|quicktime|x-matroska)$/.test(data.contentType)) {
      throw new Error("Video must be MP4, MOV or WebM.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    // 30 MB cap on server (base64 RPC size limit)
    if (bytes.byteLength > 30 * 1024 * 1024) throw new Error("File too large. Max 30 MB.");
    const ext = (data.filename.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "") || (data.kind === "video" ? "mp4" : "jpg");
    const bucket = "workshop-images"; // reuse existing bucket (admin-only writes; public read via signed URL)
    const key = `styles/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage.from(bucket).upload(key, bytes, {
      contentType: data.contentType, upsert: false,
    });
    if (upErr) throw upErr;
    const { data: signed } = await supabaseAdmin.storage.from(bucket).createSignedUrl(key, SIGN_TTL);
    return { url: `${bucket}:${key}`, preview_url: signed?.signedUrl ?? null };
  });

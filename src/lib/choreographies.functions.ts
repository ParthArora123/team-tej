import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createPublicClient } from "@/integrations/supabase/client.public";
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

/**
 * Optimised clips are stored as `<name>-1080.mp4` with a `<name>-720.mp4`
 * sibling. Signed URLs are path-bound, so the lighter mobile variant has to be
 * signed here on the server rather than string-swapped in the browser.
 */
function mobileVariant(url: string | null | undefined): string | null {
  if (!url || /^https?:\/\//i.test(url)) return null;
  return url.includes("-1080.mp4") ? url.replace("-1080.mp4", "-720.mp4") : null;
}

async function decorate(rows: any[]) {
  return Promise.all((rows ?? []).map(async (r) => ({
    ...r,
    thumbnail_url: await signIfNeeded(r.thumbnail_url),
    video_url: await signIfNeeded(r.video_url),
    video_url_mobile: await signIfNeeded(mobileVariant(r.video_url)),
  })));
}

// PUBLIC
export const listChoreographies = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (pub() as any).from("choreographies")
    .select("id,title,description,thumbnail_url,video_url,youtube_url,instagram_url,uploaded_at,sort_order")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  return decorate(data ?? []);
});

// ADMIN
export const adminListChoreographies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).from("choreographies").select("*")
      .order("sort_order", { ascending: true })
      .order("uploaded_at", { ascending: false });
    if (error) throw error;
    return decorate(data ?? []);
  });

const instagramUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .url({ message: "Instagram link must be a valid URL" })
  .refine(
    (u) => /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/.+/i.test(u),
    { message: "Must be an instagram.com URL" },
  );

const choreoSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  thumbnail_url: z.string().max(1000).optional().nullable(),
  video_url: z.string().max(1000).optional().nullable(),
  youtube_url: z.string().max(1000).optional().nullable(),
  instagram_url: z.union([instagramUrlSchema, z.literal(""), z.null()]).optional(),
  published: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  uploaded_at: z.string().optional().nullable(),
});

export const adminSaveChoreography = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => choreoSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const row: any = {
      ...rest,
      description: rest.description || null,
      thumbnail_url: rest.thumbnail_url || null,
      video_url: rest.video_url || null,
      youtube_url: rest.youtube_url || null,
      instagram_url: rest.instagram_url || null,
      uploaded_at: rest.uploaded_at || new Date().toISOString(),
    };
    if (id) {
      const { error } = await (supabaseAdmin as any).from("choreographies").update(row).eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: ins, error } = await (supabaseAdmin as any).from("choreographies").insert(row).select("id").single();
    if (error) throw error;
    return { ok: true, id: ins.id };
  });

export const adminDeleteChoreography = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await (supabaseAdmin as any).from("choreographies")
      .select("thumbnail_url,video_url").eq("id", data.id).maybeSingle();
    for (const url of [prev?.thumbnail_url, prev?.video_url]) {
      if (url && !/^https?:\/\//i.test(url)) {
        const [bucket, ...rest] = url.split(":");
        if (bucket && rest.length) await supabaseAdmin.storage.from(bucket).remove([rest.join(":")]);
      }
    }
    const { error } = await (supabaseAdmin as any).from("choreographies").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// Legacy base64 upload (kept for compatibility, no longer used by client).
export const adminUploadChoreographyMedia = createServerFn({ method: "POST" })
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
    const maxBytes = data.kind === "video" ? 500 * 1024 * 1024 : 30 * 1024 * 1024;
    if (bytes.byteLength > maxBytes) throw new Error(`File too large. Max ${data.kind === "video" ? "500" : "30"} MB.`);
    const ext = (data.filename.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "") || (data.kind === "video" ? "mp4" : "jpg");
    const bucket = "workshop-images";
    const key = `choreographies/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage.from(bucket).upload(key, bytes, {
      contentType: data.contentType, upsert: false,
    });
    if (upErr) throw upErr;
    const { data: signed } = await supabaseAdmin.storage.from(bucket).createSignedUrl(key, SIGN_TTL);
    return { url: `${bucket}:${key}`, preview_url: signed?.signedUrl ?? null };
  });

// Preferred path: create a signed upload URL; client uploads the file bytes directly to storage.
export const adminCreateChoreographyUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    kind: z.enum(["image", "video"]),
    filename: z.string().min(1).max(200),
    contentType: z.string().min(1).max(100),
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
    const ext = (data.filename.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")
      || (data.kind === "video" ? "mp4" : "jpg");
    const bucket = "workshop-images";
    const key = `choreographies/${crypto.randomUUID()}.${ext}`;
    const { data: signed, error } = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(key);
    if (error || !signed) throw error ?? new Error("Failed to create upload URL");
    return { bucket, key, path: signed.path, token: signed.token, ref: `${bucket}:${key}` };
  });

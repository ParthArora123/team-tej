import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createPublicClient } from "@/integrations/supabase/client.public";
import { z } from "zod";

const SIGN_TTL = 60 * 60 * 24 * 7;

function pub() {
  return createPublicClient();
}
async function assertAdmin(context: any) {
  const { data, error } = await context.supabase
    .from("user_roles").select("id")
    .eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (error || !data) throw new Error("Forbidden");
}

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

async function decorate(r: any) {
  return { ...r, media_url: await signPath(r.media_path), poster_url: await signPath(r.poster_path) };
}

export const listWorkshopMedia = createServerFn({ method: "GET" })
  .inputValidator((i) => z.object({ programId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { data: rows, error } = await (pub() as any)
      .from("workshop_media")
      .select("id, program_id, media_kind, media_path, poster_path, caption, sort_order")
      .eq("program_id", data.programId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return Promise.all((rows ?? []).map(decorate));
  });

export const adminListWorkshopMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ programId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await (supabaseAdmin as any)
      .from("workshop_media").select("*").eq("program_id", data.programId).order("sort_order", { ascending: true });
    if (error) throw error;
    return Promise.all((rows ?? []).map(decorate));
  });

const mediaSchema = z.object({
  id: z.string().uuid().optional(),
  program_id: z.string().uuid(),
  media_kind: z.enum(["image", "video", "gif"]),
  media_path: z.string().min(1).max(500),
  poster_path: z.string().max(500).nullable().optional(),
  caption: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().optional(),
});

export const adminSaveWorkshopMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => mediaSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    if (id) {
      const { error } = await (supabaseAdmin as any).from("workshop_media").update(rest).eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: row, error } = await (supabaseAdmin as any).from("workshop_media").insert(rest).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const adminDeleteWorkshopMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await (supabaseAdmin as any).from("workshop_media").select("media_path, poster_path").eq("id", data.id).maybeSingle();
    for (const p of [prev?.media_path, prev?.poster_path]) {
      if (!p) continue;
      const [bucket, ...rest] = String(p).split(":");
      if (bucket && rest.length) await supabaseAdmin.storage.from(bucket).remove([rest.join(":")]);
    }
    const { error } = await (supabaseAdmin as any).from("workshop_media").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminReorderWorkshopMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ ids: z.array(z.string().uuid()).max(200) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (let i = 0; i < data.ids.length; i++) {
      await (supabaseAdmin as any).from("workshop_media").update({ sort_order: i }).eq("id", data.ids[i]);
    }
    return { ok: true };
  });

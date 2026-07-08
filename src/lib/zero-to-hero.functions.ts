import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const SIGN_TTL = 60 * 60 * 24 * 7;

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

export const listZeroToHeroMedia = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (pub() as any)
    .from("zero_to_hero_media")
    .select("id, media_kind, media_path, poster_path, caption, sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return Promise.all((data ?? []).map(decorate));
});

export const adminListZeroToHeroMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("zero_to_hero_media").select("*").order("sort_order", { ascending: true });
    if (error) throw error;
    return Promise.all((data ?? []).map(decorate));
  });

const schema = z.object({
  id: z.string().uuid().optional(),
  media_kind: z.enum(["image", "video", "gif"]),
  media_path: z.string().min(1).max(500),
  poster_path: z.string().max(500).nullable().optional(),
  caption: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const adminSaveZeroToHeroMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => schema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    if (id) {
      const { error } = await (supabaseAdmin as any).from("zero_to_hero_media").update(rest).eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: row, error } = await (supabaseAdmin as any).from("zero_to_hero_media").insert(rest).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const adminDeleteZeroToHeroMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await (supabaseAdmin as any).from("zero_to_hero_media").select("media_path, poster_path").eq("id", data.id).maybeSingle();
    for (const p of [prev?.media_path, prev?.poster_path]) {
      if (!p) continue;
      const [bucket, ...rest] = String(p).split(":");
      if (bucket && rest.length) await supabaseAdmin.storage.from(bucket).remove([rest.join(":")]);
    }
    const { error } = await (supabaseAdmin as any).from("zero_to_hero_media").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminReorderZeroToHeroMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ ids: z.array(z.string().uuid()).max(200) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (let i = 0; i < data.ids.length; i++) {
      await (supabaseAdmin as any).from("zero_to_hero_media").update({ sort_order: i }).eq("id", data.ids[i]);
    }
    return { ok: true };
  });

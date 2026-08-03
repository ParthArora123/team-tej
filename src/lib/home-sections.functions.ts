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

async function removeStored(paths: (string | null | undefined)[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  for (const p of paths) {
    if (!p || /^https?:\/\//i.test(p)) continue;
    const [bucket, ...rest] = String(p).split(":");
    if (bucket && rest.length) await supabaseAdmin.storage.from(bucket).remove([rest.join(":")]);
  }
}

/* ============================ FEATURED PERFORMANCES ============================ */

const PERF_COLS = "id, title, event_name, location, achievement, media_kind, media_path, poster_path, cta_text, cta_link, sort_order";

export const listPerformances = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (pub() as any)
    .from("home_performances")
    .select(PERF_COLS)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return Promise.all((data ?? []).map(decorate));
});

export const adminListPerformances = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("home_performances").select("*").order("sort_order", { ascending: true });
    if (error) throw error;
    return Promise.all((data ?? []).map(decorate));
  });

const perfSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  event_name: z.string().max(200).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  achievement: z.string().max(300).nullable().optional(),
  media_kind: z.enum(["image", "video", "gif"]),
  media_path: z.string().max(500).nullable().optional(),
  poster_path: z.string().max(500).nullable().optional(),
  cta_text: z.string().max(60).optional(),
  cta_link: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const adminSavePerformance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => perfSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    if (id) {
      const { error } = await (supabaseAdmin as any).from("home_performances").update(rest).eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: row, error } = await (supabaseAdmin as any)
      .from("home_performances").insert(rest).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const adminDeletePerformance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await (supabaseAdmin as any)
      .from("home_performances").select("media_path, poster_path").eq("id", data.id).maybeSingle();
    await removeStored([prev?.media_path, prev?.poster_path]);
    const { error } = await (supabaseAdmin as any).from("home_performances").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/* ============================ SIGNATURE PROGRAMS ============================ */

const PROG_COLS = "id, title, description, media_kind, media_path, poster_path, cta_text, cta_link, sort_order";

export const listSignaturePrograms = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (pub() as any)
    .from("signature_programs")
    .select(PROG_COLS)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return Promise.all((data ?? []).map(decorate));
});

export const adminListSignaturePrograms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("signature_programs").select("*").order("sort_order", { ascending: true });
    if (error) throw error;
    return Promise.all((data ?? []).map(decorate));
  });

const progSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(600).nullable().optional(),
  media_kind: z.enum(["image", "video", "gif"]),
  media_path: z.string().max(500).nullable().optional(),
  poster_path: z.string().max(500).nullable().optional(),
  cta_text: z.string().max(60).optional(),
  cta_link: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const adminSaveSignatureProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => progSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    if (id) {
      const { error } = await (supabaseAdmin as any).from("signature_programs").update(rest).eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: row, error } = await (supabaseAdmin as any)
      .from("signature_programs").insert(rest).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const adminDeleteSignatureProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await (supabaseAdmin as any)
      .from("signature_programs").select("media_path, poster_path").eq("id", data.id).maybeSingle();
    await removeStored([prev?.media_path, prev?.poster_path]);
    const { error } = await (supabaseAdmin as any).from("signature_programs").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

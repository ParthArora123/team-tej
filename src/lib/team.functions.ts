import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function pub() {
  return createClient<Database>(
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

const BUCKET = "team-photos";
const SIGNED_TTL = 60 * 60 * 24 * 7; // 7 days

async function signPath(admin: any, path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data } = await admin.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL);
  return data?.signedUrl ?? null;
}

async function decorate(rows: any[]): Promise<any[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return Promise.all((rows ?? []).map(async (r: any) => {
    const signed = await signPath(supabaseAdmin, r.photo_path);
    return { ...r, photo_url: r.photo_url || signed };
  }));
}

export const listPublicTeamProfiles = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await pub()
    .from("team_profiles")
    .select("id,name,designation,short_description,biography,photo_url,photo_path,achievements,dance_styles,experience,socials,sort_order")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return decorate(data ?? []);
});

export const adminListTeamProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("team_profiles").select("*")
      .order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    if (error) throw error;
    return decorate(data ?? []);
  });

const profileSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  designation: z.string().max(160).optional().nullable(),
  short_description: z.string().max(500).optional().nullable(),
  biography: z.string().max(4000).optional().nullable(),
  photo_url: z.string().max(1000).optional().nullable(),
  photo_path: z.string().max(500).optional().nullable(),
  achievements: z.array(z.string().max(300)).optional(),
  dance_styles: z.array(z.string().max(80)).optional(),
  experience: z.string().max(200).optional().nullable(),
  socials: z.record(z.string(), z.string().max(500)).optional(),
  sort_order: z.number().int().optional(),
  published: z.boolean().optional(),
});

export const adminSaveTeamProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => profileSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const payload: any = { ...rest };
    if (id) {
      const { error } = await supabaseAdmin.from("team_profiles").update(payload).eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: row, error } = await supabaseAdmin.from("team_profiles").insert(payload).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const adminDeleteTeamProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("team_profiles").select("photo_path").eq("id", data.id).maybeSingle();
    if (row?.photo_path) {
      await supabaseAdmin.storage.from(BUCKET).remove([row.photo_path]);
    }
    const { error } = await supabaseAdmin.from("team_profiles").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminSetTeamProfilePublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), published: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("team_profiles").update({ published: data.published }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminReorderTeamProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), direction: z.enum(["up", "down"]) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: all } = await supabaseAdmin.from("team_profiles").select("id, sort_order, created_at")
      .order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    const list = all ?? [];
    const idx = list.findIndex((r: any) => r.id === data.id);
    if (idx < 0) throw new Error("Not found");
    const swapIdx = data.direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return { ok: true };
    // Reassign sort_order sequentially, swapping the two
    const reordered = [...list];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    await Promise.all(reordered.map((r: any, i: number) =>
      supabaseAdmin.from("team_profiles").update({ sort_order: i }).eq("id", r.id),
    ));
    return { ok: true };
  });

export const adminUploadTeamPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    profileId: z.string().uuid().optional(),
    filename: z.string().min(1).max(200),
    contentType: z.string().min(1).max(100),
    dataBase64: z.string().min(1),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    const ext = (data.filename.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const key = `profiles/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage.from(BUCKET).upload(key, bytes, {
      contentType: data.contentType, upsert: false,
    });
    if (upErr) throw upErr;
    if (data.profileId) {
      // Delete old photo if any
      const { data: prev } = await supabaseAdmin.from("team_profiles").select("photo_path").eq("id", data.profileId).maybeSingle();
      if (prev?.photo_path && prev.photo_path !== key) {
        await supabaseAdmin.storage.from(BUCKET).remove([prev.photo_path]);
      }
      await supabaseAdmin.from("team_profiles").update({ photo_path: key, photo_url: null }).eq("id", data.profileId);
    }
    const { data: signed } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(key, SIGNED_TTL);
    return { path: key, url: signed?.signedUrl ?? null };
  });

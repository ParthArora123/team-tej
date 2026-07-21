import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

function pub() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

// Public reads go through the `programs_public` view, which excludes payment recipient details.
const PUBLIC_COLS =
  "id,kind,name,description,banner_url,banner_path,banner_video_path,banner_gif_path,event_date,event_time,venue,city,instructor,duration,capacity,seats_taken,price_inr,registration_open_on,category,style,published,silver_seat_enabled,silver_seat_price,allow_single,allow_both,both_price,workshop1_name,workshop2_name,silver_capacity_w1,silver_capacity_w2,created_at";

const BANNER_TTL = 60 * 60 * 24 * 7; // 7 days

async function signBucketPath(bucket: string, key: string | null | undefined) {
  if (!key) return null;
  // Values may be stored as "bucket:key" (new uploads) or just "key" (legacy).
  let b = bucket;
  let k = key;
  if (key.includes(":")) {
    const [bk, ...rest] = key.split(":");
    b = bk;
    k = rest.join(":");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage.from(b).createSignedUrl(k, BANNER_TTL);
  return data?.signedUrl ?? null;
}

async function decorateBanners(rows: any[]): Promise<any[]> {
  if (!rows?.length) return rows ?? [];
  return Promise.all(rows.map(async (r: any) => {
    const banner_url = r.banner_url || await signBucketPath("workshop-images", r.banner_path);
    const banner_video_url = await signBucketPath("workshop-videos", r.banner_video_path);
    const banner_gif_url = await signBucketPath("workshop-images", r.banner_gif_path);
    return { ...r, banner_url, banner_video_url, banner_gif_url };
  }));
}

export const listPrograms = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ kind: z.string().optional() }).parse(input ?? {}))
  .handler(async ({ data }) => {
    let q = (pub() as any).from("programs_public").select(PUBLIC_COLS).order("created_at", { ascending: false });
    if (data.kind) q = q.eq("kind", data.kind);
    const { data: rows, error } = await q;
    if (error) throw error;
    return decorateBanners(rows ?? []);
  });

export const getProgram = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await (pub() as any).from("programs_public").select(PUBLIC_COLS).eq("id", data.id).maybeSingle();
    if (error) throw error;
    if (!row) return row;
    const [decorated] = await decorateBanners([row]);
    return decorated;
  });



export const listEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await pub().from("events").select("*").eq("active", true).order("event_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
});

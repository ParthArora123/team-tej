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

// Public reads go through the `programs_public` view, which excludes upi_id_encrypted.
const PUBLIC_COLS =
  "id,kind,name,description,banner_url,banner_path,event_date,event_time,venue,instructor,duration,capacity,seats_taken,price_inr,registration_closes_on,registration_open_on,category,style,published,silver_seat_enabled,bank_account_holder,created_at";

const BANNER_BUCKET = "workshop-images";
const BANNER_TTL = 60 * 60 * 24 * 7; // 7 days

async function decorateBanners(rows: any[]): Promise<any[]> {
  if (!rows?.length) return rows ?? [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return Promise.all(rows.map(async (r: any) => {
    if (r.banner_url) return r;
    if (!r.banner_path) return r;
    const { data } = await supabaseAdmin.storage.from(BANNER_BUCKET).createSignedUrl(r.banner_path, BANNER_TTL);
    return { ...r, banner_url: data?.signedUrl ?? null };
  }));
}

export const listPrograms = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ kind: z.string().optional() }).parse(input ?? {}))
  .handler(async ({ data }) => {
    let q = (pub() as any).from("programs_public").select(PUBLIC_COLS).order("event_date", { ascending: true, nullsFirst: false });
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

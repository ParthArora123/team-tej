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

export const listPrograms = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ kind: z.string().optional() }).parse(input ?? {}))
  .handler(async ({ data }) => {
    let q = pub().from("programs").select("*").eq("published", true).order("event_date", { ascending: true, nullsFirst: false });
    if (data.kind) q = q.eq("kind", data.kind as never);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const getProgram = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await pub().from("programs").select("*").eq("id", data.id).eq("published", true).maybeSingle();
    if (error) throw error;
    return row;
  });

export const listEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await pub().from("events").select("*").eq("active", true).order("event_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
});

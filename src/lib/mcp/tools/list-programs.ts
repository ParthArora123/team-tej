import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_programs",
  title: "List programs and workshops",
  description:
    "List active Team Tej programs (classes and workshops). Returns id, name, kind, price, event date, venue, instructor, and description.",
  inputSchema: {
    kind: z
      .enum(["class", "workshop"])
      .optional()
      .describe("Filter by kind. Omit to return both."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ kind }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    let q = (supabase as any)
      .from("programs_public")
      .select(
        "id,kind,name,description,price_inr,event_date,event_time,venue,city,instructor,duration,category,style",
      )
      .order("created_at", { ascending: false });
    if (kind) q = q.eq("kind", kind);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const today = new Date().toISOString().slice(0, 10);
    const rows = (data ?? []).filter((r: any) =>
      r.kind === "workshop" && r.event_date
        ? String(r.event_date).slice(0, 10) >= today
        : true,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { count: rows.length, programs: rows },
    };
  },
});

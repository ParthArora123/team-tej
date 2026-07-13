import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "submit_feedback",
  title: "Submit feedback / testimonial",
  description:
    "Post a public testimonial from the signed-in user. Appears on the homepage 'What Movers Say' section immediately.",
  inputSchema: {
    name: z.string().min(1).describe("Display name for the testimonial."),
    role: z
      .string()
      .optional()
      .describe("Optional role/title (e.g. 'Student', 'Bride 2024')."),
    rating: z.number().int().min(1).max(5).describe("Star rating, 1 to 5."),
    story: z.string().min(1).describe("The feedback text."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ name, role, rating, story }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return {
        content: [{ type: "text", text: "Not authenticated" }],
        isError: true,
      };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("testimonials")
      .insert({
        name,
        role: role ?? null,
        rating,
        story,
        approved: true,
      })
      .select()
      .single();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Feedback submitted (id: ${data?.id}).` }],
      structuredContent: { testimonial: data },
    };
  },
});

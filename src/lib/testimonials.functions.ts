import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createPublicClient } from "@/integrations/supabase/client.public";
import { z } from "zod";

function pub() {
  return createPublicClient();
}

export const listPublicTestimonials = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await (pub() as any)
      .from("testimonials")
      .select("id,name,role,story,rating,avatar_url,created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as Array<{
      id: string;
      name: string;
      role: string | null;
      story: string | null;
      rating: number | null;
      avatar_url: string | null;
      created_at: string;
    }>;
  });

export const submitFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    name: z.string().trim().min(1).max(100),
    role: z.string().trim().max(120).optional().nullable(),
    story: z.string().trim().min(3).max(2000),
    rating: z.number().int().min(1).max(5),
    avatar_url: z.string().trim().url().max(1000).optional().nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any).from("testimonials").insert({
      user_id: context.userId,
      name: data.name,
      role: data.role || null,
      story: data.story,
      rating: data.rating,
      avatar_url: data.avatar_url || null,
      approved: true,
    });
    if (error) throw error;
    return { ok: true };
  });

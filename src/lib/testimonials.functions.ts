import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SIGN_TTL = 60 * 60 * 24 * 7; // 7 days for playback URLs

const videoBucket = "testimonial-videos";

const TestimonialSchema = z.object({
  name: z.string().min(1).max(120),
  role: z.string().max(120).default("Student"),
  quote: z.string().min(1).max(2000),
  video_url: z.string().max(500).optional(),
});

const UploadUrlSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(100),
});

const FeedbackSchema = z.object({
  name: z.string().min(1).max(120),
  role: z.string().max(120).nullable().optional(),
  story: z.string().min(1).max(2000),
  rating: z.number().int().min(1).max(5).default(5),
  avatar_url: z.string().max(500).nullable().optional(),
});

function mapTestimonialRow(t: any) {
  return {
    id: t.id,
    name: t.name,
    role: t.role || "Student",
    quote: t.story || "",
    video_url: t.video_url,
    createdAt: new Date(t.created_at).getTime(),
  };
}

async function hydrateSignedVideoUrls(rows: any[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  for (const row of rows) {
    if (row.video_url && row.video_url.includes(":")) {
      const [, key] = row.video_url.split(":");
      const { data: signed } = await supabaseAdmin.storage.from(videoBucket).createSignedUrl(key, SIGN_TTL);
      row.video_url = signed?.signedUrl ?? "";
    }
  }
  return rows;
}

/** Public list of approved stories (used by the homepage bundle). */
export const listPublicTestimonials = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .select("id, name, role, story, video_url, created_at")
    .eq("approved", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message || "Failed to load stories");
  const rows = (data ?? []).map(mapTestimonialRow);
  return await hydrateSignedVideoUrls(rows);
});

/** Alias for the /testimonials page. */
export const getTestimonials = createServerFn({ method: "GET" }).handler(async () => {
  return listPublicTestimonials({ data: undefined });
});

export const createTestimonialUploadUrl = createServerFn({ method: "POST" })
  .inputValidator((i) => UploadUrlSchema.parse(i))
  .handler(async ({ data }) => {
    if (!/^video\/(mp4|webm|quicktime|x-matroska|mov|m4v)$/.test(data.contentType)) {
      throw new Error("Video must be MP4, MOV or WebM.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext = (data.filename.split(".").pop() ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "mp4";
    const key = `${crypto.randomUUID()}.${ext}`;
    const { data: signed, error } = await supabaseAdmin.storage.from(videoBucket).createSignedUploadUrl(key);
    if (error || !signed) throw error ?? new Error("Failed to create upload URL");
    return { bucket: videoBucket, key, path: signed.path, token: signed.token, ref: `${videoBucket}:${key}` };
  });

export const submitTestimonial = createServerFn({ method: "POST" })
  .inputValidator((i) => TestimonialSchema.parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("testimonials").insert({
      name: data.name.trim(),
      role: data.role.trim() || "Student",
      story: data.quote.trim(),
      video_url: data.video_url || null,
      approved: true,
    });
    if (error) throw new Error(error.message || "Failed to post story");
    return { ok: true };
  });

/** Feedback submission used by the homepage feedback form. */
export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((i) => FeedbackSchema.parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("testimonials").insert({
      name: data.name.trim(),
      role: data.role?.trim() || "Student",
      story: data.story.trim(),
      rating: data.rating,
      avatar_url: data.avatar_url || null,
      approved: true,
    });
    if (error) throw new Error(error.message || "Could not submit feedback");
    return { ok: true };
  });

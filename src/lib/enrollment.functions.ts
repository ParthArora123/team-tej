import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const detailsSchema = z.object({
  programId: z.string().uuid(),
  fullName: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  age: z.number().int().min(4).max(95),
  experience: z.string().min(1).max(40),
});

export const createEnrollment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => detailsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // update profile
    await supabase.from("profiles").update({
      full_name: data.fullName,
      phone: data.phone,
      age: data.age,
      experience: data.experience,
    }).eq("id", userId);

    const { data: program, error: pErr } = await supabase
      .from("programs").select("*").eq("id", data.programId).maybeSingle();
    if (pErr || !program) throw new Error("Program not found");

    const { data: enr, error } = await supabase.from("enrollments").insert({
      user_id: userId,
      program_id: program.id,
      amount_inr: program.price_inr,
      status: "awaiting_payment",
    }).select("*").single();
    if (error) throw error;
    return enr;
  });

export const markPaymentSubmitted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ enrollmentId: z.string().uuid(), note: z.string().max(200).optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await context.supabase.from("enrollments")
      .update({ status: "payment_submitted", payment_note: data.note ?? null })
      .eq("id", data.enrollmentId).eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });

export const listMyEnrollments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("enrollments")
      .select("*, program:programs(*)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const listAllEnrollments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId, _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("enrollments")
      .select("*, program:programs(*), profile:profiles(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const approveEnrollment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ enrollmentId: z.string().uuid(), approve: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId, _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.approve) {
      const ticket = "TTJ-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const { error } = await supabaseAdmin.from("enrollments").update({
        status: "confirmed",
        ticket_code: ticket,
        approved_by: context.userId,
        approved_at: new Date().toISOString(),
      }).eq("id", data.enrollmentId);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin.from("enrollments").update({
        status: "rejected", approved_by: context.userId, approved_at: new Date().toISOString(),
      }).eq("id", data.enrollmentId);
      if (error) throw error;
    }
    return { ok: true };
  });

export const adminCreateProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    kind: z.enum(["workshop","nritya_sadhana","zero_to_hero","online_training"]),
    name: z.string().min(2),
    description: z.string().optional(),
    duration: z.string().optional(),
    price_inr: z.number().int().min(0),
    style: z.string().optional(),
    starts_on: z.string().optional(),
    seats: z.number().int().optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("programs").insert(data);
    if (error) throw error;
    return { ok: true };
  });

export const adminCreateEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    title: z.string().min(2),
    venue: z.string().optional(),
    event_date: z.string(),
    description: z.string().optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("events").insert(data);
    if (error) throw error;
    return { ok: true };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { isAdmin: !!data };
  });

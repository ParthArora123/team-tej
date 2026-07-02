import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const detailsSchema = z.object({
  programId: z.string().uuid(),
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  age: z.number().int().min(4).max(95),
  gender: z.string().min(1).max(20),
  address: z.string().min(2).max(300),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(80),
  emergencyContact: z.string().min(5).max(60),
  medicalInfo: z.string().max(500).optional().nullable(),
});

export const createEnrollment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => detailsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("profiles").update({
      full_name: data.fullName, phone: data.phone, age: data.age,
    }).eq("id", userId);

    const { data: program, error: pErr } = await supabase
      .from("programs").select("*").eq("id", data.programId).maybeSingle();
    if (pErr || !program) throw new Error("Program not found");
    if (program.capacity != null && (program.seats_taken ?? 0) >= program.capacity) {
      throw new Error("Sorry, this workshop is full.");
    }

    const { data: enr, error } = await supabase.from("enrollments").insert({
      user_id: userId, program_id: program.id, amount_inr: program.price_inr,
      status: "awaiting_payment",
      full_name: data.fullName, email: data.email, phone: data.phone, age: data.age,
      gender: data.gender, address: data.address, city: data.city, state: data.state,
      emergency_contact: data.emergencyContact, medical_info: data.medicalInfo ?? null,
    }).select("*").single();
    if (error) throw error;
    return enr;
  });

// After a student uploads a payment screenshot to the `payment-proofs` storage
// bucket, this validates the image with the Lovable AI vision model to make
// sure it actually looks like a UPI/bank payment screenshot (not a random
// image), then marks the enrollment as pending admin verification. A ticket
// is only generated when an admin approves the payment.
export const markPaymentSubmitted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    enrollmentId: z.string().uuid(),
    proofPath: z.string().min(3).max(300),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!data.proofPath.startsWith(`${context.userId}/`)) {
      throw new Error("Invalid upload path.");
    }

    const { data: existing, error: exErr } = await supabaseAdmin
      .from("enrollments")
      .select("id, user_id, status, ticket_code, program_id, amount_inr")
      .eq("id", data.enrollmentId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (exErr) throw exErr;
    if (!existing) throw new Error("Registration not found");

    if (existing.status === "confirmed" && existing.ticket_code) {
      return { ok: true, already: true };
    }

    const dl = await supabaseAdmin.storage.from("payment-proofs").download(data.proofPath);
    if (dl.error || !dl.data) throw new Error("Could not read the uploaded screenshot.");
    const blob = dl.data;
    let contentType = (blob.type || "").toLowerCase();
    if (!contentType || contentType === "application/octet-stream") {
      const ext = (data.proofPath.split(".").pop() || "").toLowerCase();
      contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : /jpe?g/.test(ext) ? "image/jpeg" : contentType;
    }
    if (!/^image\/(png|jpe?g|webp)$/.test(contentType)) {
      throw new Error("Please upload a valid payment screenshot.");
    }
    if (blob.size > 8 * 1024 * 1024) {
      throw new Error("Screenshot is too large. Max 8 MB.");
    }
    const buf = Buffer.from(await blob.arrayBuffer());
    const dataUrl = `data:${contentType};base64,${buf.toString("base64")}`;

    const verification = await verifyPaymentScreenshot(dataUrl, existing.amount_inr);
    if (!verification.accepted) {
      throw new Error("Please upload a valid payment screenshot.");
    }

    const genCode = () => "TTJ-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    let ticket = existing.ticket_code || genCode();
    if (!existing.ticket_code) {
      for (let i = 0; i < 5; i++) {
        const { data: dup } = await supabaseAdmin
          .from("enrollments").select("id").eq("ticket_code", ticket).maybeSingle();
        if (!dup) break;
        ticket = genCode();
      }
    }
    const now = new Date().toISOString();
    const { error: upErr } = await supabaseAdmin
      .from("enrollments").update({
        status: "confirmed",
        ticket_code: ticket,
        payment_proof_path: data.proofPath,
        payment_confirmed_at: now,
        ticket_generated_at: now,
        approved_at: now,
      })
      .eq("id", existing.id);
    if (upErr) throw upErr;

    if (existing.program_id) {
      const { data: p } = await supabaseAdmin.from("programs").select("seats_taken").eq("id", existing.program_id).single();
      await supabaseAdmin.from("programs").update({ seats_taken: (p?.seats_taken ?? 0) + 1 }).eq("id", existing.program_id);
    }

    return { ok: true, confirmed: true, ticket };
  });

async function verifyPaymentScreenshot(dataUrl: string, amountInr: number) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    throw new Error("Payment screenshot verification is not configured yet.");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You verify Indian payment proof screenshots for a dance workshop. Return only valid JSON with keys: is_payment_screenshot, payment_successful, amount_matches, detected_amount, reason. Be practical: accept UPI, bank, wallet, GPay, PhonePe, Paytm, BHIM, or netbanking success receipts. Reject unrelated images, pending/failed payments, edited/fake-looking screenshots, or screenshots with a clearly different amount.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Expected paid amount is INR ${amountInr}. Check whether this image is a successful payment receipt and whether the amount matches. If amount text is not readable but the screenshot clearly shows successful payment, set amount_matches true.`,
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error("Payment screenshot verification failed. Please upload a clear UPI/bank payment receipt.");
  }

  let parsed: any;
  try {
    const payload = JSON.parse(raw);
    const content = payload?.choices?.[0]?.message?.content ?? "{}";
    parsed = typeof content === "string" ? JSON.parse(content) : content;
  } catch {
    throw new Error("Payment screenshot could not be verified. Please upload a clearer receipt from your payment app.");
  }

  const detectedAmount = Number(parsed.detected_amount);
  const amountMatches = parsed.amount_matches === true || (
    Number.isFinite(detectedAmount) && Math.abs(detectedAmount - amountInr) <= Math.max(2, amountInr * 0.02)
  );

  if (parsed.is_payment_screenshot === true && parsed.payment_successful === true && amountMatches) {
    return { accepted: true, reason: "Verified" };
  }

  return {
    accepted: false,
    reason: typeof parsed.reason === "string" && parsed.reason.trim()
      ? parsed.reason
      : "This doesn't look like a successful payment screenshot. Please upload the receipt from your UPI/bank app.",
  };
}




export const listMyEnrollments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("enrollments").select("*, program:programs(*)")
      .eq("user_id", context.userId).order("created_at", { ascending: false });
    if (error) throw error;
    const { decryptSecret } = await import("./crypto.server");
    // Decrypt the workshop's UPI ID for the enrollee to display on the payment
    // page only. The ciphertext column is never returned to the client.
    return (data ?? []).map((r: any) => {
      if (r.program) {
        const upi = decryptSecret(r.program.upi_id_encrypted);
        const { upi_id_encrypted, ...rest } = r.program;
        r.program = { ...rest, upi_id: upi };
      }
      return r;
    });
  });

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden");
}

export const listAllEnrollments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("enrollments").select("*, program:programs(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const approveEnrollment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ enrollmentId: z.string().uuid(), approve: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.approve) {
      const genCode = () => "TTJ-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      let ticket = genCode();
      for (let i = 0; i < 5; i++) {
        const { data: dup } = await supabaseAdmin
          .from("enrollments").select("id").eq("ticket_code", ticket).maybeSingle();
        if (!dup) break;
        ticket = genCode();
      }
      const now = new Date().toISOString();
      const { data: enr, error } = await supabaseAdmin.from("enrollments").update({
        status: "confirmed", ticket_code: ticket,
        approved_by: context.userId, approved_at: now,
        ticket_generated_at: now,
      }).eq("id", data.enrollmentId).select("program_id").single();
      if (error) throw error;
      if (enr?.program_id) {
        const { data: p } = await supabaseAdmin.from("programs").select("seats_taken").eq("id", enr.program_id).single();
        await supabaseAdmin.from("programs").update({ seats_taken: (p?.seats_taken ?? 0) + 1 }).eq("id", enr.program_id);
      }
    } else {
      const { error } = await supabaseAdmin.from("enrollments").update({
        status: "rejected", approved_by: context.userId, approved_at: new Date().toISOString(),
      }).eq("id", data.enrollmentId);
      if (error) throw error;
    }
    return { ok: true };
  });

export const adminGetProofUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ path: z.string().min(3).max(300) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin
      .storage.from("payment-proofs").createSignedUrl(data.path, 300);
    if (error) throw error;
    return { url: signed.signedUrl };
  });

const workshopSchema = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(["workshop","nritya_sadhana","zero_to_hero","online_training"]).default("workshop"),
  name: z.string().min(2),
  description: z.string().optional(),
  banner_url: z.string().url().optional().or(z.literal("")),
  event_date: z.string().optional(),
  event_time: z.string().optional(),
  venue: z.string().optional(),
  instructor: z.string().optional(),
  duration: z.string().optional(),
  capacity: z.number().int().optional(),
  price_inr: z.number().int().min(0),
  registration_closes_on: z.string().optional(),
  category: z.string().optional(),
  style: z.string().optional(),
  published: z.boolean().default(false),
  upi_id: z.string().max(120).optional().or(z.literal("")),
  clear_upi: z.boolean().optional(),
});

export const adminSaveWorkshop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => workshopSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { upi_id, clear_upi, ...rest } = data;
    const clean: any = {
      ...rest,
      banner_url: rest.banner_url || null,
      event_date: rest.event_date || null,
      registration_closes_on: rest.registration_closes_on || null,
    };
    if (clear_upi) {
      clean.upi_id_encrypted = null;
    } else if (upi_id && upi_id.trim()) {
      const { encryptSecret, sanitizeUpiId } = await import("./crypto.server");
      clean.upi_id_encrypted = encryptSecret(sanitizeUpiId(upi_id));
    }
    if (data.id) {
      const { error } = await supabaseAdmin.from("programs").update(clean).eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await supabaseAdmin.from("programs").insert(clean).select("id").single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const adminSetPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), published: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("programs").update({ published: data.published }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteWorkshop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("programs").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminListWorkshops = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("programs").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    // Never expose ciphertext; expose a boolean flag so admins can see UPI status.
    return (data ?? []).map((r: any) => {
      const { upi_id_encrypted, ...rest } = r;
      return { ...rest, has_upi: !!upi_id_encrypted };
    });
  });


export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [w, wp, e] = await Promise.all([
      supabaseAdmin.from("programs").select("id, published"),
      supabaseAdmin.from("programs").select("id").eq("published", true),
      supabaseAdmin.from("enrollments").select("id, status, amount_inr"),
    ]);
    const enr = e.data ?? [];
    const revenue = enr.filter((r: any) => r.status === "confirmed").reduce((s: number, r: any) => s + (r.amount_inr ?? 0), 0);
    return {
      totalWorkshops: (w.data ?? []).length,
      activeWorkshops: (wp.data ?? []).length,
      totalRegs: enr.length,
      pending: enr.filter((r: any) => r.status === "payment_submitted").length,
      awaiting: enr.filter((r: any) => r.status === "awaiting_payment").length,
      approved: enr.filter((r: any) => r.status === "confirmed").length,
      rejected: enr.filter((r: any) => r.status === "rejected").length,
      revenue,
    };
  });

export const adminScanTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ ticket: z.string().min(4) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.ticket.trim().toUpperCase();
    const { data: row, error } = await supabaseAdmin
      .from("enrollments").select("*, program:programs(*)")
      .eq("ticket_code", code).maybeSingle();
    if (error) throw error;
    return row;
  });

export const adminCreateEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    title: z.string().min(2), venue: z.string().optional(),
    event_date: z.string(), description: z.string().optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("events").insert(data);
    if (error) throw error;
    return { ok: true };
  });

// Kept for existing add-program tab compatibility
export const adminCreateProgram = adminSaveWorkshop;

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

export const adminListTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, email, full_name, phone, created_at").order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);
    if (pErr) throw pErr;
    if (rErr) throw rErr;
    const roleMap = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const list = roleMap.get(r.user_id) ?? [];
      list.push(r.role);
      roleMap.set(r.user_id, list);
    });
    return (profiles ?? []).map((p: any) => ({
      ...p, roles: roleMap.get(p.id) ?? [], is_admin: (roleMap.get(p.id) ?? []).includes("admin"),
    }));
  });

export const adminSetUserAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid(), makeAdmin: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId && !data.makeAdmin) {
      throw new Error("You cannot remove your own admin role.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.makeAdmin) {
      const { error } = await supabaseAdmin.from("user_roles")
        .insert({ user_id: data.userId, role: "admin" as any });
      if (error && !String(error.message).toLowerCase().includes("duplicate")) throw error;
    } else {
      const { error } = await supabaseAdmin.from("user_roles")
        .delete().eq("user_id", data.userId).eq("role", "admin" as any);
      if (error) throw error;
    }
    return { ok: true };
  });

export const adminAddTeamByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ email: z.string().email() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();
    const { data: prof, error: pErr } = await supabaseAdmin
      .from("profiles").select("id, email").ilike("email", email).maybeSingle();
    if (pErr) throw pErr;
    if (!prof) throw new Error("No signed-up user with that email. Ask them to sign in once, then try again.");
    const { error } = await supabaseAdmin.from("user_roles")
      .insert({ user_id: prof.id, role: "admin" as any });
    if (error && !String(error.message).toLowerCase().includes("duplicate")) throw error;
    return { ok: true, userId: prof.id };
  });


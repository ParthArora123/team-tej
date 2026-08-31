import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { nameSchema } from "@/lib/name-validation";
import { phoneSchema } from "@/lib/phone-validation";

// Extra people covered by the same registration (Participant 2..5). The
// primary registrant is always Participant 1 and keeps the existing fields.
const extraParticipantSchema = z.object({
  fullName: nameSchema,
  email: z.string().email(),
  phone: phoneSchema,
});

const detailsSchema = z.object({
  programId: z.string().uuid(),
  fullName: nameSchema,
  email: z.string().email(),
  phone: phoneSchema,
  gender: z.string().min(1).max(20),
  emergencyContact: phoneSchema,
  silverSeat: z.boolean().optional(),
  registrationType: z.enum(["single", "both"]).optional(),
  selectedWorkshop: z.enum(["w1", "w2"]).optional(),
  silverSeatW1: z.boolean().optional(),
  silverSeatW2: z.boolean().optional(),
  participantCount: z.number().int().min(1).max(5).optional(),
  participants: z.array(extraParticipantSchema).max(4).optional(),
});

export const createEnrollment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => detailsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("profiles").update({
      full_name: data.fullName, phone: data.phone,
    }).eq("id", userId);

    const { data: program, error: pErr } = await supabase
      .from("programs")
      .select("id, name, price_inr, capacity, seats_taken, silver_seat_enabled, silver_seat_price, published, allow_single, allow_both, both_price, workshop1_name, workshop2_name, silver_capacity_w1, silver_capacity_w2")
      .eq("id", data.programId).maybeSingle();
    if (pErr || !program) throw new Error("Program not found");
    if (program.capacity != null && (program.seats_taken ?? 0) >= program.capacity) {
      throw new Error("Sorry, this workshop is full.");
    }

    const p = program as any;
    const allowSingle = p.allow_single !== false;
    const allowBoth = !!p.allow_both;
    let regType: "single" | "both" = data.registrationType ?? (allowSingle ? "single" : allowBoth ? "both" : "single");
    if (regType === "single" && !allowSingle) throw new Error("Single Workshop registration is not available for this workshop.");
    if (regType === "both" && !allowBoth) throw new Error("Both Workshops registration is not available for this workshop.");
    if (regType === "both" && (p.both_price == null || p.both_price <= 0)) {
      throw new Error("Both Workshops price is not configured for this workshop.");
    }
    const baseAmount = regType === "both" ? Number(p.both_price) : Number(p.price_inr);

    const silverPrice = Number(p.silver_seat_price ?? 1000);
    let silverW1 = false, silverW2 = false;
    let selected: "w1" | "w2" | null = null;

    if (regType === "both") {
      silverW1 = !!(data.silverSeatW1 && p.silver_seat_enabled);
      silverW2 = !!(data.silverSeatW2 && p.silver_seat_enabled);
    } else {
      if (allowBoth && (p.workshop1_name || p.workshop2_name)) {
        selected = data.selectedWorkshop ?? "w1";
      } else if (data.selectedWorkshop) {
        selected = data.selectedWorkshop;
      }
      const wantSilver = !!((data.silverSeat || data.silverSeatW1 || data.silverSeatW2) && p.silver_seat_enabled);
      if (wantSilver) {
        if (selected === "w2") silverW2 = true;
        else silverW1 = true;
      }
    }

    async function assertSilverCapacity(which: "w1" | "w2", cap: number | null | undefined) {
      if (!cap || cap <= 0) return;
      const col = which === "w1" ? "silver_seat_w1" : "silver_seat_w2";
      const { count, error } = await supabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("program_id", program!.id)
        .eq(col, true)
        .in("status", ["awaiting_payment", "payment_submitted", "confirmed"]);
      if (error) throw error;
      if ((count ?? 0) >= cap) {
        throw new Error(`Silver seats are sold out for ${which === "w1" ? (p.workshop1_name || "Workshop 1") : (p.workshop2_name || "Workshop 2")}.`);
      }
    }
    if (silverW1) await assertSilverCapacity("w1", p.silver_capacity_w1);
    if (silverW2) await assertSilverCapacity("w2", p.silver_capacity_w2);

    const silverCount = (silverW1 ? 1 : 0) + (silverW2 ? 1 : 0);
    const silverAdd = silverCount * silverPrice;
    const wantSilverLegacy = silverW1 || silverW2;

    // Multi-person registration: Participant 1 is the primary registrant, the
    // rest come from `participants`. Count defaults to 1 (existing behaviour).
    const extras = data.participants ?? [];
    const participantCount = Math.min(
      Math.max(data.participantCount ?? extras.length + 1, 1),
      5,
    );
    if (extras.length !== participantCount - 1) {
      throw new Error("Please fill in details for every participant.");
    }
    if (program.capacity != null && (program.seats_taken ?? 0) + participantCount > program.capacity) {
      throw new Error("Sorry, there aren't enough seats left for that many participants.");
    }

    const { data: enr, error } = await supabase.from("enrollments").insert({
      user_id: userId, program_id: program.id, amount_inr: baseAmount + silverAdd,
      status: "awaiting_payment",
      full_name: data.fullName, email: data.email, phone: data.phone,
      gender: data.gender,
      emergency_contact: data.emergencyContact,
      silver_amount_inr: silverAdd,
      silver_seat: wantSilverLegacy,
      silver_seat_w1: silverW1,
      silver_seat_w2: silverW2,
      registration_type: regType,
      selected_workshop: selected,
      participant_count: participantCount,
    } as any).select("*").single();
    if (error) throw error;

    let record: any = enr;

    if (participantCount > 1) {
      // Existing pricing logic (incl. early-bird tiers applied by the DB
      // trigger) decides the per-person price; we only multiply by headcount.
      const perPerson = Number((enr as any).tier_price_inr ?? baseAmount);
      const total = perPerson * participantCount + silverAdd;
      const { data: updated } = await supabase
        .from("enrollments").update({ amount_inr: total }).eq("id", (enr as any).id)
        .select("*").single();
      if (updated) record = updated;

      const rows = [
        { position: 1, full_name: data.fullName, email: data.email, phone: data.phone },
        ...extras.map((x, i) => ({
          position: i + 2, full_name: x.fullName, email: x.email, phone: x.phone,
        })),
      ].map((r) => ({ ...r, enrollment_id: (enr as any).id, program_id: program.id }));

      const { error: pErr2 } = await supabase.from("enrollment_participants").insert(rows as any);
      if (pErr2) throw pErr2;
    }

    return record;
  });


// After a student uploads a payment screenshot to the `payment-proofs` storage
// bucket, this validates the file with pure code (magic-byte MIME check,
// SHA256 hash for duplicate detection, user-supplied UTR uniqueness) and,
// once it passes those checks, moves the registration to
// "payment_submitted" (Pending Admin Approval). The ticket is NOT issued and
// no WhatsApp message is sent here — an admin must review the screenshot in
// the admin dashboard and Approve or Reject it (see `approveEnrollment`).
// No AI / LLM is involved in payment validation.
export const markPaymentSubmitted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    enrollmentId: z.string().uuid(),
    proofPath: z.string().min(3).max(300),
    paymentReference: z.string().trim().min(6).max(64)
      .regex(/^[A-Za-z0-9-]+$/, "UPI Reference ID must be 6–64 letters/digits."),
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
    const { validatePaymentProofBytes } = await import("./payment-proof-validation");
    const rawBytes = new Uint8Array(await dl.data.arrayBuffer());
    let validated;
    try {
      validated = await validatePaymentProofBytes(rawBytes, data.proofPath.split("/").pop() ?? null);
    } catch (e: any) {
      await supabaseAdmin.storage.from("payment-proofs").remove([data.proofPath]).catch(() => {});
      throw e;
    }

    // Deterministic duplicate detection — same image reused across registrations.
    const { data: dupProof } = await supabaseAdmin
      .from("enrollments").select("id").eq("payment_proof_sha256", validated.sha256).neq("id", existing.id).maybeSingle();
    if (dupProof) {
      await supabaseAdmin.storage.from("payment-proofs").remove([data.proofPath]).catch(() => {});
      throw new Error("This payment screenshot has already been used for another registration. Please upload a fresh screenshot of your actual payment.");
    }

    const ref = data.paymentReference.replace(/\s+/g, "");
    const { data: dupRef } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .ilike("payment_reference", ref)
      .neq("id", existing.id)
      .maybeSingle();
    if (dupRef) {
      throw new Error("This UPI Reference ID has already been used. Please verify your payment details.");
    }

    const { error: upErr } = await supabaseAdmin
      .from("enrollments").update({
        status: "payment_submitted",
        payment_proof_path: data.proofPath,
        payment_proof_sha256: validated.sha256,
        payment_reference: ref,
        payment_confirmed_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (upErr) throw upErr;

    // No ticket, no seat increment, and no WhatsApp message here — those all
    // happen once an admin approves the payment from the admin dashboard.
    return { ok: true, submitted: true, pending: true };
  });


export const listMyEnrollments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Use admin client so we can also read `upi_id_encrypted` for decryption
    // and sign banner URLs; results are strictly scoped to the current user.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("enrollments").select("*, program:programs(*), participants:enrollment_participants(id, position, full_name, email, phone, ticket_code)")
      .eq("user_id", context.userId).order("created_at", { ascending: false });
    if (error) throw error;
    const { decryptSecret } = await import("./crypto.server");
    const BANNER_BUCKET = "workshop-images";
    const BANNER_TTL = 60 * 60 * 24 * 7;
    return Promise.all((data ?? []).map(async (r: any) => {
      if (r.program) {
        const upi = decryptSecret(r.program.upi_id_encrypted);
        const { upi_id_encrypted, ...rest } = r.program;
        let banner_url = rest.banner_url ?? null;
        if (!banner_url && rest.banner_path) {
          const { data: signed } = await supabaseAdmin.storage
            .from(BANNER_BUCKET).createSignedUrl(rest.banner_path, BANNER_TTL);
          banner_url = signed?.signedUrl ?? null;
        }
        r.program = { ...rest, banner_url, upi_id: upi };
      }
      return r;
    }));
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
      .from("enrollments").select("*, program:programs(*), participants:enrollment_participants(id, position, full_name, email, phone, ticket_code)")
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
      // Approval + ticket generation live in one shared server-only helper so
      // the single and bulk ("Approve All") paths behave identically.
      const { approveEnrollmentById } = await import("./approve-enrollment.server");
      const res = await approveEnrollmentById(supabaseAdmin, data.enrollmentId, context.userId);
      // WhatsApp confirmation is handed off to the admin's WhatsApp (wa.me
      // deep link) in the UI right after approval, then recorded via
      // markWhatsappConfirmationSent. Nothing is sent from the server here.
      return {
        ok: true,
        enrollment: res.enrollment,
        ticketCode: res.ticketCode,
        whatsappAlreadySent: res.whatsappAlreadySent,
        confirmationEmailAlreadySent: res.confirmationEmailAlreadySent,
      };






    } else {
      const { error } = await supabaseAdmin.from("enrollments").update({
        status: "rejected", approved_by: context.userId, approved_at: new Date().toISOString(),
      }).eq("id", data.enrollmentId);
      if (error) throw error;
    }
    return { ok: true };
  });

// Bulk "Approve All": approves every registration currently pending approval
// (status = payment_submitted) and generates each one's ticket + QR code via
// the same shared logic as the individual approve action. Already approved,
// rejected or unpaid registrations are never touched, and failures are
// reported per-registration instead of failing silently.
export const approveAllPendingEnrollments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { approveEnrollmentById } = await import("./approve-enrollment.server");

    const { data: pending, error } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("status", "payment_submitted")
      .order("created_at", { ascending: true });
    if (error) throw error;

    const approved: Array<{
      enrollment: any;
      ticketCode: string;
      whatsappAlreadySent: boolean;
      confirmationEmailAlreadySent: boolean;
    }> = [];
    const failed: Array<{ id: string; message: string }> = [];

    for (const row of pending ?? []) {
      try {
        const res = await approveEnrollmentById(supabaseAdmin, row.id, context.userId);
        approved.push({
          enrollment: res.enrollment,
          ticketCode: res.ticketCode,
          whatsappAlreadySent: res.whatsappAlreadySent,
          confirmationEmailAlreadySent: res.confirmationEmailAlreadySent,
        });
      } catch (e: any) {
        failed.push({ id: row.id, message: e?.message ?? "Approval failed" });
      }
    }

    return { ok: failed.length === 0, total: (pending ?? []).length, approved, failed };
  });



// Records that the WhatsApp confirmation for an approved registration has been
// handed off to WhatsApp. Called once, immediately after the pre-filled
// message window opened successfully — never on submission, payment upload or
// dashboard refresh. Writing `whatsapp_status = 'sent'` makes the send
// idempotent: re-approving or reopening the registration will not send again.
export const markWhatsappConfirmationSent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ enrollmentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("enrollments").select("status, whatsapp_status").eq("id", data.enrollmentId).maybeSingle();
    // Only approved/confirmed registrations may be marked, and only once.
    if (row?.status !== "confirmed" || row?.whatsapp_status === "sent") {
      return { ok: true, alreadySent: row?.whatsapp_status === "sent" };
    }
    const { error } = await supabaseAdmin.from("enrollments").update({
      whatsapp_status: "sent",
      whatsapp_sent_at: new Date().toISOString(),
      whatsapp_error: null,
      notification_provider: "whatsapp_web",
    }).eq("id", data.enrollmentId);
    if (error) throw error;
    return { ok: true, alreadySent: false };
  });




// Records that the EmailJS approval-confirmation email for an approved
// registration has gone out. Only confirmed registrations can be marked, and
// only once, so re-approving or refreshing never sends a second email.
export const markConfirmationEmailSent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    enrollmentId: z.string().uuid(),
    error: z.string().max(500).optional().nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("enrollments").select("status, confirmation_email_sent").eq("id", data.enrollmentId).maybeSingle();
    if (row?.status !== "confirmed") return { ok: true, alreadySent: false };
    if (data.error) {
      // Failure: keep the approval intact, just record the error for retry.
      await supabaseAdmin.from("enrollments")
        .update({ confirmation_email_error: data.error }).eq("id", data.enrollmentId);
      return { ok: false, alreadySent: false };
    }
    if (row?.confirmation_email_sent === true) return { ok: true, alreadySent: true };
    const { error } = await supabaseAdmin.from("enrollments").update({
      confirmation_email_sent: true,
      confirmation_email_error: null,
    }).eq("id", data.enrollmentId);
    if (error) throw error;
    return { ok: true, alreadySent: false };
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
  banner_path: z.string().max(500).optional().or(z.literal("")),
  banner_video_path: z.string().max(500).optional().or(z.literal("")).nullable(),
  banner_gif_path: z.string().max(500).optional().or(z.literal("")).nullable(),
  event_date: z.string().optional(),
  event_time: z.string().optional(),
  venue: z.string().optional(),
  city: z.string().max(80).optional().or(z.literal("")),

  instructor: z.string().optional(),
  duration: z.string().optional(),
  capacity: z.number().int().optional(),
  price_inr: z.number().int().min(0),
  registration_open_on: z.string().optional(),
  category: z.string().optional(),
  style: z.string().optional(),
  published: z.boolean().default(false),
  silver_seat_enabled: z.boolean().optional(),
  silver_seat_price: z.number().int().min(0).optional(),
  allow_single: z.boolean().optional(),
  allow_both: z.boolean().optional(),
  both_price: z.number().int().min(0).optional().nullable(),
  workshop1_name: z.string().max(120).optional().or(z.literal("")).nullable(),
  workshop2_name: z.string().max(120).optional().or(z.literal("")).nullable(),
  silver_capacity_w1: z.number().int().min(0).optional().nullable(),
  silver_capacity_w2: z.number().int().min(0).optional().nullable(),
  session_schedule: z.array(z.object({
    time: z.string().max(40).default(""),
    name: z.string().max(160).default(""),
  })).max(20).optional().nullable(),
  upi_id: z.string().max(120).optional().or(z.literal("")),
  clear_upi: z.boolean().optional(),
  bank_account_holder: z.string().min(2).max(120),
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
      banner_path: rest.banner_path || null,
      banner_video_path: rest.banner_video_path || null,
      banner_gif_path: rest.banner_gif_path || null,
      event_date: rest.event_date || null,
      registration_open_on: rest.registration_open_on || null,
      silver_seat_enabled: !!rest.silver_seat_enabled,
      silver_seat_price: rest.silver_seat_price ?? 1000,
      allow_single: rest.allow_single !== false,
      allow_both: !!rest.allow_both,
      both_price: rest.allow_both ? (rest.both_price ?? null) : null,
      workshop1_name: rest.allow_both ? (rest.workshop1_name || null) : null,
      workshop2_name: rest.allow_both ? (rest.workshop2_name || null) : null,
      silver_capacity_w1: rest.silver_capacity_w1 ?? null,
      silver_capacity_w2: rest.allow_both ? (rest.silver_capacity_w2 ?? null) : null,
      session_schedule: (rest.session_schedule ?? [])
        .map((s) => ({ time: (s.time ?? "").trim(), name: (s.name ?? "").trim() }))
        .filter((s) => s.time || s.name),
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

export const adminUploadWorkshopImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    filename: z.string().min(1).max(200),
    contentType: z.string().min(1).max(100),
    dataBase64: z.string().min(1),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!/^image\/(png|jpe?g|webp)$/.test(data.contentType)) {
      throw new Error("Only JPG, PNG or WebP images are allowed.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    if (bytes.byteLength > 8 * 1024 * 1024) throw new Error("Image is too large. Max 8 MB.");
    const ext = (data.filename.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const key = `workshops/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage.from("workshop-images").upload(key, bytes, {
      contentType: data.contentType, upsert: false,
    });
    if (upErr) throw upErr;
    const { data: signed } = await supabaseAdmin.storage.from("workshop-images").createSignedUrl(key, 60 * 60 * 24 * 7);
    return { path: key, url: signed?.signedUrl ?? null };
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
    // Cascade delete: remove dependent enrollments first (FK is ON DELETE RESTRICT).
    const { error: enrErr } = await supabaseAdmin.from("enrollments").delete().eq("program_id", data.id);
    if (enrErr) throw enrErr;
    const { error } = await supabaseAdmin.from("programs").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteEnrollment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Cascade delete: remove dependent attendance records first (FK is ON DELETE RESTRICT).
    const { error: attErr } = await supabaseAdmin.from("attendance").delete().eq("enrollment_id", data.id);
    if (attErr) throw attErr;
    const { error } = await supabaseAdmin.from("enrollments").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteEnrollments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ ids: z.array(z.string().uuid()).min(1).max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Cascade delete: remove dependent attendance records first (FK is ON DELETE RESTRICT).
    const { error: attErr } = await supabaseAdmin.from("attendance").delete().in("enrollment_id", data.ids);
    if (attErr) throw attErr;
    const { error } = await supabaseAdmin.from("enrollments").delete().in("id", data.ids);
    if (error) throw error;
    return { ok: true, deleted: data.ids.length };
  });

export const adminListWorkshops = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("programs").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    // Never expose ciphertext; expose a boolean flag so admins can see UPI status.
    // Also decorate banner_path with a signed URL for preview in admin.
    return Promise.all((data ?? []).map(async (r: any) => {
      const { upi_id_encrypted, ...rest } = r;
      let banner_signed_url: string | null = null;
      if (rest.banner_path) {
        const { data: s } = await supabaseAdmin.storage.from("workshop-images").createSignedUrl(rest.banner_path, 60 * 60 * 24 * 7);
        banner_signed_url = s?.signedUrl ?? null;
      }
      let banner_video_signed_url: string | null = null;
      if (rest.banner_video_path) {
        const { data: s } = await supabaseAdmin.storage.from("workshop-videos").createSignedUrl(rest.banner_video_path, 60 * 60 * 24 * 7);
        banner_video_signed_url = s?.signedUrl ?? null;
      }
      let banner_gif_signed_url: string | null = null;
      if (rest.banner_gif_path) {
        const { data: s } = await supabaseAdmin.storage.from("workshop-images").createSignedUrl(rest.banner_gif_path, 60 * 60 * 24 * 7);
        banner_gif_signed_url = s?.signedUrl ?? null;
      }
      return { ...rest, has_upi: !!upi_id_encrypted, banner_signed_url, banner_video_signed_url, banner_gif_signed_url };
    }));
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


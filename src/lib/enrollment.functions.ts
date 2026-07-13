import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const detailsSchema = z.object({
  programId: z.string().uuid(),
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  gender: z.string().min(1).max(20),
  address: z.string().min(2).max(300),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(80),
  emergencyContact: z.string().min(5).max(60),
  silverSeat: z.boolean().optional(),
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
      .select("id, name, price_inr, capacity, seats_taken, silver_seat_enabled, silver_seat_price, published")
      .eq("id", data.programId).maybeSingle();
    if (pErr || !program) throw new Error("Program not found");
    if (program.capacity != null && (program.seats_taken ?? 0) >= program.capacity) {
      throw new Error("Sorry, this workshop is full.");
    }

    const wantSilver = !!data.silverSeat && !!(program as any).silver_seat_enabled;
    const { data: enr, error } = await supabase.from("enrollments").insert({
      user_id: userId, program_id: program.id, amount_inr: program.price_inr,
      status: "awaiting_payment",
      full_name: data.fullName, email: data.email, phone: data.phone,
      gender: data.gender, address: data.address, city: data.city, state: data.state,
      emergency_contact: data.emergencyContact,
      silver_seat: wantSilver,
    } as any).select("*").single();
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

    // Load program for recipient UPI + date-window validation.
    const { data: program, error: pErr } = await supabaseAdmin
      .from("programs")
      .select("upi_id_encrypted, event_date, registration_open_on, name, bank_account_holder")
      .eq("id", existing.program_id!)
      .maybeSingle();
    if (pErr || !program) throw new Error("Workshop not found for this registration.");

    const { decryptSecret, sanitizeUpiId } = await import("./crypto.server");
    const officialUpi = program.upi_id_encrypted
      ? sanitizeUpiId(decryptSecret(program.upi_id_encrypted) || "")
      : "";
    if (!officialUpi) {
      throw new Error("The workshop's official UPI ID is not configured yet. Please contact the admin.");
    }
    const holder = (program as any).bank_account_holder?.trim();
    if (!holder) {
      throw new Error("The workshop's bank account holder name is not configured yet. Please contact the admin.");
    }

    const dl = await supabaseAdmin.storage.from("payment-proofs").download(data.proofPath);
    if (dl.error || !dl.data) throw new Error("Could not read the uploaded screenshot.");
    const { validatePaymentProofBytes } = await import("./payment-proof-validation");
    const rawBytes = new Uint8Array(await dl.data.arrayBuffer());
    let validated;
    try {
      validated = await validatePaymentProofBytes(rawBytes, data.proofPath.split("/").pop() ?? null);
    } catch (e: any) {
      // Remove the invalid file so it does not linger in storage.
      await supabaseAdmin.storage.from("payment-proofs").remove([data.proofPath]).catch(() => {});
      throw e;
    }
    // Reject re-uploading the exact same image against a different registration.
    const [{ data: dupProofE }, { data: dupProofB }] = await Promise.all([
      supabaseAdmin.from("enrollments").select("id").eq("payment_proof_sha256", validated.sha256).neq("id", existing.id).maybeSingle(),
      supabaseAdmin.from("bundle_purchases").select("id").eq("payment_proof_sha256", validated.sha256).maybeSingle(),
    ]);
    if (dupProofE || dupProofB) {
      await supabaseAdmin.storage.from("payment-proofs").remove([data.proofPath]).catch(() => {});
      throw new Error("This payment screenshot has already been used for another registration. Please upload a fresh screenshot of your actual payment.");
    }
    const contentType = validated.mime;
    const dataUrl = `data:${contentType};base64,${Buffer.from(validated.bytes).toString("base64")}`;

    const verification = await verifyPaymentScreenshot(dataUrl, {
      amountInr: existing.amount_inr,
      officialUpi,
      recipientNames: [holder],
      registrationOpenOn: program.registration_open_on ?? null,
      eventDate: program.event_date ?? null,
    });
    if (!verification.accepted) {
      throw new Error(verification.reason);
    }

    // Require a UPI Reference ID (UTR / transaction ID) to be present on
    // every accepted screenshot. Without it we cannot enforce uniqueness.
    const ref = verification.reference ?? null;
    if (!ref) {
      throw new Error("Could not read the UPI Reference ID (UTR / Transaction ID) from this screenshot. Please upload a clearer payment confirmation that shows the transaction reference.");
    }
    // Uniqueness: reject if this UPI Reference ID was ever used on any prior
    // registration or payment record — regardless of status.
    const { data: dupRef } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .ilike("payment_reference", ref)
      .neq("id", existing.id)
      .maybeSingle();
    if (dupRef) {
      throw new Error("This UPI Reference ID has already been used. Please verify your payment details.");
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
        payment_proof_sha256: validated.sha256,
        payment_reference: ref,
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

type VerifyCtx = {
  amountInr: number;
  officialUpi: string;
  recipientNames: string[];
  registrationOpenOn: string | null;
  eventDate: string | null;
};

export async function verifyPaymentScreenshot(dataUrl: string, ctx: VerifyCtx) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    throw new Error("Payment screenshot verification is not configured yet.");
  }

  const today = new Date().toISOString().slice(0, 10);
  const openOn = ctx.registrationOpenOn || "any earlier date";
  const eventOn = ctx.eventDate || today;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a validator for Indian UPI payment confirmation screenshots (Google Pay, PhonePe, Paytm, BHIM, Amazon Pay, Cred, WhatsApp Pay, or any bank UPI app). Different apps format dates, times, and amounts very differently (e.g. '13 Jul 2026, 4:32 PM', '2026-07-13', '13/07/26', 'Today 4:32 PM', 'Just now'). Treat those as valid — never flag a screenshot as manipulated just because the layout, fonts, or date format is unfamiliar. Return ONLY valid JSON with keys: is_payment_screenshot (bool), is_screenshot_not_photo (bool), is_supported_upi_app (bool), detected_app (string or null), appears_manipulated (bool — set true ONLY when there is strong, obvious visual evidence of tampering such as clearly mismatched fonts inside the amount/status/date fields, visible clone-stamp or eraser artifacts, pixel-level splicing seams, or an obviously AI-generated fake receipt; DO NOT set true for unfamiliar layouts, unusual date formats, minor compression artifacts, OCR ambiguity, unknown banks, dark-mode UIs, or screenshots that merely 'look different'), manipulation_evidence (array of short strings describing the specific tampering artifacts you can point to; empty array if none), manipulation_reason (string or null), payment_status (one of successful|failed|pending|processing|cancelled|refunded|reversed|unknown), recipient_name (string or null), recipient_upi_id (string or null), payer_upi_id (string or null), amount (number or null), payment_date (YYYY-MM-DD or null — normalise from ANY format you see, including relative ones like 'Today'/'Yesterday' using the current date provided in the user message), payment_time (HH:MM or null), transaction_reference (string or null — the UTR / UPI Reference ID / bank reference number shown on the receipt; return the longest unique alphanumeric ID visible, no spaces), has_all_required_fields (bool — true if UPI Reference ID, payment status, amount, and date/time are all clearly visible), extraction_confidence (low|medium|high), reason (short human-readable string). Extract the RECIPIENT (payee / To) UPI ID and name, never the payer's. Reject camera photos of screens and screenshots from non-UPI apps. When unsure whether an image is manipulated, prefer appears_manipulated=false — false positives are worse than false negatives here.",

        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Validate this payment confirmation screenshot for a dance workshop.
Today's date (for resolving 'Today'/'Yesterday' or relative timestamps): ${today}
Expected recipient name (any one of these is acceptable): ${ctx.recipientNames.map((n) => `"${n}"`).join(" or ")}
Expected recipient UPI ID: "${ctx.officialUpi}"
Expected amount: INR ${ctx.amountInr}
Payment must be dated between ${openOn} and ${eventOn} (inclusive). Accept any date format the app uses and normalise it to YYYY-MM-DD.
Only set appears_manipulated=true if you can point to specific tampering artifacts in manipulation_evidence. Unfamiliar layout, unusual date/time format, unknown bank, dark mode, or minor compression noise are NOT tampering. If any required field (UPI Reference ID, status, amount, date/time) is missing or not clearly visible, set has_all_required_fields to false instead.`,
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    return { accepted: false, reason: "Payment screenshot verification failed. Please upload a clear UPI/bank payment confirmation screenshot." };
  }

  let p: any;
  try {
    const payload = JSON.parse(raw);
    const content = payload?.choices?.[0]?.message?.content ?? "{}";
    p = typeof content === "string" ? JSON.parse(content) : content;
  } catch {
    return { accepted: false, reason: "Could not read the payment screenshot. Please upload a clearer receipt from your payment app." };
  }

  const normUpi = (s: any) => String(s ?? "").toLowerCase().replace(/[^a-z0-9@._-]/g, "");
  const normName = (s: any) => String(s ?? "").toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();

  if (!p.is_payment_screenshot) {
    return { accepted: false, reason: "This doesn't look like a payment confirmation screenshot. Please upload the receipt from your UPI/bank app." };
  }
  if (p.is_screenshot_not_photo === false) {
    return { accepted: false, reason: "Please upload the original payment screenshot from your app — not a photo of a screen." };
  }
  if (p.appears_manipulated === true) {
    return { accepted: false, reason: `This screenshot appears to be edited, cropped, or AI-generated${p.manipulation_reason ? ` (${p.manipulation_reason})` : ""}. Please upload an unedited payment confirmation screenshot from your UPI app.` };
  }
  if (p.is_supported_upi_app === false) {
    return { accepted: false, reason: "Please upload a payment confirmation from a supported UPI app (Google Pay, PhonePe, Paytm, BHIM, etc.)." };
  }
  if (p.has_all_required_fields === false) {
    return { accepted: false, reason: "The screenshot is missing required payment details (UPI Reference ID, status, amount, or date/time). Please upload a complete payment confirmation." };
  }
  // Note: we intentionally don't hard-reject on "low" extraction_confidence,
  // because users commonly mask/blur the recipient UPI ID for privacy. The
  // individual field checks below (name, amount, status, date) are the source of truth.

  const status = String(p.payment_status ?? "").toLowerCase();
  const okStatus = ["successful", "success", "paid", "completed"];
  const badStatus = ["failed", "pending", "processing", "cancelled", "canceled", "refunded", "reversed"];
  if (badStatus.includes(status)) {
    return { accepted: false, reason: `Payment status is "${status}". Only successful payments are accepted.` };
  }
  if (!okStatus.includes(status)) {
    return { accepted: false, reason: "Could not confirm the payment was successful. Please upload the success receipt." };
  }

  const expectedNames = ctx.recipientNames.map(normName);
  const gotName = normName(p.recipient_name);
  const nameOk = !!gotName && expectedNames.some((n) => gotName === n || gotName.includes(n) || n.includes(gotName));
  if (!nameOk) {
    return { accepted: false, reason: `Invalid payment screenshot. The payment must be made to ${ctx.recipientNames.join(" or ")}.` };
  }

  const expectedUpi = normUpi(ctx.officialUpi);
  const gotUpi = normUpi(p.recipient_upi_id);
  // If a recipient UPI ID is visible, it must match. If it's masked/blurred out
  // (common for privacy), fall back to the recipient-name match above.
  if (gotUpi && gotUpi !== expectedUpi) {
    return { accepted: false, reason: "The payment was not sent to the official UPI ID. Please make the payment to the correct UPI ID and upload the payment confirmation screenshot." };
  }

  const amt = Number(p.amount);
  if (!Number.isFinite(amt) || Math.round(amt) !== Math.round(ctx.amountInr)) {
    return { accepted: false, reason: `The paid amount (${p.amount ?? "unknown"}) does not match the required amount of ₹${ctx.amountInr}.` };
  }

  const payDate = String(p.payment_date ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payDate)) {
    return { accepted: false, reason: "Could not read the payment date. Please upload a screenshot that clearly shows the payment date." };
  }
  const openOnStr = ctx.registrationOpenOn ? ctx.registrationOpenOn.slice(0, 10) : null;
  const eventStr = ctx.eventDate ? ctx.eventDate.slice(0, 10) : null;
  if (openOnStr && payDate < openOnStr) {
    return { accepted: false, reason: `This payment (${payDate}) is dated before registration opened (${openOnStr}). Please pay again and upload the new screenshot.` };
  }
  if (eventStr && payDate > eventStr) {
    return { accepted: false, reason: `This payment (${payDate}) is dated after the workshop (${eventStr}) and cannot be accepted.` };
  }

  const rawRef = String(p.transaction_reference ?? "").trim();
  const reference = rawRef && rawRef.length >= 6 && rawRef.length <= 64 ? rawRef.replace(/\s+/g, "") : null;

  return { accepted: true, reason: "Verified", reference };
}




export const listMyEnrollments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Use admin client so we can also read `upi_id_encrypted` for decryption
    // and sign banner URLs; results are strictly scoped to the current user.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("enrollments").select("*, program:programs(*), bundle_purchase:bundle_purchases(id, final_amount_inr, workshop_count, bundle_name)")
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


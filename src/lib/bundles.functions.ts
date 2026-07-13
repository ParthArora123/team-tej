import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { verifyPaymentScreenshot } from "./enrollment.functions";

// ---------- Types ----------
export type CartSelection = { programId: string; silverSeat: boolean };

export type PricedItem = {
  programId: string;
  name: string;
  basePrice: number;
  silverAddon: number;
  silverSeat: boolean;
  itemTotal: number;
  eligible: boolean;
  city: string;
  inBundle: boolean;
};

export type PricingResult = {
  items: PricedItem[];
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  bundle: {
    id: string;
    name: string;
    description: string | null;
    discountType: "fixed_bundle_price" | "percentage" | "fixed_amount";
    discountValue: number;
    min_workshops: number;
    max_workshops: number | null;
    city: string;
  } | null;
  eligibleCount: number;
  bundleProgramIds: string[];
};


const selectionSchema = z.object({
  programId: z.string().uuid(),
  silverSeat: z.boolean().optional().default(false),
});

// ---------- Pricing helpers (server-only) ----------

async function loadPricingContext(selections: CartSelection[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const ids = Array.from(new Set(selections.map((s) => s.programId)));
  if (ids.length === 0) return { programs: [] as any[], bundles: [] as any[], bundlePrograms: [] as any[] };
  const [{ data: programs }, { data: bundles }, { data: bp }] = await Promise.all([
    supabaseAdmin.from("programs").select("id, name, price_inr, silver_seat_enabled, silver_seat_price, capacity, seats_taken, published, kind, upi_id_encrypted, bank_account_holder, event_date, registration_open_on, city, venue").in("id", ids),
    supabaseAdmin.from("bundle_offers").select("*").eq("active", true).order("priority", { ascending: false }),
    supabaseAdmin.from("bundle_offer_programs").select("bundle_id, program_id"),
  ]);
  return { programs: programs ?? [], bundles: bundles ?? [], bundlePrograms: bp ?? [] };
}

function normCity(v: any): string {
  return String(v ?? "").trim().toLowerCase();
}

function priceItems(selections: CartSelection[], programs: any[]): PricedItem[] {
  return selections.map((s) => {
    const p = programs.find((x) => x.id === s.programId);
    if (!p) return { programId: s.programId, name: "Unknown", basePrice: 0, silverAddon: 0, silverSeat: false, itemTotal: 0, eligible: false, city: "", inBundle: false };
    const silverEnabled = !!p.silver_seat_enabled;
    const silverPrice = Number(p.silver_seat_price ?? 1000);
    const wantSilver = !!s.silverSeat && silverEnabled;
    const addon = wantSilver ? silverPrice : 0;
    return {
      programId: p.id,
      name: p.name,
      basePrice: Number(p.price_inr),
      silverAddon: addon,
      silverSeat: wantSilver,
      itemTotal: Number(p.price_inr) + addon,
      eligible: p.kind === "workshop" && p.published !== false,
      city: normCity(p.city || p.venue),
      inBundle: false,
    };
  });
}

function pickBestBundle(items: PricedItem[], bundles: any[], bundlePrograms: any[]): PricingResult {
  const now = new Date();
  const original = items.reduce((s, i) => s + i.itemTotal, 0);
  let best: PricingResult["bundle"] = null;
  let bestDiscount = -1;
  let bestProgramIds: string[] = [];

  for (const b of bundles) {
    if (b.valid_from && new Date(b.valid_from) > now) continue;
    if (b.valid_until && new Date(b.valid_until) < now) continue;
    const eligibleIds = b.applies_to_all_workshops
      ? new Set(items.filter((i) => i.eligible).map((i) => i.programId))
      : new Set(bundlePrograms.filter((r: any) => r.bundle_id === b.id).map((r: any) => r.program_id));
    const pool = items.filter((i) => i.eligible && eligibleIds.has(i.programId));

    if (pool.length < b.min_workshops) continue;
    const use = b.max_workshops ? pool.slice(0, b.max_workshops) : pool;
    const baseSubtotal = use.reduce((s, i) => s + i.basePrice, 0);
    const dv = Number(b.discount_value);
    let discount = 0;
    if (b.discount_type === "fixed_bundle_price") {
      discount = Math.max(0, baseSubtotal - dv);
    } else if (b.discount_type === "percentage") {
      discount = Math.round((baseSubtotal * Math.min(100, Math.max(0, dv))) / 100);
    } else if (b.discount_type === "fixed_amount") {
      discount = Math.min(baseSubtotal, dv);
    }
    if (discount > bestDiscount) {
      bestDiscount = Math.round(discount);
      best = {
        id: b.id, name: b.name, description: b.description,
        discountType: b.discount_type, discountValue: dv,
        min_workshops: b.min_workshops, max_workshops: b.max_workshops,
        city: "",
      };
      bestProgramIds = use.map((i) => i.programId);
    }
  }

  const finalDiscount = Math.max(0, bestDiscount);

  const bundleSet = new Set(bestProgramIds);
  const markedItems = items.map((i) => ({ ...i, inBundle: bundleSet.has(i.programId) }));

  return {
    items: markedItems,
    originalAmount: Math.round(original),
    discountAmount: finalDiscount,
    finalAmount: Math.round(original) - finalDiscount,
    bundle: best,
    eligibleCount: items.filter((i) => i.eligible).length,
    bundleProgramIds: bestProgramIds,
  };
}


// ---------- Public server fns ----------

export const listActiveBundles = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("bundle_offers")
    .select("*, bundle_offer_programs(program_id)")
    .eq("active", true)
    .or(`valid_until.is.null,valid_until.gte.${now}`)
    .order("priority", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const computeCartPricing = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ selections: z.array(selectionSchema).min(1).max(20) }).parse(input))
  .handler(async ({ data }) => {
    const { programs, bundles, bundlePrograms } = await loadPricingContext(data.selections);
    const items = priceItems(data.selections, programs);
    return pickBestBundle(items, bundles, bundlePrograms);
  });

// ---------- Checkout ----------

const detailsSchema = z.object({
  selections: z.array(selectionSchema).min(1).max(20),
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  gender: z.string().min(1).max(20),
  address: z.string().min(2).max(300),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(80),
  emergencyContact: z.string().min(5).max(60),
});

export const createBundleCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => detailsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabase.from("profiles").update({
      full_name: data.fullName, phone: data.phone,
    }).eq("id", userId);

    const { programs, bundles, bundlePrograms } = await loadPricingContext(data.selections);
    if (programs.length !== new Set(data.selections.map((s) => s.programId)).size) {
      throw new Error("One or more workshops are no longer available.");
    }
    for (const p of programs) {
      if (p.capacity != null && (p.seats_taken ?? 0) >= p.capacity) {
        throw new Error(`"${p.name}" is full.`);
      }
    }
    // All workshops in a bundle checkout must share the same UPI recipient.
    // Ciphertext differs per-encryption (random IV), so we must decrypt to compare.
    if (data.selections.length > 1) {
      const { decryptSecret, sanitizeUpiId } = await import("./crypto.server");
      const upiSet = new Set(
        programs.map((p) => {
          const dec = decryptSecret(p.upi_id_encrypted) || "";
          try { return sanitizeUpiId(dec).toLowerCase(); } catch { return dec.trim().toLowerCase(); }
        }),
      );
      const holderSet = new Set(programs.map((p) => (p.bank_account_holder || "").trim().toLowerCase()));
      if (upiSet.size !== 1 || holderSet.size !== 1) {
        throw new Error("These workshops have different UPI recipients and can't be bundled in a single payment. Please register for them separately.");
      }
    }

    const items = priceItems(data.selections, programs);
    const pricing = pickBestBundle(items, bundles, bundlePrograms);

    const isBundle = data.selections.length >= 2 && !!pricing.bundle;

    // Create bundle_purchase (also for single-item so all paths are unified). We only
    // set bundle_id/name when an actual bundle offer applies.
    const { data: purchase, error: pErr } = await supabaseAdmin.from("bundle_purchases").insert({
      user_id: userId,
      bundle_id: pricing.bundle?.id ?? null,
      bundle_name: pricing.bundle?.name ?? null,
      workshop_count: data.selections.length,
      original_amount_inr: pricing.originalAmount,
      discount_amount_inr: pricing.discountAmount,
      final_amount_inr: pricing.finalAmount,
      status: "awaiting_payment",
      full_name: data.fullName, email: data.email, phone: data.phone,
    } as any).select("*").single();
    if (pErr) throw pErr;

    // Allocate the discount proportionally over the base prices of ONLY the
    // bundled items so each enrollment carries its share; silver-seat addon
    // stays on top. Non-bundled items pay their full base price.
    const bundleSet = new Set(pricing.bundleProgramIds);
    const bundledItems = items.filter((i) => bundleSet.has(i.programId));
    const totalBundleBase = bundledItems.reduce((s, i) => s + i.basePrice, 0) || 1;
    let allocated = 0;
    const rows = items.map((it) => {
      let share = 0;
      if (bundleSet.has(it.programId)) {
        const isLast = it.programId === bundledItems[bundledItems.length - 1].programId;
        share = isLast
          ? pricing.discountAmount - allocated
          : Math.round((it.basePrice / totalBundleBase) * pricing.discountAmount);
        allocated += share;
      }
      const amount = it.basePrice - share + it.silverAddon;
      return {
        user_id: userId, program_id: it.programId, amount_inr: amount,
        status: "awaiting_payment",
        full_name: data.fullName, email: data.email, phone: data.phone,
        gender: data.gender, address: data.address, city: data.city, state: data.state,
        emergency_contact: data.emergencyContact,
        silver_seat: it.silverSeat,
        bundle_purchase_id: purchase.id,
      };
    });

    const { error: eErr } = await supabaseAdmin.from("enrollments").insert(rows as any);
    if (eErr) throw eErr;

    return { purchaseId: purchase.id, isBundle, finalAmount: pricing.finalAmount };
  });

// ---------- Payment ----------

export const getBundlePurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: bp, error } = await supabaseAdmin
      .from("bundle_purchases").select("*").eq("id", data.id).eq("user_id", context.userId).maybeSingle();
    if (error) throw error;
    if (!bp) throw new Error("Purchase not found");
    const { data: enrs } = await supabaseAdmin
      .from("enrollments").select("*, program:programs(id,name,event_date,event_time,venue,bank_account_holder,upi_id_encrypted)")
      .eq("bundle_purchase_id", data.id);
    const { decryptSecret } = await import("./crypto.server");
    const enrichedEnrs = (enrs ?? []).map((e: any) => {
      if (e.program?.upi_id_encrypted) {
        e.program.upi_id = decryptSecret(e.program.upi_id_encrypted);
        delete e.program.upi_id_encrypted;
      }
      return e;
    });
    return { purchase: bp, enrollments: enrichedEnrs };
  });

export const submitBundlePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    purchaseId: z.string().uuid(),
    proofPath: z.string().min(3).max(300),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!data.proofPath.startsWith(`${context.userId}/`)) throw new Error("Invalid upload path.");

    const { data: bp, error } = await supabaseAdmin.from("bundle_purchases")
      .select("*").eq("id", data.purchaseId).eq("user_id", context.userId).maybeSingle();
    if (error) throw error;
    if (!bp) throw new Error("Purchase not found");
    if (bp.status === "confirmed") return { ok: true, already: true };

    const { data: enrs } = await supabaseAdmin
      .from("enrollments").select("id, program_id, ticket_code")
      .eq("bundle_purchase_id", bp.id);
    if (!enrs || enrs.length === 0) throw new Error("No workshops in this purchase.");

    const { data: programs } = await supabaseAdmin
      .from("programs").select("id, name, upi_id_encrypted, bank_account_holder, event_date, registration_open_on")
      .in("id", enrs.map((e: any) => e.program_id));
    if (!programs || programs.length === 0) throw new Error("Workshops missing.");

    const first = programs[0];
    const { decryptSecret, sanitizeUpiId } = await import("./crypto.server");
    const officialUpi = first.upi_id_encrypted
      ? sanitizeUpiId(decryptSecret(first.upi_id_encrypted) || "") : "";
    if (!officialUpi) throw new Error("Official UPI ID not configured. Contact admin.");
    const holder = (first as any).bank_account_holder?.trim();
    if (!holder) throw new Error("Account holder not configured. Contact admin.");

    // Widest date window across all workshops in the bundle.
    const openOns = programs.map((p: any) => p.registration_open_on).filter(Boolean).sort();
    const eventDates = programs.map((p: any) => p.event_date).filter(Boolean).sort();
    const openOn = openOns[0] ?? null;
    const eventOn = eventDates[eventDates.length - 1] ?? null;

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
    const [{ data: dupProofE }, { data: dupProofB }] = await Promise.all([
      supabaseAdmin.from("enrollments").select("id").eq("payment_proof_sha256", validated.sha256).maybeSingle(),
      supabaseAdmin.from("bundle_purchases").select("id").eq("payment_proof_sha256", validated.sha256).neq("id", bp.id).maybeSingle(),
    ]);
    if (dupProofE || dupProofB) {
      await supabaseAdmin.storage.from("payment-proofs").remove([data.proofPath]).catch(() => {});
      throw new Error("This payment screenshot has already been used for another registration. Please upload a fresh screenshot of your actual payment.");
    }
    const contentType = validated.mime;
    const dataUrl = `data:${contentType};base64,${Buffer.from(validated.bytes).toString("base64")}`;

    const verification = await verifyPaymentScreenshot(dataUrl, {
      amountInr: bp.final_amount_inr,
      officialUpi,
      recipientNames: [holder],
      registrationOpenOn: openOn,
      eventDate: eventOn,
    });
    if (!verification.accepted) throw new Error(verification.reason);

    const ref = verification.reference ?? null;
    if (!ref) throw new Error("Could not read the UPI Reference ID from this screenshot. Please upload a clearer confirmation.");

    // Uniqueness across BOTH enrollments and bundle_purchases.
    const [{ data: dupE }, { data: dupB }] = await Promise.all([
      supabaseAdmin.from("enrollments").select("id").ilike("payment_reference", ref).maybeSingle(),
      supabaseAdmin.from("bundle_purchases").select("id").ilike("payment_reference", ref).neq("id", bp.id).maybeSingle(),
    ]);
    if (dupE || dupB) throw new Error("This UPI Reference ID has already been used. Please verify your payment details.");

    const genCode = () => "TTJ-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const now = new Date().toISOString();

    for (const e of enrs) {
      let ticket = e.ticket_code || genCode();
      if (!e.ticket_code) {
        for (let i = 0; i < 5; i++) {
          const { data: dup } = await supabaseAdmin.from("enrollments").select("id").eq("ticket_code", ticket).maybeSingle();
          if (!dup) break;
          ticket = genCode();
        }
      }
      await supabaseAdmin.from("enrollments").update({
        status: "confirmed", ticket_code: ticket,
        payment_proof_path: data.proofPath,
        payment_proof_sha256: validated.sha256,
        payment_reference: ref,
        payment_confirmed_at: now,
        ticket_generated_at: now,
        approved_at: now,
      }).eq("id", e.id);
      if (e.program_id) {
        const { data: p } = await supabaseAdmin.from("programs").select("seats_taken").eq("id", e.program_id).single();
        await supabaseAdmin.from("programs").update({ seats_taken: (p?.seats_taken ?? 0) + 1 }).eq("id", e.program_id);
      }
    }

    await supabaseAdmin.from("bundle_purchases").update({
      status: "confirmed",
      payment_reference: ref,
      payment_proof_path: data.proofPath,
      payment_proof_sha256: validated.sha256,
      payment_confirmed_at: now,
    }).eq("id", bp.id);

    return { ok: true, confirmed: true };
  });

// ---------- Admin ----------

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase
    .from("user_roles").select("id").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (error || !data) throw new Error("Forbidden");
}

export const adminListBundles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("bundle_offers")
      .select("*, bundle_offer_programs(program_id)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

const bundleSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  description: z.string().optional().or(z.literal("")),
  min_workshops: z.number().int().min(2).max(20),
  max_workshops: z.number().int().min(2).max(20).nullable().optional(),
  discount_type: z.enum(["fixed_bundle_price", "percentage", "fixed_amount"]),
  discount_value: z.number().min(0).max(1000000),
  applies_to_all_workshops: z.boolean(),
  program_ids: z.array(z.string().uuid()).optional(),
  valid_from: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  active: z.boolean(),
  priority: z.number().int().optional(),
});

export const adminSaveBundle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => bundleSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row: any = {
      name: data.name,
      description: data.description || null,
      min_workshops: data.min_workshops,
      max_workshops: data.max_workshops ?? null,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      applies_to_all_workshops: data.applies_to_all_workshops,
      valid_from: data.valid_from || null,
      valid_until: data.valid_until || null,
      active: data.active,
      priority: data.priority ?? 0,
    };

    let id = data.id;
    if (id) {
      const { error } = await supabaseAdmin.from("bundle_offers").update(row).eq("id", id);
      if (error) throw error;
    } else {
      const { data: ins, error } = await supabaseAdmin.from("bundle_offers").insert(row).select("id").single();
      if (error) throw error;
      id = ins.id;
    }
    // Sync program links.
    await supabaseAdmin.from("bundle_offer_programs").delete().eq("bundle_id", id);
    if (!data.applies_to_all_workshops && data.program_ids?.length) {
      await supabaseAdmin.from("bundle_offer_programs").insert(
        data.program_ids.map((pid) => ({ bundle_id: id!, program_id: pid })),
      );
    }
    return { ok: true, id };
  });

export const adminDeleteBundle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("bundle_offers").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminListBundlePurchases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("bundle_purchases")
      .select("*, bundle:bundle_offers(name), enrollments(id, program:programs(name), amount_inr, silver_seat, status, ticket_code)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const adminBundleStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("bundle_purchases")
      .select("original_amount_inr, discount_amount_inr, final_amount_inr, status");
    const rows = data ?? [];
    const confirmed = rows.filter((r: any) => r.status === "confirmed");
    return {
      totalBundles: rows.length,
      confirmed: confirmed.length,
      originalRevenue: confirmed.reduce((s: number, r: any) => s + (r.original_amount_inr ?? 0), 0),
      totalDiscount: confirmed.reduce((s: number, r: any) => s + (r.discount_amount_inr ?? 0), 0),
      netRevenue: confirmed.reduce((s: number, r: any) => s + (r.final_amount_inr ?? 0), 0),
    };
  });

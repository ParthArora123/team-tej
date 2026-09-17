import { mobileVariantKey } from "@/lib/video-variants";
import { createPublicClient } from "@/integrations/supabase/client.public";
import { isSpotPricingActive } from "@/lib/spot-pricing";

const PUBLIC_COLS =
  "id,kind,name,description,banner_url,banner_path,banner_video_path,banner_gif_path,event_date,event_time,venue,city,instructor,duration,capacity,seats_taken,price_inr,registration_open_on,category,style,published,silver_seat_enabled,silver_seat_price,allow_single,allow_both,both_price,workshop1_name,workshop2_name,silver_capacity_w1,silver_capacity_w2,session_schedule,registration_mode,whatsapp_number,spot_registration_enabled,spot_price_inr,registration_redirect_url,created_at";

const BANNER_TTL = 60 * 60 * 24 * 7;

const OPTIONAL_PUBLIC_FIELDS = [
  "registration_redirect_url",
  "spot_registration_enabled",
  "spot_price_inr",
  "whatsapp_number",
  "registration_mode",
  "session_schedule",
] as const;

const OPTIONAL_DEFAULTS: Record<(typeof OPTIONAL_PUBLIC_FIELDS)[number], unknown> = {
  registration_redirect_url: null,
  spot_registration_enabled: false,
  spot_price_inr: null,
  whatsapp_number: null,
  registration_mode: "online",
  session_schedule: [],
};

function publicClient() {
  return createPublicClient() as any;
}

async function signBucketPath(bucket: string, key: string | null | undefined) {
  if (!key) return null;

  let resolvedBucket = bucket;
  let resolvedKey = key;
  if (key.includes(":")) {
    const [storedBucket, ...rest] = key.split(":");
    resolvedBucket = storedBucket;
    resolvedKey = rest.join(":");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage
    .from(resolvedBucket)
    .createSignedUrl(resolvedKey, BANNER_TTL);
  return data?.signedUrl ?? null;
}

async function decorateBanners(rows: any[]): Promise<any[]> {
  if (!rows.length) return [];
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      // Workshop-day temporary override; the stored price is never modified.
      original_price_inr: row.price_inr,
      price_inr: isSpotPricingActive(row) ? Number(row.spot_price_inr) : row.price_inr,
      banner_url:
        row.banner_url || (await signBucketPath("workshop-images", row.banner_path)),
      banner_video_url: await signBucketPath("workshop-videos", row.banner_video_path),
      // Optimized 720p H.264 sibling (see src/lib/video-variants.ts); null when absent.
      banner_video_url_mobile: await signBucketPath(
        "workshop-videos",
        mobileVariantKey(row.banner_video_path),
      ),
      banner_gif_url: await signBucketPath("workshop-images", row.banner_gif_path),
    })),
  );
}

async function selectPrograms(kind?: string, id?: string) {
  const run = async (columns: string) => {
    let query = publicClient()
      .from("programs_public")
      .select(columns)
      .order("created_at", { ascending: false });
    if (kind) query = query.eq("kind", kind);
    if (id) query = query.eq("id", id);
    return query;
  };

  let columns = PUBLIC_COLS;
  const omitted = new Set<(typeof OPTIONAL_PUBLIC_FIELDS)[number]>();
  let result = await run(columns);

  // Older published builds can briefly run against a newer or older catalogue
  // view. Remove every unavailable optional field cumulatively so one new
  // feature can never make the entire workshop catalogue disappear.
  for (let attempt = 0; result.error?.code === "42703" && attempt < OPTIONAL_PUBLIC_FIELDS.length; attempt += 1) {
    const missing = OPTIONAL_PUBLIC_FIELDS.find(
      (field) => !omitted.has(field) && result.error?.message?.includes(field),
    );
    if (!missing) break;
    omitted.add(missing);
    columns = columns
      .split(",")
      .filter((field) => field !== missing)
      .join(",");
    result = await run(columns);
  }

  if (result.data && omitted.size) {
    result.data = result.data.map((row: any) => {
      const defaults = Object.fromEntries(
        [...omitted].map((field) => [field, OPTIONAL_DEFAULTS[field]]),
      );
      return { ...defaults, ...row };
    });
  }
  return result;
}

/** Date-only key (YYYY-MM-DD) for "today" in India Standard Time. */
function todayKeyIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

function dateKey(value: unknown): string | null {
  if (!value) return null;
  const raw = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

/**
 * A workshop stays public through the end of its last day (event date or the
 * latest date in its session schedule). Purely dynamic — no hardcoded dates.
 */
function isPastProgram(row: any): boolean {
  if (row?.kind !== "workshop") return false;
  const keys: string[] = [];
  const main = dateKey(row?.event_date);
  if (main) keys.push(main);
  const schedule = Array.isArray(row?.session_schedule) ? row.session_schedule : [];
  for (const s of schedule) {
    const k = dateKey(s?.date ?? s?.event_date ?? s?.day);
    if (k) keys.push(k);
  }
  if (!keys.length) return false; // undated workshops stay visible
  const last = keys.sort().at(-1)!;
  return last < todayKeyIST();
}

export async function listPublicPrograms(kind?: string) {
  const { data, error } = await selectPrograms(kind);
  if (error) throw error;
  const rows = data ?? [];
  const upcoming = rows.filter((row: any) => !isPastProgram(row));
  // Never blank the site: if every workshop's date has passed, keep showing
  // the existing catalogue instead of an empty page.
  return decorateBanners(upcoming.length ? upcoming : rows);
}

export async function getPublicProgram(id: string) {
  const { data, error } = await selectPrograms(undefined, id);
  if (error) throw error;
  const row = data?.[0] ?? null;
  if (!row) return null;
  const [decorated] = await decorateBanners([row]);
  return decorated ?? null;
}



export async function listPublicEvents() {
  const { data, error } = await createPublicClient()
    .from("events")
    .select("*")
    .eq("active", true)
    .order("event_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

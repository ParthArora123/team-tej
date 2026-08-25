// Server-only: sends the participant workshop confirmation email through the
// Salesforce Apex REST endpoint (/services/apexrest/workshop/confirmation).
//
// Two authentication paths, both fully server-side (never exposed to the
// browser):
//   1. Lovable Salesforce connector gateway (managed OAuth) — used when
//      LOVABLE_API_KEY + SALESFORCE_API_KEY are present.
//   2. Direct OAuth username-password flow — used when SALESFORCE_CLIENT_ID,
//      SALESFORCE_CLIENT_SECRET, SALESFORCE_USERNAME, SALESFORCE_PASSWORD are
//      set as server environment variables.
//
// Salesforce itself validates status == "Approved" and sends the email via
// Messaging.SingleEmailMessage. No registration/payment data is stored in
// Salesforce — Supabase remains the source of truth.

export interface WorkshopConfirmationPayload {
  status: "Approved";
  participantName: string;
  participantEmail: string;
  workshopName: string;
  workshopDate: string;
  workshopLocation: string;
  workshopClass: string;
  workshopTiming: string;
  ticketId: string;
  paymentStatus: "Confirmed";
  amountPaid: number;
  paymentReference: string;
  qrCode: string; // full QR image URL (existing website ticket QR — no second QR)
  verifyUrl: string; // public ticket verification URL encoded inside the QR
}

// Resolves the human-readable selected workshop/class name(s) exactly like the
// student ticket does, so the confirmation email matches the ticket.
function selectedWorkshopNames(enr: any, prog: any): string {
  const w1 = prog?.workshop1_name || "Workshop 1";
  const w2 = prog?.workshop2_name || "Workshop 2";
  if (enr?.registration_type === "both") return [w1, w2].filter(Boolean).join(" + ");
  if (enr?.registration_type === "single") return enr?.selected_workshop === "w2" ? w2 : w1;
  return prog?.name || "Workshop";
}

export function buildConfirmationPayload(enr: any, origin: string): WorkshopConfirmationPayload {
  const prog: any = enr?.program ?? {};
  const ticketId: string = enr.ticket_code;
  const verifyUrl = `${origin}/verify?code=${encodeURIComponent(ticketId)}`;
  const qrCode =
    `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=16&data=${encodeURIComponent(verifyUrl)}`;

  const timing = prog.event_time
    || (Array.isArray(prog.session_schedule)
      ? prog.session_schedule.map((s: any) => s?.time).filter(Boolean).join(" · ")
      : "")
    || "";

  return {
    status: "Approved",
    participantName: enr.full_name || "Participant",
    participantEmail: enr.email,
    workshopName: prog.name || "Workshop",
    workshopDate: prog.event_date ? new Date(prog.event_date).toDateString() : "",
    workshopLocation: [prog.venue, prog.city].filter(Boolean).join(", "),
    workshopClass: selectedWorkshopNames(enr, prog),
    workshopTiming: timing,
    ticketId,
    paymentStatus: "Confirmed",
    amountPaid: typeof enr.amount_inr === "number" ? enr.amount_inr : Number(enr.amount_inr ?? 0),
    paymentReference: enr.payment_reference ?? "",
    qrCode,
    verifyUrl,
  };
}

// --- Auth path 1: Lovable connector gateway (managed OAuth) -----------------

async function sendViaGateway(payload: WorkshopConfirmationPayload): Promise<void> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const sfKey = process.env["SALESFORCE_API_KEY"];
  if (!lovableKey || !sfKey) throw new Error("Salesforce connector is not linked to this project.");

  const res = await fetch(
    "https://connector-gateway.lovable.dev/salesforce/apexrest/workshop/confirmation",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": sfKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    console.error(`[salesforce-email] gateway failed [${res.status}]: ${body}`);
    throw new Error(`Salesforce email failed [${res.status}]: ${body}`);
  }
  const json: any = await res.json().catch(() => ({}));
  if (json && json.success === false) {
    console.error(`[salesforce-email] apex rejected: ${JSON.stringify(json)}`);
    throw new Error(`Salesforce email rejected: ${json.error || "unknown error"}`);
  }
}

// --- Auth path 2: direct OAuth username-password flow -----------------------

async function sendViaDirectOAuth(payload: WorkshopConfirmationPayload): Promise<void> {
  const loginUrl = process.env["SALESFORCE_LOGIN_URL"] || "https://login.salesforce.com";
  const clientId = process.env["SALESFORCE_CLIENT_ID"];
  const clientSecret = process.env["SALESFORCE_CLIENT_SECRET"];
  const username = process.env["SALESFORCE_USERNAME"];
  const password = process.env["SALESFORCE_PASSWORD"];
  const token = process.env["SALESFORCE_SECURITY_TOKEN"] || "";
  if (!clientId || !clientSecret || !username || !password) {
    throw new Error("Salesforce OAuth environment variables are not configured.");
  }

  const tokenRes = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: clientId,
      client_secret: clientSecret,
      username,
      password: password + token,
    }),
  });
  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error(`[salesforce-email] oauth failed [${tokenRes.status}]: ${body}`);
    throw new Error(`Salesforce authentication failed [${tokenRes.status}]`);
  }
  const auth: any = await tokenRes.json();

  const res = await fetch(`${auth.instance_url}/services/apexrest/workshop/confirmation`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[salesforce-email] apex failed [${res.status}]: ${body}`);
    throw new Error(`Salesforce email failed [${res.status}]: ${body}`);
  }
  const json: any = await res.json().catch(() => ({}));
  if (json && json.success === false) {
    throw new Error(`Salesforce email rejected: ${json.error || "unknown error"}`);
  }
}

/**
 * Sends the participant confirmation email via Salesforce. Throws on failure —
 * callers must catch and keep the registration approved.
 */
export async function sendConfirmationViaSalesforce(
  payload: WorkshopConfirmationPayload,
): Promise<void> {
  if (process.env["LOVABLE_API_KEY"] && process.env["SALESFORCE_API_KEY"]) {
    return sendViaGateway(payload);
  }
  if (process.env["SALESFORCE_CLIENT_ID"]) {
    return sendViaDirectOAuth(payload);
  }
  throw new Error(
    "Salesforce is not configured: link the Salesforce connector or set SALESFORCE_CLIENT_ID/SECRET/USERNAME/PASSWORD server variables.",
  );
}

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

// --- Structured diagnostics -------------------------------------------------

export interface SalesforceErrorDetails {
  step: string; // which stage failed (config / oauth_token / apex_request / apex_response)
  authPath: "connector_gateway" | "direct_oauth" | "none";
  endpoint?: string;
  status?: number;
  statusText?: string;
  responseBody?: string;
  hint?: string;
}

export class SalesforceEmailError extends Error {
  details: SalesforceErrorDetails;
  constructor(message: string, details: SalesforceErrorDetails) {
    super(message);
    this.name = "SalesforceEmailError";
    this.details = details;
  }
}

function redact(url: string): string {
  return url.replace(/([?&](?:token|key|secret)=)[^&]+/gi, "$1***");
}

function fail(message: string, details: SalesforceErrorDetails): never {
  console.error(`[salesforce-email] ${message}`, JSON.stringify(details));
  throw new SalesforceEmailError(message, { ...details, endpoint: details.endpoint ? redact(details.endpoint) : undefined });
}

// --- Auth path 1: Lovable connector gateway (managed OAuth) -----------------


async function sendViaGateway(payload: WorkshopConfirmationPayload): Promise<void> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const sfKey = process.env["SALESFORCE_API_KEY"];
  const endpoint = "https://connector-gateway.lovable.dev/salesforce/apexrest/workshop/confirmation";
  if (!lovableKey || !sfKey) {
    fail("Salesforce connector is not linked to this project.", {
      step: "config",
      authPath: "connector_gateway",
      hint: `Missing ${!lovableKey ? "LOVABLE_API_KEY" : ""}${!lovableKey && !sfKey ? " and " : ""}${!sfKey ? "SALESFORCE_API_KEY" : ""} — link the Salesforce connector.`,
    });
  }

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": sfKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (e: any) {
    fail(`Network error calling Salesforce gateway: ${e?.message ?? e}`, {
      step: "apex_request",
      authPath: "connector_gateway",
      endpoint,
      hint: "The connector gateway could not be reached from the server.",
    });
  }

  const raw = await res.text();
  if (!res.ok) {
    fail(`Salesforce request failed [${res.status} ${res.statusText}]`, {
      step: res.status === 401 || res.status === 403 ? "gateway_auth" : "apex_response",
      authPath: "connector_gateway",
      endpoint,
      status: res.status,
      statusText: res.statusText,
      responseBody: raw.slice(0, 2000),
      hint:
        res.status === 401 || res.status === 403
          ? "Gateway rejected the credentials — reconnect the Salesforce connection."
          : res.status === 404
            ? "Apex REST endpoint not found — verify the /services/apexrest/workshop/confirmation class is deployed and the site user has access."
            : undefined,
    });
  }
  let json: any = {};
  try { json = raw ? JSON.parse(raw) : {}; } catch { /* non-JSON success body */ }
  if (json && json.success === false) {
    fail(`Salesforce Apex rejected the request: ${json.error || "unknown error"}`, {
      step: "apex_response",
      authPath: "connector_gateway",
      endpoint,
      status: res.status,
      statusText: res.statusText,
      responseBody: raw.slice(0, 2000),
    });
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
  const missing = [
    !clientId && "SALESFORCE_CLIENT_ID",
    !clientSecret && "SALESFORCE_CLIENT_SECRET",
    !username && "SALESFORCE_USERNAME",
    !password && "SALESFORCE_PASSWORD",
  ].filter(Boolean) as string[];
  if (missing.length) {
    fail("Salesforce OAuth environment variables are not configured.", {
      step: "config",
      authPath: "direct_oauth",
      hint: `Missing server variables: ${missing.join(", ")}`,
    });
  }

  const tokenEndpoint = `${loginUrl}/services/oauth2/token`;
  let tokenRes: Response;
  try {
    tokenRes = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: clientId!,
        client_secret: clientSecret!,
        username: username!,
        password: password! + token,
      }),
    });
  } catch (e: any) {
    fail(`Network error reaching Salesforce login: ${e?.message ?? e}`, {
      step: "oauth_token",
      authPath: "direct_oauth",
      endpoint: tokenEndpoint,
    });
  }
  const tokenRaw = await tokenRes.text();
  if (!tokenRes.ok) {
    let sfError = "";
    try {
      const parsed = JSON.parse(tokenRaw);
      sfError = [parsed.error, parsed.error_description].filter(Boolean).join(": ");
    } catch { /* keep raw */ }
    const hints: Record<string, string> = {
      invalid_grant:
        "Salesforce rejected the credentials. Common causes: wrong username/password, missing security token appended to the password, IP not in the Connected App's trusted range, or the user must approve the login.",
      invalid_client_id: "The Connected App consumer key (SALESFORCE_CLIENT_ID) is wrong or the app is not deployed.",
      invalid_client: "The consumer secret (SALESFORCE_CLIENT_SECRET) does not match the Connected App.",
      unsupported_grant_type:
        "Username-Password OAuth flow is disabled in this org. Enable it in the Connected App OAuth policies, or switch to the Salesforce connector (managed OAuth).",
    };
    const code = sfError.split(":")[0]?.trim();
    fail(`Salesforce authentication failed [${tokenRes.status} ${tokenRes.statusText}]${sfError ? ` — ${sfError}` : ""}`, {
      step: "oauth_token",
      authPath: "direct_oauth",
      endpoint: tokenEndpoint,
      status: tokenRes.status,
      statusText: tokenRes.statusText,
      responseBody: tokenRaw.slice(0, 2000),
      hint: (code && hints[code]) || "Check the Connected App settings and the login URL (sandbox orgs use https://test.salesforce.com).",
    });
  }
  const auth: any = JSON.parse(tokenRaw);

  const apexEndpoint = `${auth.instance_url}/services/apexrest/workshop/confirmation`;
  let res: Response;
  try {
    res = await fetch(apexEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (e: any) {
    fail(`Network error calling Salesforce Apex endpoint: ${e?.message ?? e}`, {
      step: "apex_request",
      authPath: "direct_oauth",
      endpoint: apexEndpoint,
    });
  }
  const raw = await res.text();
  if (!res.ok) {
    fail(`Salesforce Apex request failed [${res.status} ${res.statusText}]`, {
      step: "apex_response",
      authPath: "direct_oauth",
      endpoint: apexEndpoint,
      status: res.status,
      statusText: res.statusText,
      responseBody: raw.slice(0, 2000),
      hint:
        res.status === 404
          ? "Apex class WorkshopConfirmationRest is not deployed, or the integration user lacks access to it."
          : undefined,
    });
  }
  let json: any = {};
  try { json = raw ? JSON.parse(raw) : {}; } catch { /* non-JSON success body */ }
  if (json && json.success === false) {
    fail(`Salesforce Apex rejected the request: ${json.error || "unknown error"}`, {
      step: "apex_response",
      authPath: "direct_oauth",
      endpoint: apexEndpoint,
      status: res.status,
      statusText: res.statusText,
      responseBody: raw.slice(0, 2000),
    });
  }
}

/**
 * Sends the participant confirmation email via Salesforce. Throws
 * SalesforceEmailError (with .details) on failure — callers must catch and
 * keep the registration approved.
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
  fail("Salesforce is not configured.", {
    step: "config",
    authPath: "none",
    hint: "Link the Salesforce connector (managed OAuth), or set SALESFORCE_CLIENT_ID / SECRET / USERNAME / PASSWORD server variables.",
  });
}

  );
}

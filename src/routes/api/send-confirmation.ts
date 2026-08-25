import { createFileRoute } from "@tanstack/react-router";

// POST /api/send-confirmation
// Server-side endpoint that (re)sends the participant confirmation email for
// an ALREADY APPROVED registration through the Salesforce REST API.
//
// Security: requires a valid user bearer token AND the admin role. Salesforce
// credentials live only in server environment variables — nothing Salesforce
// related is ever exposed to the browser bundle.
//
// This is the ONLY confirmation-email path. It is invoked from the admin
// approval flow (and the admin retry button) — never on page load, payment
// completion, registration creation, dashboard refresh, or via any database
// trigger / edge function.

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export const Route = createFileRoute("/api/send-confirmation")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization") || "";
          const token = authHeader.replace(/^Bearer\s+/i, "").trim();
          if (!token) return json({ error: "Unauthorized" }, 401);

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Verify the caller's session, then their admin role.
          const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
          if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);

          const { data: roleRow } = await supabaseAdmin
            .from("user_roles")
            .select("id")
            .eq("user_id", userData.user.id)
            .eq("role", "admin")
            .maybeSingle();
          if (!roleRow) return json({ error: "Forbidden" }, 403);

          const body = await request.json().catch(() => null);
          const enrollmentId = body?.enrollmentId;
          if (typeof enrollmentId !== "string" || !/^[0-9a-f-]{36}$/i.test(enrollmentId)) {
            return json({ error: "Invalid enrollmentId" }, 400);
          }

          const { data: enr, error } = await supabaseAdmin
            .from("enrollments")
            .select("*, program:programs(*)")
            .eq("id", enrollmentId)
            .maybeSingle();
          if (error || !enr) return json({ error: "Registration not found" }, 404);

          // Email is only ever sent for approved registrations.
          if (enr.status !== "confirmed") {
            return json({ error: "Registration is not approved yet." }, 409);
          }

          // Duplicate protection — one confirmation email per registration.
          if (enr.confirmation_email_sent) {
            return json({ ok: true, alreadySent: true });
          }

          const origin = new URL(request.url).origin;
          const { buildConfirmationPayload, sendConfirmationViaSalesforce } =
            await import("@/lib/salesforce-email.server");

          try {
            await sendConfirmationViaSalesforce(buildConfirmationPayload(enr, origin));
          } catch (e: any) {
            const message = (e?.message ?? "Confirmation email failed").slice(0, 500);
            await supabaseAdmin.from("enrollments").update({
              confirmation_email_sent: false,
              confirmation_email_error: message,
            }).eq("id", enr.id);
            // Registration stays approved; the admin can retry.
            return json({ ok: false, emailSent: false, error: message }, 502);
          }

          await supabaseAdmin.from("enrollments").update({
            confirmation_email_sent: true,
            confirmation_email_error: null,
          }).eq("id", enr.id);

          return json({ ok: true, emailSent: true });
        } catch (e: any) {
          console.error("[api/send-confirmation] error:", e);
          return json({ error: e?.message ?? "Internal error" }, 500);
        }
      },
    },
  },
});

import { createServerFn } from "@tanstack/react-start";

// Idempotently seeds app_settings.admin_email from the ADMIN_EMAIL env secret
// and grants admin role to that user if they already exist.
export const bootstrapAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return { ok: false, reason: "no_admin_email" };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  await supabaseAdmin
    .from("app_settings")
    .upsert({ key: "admin_email", value: adminEmail }, { onConflict: "key" });

  // If the user with that email already exists, ensure they have admin role.
  const { data: list } = await supabaseAdmin.auth.admin.listUsers();
  const u = list?.users.find((x) => (x.email ?? "").toLowerCase() === adminEmail.toLowerCase());
  if (u) {
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: u.id, role: "admin" }, { onConflict: "user_id,role" });
  }
  return { ok: true };
});

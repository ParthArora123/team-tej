import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { nameSchema } from "@/lib/name-validation";
import { phoneSchema } from "@/lib/phone-validation";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      id: userId,
      full_name: data?.full_name ?? "",
      email: data?.email ?? (claims as any)?.email ?? "",
      phone: data?.phone ?? "",
    };
  });

const updateSchema = z.object({
  fullName: nameSchema,
  email: z.string().trim().email("Please enter a valid email address.").max(255),
  phone: phoneSchema,
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("profiles")
      .update({
        full_name: data.fullName,
        email: data.email.toLowerCase(),
        phone: data.phone,
      })
      .eq("id", userId)
      .select("id, full_name, email, phone")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Profile not found for the signed-in account.");
    return row;
  });

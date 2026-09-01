import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const attendanceWorkshops = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("@/lib/attendance.server");
    await m.assertAdmin(context);
    return m.listWorkshops();
  });

export const attendanceRoster = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ programId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const m = await import("@/lib/attendance.server");
    await m.assertAdmin(context);
    return m.loadRoster(data.programId);
  });

export const attendanceCheckIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        programId: z.string().uuid(),
        code: z.string().trim().min(3).max(300).optional(),
        enrollmentId: z.string().uuid().optional(),
        method: z.enum(["qr", "manual"]).default("qr"),
      })
      .refine((v) => !!v.code || !!v.enrollmentId, { message: "Nothing to check in" })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const m = await import("@/lib/attendance.server");
    await m.assertAdmin(context);
    return m.checkIn(data, context.userId);
  });

export const attendanceUndo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ enrollmentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const m = await import("@/lib/attendance.server");
    await m.assertAdmin(context);
    return m.undoCheckIn(data.enrollmentId);
  });

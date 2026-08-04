import { createMiddleware } from "@tanstack/react-start";

/**
 * Client-side replacement for the generated `attachSupabaseAuth`.
 *
 * Behaviourally identical — it attaches the Supabase bearer token to every
 * serverFn RPC — but the Supabase client is imported dynamically so the
 * auth/realtime libraries stay out of the entry bundle and are only fetched
 * when the first server function is actually called.
 */
export const attachSupabaseAuthLazy = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);

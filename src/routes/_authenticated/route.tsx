import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  ssr: false,
  beforeLoad: async () => {
    // Loaded on demand: `beforeLoad` is part of the critical route bundle, so a
    // static import would ship the auth client to every visitor.
    const { supabase } = await import("@/integrations/supabase/client");
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) throw redirect({ to: "/auth" });
      return { user: data.user };
    } catch (e: any) {
      // Re-throw router redirects untouched.
      if (e && (e.isRedirect || e.to || e.routerCode)) throw e;
      // Network hiccup while validating the session: fall back to the sign-in
      // screen instead of crashing into the global error page.
      throw redirect({ to: "/auth" });
    }
  },

  component: () => <Outlet />,
  errorComponent: AuthAreaError,
});

function AuthAreaError({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="min-h-[60svh] grid place-items-center px-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">We couldn't load your dashboard</h1>
        <p className="text-sm text-muted-foreground">
          The connection dropped while loading your account. Please try again.
        </p>
        <button
          className="ed-cta"
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}

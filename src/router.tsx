import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Public marketing/CMS content changes rarely — keep it warm so
        // navigating back to a page is instant instead of re-fetching.
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Warm the route chunk + loader as soon as the user shows intent,
    // so page-to-page navigation feels instant.
    defaultPreload: "intent",
    defaultPreloadDelay: 50,
    // TanStack Query owns cache freshness.
    defaultPreloadStaleTime: 0,
  });

  return router;
};

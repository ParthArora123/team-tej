import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { ScrollProgress } from "../components/site/ScrollProgress";
import { ScrollPerfMode } from "../components/site/ScrollPerfMode";
import { DeferMount } from "../components/site/DeferMount";

// Non-critical ambient/interaction layers — split out of the entry bundle and
// only fetched once the browser is idle after first paint.
const CursorGlow = lazy(() =>
  import("../components/site/CursorGlow").then((m) => ({ default: m.CursorGlow }))
);
const SmoothScroll = lazy(() =>
  import("../components/site/SmoothScroll").then((m) => ({ default: m.SmoothScroll }))
);
const ScrollToTop = lazy(() =>
  import("../components/site/ScrollToTop").then((m) => ({ default: m.ScrollToTop }))
);



function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Off-stage.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page is taking a break. Let's get you back to the studio.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try again or head home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-full border border-border px-5 py-2 text-sm hover:bg-muted"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Tejas D Dhoke — Official Website | Choreographer, Dancer & Dance Educator" },
      {
        name: "description",
        content:
          "Official website of Tejas D Dhoke — choreographer, dancer, dance educator and entrepreneur. Explore workshops, choreography, dance programs, performances and The Tej Method.",
      },
      { property: "og:site_name", content: "Tejas D Dhoke" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      // Only the weights actually used by the design; display=swap avoids
      // blocking first paint on font download.
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Hind:wght@400;600;700&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Tejas D Dhoke",
          url: "https://tejasdhoke.com",
        }),
      },
    ],

  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Entrance animations are only allowed to hide content once React is live.
  // Before that the server-rendered HTML stays fully visible, which removes
  // the blank/flashing first paint on slow networks and mobile browsers.
  useEffect(() => {
    // Wait one frame + a tick so in-view chapters have already latched their
    // `chapter-in` state; otherwise enabling the rule could blink them out.
    const id = window.setTimeout(
      () => document.documentElement.classList.add("js-ready"),
      250,
    );
    return () => window.clearTimeout(id);
  }, []);


  return (
    <QueryClientProvider client={queryClient}>
      <DeferMount delay={200}>
        <Suspense fallback={null}>
          <SmoothScroll />
        </Suspense>
      </DeferMount>
      <div className="min-h-screen relative grain-bg ambient-backdrop">
        <DeferMount>
          <Suspense fallback={null}>
            <CursorGlow />
          </Suspense>
        </DeferMount>

        <ScrollPerfMode />
        <ScrollProgress />
        <Header />
        <main className="pt-16">
          <Outlet />
        </main>
        <Footer />
        <DeferMount>
          <Suspense fallback={null}>
            <ScrollToTop />
          </Suspense>
        </DeferMount>
      </div>
    </QueryClientProvider>
  );

}

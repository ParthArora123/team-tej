import { createServerFn } from "@tanstack/react-start";

/** One round-trip that returns every public dataset the homepage renders. */
export const getHomeBundle = createServerFn({ method: "GET" }).handler(async () => {
  const { getHomeBundleCached } = await import("./home-bundle.server");
  return getHomeBundleCached();
});

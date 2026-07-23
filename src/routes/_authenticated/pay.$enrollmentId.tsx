import { createFileRoute, redirect } from "@tanstack/react-router";

// Payment now happens inline in the student dashboard. Any lingering links
// to /pay/:id (e.g. from older confirmation emails) redirect there.
export const Route = createFileRoute("/_authenticated/pay/$enrollmentId")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  component: () => null,
});

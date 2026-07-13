import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProgramsTool from "./tools/list-programs";
import listMyEnrollmentsTool from "./tools/list-my-enrollments";
import submitFeedbackTool from "./tools/submit-feedback";

// The OAuth issuer must be the direct Supabase host (not the .lovable.cloud proxy),
// built from the project ref that Vite inlines at build time.
const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "team-tej-mcp",
  title: "Team Tej Dance Studio",
  version: "0.1.0",
  instructions:
    "Tools for the Team Tej Dance Studio app. Browse active classes and workshops, review your enrollments and tickets, and post feedback that appears on the homepage.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProgramsTool, listMyEnrollmentsTool, submitFeedbackTool],
});

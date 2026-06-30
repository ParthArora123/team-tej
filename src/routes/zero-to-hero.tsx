import { createFileRoute } from "@tanstack/react-router";
import { ProgramListPage } from "@/components/site/ProgramListPage";

export const Route = createFileRoute("/zero-to-hero")({
  component: () => (
    <ProgramListPage
      kind="zero_to_hero"
      eyebrow="Zero to Hero"
      title="From your first step to the stage"
      blurb="Beginner-first programs that take you from zero experience to performing a full piece on stage."
    />
  ),
});

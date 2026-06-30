import { createFileRoute } from "@tanstack/react-router";
import { ProgramListPage } from "@/components/site/ProgramListPage";

export const Route = createFileRoute("/nritya-sadhana")({
  component: () => (
    <ProgramListPage
      kind="nritya_sadhana"
      eyebrow="Nritya Sadhana"
      title="A devoted practice"
      blurb="Weekly batches rooted in tradition — building stamina, vocabulary and stage presence over a full season."
    />
  ),
});

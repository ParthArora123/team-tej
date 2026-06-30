import { createFileRoute } from "@tanstack/react-router";
import { ProgramListPage } from "@/components/site/ProgramListPage";

export const Route = createFileRoute("/online-trainings")({
  component: () => (
    <ProgramListPage
      kind="online_training"
      eyebrow="Online Trainings"
      title="Train with us, from anywhere"
      blurb="Self-paced video modules with live monthly feedback from our faculty."
    />
  ),
});

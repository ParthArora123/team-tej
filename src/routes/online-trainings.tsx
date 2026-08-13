import { createFileRoute } from "@tanstack/react-router";
import { OnlineTrainingsPage } from "@/components/site/OnlineTrainingsPage";

export const Route = createFileRoute("/online-trainings")({
  head: () => ({
    meta: [
      { title: "Online Trainings — Tejas D Dhoke" },
      {
        name: "description",
        content:
          "Train with Tejas D Dhoke from anywhere. Join D Pro live classes or the Beginner Dance Program from the comfort of your home.",
      },
      { property: "og:title", content: "Online Trainings — Tejas D Dhoke" },
      {
        property: "og:description",
        content:
          "Join D Pro live classes or the Beginner Dance Program — online, from anywhere.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://tejasdhoke.com/online-trainings" }],
  }),
  component: OnlineTrainingsPage,
});

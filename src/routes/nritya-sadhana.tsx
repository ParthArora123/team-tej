import { createFileRoute } from "@tanstack/react-router";
import { ProgramListPage } from "@/components/site/ProgramListPage";

export const Route = createFileRoute("/nritya-sadhana")({
  head: () => ({
    meta: [
      { title: "Nritya Sadhana — Dance Practice with Tejas D Dhoke" },
      {
        name: "description",
        content:
          "Nritya Sadhana by Tejas D Dhoke — weekly dance batches building stamina, vocabulary and stage presence over a full season.",
      },
      { property: "og:title", content: "Nritya Sadhana — Dance Practice with Tejas D Dhoke" },
      {
        property: "og:description",
        content: "Weekly dance batches rooted in practice, led by Tejas D Dhoke.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://tejasdhoke.com/nritya-sadhana" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://tejasdhoke.com/nritya-sadhana" }],
  }),
  component: () => (
    <ProgramListPage
      kind="nritya_sadhana"
      eyebrow="Nritya Sadhana"
      title="A devoted practice"
      blurb="Weekly batches rooted in tradition — building stamina, vocabulary and stage presence over a full season."
    />
  ),
});

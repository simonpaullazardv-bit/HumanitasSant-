import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/shared/ContentPage";
import { RECRUTEMENT_BLOCKS } from "@/data/institutional";

const title = "Recrutement | Humanitas Santé";
const description =
  "Rejoignez les équipes d'Humanitas Santé : agents de terrain, gestionnaires et professionnels de santé.";

export const Route = createFileRoute("/recrutement")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/recrutement" },
    ],
    links: [{ rel: "canonical", href: "https://humanitassante.org/recrutement" }],
  }),
  component: RecrutementPage,
});

function RecrutementPage() {
  return (
    <ContentPage
      slug="recrutement"
      eyebrow="Carrières"
      title="Recrutement"
      description="Rejoignez les équipes d'Humanitas Santé : agents de terrain, gestionnaires et professionnels de santé."
      blocks={RECRUTEMENT_BLOCKS}
    />
  );
}

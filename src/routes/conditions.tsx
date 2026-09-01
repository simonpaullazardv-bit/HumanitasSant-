import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/shared/ContentPage";
import { CONDITIONS_BLOCKS } from "@/data/institutional";

const title = "Conditions d'utilisation | Humanitas Santé";
const description =
  "Les conditions d'utilisation du site et des services de la mutuelle Humanitas Santé.";

export const Route = createFileRoute("/conditions")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/conditions" },
    ],
    links: [{ rel: "canonical", href: "https://humanitassante.org/conditions" }],
  }),
  component: ConditionsPage,
});

function ConditionsPage() {
  return (
    <ContentPage
      slug="conditions"
      eyebrow="Mentions légales"
      title="Conditions d'utilisation"
      description="Les conditions d'utilisation du site et des services de la mutuelle Humanitas Santé."
      blocks={CONDITIONS_BLOCKS}
    />
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/shared/ContentPage";
import { CONFIDENTIALITE_BLOCKS } from "@/data/institutional";

const title = "Politique de confidentialité | Humanitas Santé";
const description =
  "Comment Humanitas Santé collecte, protège et utilise les données de ses adhérents.";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/confidentialite" },
    ],
    links: [{ rel: "canonical", href: "https://humanitassante.org/confidentialite" }],
  }),
  component: ConfidentialitePage,
});

function ConfidentialitePage() {
  return (
    <ContentPage
      slug="confidentialite"
      eyebrow="Confidentialité"
      title="Politique de confidentialité"
      description="Comment Humanitas Santé collecte, protège et utilise les données de ses adhérents."
      blocks={CONFIDENTIALITE_BLOCKS}
    />
  );
}

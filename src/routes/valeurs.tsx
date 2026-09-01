import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/shared/ContentPage";
import { VALEURS_BLOCKS } from "@/data/institutional";

const title = "Nos valeurs | Humanitas Santé";
const description =
  "Solidarité, intégrité, proximité et excellence : les valeurs qui guident la mutuelle Humanitas Santé.";

export const Route = createFileRoute("/valeurs")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/valeurs" },
    ],
    links: [{ rel: "canonical", href: "https://humanitassante.org/valeurs" }],
  }),
  component: ValeursPage,
});

function ValeursPage() {
  return (
    <ContentPage
      slug="valeurs"
      eyebrow="Valeurs"
      title="Nos valeurs"
      description="Solidarité, intégrité, proximité et excellence : les valeurs qui guident la mutuelle Humanitas Santé."
      blocks={VALEURS_BLOCKS}
    />
  );
}

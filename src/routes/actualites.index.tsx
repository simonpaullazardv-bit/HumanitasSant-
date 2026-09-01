import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { NewsList } from "@/components/sections/NewsList";

const title = "Actualités | Humanitas Santé";
const description =
  "Toutes les informations de la mutuelle Humanitas Santé : campagnes de prévention, conventions, vie institutionnelle.";

export const Route = createFileRoute("/actualites/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/actualites" },
    ],
    links: [{ rel: "canonical", href: "https://humanitassante.org/actualites" }],
  }),
  component: NewsIndexPage,
});

function NewsIndexPage() {
  return (
    <>
      <PageHeader
        eyebrow="Actualités"
        title="L'information Humanitas, à la source"
        description="Communiqués, campagnes de santé et nouvelles conventions publiés par nos équipes."
      />
      <NewsList />
    </>
  );
}

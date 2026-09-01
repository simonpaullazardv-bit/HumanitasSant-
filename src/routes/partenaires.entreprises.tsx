import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { PartnersDirectory } from "@/components/sections/PartnersDirectory";

const title = "Entreprises partenaires | Humanitas Santé";
const description =
  "Les entreprises et institutions ayant souscrit une couverture collective Humanitas Santé.";

export const Route = createFileRoute("/partenaires/entreprises")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/partenaires/entreprises" },
    ],
    links: [
      { rel: "canonical", href: "https://humanitassante.org/partenaires/entreprises" },
    ],
  }),
  component: EntreprisesPage,
});

function EntreprisesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Réseau conventionné"
        title="Entreprises partenaires"
        description="Les entreprises et institutions ayant souscrit une couverture collective Humanitas Santé."
      />
      <PartnersDirectory
        type="entreprise"
        eyebrow="Réseau Humanitas"
        title="Entreprises partenaires"
        description="Les entreprises et institutions ayant souscrit une couverture collective Humanitas Santé."
      />
    </>
  );
}

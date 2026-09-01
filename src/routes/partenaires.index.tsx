import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { PartnersDirectory } from "@/components/sections/PartnersDirectory";

const title = "Nos partenaires | Humanitas Santé";
const description =
  "Tout le réseau conventionné Humanitas Santé à Kinshasa : hôpitaux, pharmacies, laboratoires, centres de bien-être et entreprises.";

export const Route = createFileRoute("/partenaires/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/partenaires" },
    ],
    links: [{ rel: "canonical", href: "https://humanitassante.org/partenaires" }],
  }),
  component: IndexPage,
});

function IndexPage() {
  return (
    <>
      <PageHeader
        eyebrow="Réseau conventionné"
        title="Nos partenaires"
        description="Tout le réseau conventionné Humanitas Santé à Kinshasa : hôpitaux, pharmacies, laboratoires, centres de bien-être et entreprises."
      />
      <PartnersDirectory
        eyebrow="Réseau Humanitas"
        title="Nos partenaires"
        description="Tout le réseau conventionné Humanitas Santé à Kinshasa : hôpitaux, pharmacies, laboratoires, centres de bien-être et entreprises."
      />
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { PartnersDirectory } from "@/components/sections/PartnersDirectory";

const title = "Pharmacies partenaires | Humanitas Santé";
const description = "Les pharmacies conventionnées du réseau Humanitas Santé à Kinshasa.";

export const Route = createFileRoute("/partenaires/pharmacies")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/partenaires/pharmacies" },
    ],
    links: [{ rel: "canonical", href: "https://humanitassante.org/partenaires/pharmacies" }],
  }),
  component: PharmaciesPage,
});

function PharmaciesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Réseau conventionné"
        title="Pharmacies partenaires"
        description="Les pharmacies conventionnées du réseau Humanitas Santé à Kinshasa."
      />
      <PartnersDirectory
        type="pharmacie"
        eyebrow="Réseau Humanitas"
        title="Pharmacies partenaires"
        description="Les pharmacies conventionnées du réseau Humanitas Santé à Kinshasa."
      />
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { PartnersDirectory } from "@/components/sections/PartnersDirectory";

const title = "Hôpitaux partenaires | Humanitas Santé";
const description =
  "Les hôpitaux et cliniques conventionnés où les adhérents Humanitas Santé sont pris en charge.";

export const Route = createFileRoute("/partenaires/hopitaux")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/partenaires/hopitaux" },
    ],
    links: [{ rel: "canonical", href: "https://humanitassante.org/partenaires/hopitaux" }],
  }),
  component: HopitauxPage,
});

function HopitauxPage() {
  return (
    <>
      <PageHeader
        eyebrow="Réseau conventionné"
        title="Hôpitaux partenaires"
        description="Les hôpitaux et cliniques conventionnés où les adhérents Humanitas Santé sont pris en charge."
      />
      <PartnersDirectory
        type="hopital"
        eyebrow="Réseau Humanitas"
        title="Hôpitaux partenaires"
        description="Les hôpitaux et cliniques conventionnés où les adhérents Humanitas Santé sont pris en charge."
      />
    </>
  );
}

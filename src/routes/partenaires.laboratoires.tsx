import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { PartnersDirectory } from "@/components/sections/PartnersDirectory";

const title = "Laboratoires partenaires | Humanitas Santé";
const description = "Les laboratoires d'analyses conventionnés par la mutuelle Humanitas Santé.";

export const Route = createFileRoute("/partenaires/laboratoires")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:url",
        content: "https://humanitassante.org/partenaires/laboratoires",
      },
    ],
    links: [
      { rel: "canonical", href: "https://humanitassante.org/partenaires/laboratoires" },
    ],
  }),
  component: LaboratoiresPage,
});

function LaboratoiresPage() {
  return (
    <>
      <PageHeader
        eyebrow="Réseau conventionné"
        title="Laboratoires partenaires"
        description="Les laboratoires d'analyses conventionnés par la mutuelle Humanitas Santé."
      />
      <PartnersDirectory
        type="laboratoire"
        eyebrow="Réseau Humanitas"
        title="Laboratoires partenaires"
        description="Les laboratoires d'analyses conventionnés par la mutuelle Humanitas Santé."
      />
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { PartnersDirectory } from "@/components/sections/PartnersDirectory";

const title = "Centres de bien-être | Humanitas Santé";
const description = "Les centres de bien-être partenaires d'Humanitas Santé.";

export const Route = createFileRoute("/partenaires/centres-bien-etre")({
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
        content: "https://humanitassante.org/partenaires/centres-bien-etre",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://humanitassante.org/partenaires/centres-bien-etre",
      },
    ],
  }),
  component: CentresBienEtrePage,
});

function CentresBienEtrePage() {
  return (
    <>
      <PageHeader
        eyebrow="Réseau conventionné"
        title="Centres de bien-être"
        description="Les centres de bien-être partenaires d'Humanitas Santé."
      />
      <PartnersDirectory
        type="centre_bien_etre"
        eyebrow="Réseau Humanitas"
        title="Centres de bien-être"
        description="Les centres de bien-être partenaires d'Humanitas Santé."
      />
    </>
  );
}

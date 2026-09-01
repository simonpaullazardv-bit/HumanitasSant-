import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/shared/ContentPage";
import { PARTENARIAT_BLOCKS } from "@/data/institutional";

const title = "Devenir partenaire | Humanitas Santé";
const description =
  "Hôpitaux, pharmacies, laboratoires et entreprises : rejoignez le réseau conventionné Humanitas Santé.";

export const Route = createFileRoute("/partenariat")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/partenariat" },
    ],
    links: [{ rel: "canonical", href: "https://humanitassante.org/partenariat" }],
  }),
  component: PartenariatPage,
});

function PartenariatPage() {
  return (
    <ContentPage
      slug="partenariat"
      eyebrow="Partenariat"
      title="Devenir partenaire"
      description="Hôpitaux, pharmacies, laboratoires et entreprises : rejoignez le réseau conventionné Humanitas Santé."
      blocks={PARTENARIAT_BLOCKS}
    />
  );
}

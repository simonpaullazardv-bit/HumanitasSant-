import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { Testimonials } from "@/components/sections/Testimonials";

const title = "Témoignages | Humanitas Santé";
const description =
  "Les parcours et retours d'expérience des adhérents et partenaires de la mutuelle Humanitas Santé.";

export const Route = createFileRoute("/temoignages")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/temoignages" },
    ],
    links: [{ rel: "canonical", href: "https://humanitassante.org/temoignages" }],
  }),
  component: TestimonialsPage,
});

function TestimonialsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Témoignages"
        title="La parole à nos adhérents"
        description="Des expériences vécues au sein du réseau Humanitas, publiées depuis notre espace de gestion."
      />
      <Testimonials />
    </>
  );
}

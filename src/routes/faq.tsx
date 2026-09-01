import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { Faq } from "@/components/sections/Faq";

const title = "Questions fréquentes | Humanitas Santé";
const description =
  "Adhésion, cotisations, carte de membre, remboursements : les réponses aux questions les plus posées.";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/faq" },
    ],
    links: [{ rel: "canonical", href: "https://humanitassante.org/faq" }],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="Aide"
        title="Questions fréquentes"
        description="Tout ce qu'il faut savoir avant et après votre adhésion à Humanitas Santé."
      />
      <Faq />
    </>
  );
}

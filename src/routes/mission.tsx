import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/shared/ContentPage";
import { MISSION_BLOCKS } from "@/data/institutional";

const title = "Notre mission | Humanitas Santé";
const description =
  "La mission d'Humanitas Santé : mutualiser les moyens pour garantir l'accès à des soins de qualité.";

export const Route = createFileRoute("/mission")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/mission" },
    ],
    links: [{ rel: "canonical", href: "https://humanitassante.org/mission" }],
  }),
  component: MissionPage,
});

function MissionPage() {
  return (
    <ContentPage
      slug="mission"
      eyebrow="Mission"
      title="Notre mission"
      description="La mission d'Humanitas Santé : mutualiser les moyens pour garantir l'accès à des soins de qualité."
      blocks={MISSION_BLOCKS}
    />
  );
}

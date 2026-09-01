import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/shared/ContentPage";
import { VISION_BLOCKS } from "@/data/institutional";

const title = "Notre vision | Humanitas Santé";
const description =
  "La vision d'Humanitas Santé : une protection sociale en santé accessible à chaque famille congolaise.";

export const Route = createFileRoute("/vision")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/vision" },
    ],
    links: [{ rel: "canonical", href: "https://humanitassante.org/vision" }],
  }),
  component: VisionPage,
});

function VisionPage() {
  return (
    <ContentPage
      slug="vision"
      eyebrow="Vision"
      title="Notre vision"
      description="La vision d'Humanitas Santé : une protection sociale en santé accessible à chaque famille congolaise."
      blocks={VISION_BLOCKS}
    />
  );
}

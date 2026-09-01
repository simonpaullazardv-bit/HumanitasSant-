import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/shared/ContentPage";
import { ADHERER_BLOCKS } from "@/data/institutional";

const title = "Comment adhérer | Humanitas Santé";
const description =
  "Les quatre étapes pour devenir adhérent d'Humanitas Santé et activer vos droits aux prestations.";

export const Route = createFileRoute("/comment-adherer")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/comment-adherer" },
    ],
    links: [{ rel: "canonical", href: "https://humanitassante.org/comment-adherer" }],
  }),
  component: CommentAdhererPage,
});

function CommentAdhererPage() {
  return (
    <ContentPage
      slug="comment-adherer"
      eyebrow="Adhésion"
      title="Comment adhérer"
      description="Les quatre étapes pour devenir adhérent d'Humanitas Santé et activer vos droits aux prestations."
      blocks={ADHERER_BLOCKS}
    />
  );
}

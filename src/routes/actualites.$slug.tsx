import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/Section";
import { newsBySlugQuery } from "@/lib/cms.queries";

export const Route = createFileRoute("/actualites/$slug")({
  loader: async ({ context, params }) => {
    const article = await context.queryClient.ensureQueryData(newsBySlugQuery(params.slug));
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Article introuvable | Humanitas Santé" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.article.titre} | Humanitas Santé`;
    const description =
      loaderData.article.extrait ?? "Actualité publiée par la mutuelle Humanitas Santé.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          property: "og:url",
          content: `https://humanitassante.org/actualites/${params.slug}`,
        },
      ],
      links: [{ rel: "canonical", href: `https://humanitassante.org/actualites/${params.slug}` }],
    };
  },
  component: NewsArticlePage,
});

function NewsArticlePage() {
  const { slug } = Route.useParams();
  const { data: article } = useQuery(newsBySlugQuery(slug));
  if (!article) return null;

  return (
    <>
      <PageHeader
        eyebrow={article.categorie ?? "Actualité"}
        title={article.titre}
        {...(article.extrait ? { description: article.extrait } : {})}
      />
      <Section>
        <article className="mx-auto max-w-3xl">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5 text-accent" />
            {new Date(article.date_publication).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            {article.auteur ? <span>· {article.auteur}</span> : null}
          </p>
          {article.image_url ? (
            <img
              src={article.image_url}
              alt={article.titre}
              className="mt-6 w-full rounded-3xl bg-surface object-contain"
            />
          ) : null}
          <div className="mt-8 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
            {article.contenu}
          </div>
          <Link
            to="/actualites"
            className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
          >
            <ArrowLeft className="size-4" /> Toutes les actualités
          </Link>
        </article>
      </Section>
    </>
  );
}

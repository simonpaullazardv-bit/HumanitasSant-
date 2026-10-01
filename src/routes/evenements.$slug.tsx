import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/Section";
import { eventBySlugQuery } from "@/lib/cms.queries";

export const Route = createFileRoute("/evenements/$slug")({
  loader: async ({ context, params }) => {
    const evenement = await context.queryClient.ensureQueryData(eventBySlugQuery(params.slug));
    if (!evenement) throw notFound();
    return { evenement };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Évènement introuvable | Humanitas Santé" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.evenement.titre} | Humanitas Santé`;
    const description =
      loaderData.evenement.description ?? "Évènement organisé par Humanitas Santé.";
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
          content: `https://humanitassante.org/evenements/${params.slug}`,
        },
      ],
      links: [{ rel: "canonical", href: `https://humanitassante.org/evenements/${params.slug}` }],
    };
  },
  component: EventDetailPage,
});

function EventDetailPage() {
  const { slug } = Route.useParams();
  const { data: evenement } = useQuery(eventBySlugQuery(slug));
  if (!evenement) return null;

  return (
    <>
      <PageHeader
        eyebrow="Évènement"
        title={evenement.titre}
        {...(evenement.description ? { description: evenement.description } : {})}
      />
      <Section>
        <article className="mx-auto max-w-3xl">
          <ul className="flex flex-wrap gap-5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <CalendarDays className="size-3.5 text-accent" />
              {new Date(evenement.date_debut).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </li>
            {evenement.lieu ? (
              <li className="flex items-center gap-2">
                <MapPin className="size-3.5 text-accent" />
                {evenement.lieu}
              </li>
            ) : null}
          </ul>
          {evenement.image_url ? (
            <img
              src={evenement.image_url}
              alt={evenement.titre}
              className="mt-6 w-full rounded-3xl bg-surface object-contain"
            />
          ) : null}
          <div className="mt-8 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
            {evenement.contenu ?? evenement.description}
          </div>
          <Link
            to="/evenements"
            className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
          >
            <ArrowLeft className="size-4" /> Tous les évènements
          </Link>
        </article>
      </Section>
    </>
  );
}

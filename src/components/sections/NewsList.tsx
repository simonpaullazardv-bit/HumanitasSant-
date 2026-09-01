import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { newsQuery } from "@/lib/cms.queries";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function NewsList({
  limit,
  categorie,
  eyebrow = "Actualités",
  title = "Les dernières nouvelles d'Humanitas",
  description = "Informations institutionnelles, campagnes de santé et vie de la mutuelle.",
  tone = "default",
}: {
  limit?: number;
  categorie?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  tone?: "default" | "surface" | "soft";
}) {
  const { data } = useQuery(
    newsQuery({ ...(limit ? { limit } : {}), ...(categorie ? { categorie } : {}) }),
  );
  const items = data ?? [];

  return (
    <Section tone={tone} id="actualites">
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      {items.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Aucun article publié pour le moment.
        </p>
      ) : (
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.05} className="h-full">
              <article className="card-hover flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.titre}
                    loading="lazy"
                    className="h-44 w-full bg-surface object-contain"
                  />
                ) : null}
                <div className="flex flex-1 flex-col p-6">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5 text-accent" />
                    {formatDate(item.date_publication)}
                    {item.categorie ? <span>· {item.categorie}</span> : null}
                  </p>
                  <h3 className="mt-3 font-display text-lg font-semibold text-foreground">
                    {item.titre}
                  </h3>
                  {item.extrait ? (
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {item.extrait}
                    </p>
                  ) : null}
                  <Link
                    to="/actualites/$slug"
                    params={{ slug: item.slug }}
                    className="mt-5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    Lire l'article →
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      )}
    </Section>
  );
}

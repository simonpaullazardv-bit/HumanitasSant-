import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, Linkedin } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/Section";
import { Reveal } from "@/components/shared/Reveal";
import { teamQuery } from "@/lib/cms.queries";

const title = "Notre équipe | Humanitas Santé";
const description =
  "Direction générale, coordination des programmes et équipe administrative de la mutuelle Humanitas Santé.";

export const Route = createFileRoute("/equipe")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/equipe" },
    ],
    links: [{ rel: "canonical", href: "https://humanitassante.org/equipe" }],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { data } = useQuery(teamQuery());
  const members = data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Gouvernance"
        title="Les femmes et les hommes d'Humanitas"
        description="Une équipe pluridisciplinaire au service des adhérents et du réseau conventionné."
      />
      <Section>
        {members.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Les profils de l'équipe seront publiés prochainement.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {members.map((member, index) => (
              <Reveal key={member.id} delay={index * 0.05} className="h-full">
                <article className="card-hover flex h-full flex-col rounded-3xl border border-border/70 bg-card p-7 text-center shadow-soft">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.nom}
                      loading="lazy"
                      className="mx-auto size-28 rounded-full bg-surface object-cover"
                    />
                  ) : null}
                  <h2 className="mt-5 font-display text-lg font-semibold text-foreground">
                    {member.nom}
                  </h2>
                  {member.fonction ? (
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-accent">
                      {member.fonction}
                    </p>
                  ) : null}
                  {member.bio ? (
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {member.bio}
                    </p>
                  ) : null}
                  <div className="mt-5 flex justify-center gap-3">
                    {member.email ? (
                      <a
                        href={`mailto:${member.email}`}
                        aria-label={`Écrire à ${member.nom}`}
                        className="rounded-full bg-primary-soft p-2 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        <Mail className="size-4" />
                      </a>
                    ) : null}
                    {member.linkedin_url ? (
                      <a
                        href={member.linkedin_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`LinkedIn de ${member.nom}`}
                        className="rounded-full bg-primary-soft p-2 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        <Linkedin className="size-4" />
                      </a>
                    ) : null}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

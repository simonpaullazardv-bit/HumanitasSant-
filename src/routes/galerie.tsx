import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Reveal } from "@/components/shared/Reveal";
import { mediaQuery } from "@/lib/cms.queries";

const title = "Médiathèque | Humanitas Santé";
const description =
  "Photos et vidéos des activités, campagnes et évènements de la mutuelle Humanitas Santé.";

export const Route = createFileRoute("/galerie")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/galerie" },
    ],
    links: [{ rel: "canonical", href: "https://humanitassante.org/galerie" }],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const { data: photos = [] } = useQuery(mediaQuery({ type: "image" }));
  const { data: allVideos = [] } = useQuery(mediaQuery({ type: "video" }));

  return (
    <>
      <PageHeader
        eyebrow="Médiathèque"
        title="Photos et vidéos d'Humanitas"
        description="Retour en images sur nos campagnes de prévention, nos évènements et la vie de la mutuelle."
      />

      <Section id="photos">
        <SectionHeading
          eyebrow="Galerie photos"
          title="Nos activités en images"
          description="Médias publiés depuis la médiathèque interne, servis via des liens sécurisés."
        />
        {photos.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Aucune photo publiée pour le moment.
          </p>
        ) : (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((media, index) => (
              <Reveal key={media.id} delay={index * 0.04}>
                <figure className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
                  <img
                    src={media.url ?? ""}
                    alt={media.texte_alternatif ?? media.nom}
                    loading="lazy"
                    className="h-56 w-full bg-surface object-contain"
                  />
                  {media.legende ? (
                    <figcaption className="px-4 py-3 text-xs text-muted-foreground">
                      {media.legende}
                    </figcaption>
                  ) : null}
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </Section>

      <Section tone="surface" id="videos">
        <SectionHeading
          eyebrow="Galerie vidéos"
          title="Humanitas en mouvement"
          description="Reportages et capsules d'information de la mutuelle."
        />
        {allVideos.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Aucune vidéo publiée pour le moment.
          </p>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {allVideos.map((media) => (
              <figure
                key={media.id}
                className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft"
              >
                <video
                  src={media.url ?? ""}
                  controls
                  className="aspect-video w-full bg-foreground/5"
                />
                <figcaption className="px-4 py-3 text-xs text-muted-foreground">
                  {media.legende ?? media.nom}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

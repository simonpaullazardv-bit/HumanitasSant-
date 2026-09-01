import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { Events } from "@/components/sections/Events";
import { SocialLinks } from "@/components/sections/SocialLinks";

const title = "Nos évènements | Humanitas Santé";
const description =
  "Journées santé communautaires, forum mutualiste annuel et semaine du bien-être organisés par Humanitas.";

export const Route = createFileRoute("/evenements/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/evenements" },
    ],
    links: [{ rel: "canonical", href: "https://humanitassante.org/evenements" }],
  }),
  component: EventsPage,
});

function EventsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Nos évènements"
        title="Des rendez-vous qui rapprochent soignants et adhérents"
        description="Participez à nos évènements de prévention, d'information et de rencontre partout où Humanitas est présent."
      />
      <Events />
      <SocialLinks />
    </>
  );
}

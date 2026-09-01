import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { Achievements } from "@/components/sections/Achievements";
import { Stats } from "@/components/sections/Stats";
import { Partners } from "@/components/sections/Partners";

const title = "Nos réalisations | Humanitas";
const description =
  "Campagnes de dépistage, conventionnements hospitaliers, couverture des entreprises et digitalisation du parcours adhérent.";

export const Route = createFileRoute("/realisations")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: AchievementsPage,
});

function AchievementsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Nos réalisations"
        title="Ce que la solidarité mutualiste a déjà permis"
        description="Des actions concrètes, mesurées et publiées chaque année devant l'assemblée générale des adhérents."
      />
      <Achievements />
      <Stats />
      <Partners />
    </>
  );
}

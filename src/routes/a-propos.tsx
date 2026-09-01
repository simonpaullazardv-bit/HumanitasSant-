import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { Presentation } from "@/components/sections/Presentation";
import { DirectorMessage } from "@/components/sections/DirectorMessage";
import { WhyUs } from "@/components/sections/WhyUs";
import { Stats } from "@/components/sections/Stats";
import { Faq } from "@/components/sections/Faq";

const title = "Tout savoir sur Humanitas | Mutuelle de santé";
const description =
  "Mission, gouvernance, valeurs et fonctionnement de la mutuelle Humanitas Santé.";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tout savoir sur Humanitas"
        title="Une mutuelle bâtie sur la solidarité et la transparence"
        description="Humanitas mutualise les cotisations de ses membres pour financer des soins de qualité, encadrés par un médecin conseil et un réseau de structures conventionnées."
      />
      <Presentation />
      <DirectorMessage />
      <Stats />
      <WhyUs />
      <Faq />
    </>
  );
}

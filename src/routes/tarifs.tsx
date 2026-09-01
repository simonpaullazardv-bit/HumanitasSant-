import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { MembershipTiers } from "@/components/sections/MembershipTiers";
import { Faq } from "@/components/sections/Faq";

const title = "Tarifs et catégories d'adhésion | Humanitas";
const description =
  "Bronze 25 $, Argent 50 $, Or 75 $, Platine 100 $ : comparez les cotisations et les niveaux de prise en charge Humanitas.";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tarifs"
        title="Des cotisations claires, sans frais cachés"
        description="Chaque catégorie ouvre des droits précis. Vous pouvez changer de formule à chaque date anniversaire."
      />
      <MembershipTiers tone="default" />
      <Faq />
    </>
  );
}

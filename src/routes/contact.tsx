import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { ContactSection } from "@/components/sections/ContactSection";
import { SocialLinks } from "@/components/sections/SocialLinks";

const title = "Nous contacter | Humanitas";
const description =
  "Téléphone, email, adresse et formulaire de contact pour joindre l'équipe Humanitas Santé.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Nous contacter"
        title="Une équipe disponible pour vous répondre"
        description="Nos conseillers vous accompagnent du lundi au samedi pour toute question sur l'adhésion, les remboursements ou le réseau de soins."
      />
      <ContactSection />
      <SocialLinks />
    </>
  );
}

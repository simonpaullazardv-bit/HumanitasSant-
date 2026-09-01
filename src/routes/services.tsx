import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { Services } from "@/components/sections/Services";
import { Advantages } from "@/components/sections/Advantages";
import { ContactSection } from "@/components/sections/ContactSection";

const title = "Nos services de santé | Humanitas";
const description =
  "Consultations, hospitalisation, pharmacie, maternité, laboratoire et centre de bien-être : découvrez la couverture Humanitas.";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Des services pensés pour chaque étape du parcours de soins"
        description="De la consultation de routine à l'hospitalisation, Humanitas coordonne votre prise en charge de bout en bout."
      />
      <Services />
      <Advantages />
      <ContactSection />
    </>
  );
}

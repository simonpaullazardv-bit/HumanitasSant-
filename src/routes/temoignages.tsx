import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { Testimonials } from "@/components/sections/Testimonials";

export const Route = createFileRoute("/temoignages")({ component: TestimonialsPage });

function TestimonialsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Témoignages"
        title="La parole à nos membres"
        description="Découvrez les expériences publiées et validées sur la vitrine Humanitas."
      />
      <Testimonials />
    </>
  );
}

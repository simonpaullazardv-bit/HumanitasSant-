import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/sections/Hero";
import { DirectorMessage } from "@/components/sections/DirectorMessage";
import { QuickContactSection } from "@/components/sections/QuickContactSection";
import { Presentation } from "@/components/sections/Presentation";
import { Services } from "@/components/sections/Services";
import { Advantages } from "@/components/sections/Advantages";
import { Achievements } from "@/components/sections/Achievements";
import { Events } from "@/components/sections/Events";
import { Stats } from "@/components/sections/Stats";
import { WhyUs } from "@/components/sections/WhyUs";
import { MembershipTiers } from "@/components/sections/MembershipTiers";
import { GallerySection } from "@/components/sections/GallerySection";
import { HealthVideo } from "@/components/sections/HealthVideo";
import { InteractivePartnersMap } from "@/components/sections/InteractivePartnersMap";
import { Faq } from "@/components/sections/Faq";
import { PartnersDirectory } from "@/components/sections/PartnersDirectory";
import { NewsList } from "@/components/sections/NewsList";
import { ContactSection } from "@/components/sections/ContactSection";
import { SocialLinks } from "@/components/sections/SocialLinks";
import { DrcMap } from "@/components/shared/DrcMap";
import { Testimonials } from "@/components/sections/Testimonials";

const title = "Humanitas Santé | Mutuelle de santé";
const description =
  "Mutuelle de santé et centre de bien-être : couverture santé solidaire, prévention, accompagnement personnalisé et réseau de soins publié.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <DirectorMessage />
      <QuickContactSection />
      <Stats />
      <Presentation />
      <HealthVideo />
      <Services />
      <Advantages />
      <MembershipTiers />
      <GallerySection />
      <Testimonials limit={3} />
      <NewsList limit={3} tone="surface" />
      <InteractivePartnersMap />
      <PartnersDirectory />
      <Achievements />
      <Events />
      <WhyUs />
      <Faq />
      <ContactSection />
      <SocialLinks />
      <div className="mx-auto flex w-full max-w-7xl justify-end px-5 pb-16 sm:px-8">
        <DrcMap />
      </div>
    </>
  );
}

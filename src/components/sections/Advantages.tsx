import { CreditCard, HandHeart, Network, Timer, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ADVANTAGES } from "@/data/site";

const ICONS: Record<string, LucideIcon> = {
  "credit-card": CreditCard,
  network: Network,
  timer: Timer,
  "hand-heart": HandHeart,
};

export function Advantages() {
  return (
    <Section tone="surface" id="avantages">
      <SectionHeading
        eyebrow="Nos avantages"
        title="Ce qui change concrètement pour vous"
        description="Adhérer à Humanitas, c'est bénéficier d'un système pensé pour supprimer les obstacles à l'accès aux soins."
      />

      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {ADVANTAGES.map((advantage, index) => {
          const Icon = ICONS[advantage.icon] ?? CreditCard;
          return (
            <Reveal key={advantage.title} delay={index * 0.07}>
              <div className="card-hover h-full rounded-3xl border border-border/70 bg-card p-7 shadow-soft">
                <Icon className="size-6 text-accent" />
                <h3 className="mt-5 text-base font-semibold text-foreground">{advantage.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {advantage.description}
                </p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

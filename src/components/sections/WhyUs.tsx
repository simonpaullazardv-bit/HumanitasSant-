import { Reveal } from "@/components/shared/Reveal";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { WHY_US } from "@/data/site";

export function WhyUs() {
  return (
    <Section id="pourquoi-humanitas">
      <SectionHeading
        eyebrow="Pourquoi choisir Humanitas"
        title="La rigueur d'une institution, la chaleur d'une communauté"
      />

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {WHY_US.map((reason, index) => (
          <Reveal key={reason.title} delay={index * 0.07}>
            <div className="card-hover flex h-full gap-5 rounded-3xl border border-border/70 bg-card p-8 shadow-soft">
              <span className="font-display text-3xl font-bold text-primary/25">0{index + 1}</span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {reason.description}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

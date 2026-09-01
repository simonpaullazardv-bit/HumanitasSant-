import { Reveal } from "@/components/shared/Reveal";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ACHIEVEMENTS } from "@/data/site";

export function Achievements() {
  return (
    <Section id="realisations">
      <SectionHeading
        eyebrow="Nos réalisations"
        title="Nos réalisations documentées"
        description="Cette rubrique ne publie que des réalisations dont les informations ont été validées et documentées par Humanitas."
      />

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {ACHIEVEMENTS.map((achievement, index) => (
          <Reveal key={achievement.id} delay={index * 0.07}>
            <article className="card-hover h-full rounded-3xl border border-border/70 bg-card p-8 shadow-soft">
              <p className="font-display text-2xl font-bold text-gradient-brand">
                {achievement.metric}
              </p>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{achievement.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {achievement.description}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

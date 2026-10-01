import {
  Ambulance,
  Apple,
  Baby,
  Brain,
  Building2,
  HeartPulse,
  Microscope,
  Pill,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { IMAGES, SERVICES } from "@/data/site";

const ICONS: Record<string, LucideIcon> = {
  stethoscope: Stethoscope,
  brain: Brain,
  apple: Apple,
  pill: Pill,
  microscope: Microscope,
  hospital: Building2,
  ambulance: Ambulance,
  "heart-pulse": HeartPulse,
  baby: Baby,
};

export function Services() {
  return (
    <Section id="services">
      <SectionHeading
        eyebrow="Nos services"
        title="Une prise en charge complète, du quotidien à l'urgence"
        description="Six pôles de services conçus pour couvrir l'ensemble du parcours de soins de nos adhérents."
      />

      {/* Featured Services Visual Showcase */}
      <div className="mt-10 overflow-hidden rounded-3xl border border-white/40 bg-card shadow-3d-elevated group relative">
        <div className="grid items-center lg:grid-cols-2">
          <div className="p-8 sm:p-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              Réseau de soins intégré
            </span>
            <h3 className="mt-4 font-display text-2xl font-bold text-foreground sm:text-3xl">
              Des soins de qualité garantie sans avance de frais
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Du dépistage préventif aux interventions chirurgicales complexes, nos adhérents
              bénéficient d'une prise en charge directe dans les établissements et professionnels de
              santé conventionnés et publiés par Humanitas.
            </p>
          </div>
          <div className="relative h-64 sm:h-80 lg:h-full overflow-hidden">
            <img
              src={IMAGES.services}
              alt="Services de santé Humanitas"
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent lg:bg-gradient-to-r" />
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service, index) => {
          const Icon = ICONS[service.icon] ?? Stethoscope;
          return (
            <Reveal key={service.slug} delay={index * 0.06}>
              <article className="card-3d group h-full rounded-3xl border border-border/80 bg-card p-7 shadow-3d-soft">
                <span className="inline-flex size-13 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-soft transition-all duration-300 group-hover:bg-gradient-brand group-hover:text-white group-hover:scale-110">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

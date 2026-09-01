import { CalendarDays, MapPin } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { EVENTS } from "@/data/site";

export function Events() {
  return (
    <Section tone="surface" id="evenements">
      <SectionHeading
        eyebrow="Nos évènements"
        title="La communauté Humanitas se rencontre"
        description="Journées santé, forums et ateliers de prévention : nos évènements rapprochent adhérents et professionnels de santé."
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {EVENTS.map((event, index) => (
          <Reveal key={event.id} delay={index * 0.08}>
            <article className="card-3d group flex h-full flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-3d-soft">
              <div className="relative overflow-hidden h-52 bg-muted/40">
                <img
                  src={event.image}
                  alt={event.title}
                  loading="lazy"
                  width={1280}
                  height={1024}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent opacity-60" />
              </div>
              <div className="flex flex-1 flex-col p-7">
                <div className="flex flex-wrap gap-4 text-xs font-semibold text-accent">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-accent border border-accent/20">
                    <CalendarDays className="size-3.5" />
                    {event.date}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground py-1">
                    <MapPin className="size-3.5" />
                    {event.location}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {event.excerpt}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

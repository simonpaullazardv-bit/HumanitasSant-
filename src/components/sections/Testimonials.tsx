import { useQuery } from "@tanstack/react-query";
import { Quote, Star } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { testimonialsQuery } from "@/lib/cms.queries";

export function Testimonials({ tone = "default" }: { tone?: "default" | "surface" | "soft" }) {
  const { data } = useQuery(testimonialsQuery());
  const items = data ?? [];

  return (
    <Section tone={tone} id="temoignages">
      <SectionHeading
        eyebrow="Témoignages"
        title="Ce que disent nos adhérents"
        description="Des parcours réels, publiés depuis notre espace de gestion de contenu."
      />
      {items.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Les premiers témoignages seront publiés très bientôt.
        </p>
      ) : (
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.06} className="h-full">
              <figure className="card-hover flex h-full flex-col rounded-3xl border border-border/70 bg-card p-7 shadow-soft">
                <Quote className="size-6 text-accent" aria-hidden="true" />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {item.message}
                </blockquote>
                {item.note ? (
                  <div className="mt-4 flex gap-1" aria-label={`Note ${item.note} sur 5`}>
                    {Array.from({ length: item.note }).map((_, i) => (
                      <Star key={i} className="size-4 fill-accent text-accent" />
                    ))}
                  </div>
                ) : null}
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border/70 pt-5">
                  {item.photo_url ? (
                    <img
                      src={item.photo_url}
                      alt={item.auteur}
                      loading="lazy"
                      className="size-10 rounded-full object-cover"
                    />
                  ) : null}
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      {item.auteur}
                    </span>
                    {item.fonction ? (
                      <span className="block text-xs text-muted-foreground">{item.fonction}</span>
                    ) : null}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      )}
    </Section>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Quote, Star } from "lucide-react";
import { motion } from "motion/react";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { testimonialsQuery } from "@/lib/cms.queries";

type Testimonial = {
  id: string;
  auteur?: string | null;
  fonction?: string | null;
  message?: string | null;
  photo_url?: string | null;
  note?: number | null;
};

export function Testimonials({ limit }: { limit?: number } = {}) {
  const { data = [] } = useQuery(testimonialsQuery());
  const items = (data as Testimonial[]).filter((item) => item.message).slice(0, limit);
  if (!items.length) return null;
  return (
    <Section id="temoignages" className="relative overflow-hidden bg-surface/60">
      <SectionHeading
        eyebrow="Paroles de membres"
        title="Ils partagent leur expérience"
        description="Des témoignages publiés et validés avant leur affichage sur la vitrine Humanitas."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <motion.article
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: index * 0.05 }}
            className="relative rounded-3xl border border-border/70 bg-card p-7 shadow-soft card-hover"
          >
            <Quote className="size-9 text-primary/25" aria-hidden="true" />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.message}</p>
            <div className="mt-6 flex items-center gap-3">
              {item.photo_url ? (
                <img
                  src={item.photo_url}
                  alt=""
                  className="size-11 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                  {(item.auteur || "H").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {item.auteur || "Membre Humanitas"}
                </p>
                {item.fonction ? (
                  <p className="truncate text-xs text-muted-foreground">{item.fonction}</p>
                ) : null}
              </div>
              {item.note ? (
                <div className="ml-auto flex gap-0.5 text-amber-500">
                  {Array.from({ length: Math.min(5, Math.max(1, Math.round(item.note))) }).map(
                    (_, i) => (
                      <Star key={i} className="size-3.5 fill-current" />
                    ),
                  )}
                </div>
              ) : null}
            </div>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}

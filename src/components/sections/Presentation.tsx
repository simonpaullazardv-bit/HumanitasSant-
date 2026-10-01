import { motion } from "motion/react";
import { Check, Building2, ShieldCheck, Camera, Sparkles } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { Section } from "@/components/shared/Section";
import { IMAGES } from "@/data/site";
import { LOCAL_PRESENTATION } from "@/data/public-fallbacks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_PILLARS = [
  "Une mutuelle à but non lucratif, gouvernée par ses adhérents",
  "Un centre de bien-être dédié à la prévention et à la remise en forme",
  "Un réseau de soins conventionné, contrôlé par notre médecin conseil",
  "Une couverture adaptée aux familles, entreprises et institutions",
];

function usePresentationQuery() {
  return useQuery({
    queryKey: ["site_presentation"],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("site_settings" as never)
          .select("*")
          .eq("key", "presentation_content")
          .maybeSingle();

        if (!data) return LOCAL_PRESENTATION;
        return {
          ...LOCAL_PRESENTATION,
          ...((data as { value: Record<string, unknown> }).value ?? {}),
        };
      } catch {
        return LOCAL_PRESENTATION;
      }
    },
  });
}

export function Presentation() {
  const { data: presentation } = usePresentationQuery();

  const title = (presentation?.title as string) || LOCAL_PRESENTATION.title;
  const text = (presentation?.text as string) || LOCAL_PRESENTATION.text;
  const photoUrl = (presentation?.photoUrl as string) || LOCAL_PRESENTATION.photoUrl;
  const pillars = (presentation?.pillars as string[]) || LOCAL_PRESENTATION.pillars;

  return (
    <Section id="presentation">
      {}
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative group overflow-hidden rounded-4xl border border-white/40 bg-card shadow-3d-elevated"
        >
          <div className="absolute inset-0 bg-gradient-brand opacity-0 transition-opacity duration-500 group-hover:opacity-10 z-10 pointer-events-none" />

          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Présentation institutionnelle d'Humanitas Santé"
              loading="lazy"
              width={1280}
              height={1024}
              className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center bg-muted/60 p-8 text-center">
              <Camera className="size-12 text-primary opacity-60" />
              <p className="mt-3 font-display text-sm font-bold text-foreground">
                [ Emplacement Photo Présentation Humanitas ]
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                Administrable depuis le Dashboard SuperAdmin via la table Supabase site_settings.
              </p>
            </div>
          )}

          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-2xl bg-background/90 px-4 py-2 text-xs font-semibold backdrop-blur border border-border/80 shadow-md">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>Siège Social & Centre Médical Régulateur</span>
          </div>
        </motion.div>

        <div>
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              <Building2 className="size-3.5" /> Présentation Institutionnelle
            </span>
            <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{title}</h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">{text}</p>
          </Reveal>

          <ul className="mt-8 space-y-4">
            {pillars.map((pillar, index) => (
              <Reveal key={pillar} delay={index * 0.08}>
                <li className="flex gap-3 text-sm text-foreground">
                  <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Check className="size-3.5" />
                  </span>
                  {pillar}
                </li>
              </Reveal>
            ))}
          </ul>

          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground italic border-t border-border/40 pt-4">
            <Sparkles className="size-3.5 text-accent shrink-0" />
            <span>
              Contenu institutionnel synchronisé avec Supabase DB (évolutif via SuperAdmin).
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
}

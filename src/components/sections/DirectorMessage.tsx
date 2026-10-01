import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LOCAL_DIRECTOR } from "@/data/public-fallbacks";
import { motion } from "motion/react";
import { Quote, Sparkles, HeartPulse, ShieldCheck, ArrowRight, BookOpen } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { Section } from "@/components/shared/Section";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DirectorPublicData {
  name?: string;
  title?: string;
  photo_url?: string;
  message_image_url?: string;
}

export function DirectorMessage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: official } = useQuery<DirectorPublicData>({
    queryKey: ["public-director-general"],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase.from("site_settings" as never) as any)
          .select("value")
          .eq("key", "public_director_general")
          .eq("is_public", true)
          .maybeSingle();
        if (error) throw error;
        const value = (data?.value ?? {}) as DirectorPublicData;
        return { ...LOCAL_DIRECTOR, ...value };
      } catch {
        return LOCAL_DIRECTOR;
      }
    },
    staleTime: 60_000,
  });

  const directorName = official?.name?.trim() || LOCAL_DIRECTOR.name;
  const directorTitle = official?.title?.trim() || LOCAL_DIRECTOR.title;
  const directorPhoto = official?.photo_url?.trim() || LOCAL_DIRECTOR.photo_url;
  const messageImage = official?.message_image_url?.trim() || LOCAL_DIRECTOR.message_image_url;

  return (
    <Section tone="surface" id="mot-du-dg" className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <Quote className="size-3.5" /> SECTION INSTITUTIONNELLE
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground sm:text-4xl lg:text-5xl">
            MOT DU DIRECTEUR GÉNÉRAL
          </h2>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <motion.div
            initial={{ opacity: 0, scale: 0.93 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="relative mx-auto w-full max-w-md"
          >
            <div className="absolute -inset-3 rounded-4xl bg-gradient-brand opacity-25 blur-xl" />
            <div className="relative overflow-hidden rounded-4xl border-2 border-white/60 bg-card shadow-3d-elevated">
              <img
                src={directorPhoto}
                alt={`Portrait officiel de ${directorName}`}
                loading="lazy"
                width={1024}
                height={1280}
                className="aspect-[4/5] h-auto w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/30 bg-white/90 px-5 py-4 text-center shadow-lg backdrop-blur">
                <p className="font-display text-base font-extrabold text-foreground">
                  {directorName}
                </p>
                <p className="text-xs font-bold text-primary">{directorTitle}</p>
              </div>
            </div>
          </motion.div>

          <Reveal>
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="size-4 text-amber-500" /> Vision, Solidarité & Engagement
                Humanitaire
              </div>
              <h3 className="font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                « Une mutuelle moderne, scientifique, humaine et digne de la confiance de ses
                adhérents. »
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Le message officiel de la Direction Générale est conservé comme un visuel
                institutionnel afin de préserver sa mise en page, son identité graphique et son
                contenu validé. La zone reste prête à être alimentée par Supabase lorsque la
                publication dynamique sera activée.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  <ShieldCheck className="size-3.5 text-emerald-600" /> Confiance & Transparence
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                  <HeartPulse className="size-3.5 text-rose-600" /> Couverture & Prévention
                </span>
              </div>
              <Button
                onClick={() => setModalOpen(true)}
                size="lg"
                className="gap-2 bg-gradient-brand font-bold shadow-3d-soft"
              >
                <BookOpen className="size-4" /> Voir le message officiel
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </Reveal>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto rounded-3xl border-primary/20 bg-card p-4 shadow-3d-elevated sm:p-6">
          <DialogHeader className="sr-only">
            <DialogTitle>Message officiel de la Direction Générale</DialogTitle>
            <DialogDescription>
              {directorName} — {directorTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-soft">
            <img
              src={messageImage}
              alt={`Message officiel du Directeur Général de Humanitas Santé — ${directorName}`}
              className="h-auto w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </Section>
  );
}

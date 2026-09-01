import { HeartPulse, PlayCircle, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { mediaQuery } from "@/lib/cms.queries";

export function HealthVideo() {
  const { data: videos = [] } = useQuery(mediaQuery({ type: "video", limit: 4 }));
  const video = videos[0];

  return (
    <Section tone="surface" id="video-sante">
      <SectionHeading
        eyebrow="Vidéo santé"
        title="Prévention, santé et bien-être"
        description="Une courte capsule visuelle pour présenter les bons réflexes de prévention et l'esprit Humanitas Santé."
      />
      <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1.45fr_0.75fr]">
        <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-black shadow-3d-elevated">
          {video?.url ? (
            <video src={video.url} controls playsInline preload="metadata" className="aspect-video w-full object-cover" poster="/img/presentationhumanitas.png" />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-gradient-brand p-8 text-center text-white">
              <div>
                <PlayCircle className="mx-auto size-14 opacity-90" />
                <p className="mt-4 text-lg font-bold">Capsule santé Humanitas</p>
                <p className="mt-2 text-sm text-white/80">La vidéo sera disponible dès que le média local ou Supabase est publié.</p>
              </div>
            </div>
          )}
        </div>
        <div className="rounded-[2rem] border border-primary/15 bg-card p-7 shadow-soft">
          <HeartPulse className="size-10 text-primary" />
          <h3 className="mt-5 text-2xl font-bold">Prévenir avant de guérir</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Humanitas Santé met la prévention, l'information et l'accompagnement humain au cœur du parcours de santé.</p>
          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-emerald-700"><ShieldCheck className="size-4" /> Information institutionnelle Humanitas</div>
        </div>
      </div>
    </Section>
  );
}

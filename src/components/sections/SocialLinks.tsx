import {
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Globe,
  Twitter,
  Youtube,
  Music2,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { SOCIALS } from "@/data/site";

const ICONS: Record<string, LucideIcon> = {
  facebook: Facebook,
  whatsapp: MessageCircle,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  tiktok: Music2,
  x: Twitter,
  linkedin: Linkedin,
  messenger: MessageCircle,
  truth_social: Globe,
  telegram: MessageCircle,
  threads: Globe,
};

export function SocialLinks() {
  return (
    <Section tone="surface" id="reseaux-sociaux">
      <SectionHeading
        eyebrow="Réseaux sociaux"
        title="Suivez la vie de la mutuelle"
        description="Actualités, campagnes de prévention et conseils santé, chaque semaine."
      />

      <div className="mt-12 flex flex-wrap justify-center gap-4">
        {SOCIALS.map((social, index) => {
          const Icon = ICONS[social.icon] ?? Facebook;
          return (
            <Reveal key={social.name} delay={index * 0.05}>
              <a
                href={social.href}
                target="_blank"
                rel="noreferrer noopener"
                className="card-hover flex w-40 flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card px-6 py-7 shadow-soft"
              >
                <Icon className="size-6 text-primary" />
                <span className="text-sm font-semibold text-foreground">{social.name}</span>
              </a>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

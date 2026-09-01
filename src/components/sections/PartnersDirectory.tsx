import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  FlaskConical,
  Hospital,
  Pill,
  Sparkles,
  MapPin,
  Phone,
  Globe,
} from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { partnersQuery, type PartnerType } from "@/lib/cms.queries";

const TYPE_ICONS: Record<PartnerType, typeof Hospital> = {
  hopital: Hospital,
  pharmacie: Pill,
  laboratoire: FlaskConical,
  centre_bien_etre: Sparkles,
  entreprise: Building2,
};

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  hopital: "Hôpitaux partenaires",
  pharmacie: "Pharmacies partenaires",
  laboratoire: "Laboratoires partenaires",
  centre_bien_etre: "Centres de bien-être",
  entreprise: "Entreprises partenaires",
};

export function PartnersDirectory({
  type,
  eyebrow,
  title,
  description,
  tone = "default",
}: {
  type?: PartnerType;
  eyebrow?: string;
  title?: string;
  description?: string;
  tone?: "default" | "surface" | "soft";
}) {
  const { data, isPending } = useQuery(partnersQuery(type));
  const partners = data ?? [];

  return (
    <Section tone={tone} id="partenaires">
      <SectionHeading
        eyebrow={eyebrow ?? "Réseau conventionné"}
        title={title ?? (type ? PARTNER_TYPE_LABELS[type] : "Nos partenaires")}
        description={
          description ??
          "Un réseau de structures conventionnées à Kinshasa, administré depuis l'espace de gestion Humanitas."
        }
      />

      {isPending ? null : partners.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Aucun partenaire publié dans cette catégorie pour le moment.
        </p>
      ) : (
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner, index) => {
            const Icon = TYPE_ICONS[partner.type as PartnerType] ?? Building2;
            return (
              <Reveal key={partner.id} delay={index * 0.05} className="h-full">
                <article className="card-hover flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
                  <div className="flex items-center gap-3">
                    {partner.logo_url ? (
                      <img
                        src={partner.logo_url}
                        alt={partner.nom}
                        loading="lazy"
                        className="size-11 rounded-xl object-contain"
                      />
                    ) : (
                      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                        <Icon className="size-5" />
                      </span>
                    )}
                    <div>
                      <h3 className="font-display text-base font-semibold text-foreground">
                        {partner.nom}
                      </h3>
                      {partner.categorie ? (
                        <p className="text-xs text-muted-foreground">{partner.categorie}</p>
                      ) : null}
                    </div>
                  </div>
                  {partner.description ? (
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {partner.description}
                    </p>
                  ) : null}
                  <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
                    {partner.commune || partner.ville ? (
                      <li className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-accent" />
                        {[partner.commune, partner.ville].filter(Boolean).join(", ")}
                      </li>
                    ) : null}
                    {partner.telephone ? (
                      <li className="flex items-center gap-2">
                        <Phone className="size-3.5 text-accent" />
                        {partner.telephone}
                      </li>
                    ) : null}
                    {partner.site_web ? (
                      <li className="flex items-center gap-2">
                        <Globe className="size-3.5 text-accent" />
                        <a
                          href={partner.site_web}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="transition-colors hover:text-primary"
                        >
                          Site web
                        </a>
                      </li>
                    ) : null}
                  </ul>
                  {partner.conventionne ? (
                    <span className="mt-5 inline-flex w-fit rounded-full bg-accent-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
                      Conventionné
                    </span>
                  ) : null}
                </article>
              </Reveal>
            );
          })}
        </div>
      )}
    </Section>
  );
}

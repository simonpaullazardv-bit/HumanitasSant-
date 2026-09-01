import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Building2, HeartPulse } from "lucide-react";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { supabase } from "@/integrations/supabase/client";
import { LOCAL_INSTITUTIONAL_PARTNERS } from "@/data/public-fallbacks";

interface PublicPartner {
  id: string;
  name: string;
  category: string;
  description: string;
  type: string;
  logo?: string | null;
}

function usePublicPartners() {
  return useQuery({
    queryKey: ["public-partners-section"],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase.from("partenaires" as never) as any)
          .select("id, nom, categorie, description, type, logo_url, is_active, is_public")
          .eq("is_active", true)
          .eq("is_public", true)
          .order("ordre", { ascending: true });
        if (error) throw error;
        return (data ?? []).map((row) => ({
          id: row.id,
          name: row.nom,
          category: row.categorie ?? "Partenaire Humanitas",
          description: row.description ?? "Informations publiées par Humanitas.",
          type: row.type,
          logo: row.logo_url,
        })) as PublicPartner[];
      } catch {
        return [];
      }
    },
    staleTime: 30_000,
  });
}

function PartnerCard({ partner, index, kind }: { partner: PublicPartner; index: number; kind: "hospital" | "company" }) {
  const Icon = kind === "hospital" ? HeartPulse : Building2;
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-soft"
    >
      <div className="flex items-center gap-4">
        {partner.logo ? (
          <img src={partner.logo} alt={`Logo ${partner.name}`} loading="lazy" className="size-14 rounded-2xl border border-border/70 object-contain p-1.5" />
        ) : (
          <span className={`inline-flex size-14 items-center justify-center rounded-2xl ${kind === "hospital" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
            <Icon className="size-6" />
          </span>
        )}
        <div>
          <h3 className="font-display text-base font-bold leading-snug text-foreground">{partner.name}</h3>
          <p className="mt-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{partner.category}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{partner.description}</p>
    </motion.article>
  );
}

export function Partners() {
  const { data: partners = [], isPending } = usePublicPartners();
  const hospitals = partners.filter((p) => p.type === "hopital");
  const companies = partners.filter((p) => p.type === "entreprise");

  return (
    <Section tone="surface" id="partenaires">
      <SectionHeading
        eyebrow="Nos partenaires"
        title="Un réseau publié et validé par Humanitas"
        description="Seules les structures explicitement validées pour publication dans Supabase apparaissent sur le site public."
      />

      {isPending ? <p className="mt-10 text-center text-sm text-muted-foreground">Chargement du réseau validé…</p> : null}
      {!isPending && partners.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Les établissements de soins conventionnés seront affichés dès leur validation publique dans Supabase. Les partenaires institutionnels déjà référencés restent visibles ci-dessous.
        </div>
      ) : null}

      {hospitals.length > 0 ? (
        <div className="mt-12">
          <h3 className="font-display text-lg font-bold text-foreground">Établissements hospitaliers partenaires</h3>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hospitals.map((partner, index) => <PartnerCard key={partner.id} partner={partner} index={index} kind="hospital" />)}
          </div>
        </div>
      ) : null}

      {companies.length > 0 ? (
        <div className="mt-14">
          <h3 className="font-display text-lg font-bold text-foreground">Entreprises partenaires</h3>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {companies.map((partner, index) => <PartnerCard key={partner.id} partner={partner} index={index} kind="company" />)}
          </div>
        </div>
      ) : null}

      <div className="mt-14">
        <h3 className="font-display text-lg font-bold text-foreground">Partenaires institutionnels et réseaux associés</h3>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {LOCAL_INSTITUTIONAL_PARTNERS.map((partner, index) => (
            <PartnerCard
              key={partner.id}
              partner={{ ...partner, category: partner.category, type: "institutionnel" }}
              index={index}
              kind="company"
            />
          ))}
        </div>
      </div>
    </Section>
  );
}

import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/Reveal";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { tiersQuery } from "@/lib/cms.queries";
import { cn } from "@/lib/utils";

/**
 * Catégories d'adhésion — les prix, taux de couverture et avantages
 * proviennent prioritairement de `categories_adhesion`, avec repli local versionné
 * lorsque Supabase n'est pas encore alimenté.
 */
export function MembershipTiers({ tone = "surface" }: { tone?: "surface" | "default" }) {
  const { data: tiers, isPending } = useQuery(tiersQuery());

  return (
    <Section tone={tone} id="categories">
      <SectionHeading
        eyebrow="Catégories des adhérents"
        title="Des niveaux de couverture clairs, une seule exigence de qualité"
        description="Choisissez la formule adaptée à votre situation : chaque catégorie ouvre des droits précis, configurés par l'administration Humanitas."
      />

      {isPending ? (
        <div className="mt-14 flex justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : null}

      <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {(tiers ?? []).map((plan, index) => {
          const avantages = Array.isArray(plan.avantages) ? (plan.avantages as unknown[]) : [];
          return (
            <Reveal key={plan.id} delay={index * 0.06} className="h-full">
              <article
                className={cn(
                  "card-hover flex h-full flex-col rounded-3xl border bg-card p-7 shadow-soft",
                  plan.mise_en_avant
                    ? "border-primary/40 ring-1 ring-primary/20"
                    : "border-border/70",
                )}
              >
                {plan.mise_en_avant ? (
                  <span className="mb-4 inline-flex w-fit rounded-full bg-gradient-brand px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
                    Le plus choisi
                  </span>
                ) : null}
                <h3 className="font-display text-xl font-bold text-foreground">{plan.nom}</h3>
                {plan.tagline ? (
                  <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>
                ) : null}
                <p className="mt-5 font-display text-3xl font-bold text-primary">
                  {Number(plan.prix_usd)} $
                  <span className="text-sm font-medium text-muted-foreground">
                    {" "}
                    / {plan.periode}
                  </span>
                </p>
                <p className="mt-2 text-xs font-medium text-accent">
                  {"couverture_label" in plan && plan.couverture_label
                    ? String(plan.couverture_label)
                    : plan.taux_couverture != null
                      ? `Prise en charge ${plan.taux_couverture} %`
                      : "Couverture selon les droits ouverts"}
                  {plan.plafond_usd ? ` · plafond ${Number(plan.plafond_usd)} $` : ""}
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {avantages.map((benefit, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                      {String(benefit)}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={cn("mt-7", plan.mise_en_avant && "bg-gradient-brand")}
                  variant={plan.mise_en_avant ? "default" : "outline"}
                >
                  <Link to="/adhesion">Choisir {plan.nom}</Link>
                </Button>
              </article>
            </Reveal>
          );
        })}
      </div>

      {!isPending && (tiers ?? []).length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Les catégories d'adhésion sont prêtes et seront actualisées automatiquement dès
          publication dans Supabase.
        </p>
      ) : null}
    </Section>
  );
}

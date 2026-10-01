import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/Section";
import { Reveal } from "@/components/shared/Reveal";
import { submitMembershipRequest } from "@/services/contact.service";
import { tiersQuery } from "@/lib/cms.queries";

const title = "Devenir adhérent | Humanitas";
const description =
  "Remplissez votre demande d'adhésion à la mutuelle Humanitas Santé en quelques minutes.";

export const Route = createFileRoute("/adhesion")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: MembershipPage,
});

const schema = z
  .object({
    full_name: z.string().trim().min(2, "Nom trop court").max(100),
    email: z.string().trim().email("Adresse email invalide").max(255).optional().or(z.literal("")),
    phone: z.string().trim().min(6, "Numéro invalide").max(30).optional().or(z.literal("")),
    tier: z.string().trim().min(1, "Catégorie requise").max(80),
  })
  .refine((value) => Boolean(value.email?.trim() || value.phone?.trim()), {
    message: "Indiquez au moins un email ou un numéro de téléphone.",
    path: ["email"],
  });

type MembershipValues = z.infer<typeof schema>;

function MembershipPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MembershipValues>({
    resolver: zodResolver(schema),
    defaultValues: { tier: "", email: "", phone: "" },
  });

  const tiers = useQuery(tiersQuery());

  const onSubmit = async (values: MembershipValues) => {
    try {
      await submitMembershipRequest(values);
      toast.success(
        "Demande d'adhésion enregistrée. Notre équipe vous recontactera après vérification du dossier.",
      );
      reset();
    } catch {
      toast.error("Envoi impossible pour le moment. Merci de réessayer.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Devenir adhérent"
        title="Rejoignez la communauté Humanitas"
        description="Complétez votre demande d'adhésion : un Coordonnateur vérifie votre demande et vous indique les prochaines étapes."
      />

      <Section>
        <Reveal className="mx-auto max-w-3xl">
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Adhésion
              </p>
              <p className="mt-1 font-display text-xl font-extrabold text-foreground">
                Adhésion gratuite
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Aucun frais d'adhésion supplémentaire annoncé à ce stade.
              </p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Carte de membre
              </p>
              <p className="mt-1 font-display text-xl font-extrabold text-foreground">10 USD</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Frais d'émission de la carte de membre, selon les règles publiées par Humanitas.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-3xl border border-border/70 bg-card p-8 shadow-soft sm:p-10"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nom complet</Label>
                <Input id="full_name" placeholder="Votre nom" {...register("full_name")} />
                {errors.full_name ? (
                  <p className="text-xs text-destructive">{errors.full_name.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@email.com"
                  {...register("email")}
                />
                {errors.email ? (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" placeholder="+243 ..." {...register("phone")} />
                {errors.phone ? (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="tier">Catégorie souhaitée</Label>
                <select
                  id="tier"
                  {...register("tier")}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {tiers.data?.map((plan) => (
                    <option key={plan.code} value={plan.code}>
                      {plan.nom} — {Number(plan.prix_usd).toFixed(2)} USD / {plan.periode}
                    </option>
                  ))}
                  {!tiers.isPending && !tiers.data?.length ? (
                    <option value="" disabled>
                      Aucune catégorie publiée
                    </option>
                  ) : null}
                </select>
              </div>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              Votre demande contient uniquement les informations nécessaires au premier contact. Un
              Coordonnateur Humanitas pourra ensuite vous recontacter pour compléter le dossier.
            </p>

            <Button type="submit" disabled={isSubmitting} className="mt-7 w-full bg-gradient-brand">
              <UserPlus className="size-4" />
              {isSubmitting ? "Envoi en cours..." : "Envoyer ma demande"}
            </Button>
          </form>
        </Reveal>
      </Section>
    </>
  );
}

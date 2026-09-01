/**
 * Vérification publique d'une carte à partir du jeton du QR code.
 * Aucune donnée personnelle sensible n'est exposée : uniquement le numéro,
 * l'initiale du titulaire, la catégorie, la validité et l'ouverture des droits.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import { verificationQuery } from "@/modules/cartes/queries";

export const Route = createFileRoute("/verify/$token")({
  head: () => ({
    meta: [
      { title: "Vérification de carte — Humanitas Santé" },
      {
        name: "description",
        content:
          "Vérifiez en un scan la validité d'une carte Humanitas Santé : statut, catégorie et ouverture des droits.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Vérification de carte — Humanitas Santé" },
      {
        property: "og:description",
        content: "Contrôle instantané de la validité d'une carte de membre ou de service.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifyPage,
});

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function VerifyPage() {
  const { token } = Route.useParams();
  const verification = useQuery(verificationQuery(token));
  const data = verification.data as Record<string, unknown> | undefined;
  const valide = Boolean(data?.["valide"]);
  const droits = Boolean(data?.["droits_ouverts"]);

  const fmt = (value: unknown) =>
    value ? new Date(String(value)).toLocaleDateString("fr-FR") : "—";

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="pb-4 text-center text-lg font-semibold">
          Vérification d'une carte Humanitas Santé
        </h1>

        {verification.isLoading && (
          <p className="text-center text-sm text-muted-foreground">Vérification en cours…</p>
        )}

        {!verification.isLoading && (!data || Boolean(data["motif"])) && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <ShieldAlert className="size-10 text-destructive" />
            <p className="font-semibold text-destructive">Carte inconnue ou jeton invalide</p>
            <p className="text-sm text-muted-foreground">
              Ce QR code ne correspond à aucune carte enregistrée.
            </p>
          </div>
        )}

        {data && !data["motif"] && (
          <>
            <div
              className={`mb-4 flex items-center gap-3 rounded-xl p-4 ${
                valide ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
              }`}
            >
              {valide ? <ShieldCheck className="size-8" /> : <ShieldAlert className="size-8" />}
              <div>
                <p className="font-semibold">{valide ? "Carte valide" : "Carte non valide"}</p>
                <p className="text-xs opacity-80">
                  {valide
                    ? "Présentez une pièce d'identité pour confirmer l'identité du porteur."
                    : "Cette carte est expirée, remplacée ou annulée."}
                </p>
              </div>
            </div>

            <div className="space-y-0">
              <Line label="Numéro de carte" value={String(data["numero"] ?? "—")} />
              <Line
                label="Type"
                value={data["type"] === "personnel" ? "Carte de service" : "Carte de membre"}
              />
              <Line label="Titulaire" value={String(data["titulaire"] ?? "—")} />
              <Line
                label={data["type"] === "personnel" ? "Fonction" : "Catégorie"}
                value={String(data["categorie"] ?? "—")}
              />
              <Line label="Émise le" value={fmt(data["date_emission"])} />
              <Line label="Expire le" value={fmt(data["date_expiration"])} />
              <Line label="Statut de la carte" value={String(data["statut_carte"] ?? "—")} />
            </div>

            <div
              className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
                droits ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
              }`}
            >
              <BadgeCheck className="size-4" />
              {droits
                ? "Droits ouverts : prestations accessibles."
                : "Droits non ouverts : cotisations insuffisantes ou statut inactif."}
            </div>
          </>
        )}

        <p className="pt-6 text-center text-xs text-muted-foreground">
          Aucune donnée personnelle n'est encodée dans le QR code.
        </p>
      </div>
    </main>
  );
}

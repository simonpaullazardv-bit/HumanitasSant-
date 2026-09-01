/**
 * « Mon dossier » : l'adhérent connecté consulte uniquement son propre dossier.
 * Les policies RLS garantissent qu'aucun autre dossier n'est accessible.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdherentDossier } from "@/modules/adherents/AdherentDossier";
import { DASHBOARDS } from "@/modules/portail/dashboardConfig";
import { monDossierQuery } from "@/modules/adherents/queries";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/portail/mon-dossier")({
  component: MonDossierPage,
});

function MonDossierPage() {
  const { user } = useAuth();
  const dossier = useQuery(monDossierQuery(user?.id));
  const config = DASHBOARDS["adherent"]!;

  return (
    <DashboardLayout
      title="Mon dossier"
      subtitle="Vos informations, vos bénéficiaires, votre carte et votre historique."
      navItems={config.nav}
    >
      {dossier.isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {!dossier.isLoading && !dossier.data && (
        <p className="text-sm text-muted-foreground">
          Aucun dossier d'adhésion n'est encore rattaché à votre compte. Contactez un agent
          Humanitas pour finaliser votre enrôlement.
        </p>
      )}
      {dossier.data && <AdherentDossier adherentId={dossier.data.id} />}
    </DashboardLayout>
  );
}

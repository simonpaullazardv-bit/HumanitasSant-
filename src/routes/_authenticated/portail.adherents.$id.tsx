import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdherentDossier } from "@/modules/adherents/AdherentDossier";
import { DASHBOARDS } from "@/modules/portail/dashboardConfig";
import { AccessGuard } from "@/modules/portail/AccessGuard";

export const Route = createFileRoute("/_authenticated/portail/adherents/$id")({
  component: DossierPage,
});

function DossierPage() {
  const { id } = Route.useParams();
  const config = DASHBOARDS["coordination"]!;
  return (
    <AccessGuard
      allowed={[
        "super_admin",
        "administrateur",
        "coordonnateur",
        "agent_humanitas",
        "financier",
        "medecin_conseil",
      ]}
    >
      <DashboardLayout
        title="Dossier adhérent"
        subtitle="Fiche complète : identité, bénéficiaires, carte, finances, documents et historique."
        navItems={config.nav}
      >
        <AdherentDossier adherentId={id} />
      </DashboardLayout>
    </AccessGuard>
  );
}

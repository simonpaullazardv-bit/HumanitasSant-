import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdherentsList } from "@/modules/adherents/AdherentsList";
import { DASHBOARDS } from "@/modules/portail/dashboardConfig";
import { AccessGuard } from "@/modules/portail/AccessGuard";

export const Route = createFileRoute("/_authenticated/portail/adherents/")({
  component: AdherentsPage,
});

function AdherentsPage() {
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
        title="Adhérents et bénéficiaires"
        subtitle="Dossiers d'adhésion, ayants droit, statuts et pièces justificatives."
        navItems={config.nav}
      >
        <AdherentsList />
      </DashboardLayout>
    </AccessGuard>
  );
}

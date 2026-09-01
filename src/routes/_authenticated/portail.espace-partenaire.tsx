import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DASHBOARDS } from "@/modules/portail/dashboardConfig";
import { AccessGuard } from "@/modules/portail/AccessGuard";
import { EspacePartenaire } from "@/modules/partenaires/EspacePartenaire";

export const Route = createFileRoute("/_authenticated/portail/espace-partenaire")({
  component: EspacePartenairePage,
});

function EspacePartenairePage() {
  const config = DASHBOARDS["hopital"]!;
  return (
    <AccessGuard allowed={["hopital", "super_admin", "administrateur"]}>
      <DashboardLayout
        title="Espace partenaire"
        subtitle="Vérification des adhérents, prises en charge et facturation."
        navItems={config.nav}
      >
        <EspacePartenaire />
      </DashboardLayout>
    </AccessGuard>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DASHBOARDS } from "@/modules/portail/dashboardConfig";
import { AccessGuard } from "@/modules/portail/AccessGuard";
import { CotisationsBoard } from "@/modules/finance/CotisationsBoard";

export const Route = createFileRoute("/_authenticated/portail/cotisations/")({
  component: CotisationsPage,
});

function CotisationsPage() {
  const config = DASHBOARDS["finance"]!;
  return (
    <AccessGuard
      allowed={["super_admin", "administrateur", "financier", "coordonnateur", "agent_humanitas", "adherent"]}
    >
      <DashboardLayout
        title="Cotisations et paiements"
        subtitle="Appels de cotisation, encaissements, répartition 70/30, échéances et solde des adhérents."
        navItems={config.nav}
      >
        <CotisationsBoard />
      </DashboardLayout>
    </AccessGuard>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DASHBOARDS } from "@/modules/portail/dashboardConfig";
import { RapportsBoard } from "@/modules/rapports/RapportsBoard";

export const Route = createFileRoute("/_authenticated/portail/rapports")({
  component: RapportsRouteComponent,
});

function RapportsRouteComponent() {
  const config = DASHBOARDS.administration;
  return (
    <DashboardLayout
      title="Rapports, Analytics & PDF"
      subtitle="Graphiques de synthèse, taux de couverture, état des cotisations, exports Excel et impression."
      navItems={config.nav}
    >
      <RapportsBoard />
    </DashboardLayout>
  );
}

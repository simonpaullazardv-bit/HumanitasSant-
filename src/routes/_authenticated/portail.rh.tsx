import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DASHBOARDS } from "@/modules/portail/dashboardConfig";
import { RhBoard } from "@/modules/rh/RhBoard";

export const Route = createFileRoute("/_authenticated/portail/rh")({
  component: RhRouteComponent,
});

function RhRouteComponent() {
  const config = DASHBOARDS.administration;
  return (
    <DashboardLayout
      title="Ressources Humaines & Administration"
      subtitle="Gestion des équipes, bulletins de paie, pointage, congés, missions et dépenses administratives."
      navItems={config.nav}
    >
      <RhBoard />
    </DashboardLayout>
  );
}

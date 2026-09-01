import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DASHBOARDS } from "@/modules/portail/dashboardConfig";
import { GedBoard } from "@/modules/ged/GedBoard";

export const Route = createFileRoute("/_authenticated/portail/ged")({
  component: GedRouteComponent,
});

function GedRouteComponent() {
  const config = DASHBOARDS.administration;
  return (
    <DashboardLayout
      title="Gestion Électronique Documentaire"
      subtitle="Stockage chiffré des contrats, pièces d'identité, ordonnances, photos et factures."
      navItems={config.nav}
    >
      <GedBoard />
    </DashboardLayout>
  );
}

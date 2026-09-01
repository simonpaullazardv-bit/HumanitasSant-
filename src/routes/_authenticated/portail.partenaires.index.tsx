import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DASHBOARDS } from "@/modules/portail/dashboardConfig";
import { AccessGuard } from "@/modules/portail/AccessGuard";
import { PartenairesBoard } from "@/modules/partenaires/PartenairesBoard";

export const Route = createFileRoute("/_authenticated/portail/partenaires/")({
  component: PartenairesPage,
});

function PartenairesPage() {
  const config = DASHBOARDS["coordination"]!;
  return (
    <AccessGuard
      allowed={["super_admin", "administrateur", "coordonnateur", "medecin_conseil", "financier"]}
    >
      <DashboardLayout
        title="Réseau de soins et partenaires"
        subtitle="Structures conventionnées, contrats, prises en charge et facturation."
        navItems={config.nav}
      >
        <PartenairesBoard />
      </DashboardLayout>
    </AccessGuard>
  );
}

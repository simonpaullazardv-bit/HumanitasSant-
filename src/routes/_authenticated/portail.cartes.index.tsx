import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DASHBOARDS } from "@/modules/portail/dashboardConfig";
import { AccessGuard } from "@/modules/portail/AccessGuard";
import { CartesBoard } from "@/modules/cartes/CartesBoard";

export const Route = createFileRoute("/_authenticated/portail/cartes/")({
  component: CartesPage,
});

function CartesPage() {
  const config = DASHBOARDS["coordination"]!;
  return (
    <AccessGuard
      allowed={["super_admin", "administrateur", "directeur_general", "coordonnateur", "financier"]}
    >
      <DashboardLayout
        title="Cartes de membre et cartes de service"
        subtitle="Émission, conditions d'impression, QR code sécurisé, réimpression et historiques."
        navItems={config.nav}
      >
        <CartesBoard />
      </DashboardLayout>
    </AccessGuard>
  );
}

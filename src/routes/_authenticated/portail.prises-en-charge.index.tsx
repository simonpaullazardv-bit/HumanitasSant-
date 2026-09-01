import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DASHBOARDS } from "@/modules/portail/dashboardConfig";
import { AccessGuard } from "@/modules/portail/AccessGuard";
import { PriseEnChargeBoard } from "@/modules/priseencharge/PriseEnChargeBoard";

export const Route = createFileRoute("/_authenticated/portail/prises-en-charge/")({
  component: PriseEnChargePage,
});

function PriseEnChargePage() {
  const config = DASHBOARDS["medical"]!;
  return (
    <AccessGuard allowed={["super_admin", "administrateur", "coordonnateur", "medecin_conseil"]}>
      <DashboardLayout
        title="Prises en charge"
        subtitle="Examen médical des demandes, décisions historisées et contrôle des factures."
        navItems={config.nav}
      >
        <PriseEnChargeBoard />
      </DashboardLayout>
    </AccessGuard>
  );
}

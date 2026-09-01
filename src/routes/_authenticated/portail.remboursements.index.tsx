import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DASHBOARDS } from "@/modules/portail/dashboardConfig";
import { AccessGuard } from "@/modules/portail/AccessGuard";
import { RemboursementsBoard } from "@/modules/priseencharge/RemboursementsBoard";

export const Route = createFileRoute("/_authenticated/portail/remboursements/")({
  component: RemboursementsPage,
});

function RemboursementsPage() {
  const config = DASHBOARDS["finance"]!;
  return (
    <AccessGuard allowed={["super_admin", "administrateur", "financier"]}>
      <DashboardLayout
        title="Ordres de remboursement"
        subtitle="Autorisation administrative, décaissement et écritures comptables."
        navItems={config.nav}
      >
        <RemboursementsBoard />
      </DashboardLayout>
    </AccessGuard>
  );
}

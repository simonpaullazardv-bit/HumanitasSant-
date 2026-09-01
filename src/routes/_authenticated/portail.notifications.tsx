import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DASHBOARDS } from "@/modules/portail/dashboardConfig";
import { NotificationsBoard } from "@/modules/notifications/NotificationsBoard";

export const Route = createFileRoute("/_authenticated/portail/notifications")({
  component: NotificationsRouteComponent,
});

function NotificationsRouteComponent() {
  const config = DASHBOARDS.administration;
  return (
    <DashboardLayout
      title="Centre de Notifications"
      subtitle="Rappels d'échéance le 5 du mois, cartes prêtes, alertes de paiement et canal SMS/Email."
      navItems={config.nav}
    >
      <NotificationsBoard />
    </DashboardLayout>
  );
}

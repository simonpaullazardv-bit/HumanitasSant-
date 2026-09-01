import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DASHBOARDS } from "@/modules/portail/dashboardConfig";
import { SecuriteBoard } from "@/modules/securite/SecuriteBoard";

export const Route = createFileRoute("/_authenticated/portail/securite")({
  component: SecuriteRouteComponent,
});

function SecuriteRouteComponent() {
  const config = DASHBOARDS.administration;
  return (
    <DashboardLayout
      title="Sécurité & Journal d'Audit"
      subtitle="Isolation RLS Supabase, sessions actives, IP, tentatives suspectes et audit applicatif."
      navItems={config.nav}
    >
      <SecuriteBoard />
    </DashboardLayout>
  );
}

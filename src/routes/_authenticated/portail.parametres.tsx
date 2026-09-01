import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DASHBOARDS } from "@/modules/portail/dashboardConfig";
import { ParametresBoard } from "@/modules/parametres/ParametresBoard";

export const Route = createFileRoute("/_authenticated/portail/parametres")({
  component: ParametresRouteComponent,
});

function ParametresRouteComponent() {
  const config = DASHBOARDS.administration;
  return (
    <DashboardLayout
      title="Paramètres Système & Devises"
      subtitle="Espace réservé au Super Administrateur : Taux, frais de cartes (10$), règles 70/30, cotisations & sauvegardes."
      navItems={config.nav}
    >
      <ParametresBoard />
    </DashboardLayout>
  );
}

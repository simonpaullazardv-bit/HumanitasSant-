import { createFileRoute, useParams } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DASHBOARDS } from "@/modules/portail/dashboardConfig";
import { AccessGuard } from "@/modules/portail/AccessGuard";
import { PartenaireDossier } from "@/modules/partenaires/PartenaireDossier";

export const Route = createFileRoute("/_authenticated/portail/partenaires/$id")({
  component: PartenaireDossierPage,
});

function PartenaireDossierPage() {
  const { id } = useParams({ from: "/_authenticated/portail/partenaires/$id" });
  const config = DASHBOARDS["coordination"]!;
  return (
    <AccessGuard
      allowed={["super_admin", "administrateur", "coordonnateur", "medecin_conseil", "financier"]}
    >
      <DashboardLayout
        title="Dossier partenaire"
        subtitle="Identité, contrats, documents, activité et historique."
        navItems={config.nav}
      >
        <PartenaireDossier partenaireId={id} />
      </DashboardLayout>
    </AccessGuard>
  );
}

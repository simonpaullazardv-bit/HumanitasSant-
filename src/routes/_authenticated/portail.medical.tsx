import { createFileRoute } from "@tanstack/react-router";
import { RoleDashboard } from "@/modules/portail/RoleDashboard";

export const Route = createFileRoute("/_authenticated/portail/medical")({
  component: () => <RoleDashboard dashboardKey="medical" />,
});

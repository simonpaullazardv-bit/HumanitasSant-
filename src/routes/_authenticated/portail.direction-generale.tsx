import { createFileRoute } from "@tanstack/react-router";
import { DirecteurGeneralDashboard } from "@/modules/portail/DirecteurGeneralDashboard";

export const Route = createFileRoute("/_authenticated/portail/direction-generale")({
  component: DirecteurGeneralDashboard,
});

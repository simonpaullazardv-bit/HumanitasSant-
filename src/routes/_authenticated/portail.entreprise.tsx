import { createFileRoute } from "@tanstack/react-router";
import { AccountDashboard } from "@/modules/portail/AccountDashboard";

export const Route = createFileRoute("/_authenticated/portail/entreprise")({
  component: () => <AccountDashboard kind="entreprise" />,
});

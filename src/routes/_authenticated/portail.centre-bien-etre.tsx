import { createFileRoute } from "@tanstack/react-router";
import { AccountDashboard } from "@/modules/portail/AccountDashboard";

export const Route = createFileRoute("/_authenticated/portail/centre-bien-etre")({
  component: () => <AccountDashboard kind="centre_bien_etre" />,
});

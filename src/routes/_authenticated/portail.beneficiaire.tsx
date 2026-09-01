import { createFileRoute } from "@tanstack/react-router";
import { AccountDashboard } from "@/modules/portail/AccountDashboard";

export const Route = createFileRoute("/_authenticated/portail/beneficiaire")({
  component: () => <AccountDashboard kind="beneficiaire" />,
});

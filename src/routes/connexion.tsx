import { createFileRoute, redirect } from "@tanstack/react-router";

/** Ancienne URL de connexion conservée : redirige vers le portail unifié /auth. */
export const Route = createFileRoute("/connexion")({
  beforeLoad: () => {
    throw redirect({ to: "/auth", search: { redirect: undefined }, replace: true });
  },
});

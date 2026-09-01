import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

/** Aiguille l'utilisateur vers le tableau de bord de son rôle principal. */
export const Route = createFileRoute("/_authenticated/portail/")({
  component: PortailIndex,
});

function PortailIndex() {
  const { isLoading, home } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-muted-foreground">
        Ouverture de votre espace…
      </div>
    );
  }
  return <Navigate to={home} replace />;
}

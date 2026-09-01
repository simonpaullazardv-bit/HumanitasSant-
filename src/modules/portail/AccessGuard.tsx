/**
 * Garde d'accès par rôle pour les écrans du portail.
 * Rappel : l'autorisation réelle est appliquée par les policies RLS en base.
 */
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS } from "@/constants/roles";
import type { UserRole } from "@/types";

export function AccessGuard({
  allowed,
  children,
}: {
  allowed: readonly UserRole[];
  children: ReactNode;
}) {
  const { roles, role, home, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-muted-foreground">
        Chargement de votre espace…
      </div>
    );
  }

  if (!allowed.some((candidate) => roles.includes(candidate))) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
        <ShieldAlert className="size-10 text-destructive" />
        <h1 className="font-display text-2xl font-bold text-foreground">Accès non autorisé</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Votre rôle {role ? `« ${ROLE_LABELS[role]} »` : "actuel"} ne donne pas accès à cet écran.
        </p>
        <Button asChild>
          <Link to={home}>Aller à mon espace</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/partenaires", label: "Tous" },
  { to: "/partenaires/hopitaux", label: "Hôpitaux" },
  { to: "/partenaires/pharmacies", label: "Pharmacies" },
  { to: "/partenaires/laboratoires", label: "Laboratoires" },
  { to: "/partenaires/centres-bien-etre", label: "Bien-être" },
  { to: "/partenaires/entreprises", label: "Entreprises" },
] as const;

export const Route = createFileRoute("/partenaires")({
  component: PartnersLayout,
});

function PartnersLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      <div className="border-b border-border/70 bg-surface">
        <nav
          aria-label="Catégories de partenaires"
          className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-4"
        >
          {TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
                pathname === tab.to
                  ? "bg-gradient-brand text-primary-foreground"
                  : "text-muted-foreground hover:bg-primary-soft hover:text-primary",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
      <Outlet />
    </>
  );
}

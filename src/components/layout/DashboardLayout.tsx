/**
 * Coquille commune à tous les tableaux de bord du portail privé :
 * navigation latérale filtrée par rôle, en-tête utilisateur et zone de contenu.
 */
import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Building2,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS } from "@/constants/roles";
import { IMAGES } from "@/data/site";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface DashboardLayoutProps {
  title: string;
  subtitle: string;
  navItems: NavItem[];
  children: ReactNode;
}

export function DashboardLayout({ title, subtitle, navItems, children }: DashboardLayoutProps) {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  };

  const initials = (profile?.full_name ?? profile?.email ?? "H")
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen w-full bg-surface">
      {/* Navigation latérale */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/80 px-5 py-5">
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-card p-1 shadow-soft transition-all duration-300 group-hover:scale-105 group-hover:border-primary/40 group-hover:shadow-glow-primary">
              <img src={IMAGES.logo} alt="Humanitas" className="h-full w-full object-contain" />
            </div>
            <span className="font-display text-sm font-bold leading-tight group-hover:text-primary transition-colors">
              HUMANITAS
              <span className="block text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Santé & bien-être
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-muted-foreground lg:hidden hover:text-foreground"
            aria-label="Fermer le menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-5">
          {navItems.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-gradient-brand text-white shadow-3d-soft font-semibold translate-x-1"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:translate-x-0.5",
                )}
              >
                <item.icon
                  className={cn("size-4", active ? "text-white" : "text-muted-foreground")}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Home className="size-4" />
            Retour au site
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Zone principale */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-card/90 px-5 py-4 backdrop-blur">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-muted-foreground lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
              Portail <ChevronRight className="size-3" /> {role ? ROLE_LABELS[role] : "Utilisateur"}
            </p>
            <h1 className="truncate font-display text-lg font-bold text-foreground">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-semibold text-foreground">
                {profile?.full_name ?? "Utilisateur"}
              </span>
              <span className="block text-xs text-muted-foreground">{profile?.email}</span>
            </span>
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
              {initials}
            </span>
          </div>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 px-5 py-6 sm:px-8"
        >
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          {children}
        </motion.main>

        <footer className="border-t border-border px-5 py-4 text-xs text-muted-foreground sm:px-8">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-accent" />
            Accès journalisé — Humanitas et Centre de Bien-être
          </span>
        </footer>
      </div>
    </div>
  );
}

/** Carte d'indicateur réutilisable dans les tableaux de bord. */
export function KpiCard({
  label,
  value,
  hint,
  icon: Icon = Building2,
  delay = 0,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="card-3d rounded-2xl border border-border/80 bg-card p-5.5 shadow-3d-soft"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <span className="inline-flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-soft">
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold tabular-nums text-foreground">{value}</p>
      {hint && <p className="mt-1.5 text-xs font-medium text-muted-foreground">{hint}</p>}
    </motion.div>
  );
}

/** Bloc « module à venir » pour les sections en cours de déploiement. */
export function ModulePlaceholder({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6">
      <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
      <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-accent" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export { Button };

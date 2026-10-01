/**
 * Tableaux de bord opérationnels pour les rôles internes Humanitas.
 * L'autorisation finale reste dans PostgreSQL/RLS ; cette couche sert à présenter
 * les indicateurs réellement disponibles et les raccourcis métier.
 */
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Banknote,
  Bell,
  Building2,
  ClipboardCheck,
  CreditCard,
  FileText,
  FolderOpen,
  HeartPulse,
  Hospital,
  ShieldAlert,
  Users,
  Wallet,
} from "lucide-react";
import { DashboardLayout, KpiCard } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS } from "@/constants/roles";
import { DASHBOARDS } from "./dashboardConfig";
import { MembershipRequestsInbox } from "@/modules/adhesions/MembershipRequestsInbox";
import { supabase } from "@/integrations/supabase/client";
import { GratificationsBoard } from "@/modules/gratifications/GratificationsBoard";

const ICONS = [Users, Banknote, CreditCard, HeartPulse, Hospital, FolderOpen, Bell, FileText];

function useRealtimeStaff() {
  const client = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("staff-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "adherents" },
        () => void client.invalidateQueries({ queryKey: ["staff-dashboard"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cotisations" },
        () => void client.invalidateQueries({ queryKey: ["staff-dashboard"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prises_en_charge" },
        () => void client.invalidateQueries({ queryKey: ["staff-dashboard"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "factures_partenaires" },
        () => void client.invalidateQueries({ queryKey: ["staff-dashboard"] }),
      );
    void channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [client]);
}

function useRoleKpis(dashboardKey: keyof typeof DASHBOARDS, enabled: boolean) {
  return useQuery({
    queryKey: ["staff-dashboard", dashboardKey],
    enabled,
    queryFn: async () => {
      const count = async (table: string, filter?: { column: string; value: string }) => {
        const q = supabase.from(table as never).select("id", { count: "exact", head: true }) as any;
        if (filter) q.eq(filter.column, filter.value);
        const result = await q;
        if (result.error) throw result.error;
        return result.count ?? 0;
      };
      const totalAdherents = await count("adherents");
      switch (dashboardKey) {
        case "administration":
          return {
            items: [
              ["Adhérents", totalAdherents, "Dossiers suivis", Users],
              ["Partenaires", await count("partenaires"), "Réseau conventionné", Hospital],
              ["Prises en charge", await count("prises_en_charge"), "Toutes demandes", HeartPulse],
              ["Alertes", await count("alertes_financieres"), "Suivi financier", Bell],
            ],
          };
        case "coordination":
          return {
            items: [
              ["Adhérents", totalAdherents, "Dossiers", Users],
              [
                "En attente",
                await count("adherents", { column: "statut", value: "en_attente" }),
                "À traiter",
                ClipboardCheck,
              ],
              ["Bénéficiaires", await count("beneficiaires"), "Familles couvertes", Users],
              ["Cartes", await count("cartes_membre"), "Émises / historiques", CreditCard],
            ],
          };
        case "medical":
          return {
            items: [
              ["Demandes", await count("prises_en_charge"), "File de prise en charge", HeartPulse],
              [
                "À revoir",
                await count("prises_en_charge", { column: "statut", value: "en_revue" }),
                "Avis médical",
                ClipboardCheck,
              ],
              [
                "Approuvées",
                await count("prises_en_charge", { column: "statut", value: "approuvee" }),
                "Décisions positives",
                ShieldAlert,
              ],
              ["Prestations", await count("pec_prestations"), "Actes déclarés", Activity],
            ],
          };
        case "finance":
          return {
            items: [
              ["Cotisations", await count("cotisations"), "Échéances enregistrées", Banknote],
              [
                "Impayés",
                await count("cotisations", { column: "statut", value: "en_retard" }),
                "À recouvrer",
                Wallet,
              ],
              ["Factures", await count("factures_partenaires"), "Facturation réseau", FileText],
              ["Ordres", await count("ordres_remboursement"), "Remboursements", Banknote],
            ],
          };
        case "agent":
          return {
            items: [
              ["Portefeuille", totalAdherents, "Adhérents suivis", Users],
              [
                "En attente",
                await count("adherents", { column: "statut", value: "en_attente" }),
                "Dossiers à finaliser",
                ClipboardCheck,
              ],
              ["Bénéficiaires", await count("beneficiaires"), "Familles", Users],
              ["Cartes", await count("cartes_membre"), "Production cartes", CreditCard],
            ],
          };
        default:
          return {
            items: [
              ["Adhérents", totalAdherents, "Dossiers", Users],
              ["Partenaires", await count("partenaires"), "Structures", Building2],
              ["Prises en charge", await count("prises_en_charge"), "Demandes", HeartPulse],
              ["Factures", await count("factures_partenaires"), "Réseau", FileText],
            ],
          };
      }
    },
    staleTime: 15_000,
  });
}

export function RoleDashboard({ dashboardKey }: { dashboardKey: keyof typeof DASHBOARDS }) {
  const config = DASHBOARDS[dashboardKey]!;
  const { roles, role, home, isLoading, isStaff } = useAuth();
  const allowed = config.allowed.some((candidate) => roles.includes(candidate));
  const kpis = useRoleKpis(dashboardKey, allowed && isStaff);
  useRealtimeStaff();

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-muted-foreground">
        Chargement de votre espace…
      </div>
    );
  if (!allowed)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
        <ShieldAlert className="size-10 text-destructive" />
        <h1 className="font-display text-2xl font-bold text-foreground">Accès non autorisé</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Votre rôle {role ? `« ${ROLE_LABELS[role]} »` : "actuel"} ne permet pas d'ouvrir cet
          espace.
        </p>
        <Button asChild>
          <Link to={home}>Aller à mon espace</Link>
        </Button>
      </div>
    );

  return (
    <DashboardLayout title={config.title} subtitle={config.subtitle} navItems={config.nav}>
      {isStaff ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(kpis.data?.items ?? []).map(([label, value, hint, Icon], index) => (
            <KpiCard
              key={String(label)}
              label={String(label)}
              value={value as number | string}
              hint={String(hint)}
              icon={Icon as typeof Users}
              delay={index * 0.05}
            />
          ))}
        </div>
      ) : null}

      {isStaff &&
      ["administration", "coordination", "medical", "finance", "agent"].includes(dashboardKey) ? (
        <MembershipRequestsInbox />
      ) : null}
      {dashboardKey === "coordination" ? <GratificationsBoard compact /> : null}

      <section className="mt-6 rounded-2xl border border-border/80 bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold">Périmètre métier</h2>
            <p className="text-sm text-muted-foreground">
              Fonctions prévues pour ce rôle dans la version Supabase directe.
            </p>
          </div>
          <Badge variant="secondary">RLS actif</Badge>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {config.modules.map((item) => (
            <li key={item} className="rounded-xl bg-surface p-3 text-sm text-muted-foreground">
              <span className="mr-2 text-primary">•</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-border/80 bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold">Centre opérationnel</h2>
            <p className="text-sm text-muted-foreground">
              Accès direct aux modules du rôle, avec données filtrées par RLS.
            </p>
          </div>
          <Badge variant="secondary">Temps réel</Badge>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {config.nav
            .filter((item) => item.label !== "Tableau de bord")
            .map((item, index) => {
              const Icon = ICONS[index % ICONS.length];
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group rounded-xl border border-border/70 bg-surface p-4 transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Ouvrir le module et travailler sur les dossiers autorisés.
                  </p>
                </Link>
              );
            })}
        </div>
      </section>
    </DashboardLayout>
  );
}

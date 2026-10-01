/**
 * Direction Générale — vue stratégique distincte de l'administration technique.
 *
 * Règle produit : aucun chiffre n'est inventé côté interface. Chaque KPI est
 * lu depuis une table Supabase réelle. En cas d'erreur de lecture, l'interface
 * affiche « Indisponible » plutôt que de transformer une erreur en zéro.
 */
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Banknote,
  BarChart3,
  Building2,
  ClipboardCheck,
  FileText,
  HeartPulse,
  Hospital,
  ShieldCheck,
  Users,
} from "lucide-react";
import { DashboardLayout, KpiCard } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS } from "@/constants/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DASHBOARDS } from "./dashboardConfig";
import { MembershipRequestsInbox } from "@/modules/adhesions/MembershipRequestsInbox";
import { GratificationsBoard } from "@/modules/gratifications/GratificationsBoard";

const config = DASHBOARDS.direction_generale;

async function exactCount(table: string, filter?: { column: string; value: string }) {
  const query = supabase.from(table as never).select("id", { count: "exact", head: true }) as any;
  if (filter) query.eq(filter.column, filter.value);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

function useDirectionGeneraleData(enabled: boolean) {
  return useQuery({
    queryKey: ["direction-generale-dashboard"],
    enabled,
    queryFn: async () => {
      const [
        adherents,
        beneficiaires,
        partenaires,
        prises,
        remboursements,
        cotisations,
        factures,
        audit,
      ] = await Promise.all([
        exactCount("adherents"),
        exactCount("beneficiaires"),
        exactCount("partenaires"),
        exactCount("prises_en_charge"),
        exactCount("ordres_remboursement"),
        exactCount("cotisations"),
        exactCount("factures_partenaires"),
        exactCount("audit_logs"),
      ]);

      return {
        adherents,
        beneficiaires,
        partenaires,
        prises,
        remboursements,
        cotisations,
        factures,
        audit,
      };
    },
    staleTime: 15_000,
  });
}

function useDirectionGeneraleRealtime(enabled: boolean) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const tables = [
      "adherents",
      "beneficiaires",
      "partenaires",
      "prises_en_charge",
      "ordres_remboursement",
      "cotisations",
      "factures_partenaires",
      "audit_logs",
      "operations_financieres",
      "membership_requests",
    ];
    const channel = supabase.channel("direction-generale-dashboard");
    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => void queryClient.invalidateQueries({ queryKey: ["direction-generale-dashboard"] }),
      );
    }
    void channel.subscribe();
    return () => void supabase.removeChannel(channel);
  }, [enabled, queryClient]);
}

function FluxFinancierDG() {
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const query = useQuery({
    queryKey: ["dg-flux-financier", dateDebut, dateFin],
    queryFn: async () => {
      const [summary, rows] = await Promise.all([
        supabase.rpc(
          "dg_synthese_financiere" as never,
          { _date_debut: dateDebut || null, _date_fin: dateFin || null } as never,
        ) as any,
        supabase.rpc(
          "dg_flux_financier" as never,
          { _date_debut: dateDebut || null, _date_fin: dateFin || null } as never,
        ) as any,
      ]);
      if (summary.error) throw summary.error;
      if (rows.error) throw rows.error;
      return {
        summary: summary.data as {
          entrees_usd: number;
          sorties_usd: number;
          solde_usd: number;
          operations: number;
        },
        rows: rows.data as Array<{
          id: string;
          date_operation: string;
          sens: string;
          type_operation: string;
          montant_usd: number;
          devise: string;
          libelle: string | null;
        }>,
      };
    },
    staleTime: 15_000,
  });
  const summary = query.data?.summary;
  return (
    <section className="mt-6 rounded-2xl border border-border/80 bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold">Flux financier global</h2>
          <p className="text-sm text-muted-foreground">
            Lecture seule du grand livre immuable, avec période filtrable. Les montants viennent de
            Supabase.
          </p>
        </div>
        <Badge variant="secondary">DG · lecture</Badge>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium">
          Du
          <Input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="mt-1"
          />
        </label>
        <label className="text-xs font-medium">
          Au
          <Input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="mt-1"
          />
        </label>
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={() => {
              setDateDebut("");
              setDateFin("");
            }}
          >
            Réinitialiser
          </Button>
        </div>
      </div>
      {query.isPending ? (
        <p className="mt-5 text-sm text-muted-foreground">Chargement du flux financier…</p>
      ) : null}
      {query.isError ? (
        <p className="mt-5 text-sm text-destructive">Flux financier indisponible.</p>
      ) : null}
      {summary ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Entrées"
            value={`${Number(summary.entrees_usd).toLocaleString("fr-FR")} USD`}
            hint="Crédits du grand livre"
            icon={Banknote}
          />
          <KpiCard
            label="Sorties"
            value={`${Number(summary.sorties_usd).toLocaleString("fr-FR")} USD`}
            hint="Débits du grand livre"
            icon={Banknote}
          />
          <KpiCard
            label="Solde"
            value={`${Number(summary.solde_usd).toLocaleString("fr-FR")} USD`}
            hint="Entrées moins sorties"
            icon={BarChart3}
          />
          <KpiCard
            label="Opérations"
            value={Number(summary.operations)}
            hint="Mouvements enregistrés"
            icon={Activity}
          />
        </div>
      ) : null}
      {query.data?.rows?.length ? (
        <div className="mt-5 overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Sens</th>
                <th className="px-3 py-2 text-right">Montant</th>
                <th className="px-3 py-2 text-left">Libellé</th>
              </tr>
            </thead>
            <tbody>
              {query.data.rows.slice(0, 100).map((row) => (
                <tr key={row.id} className="border-t border-border/60">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(row.date_operation).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-3 py-2">{row.type_operation}</td>
                  <td className="px-3 py-2">{row.sens}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {Number(row.montant_usd).toLocaleString("fr-FR")} {row.devise}
                  </td>
                  <td className="px-3 py-2">{row.libelle || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

export function DirecteurGeneralDashboard() {
  const { roles, role, home, isLoading } = useAuth();
  const allowed = roles.includes("directeur_general");
  const query = useDirectionGeneraleData(allowed);
  useDirectionGeneraleRealtime(allowed);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-muted-foreground">
        Chargement de la Direction Générale…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
        <ShieldCheck className="size-10 text-destructive" />
        <h1 className="font-display text-2xl font-bold">Accès non autorisé</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Votre rôle {role ? `« ${ROLE_LABELS[role]} »` : "actuel"} n'ouvre pas l'espace de
          Direction Générale.
        </p>
        <Button asChild>
          <Link to={home}>Aller à mon espace</Link>
        </Button>
      </div>
    );
  }

  const d = query.data;
  const unavailable = query.isError;
  const value = (v: number | undefined) => (unavailable || v === undefined ? "Indisponible" : v);

  return (
    <DashboardLayout title={config.title} subtitle={config.subtitle} navItems={config.nav}>
      <section className="mb-6 rounded-2xl border border-primary/15 bg-primary/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Gouvernance
            </p>
            <h2 className="mt-1 font-display text-xl font-bold">
              Tableau de pilotage du Directeur Général
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Les indicateurs ci-dessous sont des comptages issus des données opérationnelles
              Supabase. Aucun chiffre fictif n'est affiché.
            </p>
          </div>
          <Badge variant="secondary">Temps réel · RLS</Badge>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Adhérents"
          value={value(d?.adherents)}
          hint="Dossiers enregistrés"
          icon={Users}
        />
        <KpiCard
          label="Bénéficiaires"
          value={value(d?.beneficiaires)}
          hint="Personnes rattachées"
          icon={Users}
          delay={0.05}
        />
        <KpiCard
          label="Partenaires"
          value={value(d?.partenaires)}
          hint="Structures référencées"
          icon={Hospital}
          delay={0.1}
        />
        <KpiCard
          label="Prises en charge"
          value={value(d?.prises)}
          hint="Demandes enregistrées"
          icon={HeartPulse}
          delay={0.15}
        />
        <KpiCard
          label="Cotisations"
          value={value(d?.cotisations)}
          hint="Échéances enregistrées"
          icon={Banknote}
          delay={0.2}
        />
        <KpiCard
          label="Factures partenaires"
          value={value(d?.factures)}
          hint="Documents de facturation"
          icon={FileText}
          delay={0.25}
        />
        <KpiCard
          label="Ordres de remboursement"
          value={value(d?.remboursements)}
          hint="Ordres enregistrés"
          icon={ClipboardCheck}
          delay={0.3}
        />
        <KpiCard
          label="Journal d'audit"
          value={value(d?.audit)}
          hint="Événements journalisés"
          icon={Activity}
          delay={0.35}
        />
      </div>

      <section className="mt-6 rounded-2xl border border-border/80 bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold">Périmètre de décision</h2>
            <p className="text-sm text-muted-foreground">
              Accès orientés stratégie et supervision ; l'administration technique reste séparée.
            </p>
          </div>
          <Building2 className="size-5 text-primary" />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {config.nav
            .filter((item) => item.label !== "Tableau de bord")
            .map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-xl border border-border/70 bg-surface p-4 transition hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="size-4 text-primary" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Ouvrir la vue avec les autorisations RLS applicables.
                </p>
              </Link>
            ))}
        </div>
      </section>

      <FluxFinancierDG />

      <GratificationsBoard />

      <MembershipRequestsInbox />

      <section className="mt-6 rounded-2xl border border-border/80 bg-card p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <BarChart3 className="size-5 text-primary" />
          <div>
            <h2 className="font-display text-base font-bold">Règle de publication</h2>
            <p className="text-sm text-muted-foreground">
              Les chiffres destinés au site public doivent provenir d'un contenu institutionnel
              validé ; les KPI internes ne sont jamais publiés automatiquement.
            </p>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

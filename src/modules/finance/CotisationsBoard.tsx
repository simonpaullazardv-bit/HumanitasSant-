/**
 * Tableau de bord Cotisations & Paiements.
 * Tous les montants, taux, répartitions et règles affichés proviennent de la base
 * (catégories, modes de paiement, paramètres finance) : rien n'est codé en dur.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Plus,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { adherentsQuery } from "@/modules/adherents/queries";
import { formatDate, fullName } from "@/modules/adherents/constants";
import { CotisationDialog } from "./CotisationDialog";
import { PaiementDialog } from "./PaiementDialog";
import {
  AFFECTATION_LABELS,
  STATUTS_COTISATION,
  STATUT_COTISATION_BADGE,
  STATUT_COTISATION_LABELS,
  STATUT_PAIEMENT_BADGE,
  STATUT_PAIEMENT_LABELS,
  TYPE_OPERATION_LABELS,
  formatMontant,
  formatPeriode,
  periodesDisponibles,
  type StatutCotisation,
} from "./constants";
import {
  alertesQuery,
  balanceComptableQuery,
  categoriesFinanceQuery,
  cotisationsQuery,
  grandLivreQuery,
  journalCaisseQuery,
  modesPaiementQuery,
  operationsQuery,
  paiementsQuery,
  parametresFinanceQuery,
  useTraiterRetards,
  type CotisationRow,
} from "./queries";

export function CotisationsBoard() {
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["super_admin", "administrateur", "financier"]);

  const [statut, setStatut] = useState<StatutCotisation | "tous">("tous");
  const [periode, setPeriode] = useState<string>("toutes");
  const [cotisationDialog, setCotisationDialog] = useState(false);
  const [paiementCible, setPaiementCible] = useState<CotisationRow | undefined>();
  const [paiementDialog, setPaiementDialog] = useState(false);

  const filters = useMemo(() => ({ statut, periode }), [statut, periode]);
  const cotisations = useQuery(cotisationsQuery(filters));
  const paiements = useQuery(paiementsQuery());
  const operations = useQuery(operationsQuery());
  const alertes = useQuery(alertesQuery());
  const journalCaisse = useQuery(journalCaisseQuery());
  const grandLivre = useQuery(grandLivreQuery());
  const balanceComptable = useQuery(balanceComptableQuery());
  const categories = useQuery(categoriesFinanceQuery());
  const modes = useQuery(modesPaiementQuery());
  const parametres = useQuery(parametresFinanceQuery());
  const adherents = useQuery(adherentsQuery({}));
  const retards = useTraiterRetards();

  const devise = parametres.data?.devise ?? "USD";
  const nomAdherent = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of adherents.data ?? []) map.set(row.id, `${row.matricule} — ${fullName(row)}`);
    return map;
  }, [adherents.data]);

  const totalEncaisse = (paiements.data ?? [])
    .filter((row) => row.statut === "valide")
    .reduce((sum, row) => sum + Number(row.montant_usd), 0);
  const totalMutuelle = (operations.data ?? [])
    .filter((row) => row.affectation === "fonds_mutuelle")
    .reduce((sum, row) => sum + Number(row.montant_usd), 0);
  const totalAdmin = (operations.data ?? [])
    .filter((row) => row.affectation === "administration")
    .reduce((sum, row) => sum + Number(row.montant_usd), 0);
  const impayes = (cotisations.data ?? []).filter(
    (row) => row.statut === "due" || row.statut === "en_retard" || row.statut === "partielle",
  ).length;

  async function lancerRetards() {
    try {
      const count = await retards.mutateAsync();
      toast.success(
        count === 0
          ? "Aucune échéance dépassée à traiter."
          : `${count} cotisation(s) passée(s) en retard, alertes et historique créés.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Traitement impossible.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Banknote}
          label="Encaissements validés"
          value={formatMontant(totalEncaisse, devise)}
        />
        <StatCard
          icon={ShieldCheck}
          label={`Fonds Mutuelle (${parametres.data?.repartitionCotisation.fonds_mutuelle ?? 70} %)`}
          value={formatMontant(totalMutuelle, devise)}
        />
        <StatCard
          icon={Wallet}
          label={`Administration (${parametres.data?.repartitionCotisation.administration ?? 30} %)`}
          value={formatMontant(totalAdmin, devise)}
        />
        <StatCard icon={AlertTriangle} label="Cotisations non soldées" value={String(impayes)} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Échéance au {parametres.data?.jourEcheance ?? 5} du mois · droits ouverts après{" "}
          {parametres.data?.mensualitesCarence ?? 3} mensualités validées (contrôle serveur).
        </p>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={lancerRetards} disabled={retards.isPending}>
              <RefreshCw className={cn("size-4", retards.isPending && "animate-spin")} /> Traiter
              les retards
            </Button>
            <Button variant="outline" onClick={() => setCotisationDialog(true)}>
              <Plus className="size-4" /> Appel de cotisation
            </Button>
            <Button
              onClick={() => {
                setPaiementCible(undefined);
                setPaiementDialog(true);
              }}
            >
              <Plus className="size-4" /> Paiement
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="cotisations">
        <TabsList className="flex-wrap">
          <TabsTrigger value="cotisations">Cotisations</TabsTrigger>
          <TabsTrigger value="paiements">Paiements</TabsTrigger>
          <TabsTrigger value="journal_caisse">Journal de Caisse</TabsTrigger>
          <TabsTrigger value="grand_livre">Grand Livre</TabsTrigger>
          <TabsTrigger value="balance_comptable">Balance Comptable</TabsTrigger>
          <TabsTrigger value="repartition">Répartition (70/30)</TabsTrigger>
          <TabsTrigger value="alertes">Alertes ({alertes.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="categories">Catégories & Tarifs</TabsTrigger>
        </TabsList>

        <TabsContent value="cotisations" className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              value={statut}
              onValueChange={(value) => setStatut(value as StatutCotisation | "tous")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                {STATUTS_COTISATION.map((value) => (
                  <SelectItem key={value} value={value}>
                    {STATUT_COTISATION_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={periode} onValueChange={setPeriode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les périodes</SelectItem>
                {periodesDisponibles().map((value) => (
                  <SelectItem key={value} value={value}>
                    {formatPeriode(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adhérent</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead className="hidden md:table-cell">Échéance</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead className="hidden md:table-cell">Réglé</TableHead>
                  <TableHead>Statut</TableHead>
                  {canManage && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(cotisations.data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-[220px] truncate">
                      {nomAdherent.get(row.adherent_id) ?? row.adherent_id}
                    </TableCell>
                    <TableCell className="capitalize">{formatPeriode(row.periode)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDate(row.echeance)}
                    </TableCell>
                    <TableCell>{formatMontant(row.montant_usd, row.devise)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatMontant(row.montant_paye, row.devise)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-medium",
                          STATUT_COTISATION_BADGE[row.statut],
                        )}
                      >
                        {STATUT_COTISATION_LABELS[row.statut]}
                      </span>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        {row.statut !== "payee" && row.statut !== "annulee" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPaiementCible(row);
                              setPaiementDialog(true);
                            }}
                          >
                            Encaisser
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {(cotisations.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Aucune cotisation pour ce filtre.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="paiements">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Adhérent</TableHead>
                  <TableHead className="hidden md:table-cell">Période</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead className="hidden md:table-cell">Mode</TableHead>
                  <TableHead className="hidden lg:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(paiements.data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.reference}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {nomAdherent.get(row.adherent_id) ?? row.adherent_id}
                    </TableCell>
                    <TableCell className="hidden capitalize md:table-cell">
                      {formatPeriode(row.periode)}
                    </TableCell>
                    <TableCell>{formatMontant(row.montant_usd, row.devise)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {modes.data?.find((mode) => mode.code === row.mode)?.libelle ?? row.mode}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {TYPE_OPERATION_LABELS[row.type_operation] ?? row.type_operation}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatDate(row.date_paiement)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-medium",
                          STATUT_PAIEMENT_BADGE[row.statut],
                        )}
                      >
                        {STATUT_PAIEMENT_LABELS[row.statut]}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {(paiements.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Aucun paiement enregistré.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="journal_caisse" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Journal de Caisse : Registre exhaustif de tous les flux d'entrées et sorties (Mobile
            Money, Banque, Caisse Agence) avec éclatements automatiques. Aucune suppression physique
            n'est permise.
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>N° Pièce</TableHead>
                  <TableHead>Tiers</TableHead>
                  <TableHead>Opération</TableHead>
                  <TableHead>Mode / Réf.</TableHead>
                  <TableHead className="text-right">Montant Total</TableHead>
                  <TableHead className="text-right">Mutuelle (70%)</TableHead>
                  <TableHead className="text-right">Admin (30%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(journalCaisse.data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs">{formatDate(row.date_operation)}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold">
                      {row.numero_piece}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">{row.tiers_nom}</TableCell>
                    <TableCell className="capitalize">
                      {row.type_operation.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-semibold uppercase">{row.mode_paiement}</span> (
                      {row.reference_transaction})
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatMontant(row.montant_usd, "USD")}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">
                      {formatMontant(row.montant_soins_usd, "USD")}
                    </TableCell>
                    <TableCell className="text-right text-blue-600 font-medium">
                      {formatMontant(row.montant_admin_usd, "USD")}
                    </TableCell>
                  </TableRow>
                ))}
                {(journalCaisse.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Aucun mouvement de caisse enregistré.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="grand_livre" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Grand Livre : Vue comptable détaillée avec débit/crédit et immutabilité totale du
            registre.
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead>Affectation</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Débit</TableHead>
                  <TableHead className="text-right">Crédit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(grandLivre.data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs">{formatDate(row.date_écriture)}</TableCell>
                    <TableCell className="font-mono text-xs font-bold">{row.compte_code}</TableCell>
                    <TableCell className="capitalize">
                      {row.compte_libelle.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate text-xs">
                      {row.libelle ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-rose-600">
                      {row.debit_usd > 0 ? formatMontant(row.debit_usd, "USD") : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-emerald-600 font-bold">
                      {row.credit_usd > 0 ? formatMontant(row.credit_usd, "USD") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {(grandLivre.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Aucune écriture enregistrée dans le Grand Livre.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="balance_comptable" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Balance Comptable : Synthèse périodique cumulée des débits, crédits et soldes par
            affectation financière.
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affectation / Compte</TableHead>
                  <TableHead className="text-center">Nb Écritures</TableHead>
                  <TableHead className="text-right">Total Débit</TableHead>
                  <TableHead className="text-right">Total Crédit</TableHead>
                  <TableHead className="text-right">Solde Net</TableHead>
                  <TableHead className="text-right">Soins (70%)</TableHead>
                  <TableHead className="text-right">Admin (30%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(balanceComptable.data ?? []).map((row) => (
                  <TableRow key={row.compte}>
                    <TableCell className="font-bold capitalize">
                      {row.compte.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-center font-mono">{row.nombre_écritures}</TableCell>
                    <TableCell className="text-right font-mono text-rose-600">
                      {formatMontant(row.total_debit_usd, "USD")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-emerald-600">
                      {formatMontant(row.total_credit_usd, "USD")}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatMontant(row.solde_net_usd, "USD")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-emerald-600">
                      {formatMontant(row.sous_total_fonds_soins_usd, "USD")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-blue-600">
                      {formatMontant(row.sous_total_frais_admin_usd, "USD")}
                    </TableCell>
                  </TableRow>
                ))}
                {(balanceComptable.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Balance comptable vierge.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="repartition" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Grand livre immuable : chaque opération est conservée, aucune écriture passée ne peut
            être modifiée ou supprimée.
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="hidden md:table-cell">Adhérent</TableHead>
                  <TableHead>Affectation</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(operations.data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.created_at)}</TableCell>
                    <TableCell className="max-w-[260px] truncate">{row.libelle ?? "—"}</TableCell>
                    <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                      {row.adherent_id ? (nomAdherent.get(row.adherent_id) ?? "—") : "—"}
                    </TableCell>
                    <TableCell>{AFFECTATION_LABELS[row.affectation]}</TableCell>
                    <TableCell className="text-right">
                      {formatMontant(row.montant_usd, row.devise)}
                    </TableCell>
                  </TableRow>
                ))}
                {(operations.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Aucune opération enregistrée.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="alertes" className="space-y-3">
          {(alertes.data ?? []).length === 0 && (
            <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Aucune alerte active.
            </p>
          )}
          {(alertes.data ?? []).map((row) => (
            <div
              key={row.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
            >
              <AlertTriangle
                className={cn(
                  "mt-0.5 size-4",
                  row.niveau === "critique" ? "text-destructive" : "text-primary",
                )}
              />
              <div>
                <p className="text-sm font-medium">
                  {nomAdherent.get(row.adherent_id) ?? row.adherent_id}
                </p>
                <p className="text-sm text-muted-foreground">{row.message}</p>
                <p className="text-xs text-muted-foreground">{formatDate(row.created_at)}</p>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="categories" className="grid gap-3 md:grid-cols-2">
          {(categories.data ?? []).map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">{item.nom}</h3>
                <span className="text-sm font-semibold text-primary">
                  {formatMontant(item.prix_usd, item.devise)}/{item.periode}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Couverture {item.taux_couverture} % · plafond{" "}
                {item.plafond_usd ? formatMontant(item.plafond_usd, item.devise) : "non défini"}
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {(item.prestations_autorisees ?? []).map((prestation) => (
                  <li key={prestation} className="flex items-center gap-2">
                    <BadgeCheck className="size-4 text-accent" />
                    <span className="capitalize">{prestation.replace(/_/g, " ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs text-muted-foreground md:col-span-2">
            Ces valeurs sont stockées en base et modifiables sans redéploiement.
          </p>
        </TabsContent>
      </Tabs>

      <CotisationDialog open={cotisationDialog} onOpenChange={setCotisationDialog} />
      <PaiementDialog
        key={paiementCible?.id ?? "nouveau"}
        open={paiementDialog}
        onOpenChange={setPaiementDialog}
        cotisation={paiementCible}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" /> {label}
      </div>
      <p className="mt-2 font-display text-xl font-bold">{value}</p>
    </div>
  );
}

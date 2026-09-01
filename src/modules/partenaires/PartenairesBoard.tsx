/**
 * Tableau de bord staff du réseau de partenaires :
 * fiches, contrats, prises en charge et factures.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Building2, FileSignature, Plus, ReceiptText, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { PartenaireDialog } from "./PartenaireDialog";
import {
  PARTENAIRE_TYPES,
  STATUTS_PARTENAIRE,
  contratsQuery,
  facturesQuery,
  partenairesAdminQuery,
  pecQuery,
  useDeciderPriseEnCharge,
  useTraiterFacture,
  type PartenaireRow,
  type PartenaireType,
  type StatutPartenaire,
} from "./queries";

const TYPE_LABEL = Object.fromEntries(PARTENAIRE_TYPES.map((t) => [t.value, t.label]));

function Kpi({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Building2;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-4 text-primary" /> {label}
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

export function PartenairesBoard() {
  const [type, setType] = useState<PartenaireType | "tous">("tous");
  const [statut, setStatut] = useState<StatutPartenaire | "tous">("tous");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PartenaireRow | undefined>(undefined);

  const partenaires = useQuery(partenairesAdminQuery({ type, statut, search }));
  const contrats = useQuery(contratsQuery());
  const pec = useQuery(pecQuery());
  const factures = useQuery(facturesQuery());

  const decider = useDeciderPriseEnCharge();
  const traiterFacture = useTraiterFacture();

  const nomsParId = useMemo(
    () => Object.fromEntries((partenaires.data ?? []).map((p) => [p.id, p.nom])),
    [partenaires.data],
  );

  const contratsActifs = (contrats.data ?? []).filter((c) => c.statut === "actif").length;
  const pecEnAttente = (pec.data ?? []).filter(
    (p) => p.statut === "soumise" || p.statut === "en_revue",
  ).length;
  const facturesDues = (factures.data ?? [])
    .filter((f) => f.statut === "validee")
    .reduce((total, f) => total + Number(f.montant_valide_usd ?? f.montant_usd), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Partenaires" value={String(partenaires.data?.length ?? 0)} icon={Building2} />
        <Kpi label="Contrats actifs" value={String(contratsActifs)} icon={FileSignature} />
        <Kpi label="Prises en charge à traiter" value={String(pecEnAttente)} icon={Stethoscope} />
        <Kpi label="Factures à payer (USD)" value={facturesDues.toFixed(2)} icon={ReceiptText} />
      </div>

      <Tabs defaultValue="reseau">
        <TabsList>
          <TabsTrigger value="reseau">Réseau</TabsTrigger>
          <TabsTrigger value="contrats">Contrats</TabsTrigger>
          <TabsTrigger value="pec">Prises en charge</TabsTrigger>
          <TabsTrigger value="factures">Factures</TabsTrigger>
        </TabsList>

        <TabsContent value="reseau" className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              className="max-w-xs"
              placeholder="Rechercher une raison sociale…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={type} onValueChange={(v) => setType(v as PartenaireType | "tous")}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                {PARTENAIRE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statut} onValueChange={(v) => setStatut(v as StatutPartenaire | "tous")}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                {STATUTS_PARTENAIRE.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="ml-auto"
              onClick={() => {
                setEditing(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" /> Nouveau partenaire
            </Button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Raison sociale</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(partenaires.data ?? []).map((partenaire) => (
                  <TableRow key={partenaire.id}>
                    <TableCell className="font-mono text-xs">{partenaire.numero ?? "—"}</TableCell>
                    <TableCell className="font-medium">{partenaire.nom}</TableCell>
                    <TableCell>{TYPE_LABEL[partenaire.type] ?? partenaire.type}</TableCell>
                    <TableCell>{partenaire.responsable_nom ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {partenaire.telephone ?? partenaire.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={partenaire.statut === "actif" ? "default" : "secondary"}>
                        {partenaire.statut}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(partenaire);
                            setDialogOpen(true);
                          }}
                        >
                          Modifier
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/portail/partenaires/$id" params={{ id: partenaire.id }}>
                            Dossier
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!partenaires.isPending && (partenaires.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Aucun partenaire enregistré.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="contrats" className="mt-5">
          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrat</TableHead>
                  <TableHead>Partenaire</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Plafond acte</TableHead>
                  <TableHead>Couverture</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(contrats.data ?? []).map((contrat) => {
                  const expire =
                    contrat.date_fin != null &&
                    contrat.date_fin < new Date().toISOString().slice(0, 10);
                  return (
                    <TableRow key={contrat.id}>
                      <TableCell className="font-mono text-xs">{contrat.numero}</TableCell>
                      <TableCell>{nomsParId[contrat.partenaire_id] ?? "—"}</TableCell>
                      <TableCell className="text-xs">
                        {contrat.date_debut} → {contrat.date_fin ?? "indéterminée"}
                      </TableCell>
                      <TableCell>{contrat.plafond_acte_usd ?? "—"}</TableCell>
                      <TableCell>{contrat.taux_couverture} %</TableCell>
                      <TableCell>
                        <Badge
                          variant={contrat.statut === "actif" && !expire ? "default" : "secondary"}
                        >
                          {expire && contrat.statut === "actif" ? "expiré" : contrat.statut}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!contrats.isPending && (contrats.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Aucun contrat. Ouvrez le dossier d'un partenaire pour en créer un.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="pec" className="mt-5">
          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Partenaire</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Montant estimé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(pec.data ?? []).map((demande) => (
                  <TableRow key={demande.id}>
                    <TableCell className="font-mono text-xs">{demande.numero}</TableCell>
                    <TableCell>{nomsParId[demande.partenaire_id] ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">{demande.motif}</TableCell>
                    <TableCell>{Number(demande.montant_estime_usd).toFixed(2)} USD</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{demande.statut}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {demande.statut === "soumise" || demande.statut === "en_revue" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await decider.mutateAsync({
                                  id: demande.id,
                                  statut: "approuvee",
                                  montant_approuve_usd: demande.montant_estime_usd,
                                });
                                toast.success("Prise en charge approuvée.");
                              } catch (error) {
                                toast.error((error as Error).message);
                              }
                            }}
                          >
                            Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await decider.mutateAsync({
                                  id: demande.id,
                                  statut: "refusee",
                                  decision_motif: "Refus après revue médicale",
                                });
                                toast.success("Prise en charge refusée.");
                              } catch (error) {
                                toast.error((error as Error).message);
                              }
                            }}
                          >
                            Refuser
                          </Button>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
                {!pec.isPending && (pec.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Aucune demande de prise en charge.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="factures" className="mt-5">
          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Facture</TableHead>
                  <TableHead>Partenaire</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Validé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(factures.data ?? []).map((facture) => (
                  <TableRow key={facture.id}>
                    <TableCell className="font-mono text-xs">{facture.numero}</TableCell>
                    <TableCell>{nomsParId[facture.partenaire_id] ?? "—"}</TableCell>
                    <TableCell>{Number(facture.montant_usd).toFixed(2)} USD</TableCell>
                    <TableCell>
                      {facture.montant_valide_usd != null
                        ? `${Number(facture.montant_valide_usd).toFixed(2)} USD`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{facture.statut}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {facture.statut === "soumise" ? (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await traiterFacture.mutateAsync({
                                  id: facture.id,
                                  statut: "validee",
                                  montant_valide_usd: facture.montant_usd,
                                });
                                toast.success("Facture validée.");
                              } catch (error) {
                                toast.error((error as Error).message);
                              }
                            }}
                          >
                            Valider
                          </Button>
                        ) : null}
                        {facture.statut === "validee" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await traiterFacture.mutateAsync({
                                  id: facture.id,
                                  statut: "payee",
                                  montant_paye_usd: Number(
                                    facture.montant_valide_usd ?? facture.montant_usd,
                                  ),
                                });
                                toast.success("Paiement enregistré.");
                              } catch (error) {
                                toast.error((error as Error).message);
                              }
                            }}
                          >
                            Marquer payée
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!factures.isPending && (factures.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Aucune facture partenaire.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <PartenaireDialog open={dialogOpen} onOpenChange={setDialogOpen} partenaire={editing} />
    </div>
  );
}

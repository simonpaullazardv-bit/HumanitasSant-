/**
 * Tableau de bord du module Cartes : cartes adhérents, cartes personnel,
 * conditions d'impression, impression en lot, historiques d'impression et de réimpression.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, IdCard, Plus, Printer, RefreshCw, Search, UserCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adherentsQuery, type BeneficiaireRow } from "@/modules/adherents/queries";
import { supabase } from "@/integrations/supabase/client";
import { fullName, formatDate, formatDateTime } from "@/modules/adherents/constants";
import { useAuth } from "@/hooks/useAuth";
import { categoriesFinanceQuery } from "@/modules/finance/queries";
import type { CarteVisuelData } from "./CarteVisuel";
import { EmissionDialog } from "./EmissionDialog";
import { ImpressionDialog } from "./ImpressionDialog";
import { PersonnelDialog } from "./PersonnelDialog";
import {
  cartesQuery,
  impressionsQuery,
  personnelQuery,
  reimpressionsQuery,
  type CarteRow,
  type PersonnelRow,
  type StatutCarte,
} from "./queries";

const STATUT_BADGE: Record<StatutCarte, string> = {
  active: "bg-accent/15 text-accent",
  remplacee: "bg-muted text-muted-foreground",
  perdue: "bg-destructive/10 text-destructive",
  annulee: "bg-destructive/15 text-destructive",
  expiree: "bg-destructive/10 text-destructive",
};

export function CartesBoard() {
  const { roles } = useAuth();
  const canManagePersonnelCards = roles.some((role) =>
    ["super_admin", "administrateur", "directeur_general"].includes(role),
  );
  const canPrintCards = roles.some((role) =>
    ["super_admin", "administrateur", "directeur_general", "coordonnateur", "financier"].includes(
      role,
    ),
  );
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<string[]>([]);
  const [emission, setEmission] = useState<{ open: boolean; reimpression: boolean }>({
    open: false,
    reimpression: false,
  });
  const [apercu, setApercu] = useState<{ id: string; data: CarteVisuelData }[] | null>(null);
  const [agentEdit, setAgentEdit] = useState<{ open: boolean; agent?: PersonnelRow }>({
    open: false,
  });

  const cartes = useQuery(cartesQuery());
  const adherents = useQuery(adherentsQuery({}));
  const agents = useQuery(personnelQuery());
  const beneficiaires = useQuery({
    queryKey: ["cartes", "beneficiaires-all"],
    queryFn: async (): Promise<BeneficiaireRow[]> => {
      const { data, error } = await (supabase.from("beneficiaires") as any)
        .select("*")
        .eq("is_active", true)
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as BeneficiaireRow[];
    },
  });
  const categories = useQuery(categoriesFinanceQuery());
  const impressions = useQuery(impressionsQuery());
  const reimpressions = useQuery(reimpressionsQuery());

  const adherentsById = useMemo(
    () => new Map((adherents.data ?? []).map((row) => [row.id, row])),
    [adherents.data],
  );
  const agentsById = useMemo(
    () => new Map((agents.data ?? []).map((row) => [row.id, row])),
    [agents.data],
  );
  const beneficiairesById = useMemo(
    () => new Map((beneficiaires.data ?? []).map((row) => [row.id, row])),
    [beneficiaires.data],
  );
  const categoriesById = useMemo(
    () => new Map((categories.data ?? []).map((row) => [row.id, row])),
    [categories.data],
  );

  const toVisuel = (carte: CarteRow): CarteVisuelData => {
    if (carte.type_carte === "personnel") {
      const agent = agentsById.get(carte.personnel_id ?? "");
      return {
        type: "personnel",
        numero: carte.numero,
        token: carte.qr_token,
        nomComplet: agent
          ? [agent.prenom, agent.nom, agent.postnom].filter(Boolean).join(" ")
          : "—",
        photoPath: agent?.photo_url ?? null,
        ligne1: agent?.fonction ?? null,
        ligne2: agent?.departement ? `Département : ${agent.departement}` : null,
        ligne3: [agent?.grade, agent?.matricule].filter(Boolean).join(" · ") || null,
        dateEmission: carte.date_emission,
        dateExpiration: carte.date_expiration,
        statut: agent?.statut ?? null,
      };
    }
    const beneficiaire = beneficiairesById.get(carte.beneficiaire_id ?? "");
    if (carte.type_carte === "beneficiaire") {
      return {
        type: "adherent",
        numero: carte.numero,
        token: carte.qr_token,
        nomComplet: beneficiaire
          ? [beneficiaire.nom, beneficiaire.prenom].filter(Boolean).join(" ")
          : "—",
        photoPath: beneficiaire?.photo_url ?? null,
        ligne1: "Bénéficiaire Humanitas",
        ligne2: beneficiaire?.code ? `Code ${beneficiaire.code}` : null,
        ligne3: "Carte personnelle",
        dateEmission: carte.date_emission,
        dateExpiration: carte.date_expiration,
        statut: beneficiaire?.is_active ? "actif" : "inactif",
      };
    }
    const adherent = adherentsById.get(carte.adherent_id ?? "");
    const categorie = categoriesById.get(carte.categorie_id ?? adherent?.categorie_id ?? "");
    return {
      type: "adherent",
      numero: carte.numero,
      token: carte.qr_token,
      nomComplet: adherent ? fullName(adherent) : "—",
      photoPath: adherent?.photo_url ?? null,
      ligne1: categorie ? `Catégorie ${categorie.nom}` : null,
      ligne2: adherent?.matricule ? `Matricule ${adherent.matricule}` : null,
      ligne3: adherent?.ville ?? null,
      dateEmission: carte.date_emission,
      dateExpiration: carte.date_expiration,
      statut: adherent?.statut ?? null,
    };
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = cartes.data ?? [];
    if (!term) return rows;
    return rows.filter((carte) => {
      const visuel = toVisuel(carte);
      return (
        carte.numero.toLowerCase().includes(term) || visuel.nomComplet.toLowerCase().includes(term)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartes.data, search, adherentsById, agentsById, beneficiairesById, categoriesById]);

  const actives = filtered.filter((carte) => carte.statut === "active");

  const imprimerSelection = () => {
    const rows = (cartes.data ?? []).filter((carte) => selection.includes(carte.id));
    setApercu(rows.map((carte) => ({ id: carte.id, data: toVisuel(carte) })));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Cartes actives" value={actives.length} icon={CreditCard} />
        <Kpi
          label="Cartes adhérents"
          value={(cartes.data ?? []).filter((c) => c.type_carte === "adherent").length}
          icon={IdCard}
        />
        <Kpi
          label="Cartes personnel"
          value={(cartes.data ?? []).filter((c) => c.type_carte === "personnel").length}
          icon={UserCog}
        />
        <Kpi
          label="Cartes bénéficiaires"
          value={(cartes.data ?? []).filter((c) => c.type_carte === "beneficiaire").length}
          icon={IdCard}
        />
        <Kpi label="Impressions" value={impressions.data?.length ?? 0} icon={Printer} />
      </div>

      <Tabs defaultValue="cartes">
        <TabsList className="flex-wrap">
          <TabsTrigger value="cartes">Cartes</TabsTrigger>
          <TabsTrigger value="personnel" disabled={!canManagePersonnelCards}>
            Personnel
          </TabsTrigger>
          <TabsTrigger value="impressions">Historique d'impression</TabsTrigger>
          <TabsTrigger value="reimpressions">Réimpressions</TabsTrigger>
        </TabsList>

        <TabsContent value="cartes" className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Numéro de carte ou titulaire…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Button
              variant="secondary"
              disabled={selection.length === 0 || !canPrintCards}
              onClick={imprimerSelection}
            >
              <Printer className="mr-1 size-4" /> Imprimer le lot ({selection.length})
            </Button>
            <Button
              disabled={!canPrintCards}
              onClick={() => setEmission({ open: true, reimpression: false })}
            >
              <Plus className="mr-1 size-4" /> Émettre une carte
            </Button>
            <Button
              variant="secondary"
              disabled={!canPrintCards}
              onClick={() => setEmission({ open: true, reimpression: true })}
            >
              <RefreshCw className="mr-1 size-4" /> Réimprimer
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Numéro</TableHead>
                  <TableHead>Titulaire</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Émission</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Tirages</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((carte) => {
                  const visuel = toVisuel(carte);
                  return (
                    <TableRow key={carte.id}>
                      <TableCell>
                        <Checkbox
                          checked={selection.includes(carte.id)}
                          disabled={carte.statut !== "active"}
                          onCheckedChange={(checked) =>
                            setSelection((current) =>
                              checked
                                ? [...current, carte.id]
                                : current.filter((id) => id !== carte.id),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{carte.numero}</TableCell>
                      <TableCell>{visuel.nomComplet}</TableCell>
                      <TableCell className="capitalize">{carte.type_carte}</TableCell>
                      <TableCell>{formatDate(carte.date_emission)}</TableCell>
                      <TableCell>{formatDate(carte.date_expiration)}</TableCell>
                      <TableCell>
                        <Badge className={STATUT_BADGE[carte.statut]} variant="secondary">
                          {carte.statut}
                        </Badge>
                      </TableCell>
                      <TableCell>{carte.nb_impressions}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setApercu([{ id: carte.id, data: visuel }])}
                        >
                          Aperçu
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Aucune carte pour le moment.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="personnel" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setAgentEdit({ open: true })}>
              <Plus className="mr-1 size-4" /> Nouvel agent
            </Button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Fonction</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(agents.data ?? []).map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-mono text-xs">{agent.matricule}</TableCell>
                    <TableCell>
                      {[agent.prenom, agent.nom, agent.postnom].filter(Boolean).join(" ")}
                    </TableCell>
                    <TableCell>{agent.fonction ?? "—"}</TableCell>
                    <TableCell>{agent.departement ?? "—"}</TableCell>
                    <TableCell>{agent.grade ?? "—"}</TableCell>
                    <TableCell className="capitalize">{agent.statut}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAgentEdit({ open: true, agent })}
                      >
                        Modifier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(agents.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Aucun agent enregistré.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="impressions" className="mt-4">
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Carte</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Motif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(impressions.data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDateTime(row.created_at)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {(cartes.data ?? []).find((c) => c.id === row.carte_id)?.numero ??
                        row.carte_id}
                    </TableCell>
                    <TableCell className="capitalize">{row.mode}</TableCell>
                    <TableCell className="uppercase">{row.format}</TableCell>
                    <TableCell>{row.motif ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {(impressions.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Aucune impression enregistrée.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="reimpressions" className="mt-4">
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Ancienne carte</TableHead>
                  <TableHead>Nouvelle carte</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Frais</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reimpressions.data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDateTime(row.created_at)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {(cartes.data ?? []).find((c) => c.id === row.ancienne_carte_id)?.numero ??
                        "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {(cartes.data ?? []).find((c) => c.id === row.nouvelle_carte_id)?.numero ??
                        "—"}
                    </TableCell>
                    <TableCell>{row.motif}</TableCell>
                    <TableCell>{Number(row.frais_usd).toFixed(2)} $</TableCell>
                  </TableRow>
                ))}
                {(reimpressions.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Aucune réimpression enregistrée.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <EmissionDialog
        open={emission.open}
        reimpression={emission.reimpression}
        onOpenChange={(open) => setEmission((current) => ({ ...current, open }))}
      />
      <PersonnelDialog
        open={agentEdit.open}
        agent={agentEdit.agent}
        onOpenChange={(open) => setAgentEdit((current) => ({ ...current, open }))}
      />
      <ImpressionDialog
        open={apercu !== null}
        cartes={apercu ?? []}
        onOpenChange={(open) => !open && setApercu(null)}
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof CreditCard;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

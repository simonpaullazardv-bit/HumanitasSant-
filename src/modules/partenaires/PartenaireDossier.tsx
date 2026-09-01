/** Dossier 360° d'un partenaire : identité, contrats, documents, activité, historique. */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileSignature, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ContratDialog } from "./ContratDialog";
import { PartenaireDialog } from "./PartenaireDialog";
import {
  PARTENAIRE_TYPES,
  contratsQuery,
  documentsPartenaireQuery,
  facturesQuery,
  historiquePartenaireQuery,
  partenaireQuery,
  pecQuery,
  useUploadDocumentPartenaire,
  type ContratRow,
} from "./queries";

const TYPE_LABEL = Object.fromEntries(PARTENAIRE_TYPES.map((t) => [t.value, t.label]));

export function PartenaireDossier({ partenaireId }: { partenaireId: string }) {
  const partenaire = useQuery(partenaireQuery(partenaireId));
  const contrats = useQuery(contratsQuery(partenaireId));
  const documents = useQuery(documentsPartenaireQuery(partenaireId));
  const pec = useQuery(pecQuery({ partenaireId }));
  const factures = useQuery(facturesQuery(partenaireId));
  const historique = useQuery(historiquePartenaireQuery(partenaireId));
  const upload = useUploadDocumentPartenaire();

  const [contratOpen, setContratOpen] = useState(false);
  const [editContrat, setEditContrat] = useState<ContratRow | undefined>(undefined);
  const [ficheOpen, setFicheOpen] = useState(false);

  if (partenaire.isPending) {
    return <p className="text-sm text-muted-foreground">Chargement du dossier…</p>;
  }
  if (!partenaire.data) {
    return <p className="text-sm text-muted-foreground">Partenaire introuvable.</p>;
  }

  const p = partenaire.data;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{p.numero}</p>
            <h2 className="font-display text-xl font-bold text-foreground">{p.nom}</h2>
            <p className="text-sm text-muted-foreground">
              {TYPE_LABEL[p.type] ?? p.type} · {[p.commune, p.ville].filter(Boolean).join(", ")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={p.statut === "actif" ? "default" : "secondary"}>{p.statut}</Badge>
            <Button variant="outline" onClick={() => setFicheOpen(true)}>
              Modifier la fiche
            </Button>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Adresse</dt>
            <dd>{p.adresse ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Téléphone</dt>
            <dd>{p.telephone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{p.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Responsable</dt>
            <dd>{p.responsable_nom ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Fonction</dt>
            <dd>{p.responsable_fonction ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Contact responsable</dt>
            <dd>{p.responsable_telephone ?? p.responsable_email ?? "—"}</dd>
          </div>
        </dl>
      </div>

      <Tabs defaultValue="contrats">
        <TabsList>
          <TabsTrigger value="contrats">Contrats</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activite">Activité</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="contrats" className="mt-5 space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditContrat(undefined);
                setContratOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" /> Nouveau contrat
            </Button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Prestations</TableHead>
                  <TableHead>Plafonds (acte / mois / an)</TableHead>
                  <TableHead>Signatures</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(contrats.data ?? []).map((contrat) => (
                  <TableRow key={contrat.id}>
                    <TableCell className="font-mono text-xs">{contrat.numero}</TableCell>
                    <TableCell className="text-xs">
                      {contrat.date_debut} → {contrat.date_fin ?? "indéterminée"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs">
                      {(contrat.prestations_autorisees ?? []).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {contrat.plafond_acte_usd ?? "—"} / {contrat.plafond_mensuel_usd ?? "—"} /{" "}
                      {contrat.plafond_annuel_usd ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {contrat.signe_humanitas_par ? "Humanitas ✓" : "Humanitas —"}
                      <br />
                      {contrat.signe_partenaire_par ? "Partenaire ✓" : "Partenaire —"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={contrat.statut === "actif" ? "default" : "secondary"}>
                        {contrat.statut}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditContrat(contrat);
                          setContratOpen(true);
                        }}
                      >
                        Modifier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!contrats.isPending && (contrats.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      <FileSignature className="mx-auto mb-2 size-5" />
                      Aucun contrat : le partenaire ne peut ni créer de prise en charge ni facturer.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-5 space-y-4">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2 text-sm">
            <Upload className="size-4 text-primary" />
            {upload.isPending ? "Envoi…" : "Téléverser un document"}
            <input
              type="file"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  await upload.mutateAsync({
                    partenaire_id: partenaireId,
                    type: "convention",
                    file,
                  });
                  toast.success("Document ajouté.");
                } catch (error) {
                  toast.error((error as Error).message);
                }
                event.target.value = "";
              }}
            />
          </label>
          <ul className="space-y-2">
            {(documents.data ?? []).map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3 text-sm"
              >
                <span>{doc.nom}</span>
                <Badge variant="secondary">{doc.type}</Badge>
              </li>
            ))}
            {(documents.data ?? []).length === 0 ? (
              <li className="text-sm text-muted-foreground">Aucun document.</li>
            ) : null}
          </ul>
        </TabsContent>

        <TabsContent value="activite" className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-card p-5">
            <h3 className="font-display text-sm font-bold">Prises en charge</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {(pec.data ?? []).map((demande) => (
                <li key={demande.id} className="flex items-center justify-between gap-3">
                  <span className="truncate">
                    {demande.numero} · {demande.motif}
                  </span>
                  <Badge variant="secondary">{demande.statut}</Badge>
                </li>
              ))}
              {(pec.data ?? []).length === 0 ? (
                <li className="text-muted-foreground">Aucune demande.</li>
              ) : null}
            </ul>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-5">
            <h3 className="font-display text-sm font-bold">Factures</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {(factures.data ?? []).map((facture) => (
                <li key={facture.id} className="flex items-center justify-between gap-3">
                  <span>
                    {facture.numero} · {Number(facture.montant_usd).toFixed(2)} USD
                  </span>
                  <Badge variant="secondary">{facture.statut}</Badge>
                </li>
              ))}
              {(factures.data ?? []).length === 0 ? (
                <li className="text-muted-foreground">Aucune facture.</li>
              ) : null}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="historique" className="mt-5">
          <ul className="space-y-2 text-sm">
            {(historique.data ?? []).map((entry) => (
              <li key={entry.id} className="rounded-xl border border-border/70 bg-card px-4 py-3">
                <span className="font-medium">{entry.evenement}</span>{" "}
                <span className="text-muted-foreground">
                  {entry.ancien_statut ? `${entry.ancien_statut} → ` : ""}
                  {entry.nouveau_statut ?? ""} ·{" "}
                  {new Date(entry.created_at).toLocaleString("fr-FR")}
                </span>
              </li>
            ))}
            {(historique.data ?? []).length === 0 ? (
              <li className="text-sm text-muted-foreground">Aucun évènement.</li>
            ) : null}
          </ul>
        </TabsContent>
      </Tabs>

      <ContratDialog
        open={contratOpen}
        onOpenChange={setContratOpen}
        partenaireId={partenaireId}
        contrat={editContrat}
      />
      <PartenaireDialog open={ficheOpen} onOpenChange={setFicheOpen} partenaire={p} />
    </div>
  );
}

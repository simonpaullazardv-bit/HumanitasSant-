/**
 * Espace sécurisé du partenaire.
 * Cloisonnement strict : le partenaire ne voit que ses propres données.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, FileSignature, Plus, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useAuth } from "@/hooks/useAuth";
import { ControleEligibilite } from "@/modules/priseencharge/ControleEligibilite";
import { PrestationsDialog } from "@/modules/priseencharge/PrestationsDialog";
import {
  contratsQuery,
  facturesQuery,
  monPartenaireQuery,
  notificationsQuery,
  pecQuery,
  useCreerPriseEnCharge,
  useMarquerNotification,
  useSoumettreFacture,
} from "./queries";

export function EspacePartenaire({
  partnerType,
}: {
  partnerType?: "hopital" | "pharmacie" | "laboratoire" | "centre_bien_etre";
}) {
  const { user } = useAuth();
  const partenaire = useQuery(monPartenaireQuery(user?.id));
  const partenaireId = partenaire.data?.id;

  const contrats = useQuery({ ...contratsQuery(partenaireId), enabled: Boolean(partenaireId) });
  const pec = useQuery({
    ...pecQuery(partenaireId ? { partenaireId } : {}),
    enabled: Boolean(partenaireId),
  });
  const factures = useQuery({ ...facturesQuery(partenaireId), enabled: Boolean(partenaireId) });
  const notifications = useQuery(notificationsQuery(partenaireId));

  const creerPec = useCreerPriseEnCharge();
  const soumettreFacture = useSoumettreFacture();
  const marquer = useMarquerNotification();

  const [personne, setPersonne] = useState<{
    adherentId: string | null;
    beneficiaireId: string | null;
    carteId: string | null;
  }>({ adherentId: null, beneficiaireId: null, carteId: null });
  const [prestationPec, setPrestationPec] = useState<{ id: string; numero: string } | null>(null);
  const [motif, setMotif] = useState("");
  const [montant, setMontant] = useState("");
  const [factureRef, setFactureRef] = useState("");
  const [factureMontant, setFactureMontant] = useState("");
  const [facturePec, setFacturePec] = useState("");

  const contratActif = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (contrats.data ?? []).find(
      (c) => c.statut === "actif" && c.date_debut <= today && (!c.date_fin || c.date_fin >= today),
    );
  }, [contrats.data]);

  if (partenaire.isPending) {
    return <p className="text-sm text-muted-foreground">Chargement de votre espace…</p>;
  }

  if (!partenaire.data || !partenaireId) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-8 text-center">
        <h2 className="font-display text-lg font-bold text-foreground">
          Aucun partenaire rattaché
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre compte n'est rattaché à aucune structure partenaire. Contactez la coordination
          Humanitas.
        </p>
      </div>
    );
  }

  const nonLues = (notifications.data ?? []).filter((n) => !n.is_lue).length;
  const typeLabels: Record<string, string> = {
    hopital: "Hôpital",
    pharmacie: "Pharmacie",
    laboratoire: "Laboratoire",
    centre_bien_etre: "Centre de bien-être",
  };
  if (partnerType && partenaire.data.type !== partnerType) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <h2 className="font-display text-lg font-bold">Rattachement métier incohérent</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre rôle exige un établissement de type {typeLabels[partnerType]}, mais le rattachement
          courant ne correspond pas. Contactez la coordination Humanitas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{partenaire.data.numero}</p>
          <h2 className="font-display text-lg font-bold text-foreground">{partenaire.data.nom}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {typeLabels[partenaire.data.type] ?? "Partenaire"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={contratActif ? "default" : "secondary"}>
            {contratActif ? `Contrat ${contratActif.numero} actif` : "Aucun contrat valide"}
          </Badge>
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Bell className="size-4" /> {nonLues}
          </span>
        </div>
      </div>

      {!contratActif ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Sans contrat valide, la vérification des adhérents, les prises en charge et la facturation
          sont bloquées.
        </p>
      ) : null}

      <Tabs defaultValue="verification">
        <TabsList>
          <TabsTrigger value="verification">Vérification</TabsTrigger>
          <TabsTrigger value="pec">Prises en charge</TabsTrigger>
          <TabsTrigger value="factures">Factures</TabsTrigger>
          <TabsTrigger value="contrats">Contrats</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="verification" className="mt-5 space-y-5">
          <ControleEligibilite
            partenaireId={partenaireId}
            onResult={(result) =>
              setPersonne({
                adherentId: result.eligible ? (result.adherent_id ?? null) : null,
                beneficiaireId: result.eligible ? (result.beneficiaire_id ?? null) : null,
                carteId: result.eligible ? (result.carte?.id ?? null) : null,
              })
            }
          />

          <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h3 className="font-display text-sm font-bold">Nouvelle demande de prise en charge</h3>
            <p className="text-xs text-muted-foreground">
              Vérifiez d'abord la carte de l'adhérent : la demande est rattachée automatiquement.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Motif / actes</Label>
                <Textarea
                  rows={2}
                  value={motif}
                  onChange={(event) => setMotif(event.target.value)}
                />
              </div>
              <div>
                <Label>Montant estimé (USD)</Label>
                <Input
                  type="number"
                  value={montant}
                  onChange={(event) => setMontant(event.target.value)}
                />
              </div>
            </div>
            <Button
              disabled={creerPec.isPending}
              onClick={async () => {
                if (!motif.trim()) {
                  toast.error("Indiquez le motif de la demande.");
                  return;
                }
                try {
                  await creerPec.mutateAsync({
                    partenaire_id: partenaireId,
                    adherent_id: personne.adherentId,
                    beneficiaire_id: personne.beneficiaireId,
                    carte_id: personne.carteId,
                    motif,
                    montant_estime_usd: Number(montant || 0),
                  });
                  toast.success("Demande transmise à Humanitas.");
                  setMotif("");
                  setMontant("");
                  setPersonne({ adherentId: null, beneficiaireId: null, carteId: null });
                } catch (error) {
                  toast.error((error as Error).message);
                }
              }}
            >
              <Plus className="mr-2 size-4" /> Envoyer la demande
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="pec" className="mt-5">
          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Estimé</TableHead>
                  <TableHead>Approuvé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Prestations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(pec.data ?? []).map((demande) => (
                  <TableRow key={demande.id}>
                    <TableCell className="font-mono text-xs">{demande.numero}</TableCell>
                    <TableCell className="max-w-xs truncate">{demande.motif}</TableCell>
                    <TableCell>{Number(demande.montant_estime_usd).toFixed(2)} USD</TableCell>
                    <TableCell>
                      {demande.montant_approuve_usd != null
                        ? `${Number(demande.montant_approuve_usd).toFixed(2)} USD`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{demande.statut}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!["approuvee", "executee"].includes(demande.statut)}
                        onClick={() => setPrestationPec({ id: demande.id, numero: demande.numero })}
                      >
                        Enregistrer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(pec.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Aucune prestation enregistrée.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="factures" className="mt-5 space-y-5">
          <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h3 className="font-display text-sm font-bold">Envoyer une facture</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Votre référence</Label>
                <Input value={factureRef} onChange={(event) => setFactureRef(event.target.value)} />
              </div>
              <div>
                <Label>Montant (USD)</Label>
                <Input
                  type="number"
                  value={factureMontant}
                  onChange={(event) => setFactureMontant(event.target.value)}
                />
              </div>
              <div>
                <Label>N° prise en charge (optionnel)</Label>
                <Input value={facturePec} onChange={(event) => setFacturePec(event.target.value)} />
              </div>
            </div>
            <Button
              disabled={soumettreFacture.isPending}
              onClick={async () => {
                const montantValue = Number(factureMontant || 0);
                if (montantValue <= 0) {
                  toast.error("Le montant doit être supérieur à zéro.");
                  return;
                }
                const lien = (pec.data ?? []).find(
                  (demande) => demande.numero === facturePec.trim(),
                );
                try {
                  await soumettreFacture.mutateAsync({
                    partenaire_id: partenaireId,
                    reference_partenaire: factureRef || null,
                    prise_en_charge_id: lien?.id ?? null,
                    montant_usd: montantValue,
                  });
                  toast.success("Facture transmise.");
                  setFactureRef("");
                  setFactureMontant("");
                  setFacturePec("");
                } catch (error) {
                  toast.error((error as Error).message);
                }
              }}
            >
              <ReceiptText className="mr-2 size-4" /> Soumettre
            </Button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Facture</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Validé</TableHead>
                  <TableHead>Payé</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(factures.data ?? []).map((facture) => (
                  <TableRow key={facture.id}>
                    <TableCell className="font-mono text-xs">{facture.numero}</TableCell>
                    <TableCell>{Number(facture.montant_usd).toFixed(2)} USD</TableCell>
                    <TableCell>
                      {facture.montant_valide_usd != null
                        ? `${Number(facture.montant_valide_usd).toFixed(2)} USD`
                        : "—"}
                    </TableCell>
                    <TableCell>{Number(facture.montant_paye_usd).toFixed(2)} USD</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{facture.statut}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(factures.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Aucune facture soumise.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="contrats" className="mt-5">
          <ul className="space-y-3">
            {(contrats.data ?? []).map((contrat) => (
              <li
                key={contrat.id}
                className="rounded-2xl border border-border/70 bg-card p-5 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">
                    <FileSignature className="mr-2 inline size-4 text-primary" />
                    {contrat.numero}
                  </span>
                  <Badge variant={contrat.statut === "actif" ? "default" : "secondary"}>
                    {contrat.statut}
                  </Badge>
                </div>
                <p className="mt-2 text-muted-foreground">
                  {contrat.date_debut} → {contrat.date_fin ?? "indéterminée"} · couverture{" "}
                  {contrat.taux_couverture} %
                </p>
                <p className="mt-1 text-muted-foreground">
                  Prestations : {(contrat.prestations_autorisees ?? []).join(", ") || "—"}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Plafonds : acte {contrat.plafond_acte_usd ?? "—"} · mois{" "}
                  {contrat.plafond_mensuel_usd ?? "—"} · an {contrat.plafond_annuel_usd ?? "—"}
                </p>
              </li>
            ))}
            {(contrats.data ?? []).length === 0 ? (
              <li className="text-sm text-muted-foreground">Aucun contrat disponible.</li>
            ) : null}
          </ul>
        </TabsContent>

        <TabsContent value="notifications" className="mt-5">
          <ul className="space-y-2">
            {(notifications.data ?? []).map((notification) => (
              <li
                key={notification.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-border/70 bg-card px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{notification.titre}</p>
                  <p className="text-muted-foreground">{notification.message}</p>
                </div>
                {!notification.is_lue ? (
                  <Button size="sm" variant="ghost" onClick={() => marquer.mutate(notification.id)}>
                    Marquer lue
                  </Button>
                ) : null}
              </li>
            ))}
            {(notifications.data ?? []).length === 0 ? (
              <li className="text-sm text-muted-foreground">Aucune notification.</li>
            ) : null}
          </ul>
        </TabsContent>
      </Tabs>

      {prestationPec ? (
        <PrestationsDialog
          open
          onOpenChange={(value) => (!value ? setPrestationPec(null) : undefined)}
          pecId={prestationPec.id}
          numero={prestationPec.numero}
        />
      ) : null}
    </div>
  );
}

/**
 * Poste du Médecin Conseil (étapes 5, 6 et 9).
 * Chaque décision passe par une fonction serveur : elle est historisée et
 * met à jour les montants engagés sur le plafond de l'adhérent.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileQuestion, ReceiptText, Stethoscope, XCircle } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  facturesQuery,
  pecQuery,
  type FactureRow,
  type PriseEnChargeRow,
} from "@/modules/partenaires/queries";
import {
  decisionsQuery,
  notificationsInternesQuery,
  prestationsQuery,
  useControlerFacture,
  useDecisionMedicale,
  useMarquerNotificationInterne,
} from "./queries";

const STATUT_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  soumise: "outline",
  en_revue: "secondary",
  approuvee: "default",
  refusee: "destructive",
  executee: "default",
  annulee: "secondary",
};

export function PriseEnChargeBoard() {
  const pec = useQuery(pecQuery({}));
  const factures = useQuery(facturesQuery());
  const notifications = useQuery(notificationsInternesQuery());
  const marquer = useMarquerNotificationInterne();

  const [selection, setSelection] = useState<PriseEnChargeRow | null>(null);
  const [facture, setFacture] = useState<FactureRow | null>(null);

  const aTraiter = useMemo(
    () => (pec.data ?? []).filter((demande) => ["soumise", "en_revue"].includes(demande.statut)),
    [pec.data],
  );
  const facturesAControler = useMemo(
    () => (factures.data ?? []).filter((item) => item.statut === "soumise"),
    [factures.data],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi
          label="Demandes à examiner"
          value={aTraiter.length}
          icon={<Stethoscope className="size-4" />}
        />
        <Kpi
          label="Factures à contrôler"
          value={facturesAControler.length}
          icon={<ReceiptText className="size-4" />}
        />
        <Kpi
          label="Notifications non lues"
          value={(notifications.data ?? []).filter((n) => !n.is_lue).length}
          icon={<FileQuestion className="size-4" />}
        />
      </div>

      <Tabs defaultValue="demandes">
        <TabsList>
          <TabsTrigger value="demandes">Demandes</TabsTrigger>
          <TabsTrigger value="factures">Contrôle des factures</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="demandes" className="mt-5">
          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Estimé</TableHead>
                  <TableHead>Approuvé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Action</TableHead>
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
                      <Badge variant={STATUT_VARIANT[demande.statut] ?? "secondary"}>
                        {demande.statut}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelection(demande)}>
                        Examiner
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
                  <TableHead>Montant</TableHead>
                  <TableHead>Validé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(factures.data ?? []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.numero}</TableCell>
                    <TableCell>{Number(item.montant_usd).toFixed(2)} USD</TableCell>
                    <TableCell>
                      {item.montant_valide_usd != null
                        ? `${Number(item.montant_valide_usd).toFixed(2)} USD`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.statut}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={item.statut !== "soumise"}
                        onClick={() => setFacture(item)}
                      >
                        Contrôler
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(factures.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Aucune facture transmise.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-5">
          <ul className="space-y-2">
            {(notifications.data ?? []).map((notification) => (
              <li
                key={notification.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-border/70 bg-card p-4 text-sm"
              >
                <div>
                  <p className="font-semibold">{notification.titre}</p>
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

      {selection ? <DecisionDialog demande={selection} onClose={() => setSelection(null)} /> : null}
      {facture ? (
        <ControleFactureDialog facture={facture} onClose={() => setFacture(null)} />
      ) : null}
    </div>
  );
}

function Kpi({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function DecisionDialog({ demande, onClose }: { demande: PriseEnChargeRow; onClose: () => void }) {
  const decisions = useQuery(decisionsQuery(demande.id));
  const prestations = useQuery(prestationsQuery(demande.id));
  const decider = useDecisionMedicale();
  const [motif, setMotif] = useState("");
  const [montant, setMontant] = useState(String(demande.montant_estime_usd ?? ""));

  async function appliquer(decision: "validee" | "refusee" | "info_requise") {
    if (decision !== "validee" && !motif.trim()) {
      toast.error("Le motif est obligatoire pour un refus ou une demande d'informations.");
      return;
    }
    try {
      await decider.mutateAsync({
        pec_id: demande.id,
        decision,
        motif: motif.trim() || null,
        montant: decision === "validee" ? Number(montant || 0) : null,
      });
      toast.success("Décision enregistrée et historisée.");
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <Dialog open onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prise en charge {demande.numero}</DialogTitle>
          <DialogDescription>{demande.motif}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Montant approuvé (USD)</Label>
            <Input
              type="number"
              value={montant}
              onChange={(event) => setMontant(event.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Motif / informations demandées</Label>
            <Textarea rows={3} value={motif} onChange={(event) => setMotif(event.target.value)} />
          </div>
        </div>

        {(prestations.data ?? []).length > 0 ? (
          <div className="rounded-xl border border-border/70 bg-surface p-3 text-sm">
            <p className="mb-2 font-semibold">Prestations réalisées</p>
            <ul className="space-y-1 text-muted-foreground">
              {(prestations.data ?? []).map((prestation) => (
                <li key={prestation.id}>
                  {prestation.type} · {prestation.libelle} × {prestation.quantite} ={" "}
                  {Number(prestation.montant_usd).toFixed(2)} USD
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="rounded-xl border border-border/70 bg-surface p-3 text-sm">
          <p className="mb-2 font-semibold">Historique des décisions</p>
          <ul className="space-y-1 text-muted-foreground">
            {(decisions.data ?? []).map((decision) => (
              <li key={decision.id}>
                {new Date(decision.created_at).toLocaleString("fr-FR")} — {decision.decision}
                {decision.motif ? ` : ${decision.motif}` : ""}
              </li>
            ))}
            {(decisions.data ?? []).length === 0 ? <li>Aucune décision enregistrée.</li> : null}
          </ul>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={decider.isPending}
            onClick={() => void appliquer("info_requise")}
          >
            <FileQuestion className="mr-2 size-4" /> Informations complémentaires
          </Button>
          <Button
            variant="destructive"
            disabled={decider.isPending}
            onClick={() => void appliquer("refusee")}
          >
            <XCircle className="mr-2 size-4" /> Refuser
          </Button>
          <Button disabled={decider.isPending} onClick={() => void appliquer("validee")}>
            <CheckCircle2 className="mr-2 size-4" /> Valider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ControleFactureDialog({ facture, onClose }: { facture: FactureRow; onClose: () => void }) {
  const prestations = useQuery(prestationsQuery(facture.prise_en_charge_id ?? undefined));
  const controler = useControlerFacture();
  const [montant, setMontant] = useState(String(facture.montant_usd));
  const [avis, setAvis] = useState("");

  async function appliquer(decision: "validee" | "rejetee") {
    if (decision === "rejetee" && !avis.trim()) {
      toast.error("Indiquez le motif de rejet.");
      return;
    }
    try {
      await controler.mutateAsync({
        facture_id: facture.id,
        decision,
        montant_valide: decision === "validee" ? Number(montant || 0) : null,
        avis: avis.trim() || null,
      });
      toast.success(
        decision === "validee"
          ? "Facture validée : ordre de remboursement créé."
          : "Facture rejetée.",
      );
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <Dialog open onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Contrôle de la facture {facture.numero}</DialogTitle>
          <DialogDescription>
            Montant soumis : {Number(facture.montant_usd).toFixed(2)} USD
          </DialogDescription>
        </DialogHeader>

        {(prestations.data ?? []).length > 0 ? (
          <ul className="rounded-xl border border-border/70 bg-surface p-3 text-sm text-muted-foreground">
            {(prestations.data ?? []).map((prestation) => (
              <li key={prestation.id}>
                {prestation.libelle} × {prestation.quantite} ={" "}
                {Number(prestation.montant_usd).toFixed(2)} USD
              </li>
            ))}
          </ul>
        ) : null}

        <div className="grid gap-3">
          <div>
            <Label>Montant validé (USD)</Label>
            <Input
              type="number"
              value={montant}
              onChange={(event) => setMontant(event.target.value)}
            />
          </div>
          <div>
            <Label>Avis médical / motif</Label>
            <Textarea rows={3} value={avis} onChange={(event) => setAvis(event.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="destructive"
            disabled={controler.isPending}
            onClick={() => void appliquer("rejetee")}
          >
            Rejeter
          </Button>
          <Button disabled={controler.isPending} onClick={() => void appliquer("validee")}>
            Valider et transmettre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

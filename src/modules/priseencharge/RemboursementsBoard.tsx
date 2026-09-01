/**
 * Étapes 10 à 12 : autorisation administrative puis paiement comptable.
 * Le double remboursement est impossible : contrainte unique par facture,
 * ordre payé immuable et paiement atomique côté serveur.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Banknote, ShieldCheck } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ordresQuery,
  STATUT_ORDRE_LABELS,
  usePayerOrdre,
  useValiderOrdre,
  type OrdreRow,
  type StatutOrdre,
} from "./queries";

const MODES = [
  { value: "banque", label: "Virement bancaire" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "caisse", label: "Caisse" },
];

export function RemboursementsBoard() {
  const ordres = useQuery(ordresQuery());
  const [onglet, setOnglet] = useState<StatutOrdre | "tous">("en_attente");
  const [validation, setValidation] = useState<OrdreRow | null>(null);
  const [paiement, setPaiement] = useState<OrdreRow | null>(null);

  const liste = useMemo(
    () => (ordres.data ?? []).filter((ordre) => onglet === "tous" || ordre.statut === onglet),
    [ordres.data, onglet],
  );

  const totaux = useMemo(() => {
    const rows = ordres.data ?? [];
    return {
      aValider: rows.filter((o) => o.statut === "en_attente").length,
      aPayer: rows
        .filter((o) => o.statut === "valide")
        .reduce((sum, o) => sum + Number(o.montant_usd), 0),
      paye: rows
        .filter((o) => o.statut === "paye")
        .reduce((sum, o) => sum + Number(o.montant_usd), 0),
    };
  }, [ordres.data]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi
          label="Ordres à autoriser"
          value={String(totaux.aValider)}
          icon={<ShieldCheck className="size-4" />}
        />
        <Kpi
          label="À décaisser"
          value={`${totaux.aPayer.toFixed(2)} USD`}
          icon={<Banknote className="size-4" />}
        />
        <Kpi
          label="Déjà remboursé"
          value={`${totaux.paye.toFixed(2)} USD`}
          icon={<BadgeCheck className="size-4" />}
        />
      </div>

      <Tabs value={onglet} onValueChange={(value) => setOnglet(value as StatutOrdre | "tous")}>
        <TabsList>
          <TabsTrigger value="en_attente">À autoriser</TabsTrigger>
          <TabsTrigger value="valide">À payer</TabsTrigger>
          <TabsTrigger value="paye">Payés</TabsTrigger>
          <TabsTrigger value="rejete">Rejetés</TabsTrigger>
          <TabsTrigger value="tous">Tous</TabsTrigger>
        </TabsList>

        <TabsContent value={onglet} className="mt-5">
          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordre</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Référence paiement</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liste.map((ordre) => (
                  <TableRow key={ordre.id}>
                    <TableCell className="font-mono text-xs">{ordre.numero}</TableCell>
                    <TableCell>{Number(ordre.montant_usd).toFixed(2)} USD</TableCell>
                    <TableCell>
                      <Badge variant={ordre.statut === "paye" ? "default" : "secondary"}>
                        {STATUT_ORDRE_LABELS[ordre.statut]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {ordre.reference_paiement ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {ordre.statut === "en_attente" ? (
                        <Button size="sm" variant="outline" onClick={() => setValidation(ordre)}>
                          Autoriser
                        </Button>
                      ) : ordre.statut === "valide" ? (
                        <Button size="sm" onClick={() => setPaiement(ordre)}>
                          Payer
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {liste.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Aucun ordre de remboursement.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {validation ? (
        <ValidationDialog ordre={validation} onClose={() => setValidation(null)} />
      ) : null}
      {paiement ? <PaiementDialog ordre={paiement} onClose={() => setPaiement(null)} /> : null}
    </div>
  );
}

function Kpi({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function ValidationDialog({ ordre, onClose }: { ordre: OrdreRow; onClose: () => void }) {
  const valider = useValiderOrdre();
  const [motif, setMotif] = useState("");

  async function appliquer(decision: "valide" | "rejete") {
    if (decision === "rejete" && !motif.trim()) {
      toast.error("Indiquez le motif du rejet.");
      return;
    }
    try {
      await valider.mutateAsync({ ordre_id: ordre.id, decision, motif: motif.trim() });
      toast.success(decision === "valide" ? "Ordre autorisé." : "Ordre rejeté.");
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <Dialog open onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ordre {ordre.numero}</DialogTitle>
          <DialogDescription>
            Montant contrôlé par le médecin conseil : {Number(ordre.montant_usd).toFixed(2)} USD
          </DialogDescription>
        </DialogHeader>
        {ordre.avis_medical ? (
          <p className="rounded-xl border border-border/70 bg-surface p-3 text-sm text-muted-foreground">
            Avis médical : {ordre.avis_medical}
          </p>
        ) : null}
        <div>
          <Label>Observation / motif de rejet</Label>
          <Textarea rows={3} value={motif} onChange={(event) => setMotif(event.target.value)} />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="destructive"
            disabled={valider.isPending}
            onClick={() => void appliquer("rejete")}
          >
            Rejeter
          </Button>
          <Button disabled={valider.isPending} onClick={() => void appliquer("valide")}>
            Autoriser le remboursement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaiementDialog({ ordre, onClose }: { ordre: OrdreRow; onClose: () => void }) {
  const payer = usePayerOrdre();
  const [mode, setMode] = useState("banque");
  const [reference, setReference] = useState("");

  return (
    <Dialog open onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Paiement de l'ordre {ordre.numero}</DialogTitle>
          <DialogDescription>
            {Number(ordre.montant_usd).toFixed(2)} USD — le paiement est définitif et ne peut être
            rejoué.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Mode de paiement</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Référence de paiement</Label>
            <Input value={reference} onChange={(event) => setReference(event.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={payer.isPending}
            onClick={async () => {
              try {
                await payer.mutateAsync({ ordre_id: ordre.id, mode, reference });
                toast.success("Paiement enregistré, écritures et notifications générées.");
                onClose();
              } catch (error) {
                toast.error((error as Error).message);
              }
            }}
          >
            <Banknote className="mr-2 size-4" /> Confirmer le paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

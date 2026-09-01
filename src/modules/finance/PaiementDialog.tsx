/**
 * Enregistrement d'un paiement.
 * Le formulaire ne contient aucune règle métier : les modes proviennent du
 * référentiel `modes_paiement`, les montants des catégories, et la base rejette
 * les doublons de période ou les références déjà utilisées.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { adherentsQuery } from "@/modules/adherents/queries";
import { fullName } from "@/modules/adherents/constants";
import {
  TYPE_OPERATION_LABELS,
  formatPeriode,
  moisCourant,
  periodesDisponibles,
  type TypeOperation,
} from "./constants";
import {
  modesPaiementQuery,
  parametresFinanceQuery,
  uploadPreuve,
  useEnregistrerPaiement,
  type CotisationRow,
} from "./queries";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pré-remplissage depuis une cotisation existante. */
  cotisation?: CotisationRow | undefined;
  adherentId?: string | undefined;
}

export function PaiementDialog({ open, onOpenChange, cotisation, adherentId }: Props) {
  const modes = useQuery(modesPaiementQuery());
  const parametres = useQuery(parametresFinanceQuery());
  const adherents = useQuery({
    ...adherentsQuery({}),
    enabled: open && !adherentId && !cotisation,
  });
  const save = useEnregistrerPaiement();

  const devise = parametres.data?.devise ?? "USD";
  const [adherent, setAdherent] = useState(cotisation?.adherent_id ?? adherentId ?? "");
  const [type, setType] = useState<TypeOperation>("cotisation");
  const [periode, setPeriode] = useState(cotisation?.periode ?? moisCourant());
  const [montant, setMontant] = useState(
    cotisation ? String(Number(cotisation.montant_usd) - Number(cotisation.montant_paye)) : "",
  );
  const [mode, setMode] = useState("");
  const [reference, setReference] = useState("");
  const [payeur, setPayeur] = useState("");
  const [notes, setNotes] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const modeCourant = useMemo(
    () => modes.data?.find((item) => item.code === mode),
    [modes.data, mode],
  );
  const periodes = useMemo(() => periodesDisponibles(), []);

  async function submit() {
    if (!adherent) {
      toast.error("Sélectionnez un adhérent.");
      return;
    }
    if (!mode) {
      toast.error("Sélectionnez un mode de paiement.");
      return;
    }
    const valeur = Number(montant);
    if (!Number.isFinite(valeur) || valeur <= 0) {
      toast.error("Montant invalide.");
      return;
    }
    if (modeCourant?.exige_reference && !reference.trim()) {
      toast.error(`Une référence est requise pour le mode ${modeCourant.libelle}.`);
      return;
    }

    setBusy(true);
    try {
      let preuvePath: string | null = null;
      if (fichier) preuvePath = await uploadPreuve(adherent, fichier);
      await save.mutateAsync({
        adherent_id: adherent,
        cotisation_id: cotisation?.id ?? null,
        montant_usd: valeur,
        devise,
        mode,
        reference: reference || null,
        payeur: payeur || null,
        periode: type === "cotisation" ? periode : null,
        type_operation: type,
        statut: "valide",
        preuve_path: preuvePath,
        notes: notes || null,
      });
      toast.success("Paiement enregistré, répartition et solde mis à jour.");
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      if (message.includes("paiements_cotisation_periode_unique")) {
        toast.error("Cette période a déjà été réglée pour cet adhérent.");
      } else if (message.includes("paiements_reference_unique")) {
        toast.error("Cette référence de paiement existe déjà.");
      } else {
        toast.error(message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          <DialogDescription>
            Répartition automatique : {parametres.data?.repartitionCotisation.fonds_mutuelle ?? 70}{" "}
            % fonds mutuelle / {parametres.data?.repartitionCotisation.administration ?? 30} %
            administration. Les frais de carte sont affectés à 100 % à l'administration.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Adhérent</Label>
            {cotisation || adherentId ? (
              <Input value={adherent} readOnly className="font-mono text-xs" />
            ) : (
              <Select value={adherent} onValueChange={setAdherent}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un adhérent" />
                </SelectTrigger>
                <SelectContent>
                  {(adherents.data ?? []).map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.matricule} — {fullName(row)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label>Type d'opération</Label>
            <Select value={type} onValueChange={(value) => setType(value as TypeOperation)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_OPERATION_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Période concernée</Label>
            <Select
              value={periode}
              onValueChange={setPeriode}
              disabled={type !== "cotisation" || Boolean(cotisation)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodes.map((value) => (
                  <SelectItem key={value} value={value}>
                    {formatPeriode(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Montant ({devise})</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={montant}
              onChange={(event) => setMontant(event.target.value)}
            />
          </div>

          <div>
            <Label>Mode de paiement</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {(modes.data ?? []).map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Référence {modeCourant?.exige_reference ? "(requise)" : "(optionnelle)"}</Label>
            <Input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Générée automatiquement si vide"
            />
          </div>

          <div>
            <Label>Payeur</Label>
            <Input
              value={payeur}
              onChange={(event) => setPayeur(event.target.value)}
              placeholder="Adhérent, entreprise, tiers…"
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="flex items-center gap-2">
              <Upload className="size-4" /> Preuve de paiement
            </Label>
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={(event) => setFichier(event.target.files?.[0] ?? null)}
            />
          </div>

          <div className="sm:col-span-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />} Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

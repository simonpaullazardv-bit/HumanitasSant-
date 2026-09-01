/**
 * Étape 7 : le partenaire enregistre les prestations réellement réalisées.
 * Le serveur contrôle l'autorisation au contrat et la conformité à la décision.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  prestationsQuery,
  TYPES_PRESTATION,
  useEnregistrerPrestations,
  type TypePrestation,
} from "./queries";

interface Ligne {
  type: TypePrestation;
  libelle: string;
  quantite: string;
  montant_unitaire_usd: string;
  notes: string;
}

const LIGNE_VIDE: Ligne = {
  type: "consultation",
  libelle: "",
  quantite: "1",
  montant_unitaire_usd: "",
  notes: "",
};

export function PrestationsDialog({
  open,
  onOpenChange,
  pecId,
  numero,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  pecId: string;
  numero: string;
}) {
  const [lignes, setLignes] = useState<Ligne[]>([{ ...LIGNE_VIDE }]);
  const existantes = useQuery({ ...prestationsQuery(pecId), enabled: open });
  const enregistrer = useEnregistrerPrestations();

  const total = lignes.reduce(
    (sum, ligne) => sum + Number(ligne.quantite || 0) * Number(ligne.montant_unitaire_usd || 0),
    0,
  );

  function patch(index: number, values: Partial<Ligne>) {
    setLignes((prev) => prev.map((ligne, i) => (i === index ? { ...ligne, ...values } : ligne)));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prestations réalisées — {numero}</DialogTitle>
          <DialogDescription>
            N'enregistrez que les informations nécessaires au remboursement.
          </DialogDescription>
        </DialogHeader>

        {(existantes.data ?? []).length > 0 ? (
          <div className="rounded-xl border border-border/70 bg-surface p-3 text-sm">
            <p className="mb-2 font-semibold">Déjà enregistré</p>
            <ul className="space-y-1 text-muted-foreground">
              {(existantes.data ?? []).map((prestation) => (
                <li key={prestation.id}>
                  {prestation.type} · {prestation.libelle} × {prestation.quantite} ={" "}
                  {Number(prestation.montant_usd).toFixed(2)} USD
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-3">
          {lignes.map((ligne, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-xl border border-border/70 p-3 sm:grid-cols-12"
            >
              <div className="sm:col-span-3">
                <Label>Type</Label>
                <Select
                  value={ligne.type}
                  onValueChange={(value) => patch(index, { type: value as TypePrestation })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES_PRESTATION.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-4">
                <Label>Libellé</Label>
                <Input
                  value={ligne.libelle}
                  onChange={(event) => patch(index, { libelle: event.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Quantité</Label>
                <Input
                  type="number"
                  min={1}
                  value={ligne.quantite}
                  onChange={(event) => patch(index, { quantite: event.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>PU (USD)</Label>
                <Input
                  type="number"
                  value={ligne.montant_unitaire_usd}
                  onChange={(event) => patch(index, { montant_unitaire_usd: event.target.value })}
                />
              </div>
              <div className="flex items-end sm:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setLignes((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="sm:col-span-12">
                <Label>Notes (facultatif)</Label>
                <Textarea
                  rows={2}
                  value={ligne.notes}
                  onChange={(event) => patch(index, { notes: event.target.value })}
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => setLignes((prev) => [...prev, { ...LIGNE_VIDE }])}
          >
            <Plus className="mr-2 size-4" /> Ajouter une ligne
          </Button>
        </div>

        <DialogFooter className="items-center justify-between gap-3 sm:justify-between">
          <span className="text-sm font-semibold">Total : {total.toFixed(2)} USD</span>
          <Button
            disabled={enregistrer.isPending}
            onClick={async () => {
              const payload = lignes
                .filter((ligne) => ligne.libelle.trim())
                .map((ligne) => ({
                  type: ligne.type,
                  libelle: ligne.libelle.trim(),
                  quantite: Number(ligne.quantite || 1),
                  montant_unitaire_usd: Number(ligne.montant_unitaire_usd || 0),
                  notes: ligne.notes.trim() || null,
                }));
              if (payload.length === 0) {
                toast.error("Ajoutez au moins une prestation.");
                return;
              }
              try {
                await enregistrer.mutateAsync({ pec_id: pecId, prestations: payload });
                toast.success("Prestations enregistrées.");
                setLignes([{ ...LIGNE_VIDE }]);
                onOpenChange(false);
              } catch (error) {
                toast.error((error as Error).message);
              }
            }}
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

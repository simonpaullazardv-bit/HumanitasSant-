/**
 * Appel de cotisation : le montant proposé provient de la catégorie choisie,
 * jamais d'une constante React. L'échéance est calculée en base selon le
 * paramètre `finance.jour_echeance`.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
import { adherentsQuery } from "@/modules/adherents/queries";
import { fullName } from "@/modules/adherents/constants";
import { formatPeriode, moisCourant, periodesDisponibles } from "./constants";
import { categoriesFinanceQuery, parametresFinanceQuery, useCreerCotisation } from "./queries";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adherentId?: string | undefined;
}

export function CotisationDialog({ open, onOpenChange, adherentId }: Props) {
  const categories = useQuery(categoriesFinanceQuery());
  const parametres = useQuery(parametresFinanceQuery());
  const adherents = useQuery({ ...adherentsQuery({}), enabled: open && !adherentId });
  const creer = useCreerCotisation();

  const [adherent, setAdherent] = useState(adherentId ?? "");
  const [categorieId, setCategorieId] = useState("");
  const [periode, setPeriode] = useState(moisCourant());
  const [montant, setMontant] = useState("");
  const periodes = useMemo(() => periodesDisponibles(), []);
  const categorie = categories.data?.find((item) => item.id === categorieId);

  useEffect(() => {
    if (categorie) setMontant(String(categorie.prix_usd));
  }, [categorie]);

  async function submit() {
    if (!adherent) {
      toast.error("Sélectionnez un adhérent.");
      return;
    }
    const valeur = Number(montant);
    if (!Number.isFinite(valeur) || valeur <= 0) {
      toast.error("Montant invalide.");
      return;
    }
    try {
      await creer.mutateAsync({
        adherent_id: adherent,
        categorie_id: categorieId || null,
        periode,
        montant_usd: valeur,
        devise: parametres.data?.devise ?? "USD",
      });
      toast.success("Appel de cotisation créé.");
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(
        message.includes("cotisations_adherent_id_periode_key")
          ? "Une cotisation existe déjà pour cet adhérent sur cette période."
          : message,
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvel appel de cotisation</DialogTitle>
          <DialogDescription>
            Échéance automatique au {parametres.data?.jourEcheance ?? 5} du mois concerné.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {!adherentId && (
            <div>
              <Label>Adhérent</Label>
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
            </div>
          )}

          <div>
            <Label>Catégorie</Label>
            <Select value={categorieId} onValueChange={setCategorieId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {(categories.data ?? []).map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.nom} — {item.prix_usd} {item.devise}/{item.periode} ·{" "}
                    {item.taux_couverture} %
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Période</Label>
            <Select value={periode} onValueChange={setPeriode}>
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
            <Label>Montant ({parametres.data?.devise ?? "USD"})</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={montant}
              onChange={(event) => setMontant(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={creer.isPending}>
            {creer.isPending && <Loader2 className="size-4 animate-spin" />} Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

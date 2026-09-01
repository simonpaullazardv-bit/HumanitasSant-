/**
 * Aperçu avant impression, impression individuelle ou en lot, export PDF
 * (via l'impression du navigateur) et journalisation de chaque tirage.
 */
import { useState } from "react";
import { Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CarteVisuel, type CarteVisuelData } from "./CarteVisuel";
import { useEnregistrerImpression } from "./queries";

export function ImpressionDialog({
  open,
  onOpenChange,
  cartes,
  motif,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  /** Cartes à imprimer, avec leur identifiant de base pour la journalisation. */
  cartes: { id: string; data: CarteVisuelData }[];
  motif?: string | null;
}) {
  const [verso, setVerso] = useState(true);
  const journaliser = useEnregistrerImpression();

  const lancer = async () => {
    try {
      await journaliser.mutateAsync({
        carteIds: cartes.map((carte) => carte.id),
        format: "pdf",
        mode: cartes.length > 1 ? "lot" : "individuelle",
        motif: motif ?? null,
        lotId: cartes.length > 1 ? crypto.randomUUID() : null,
      });
      window.print();
      toast.success(`Impression journalisée (${cartes.length} carte(s)).`);
    } catch (error) {
      toast.error((error as Error).message ?? "Impression refusée par le serveur.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Aperçu avant impression</DialogTitle>
          <DialogDescription>
            {cartes.length} carte(s). Utilisez « Enregistrer au format PDF » dans la boîte
            d'impression pour générer le fichier.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 print:hidden">
          <Switch id="verso" checked={verso} onCheckedChange={setVerso} />
          <Label htmlFor="verso">Imprimer aussi le verso</Label>
        </div>

        <div className="print-root flex flex-wrap gap-4">
          {cartes.map((carte) => (
            <div key={carte.id} className="flex gap-4">
              <CarteVisuel data={carte.data} />
              {verso && <CarteVisuel data={carte.data} verso />}
            </div>
          ))}
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button onClick={lancer} disabled={journaliser.isPending || cartes.length === 0}>
            <Printer className="mr-1 size-4" />
            {journaliser.isPending ? "Préparation…" : "Imprimer / PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

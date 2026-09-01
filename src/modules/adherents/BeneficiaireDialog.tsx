/**
 * Formulaire d'ajout / modification d'un bénéficiaire.
 * La limite de 4 bénéficiaires actifs est appliquée par un trigger serveur ;
 * l'interface la reflète et affiche le message d'erreur renvoyé par la base.
 */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LIEN_LABELS, MAX_BENEFICIAIRES } from "./constants";
import { useSaveBeneficiaire, type BeneficiaireInput, type BeneficiaireRow } from "./queries";

const schema = z.object({
  nom: z.string().trim().min(2, "Nom requis").max(80),
  prenom: z.string().trim().max(80).optional().or(z.literal("")),
  lien: z.enum(["conjoint", "enfant", "parent", "autre"]),
  sexe: z.enum(["M", "F"]).optional(),
  date_naissance: z.string().optional().or(z.literal("")),
  telephone: z.string().trim().max(30).optional().or(z.literal("")),
  photo_url: z.string().trim().max(400).optional().or(z.literal("")),
  piece_type: z.string().trim().max(40).optional().or(z.literal("")),
  piece_numero: z.string().trim().max(60).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const empty: FormValues = {
  nom: "",
  prenom: "",
  lien: "enfant",
  date_naissance: "",
  telephone: "",
  photo_url: "",
  piece_type: "",
  piece_numero: "",
  notes: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adherentId: string;
  beneficiaire?: BeneficiaireRow | null;
  activeCount: number;
}

export function BeneficiaireDialog({
  open,
  onOpenChange,
  adherentId,
  beneficiaire,
  activeCount,
}: Props) {
  const save = useSaveBeneficiaire();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: empty });

  useEffect(() => {
    if (!open) return;
    setError(null);
    form.reset(
      beneficiaire
        ? ({
            ...empty,
            ...(Object.fromEntries(
              Object.entries(beneficiaire).map(([key, value]) => [key, value ?? ""]),
            ) as unknown as FormValues),
          } as FormValues)
        : empty,
    );
  }, [open, beneficiaire, form]);

  const quotaAtteint = !beneficiaire && activeCount >= MAX_BENEFICIAIRES;

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const payload = Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, value === "" ? null : value]),
      ) as unknown as FormValues;
      await save.mutateAsync({
        ...(beneficiaire ? { id: beneficiaire.id } : {}),
        values: {
          ...payload,
          adherent_id: adherentId,
          nom: values.nom,
          lien: values.lien,
        } as unknown as BeneficiaireInput,
      });
      toast.success(beneficiaire ? "Bénéficiaire mis à jour." : "Bénéficiaire ajouté.");
      onOpenChange(false);
    } catch (cause) {
      const raw = cause instanceof Error ? cause.message : "Enregistrement impossible.";
      const message = raw.includes("4 bénéficiaires")
        ? `Refusé par le serveur : un adhérent ne peut avoir que ${MAX_BENEFICIAIRES} bénéficiaires actifs.`
        : raw;
      setError(message);
      toast.error(message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {beneficiaire ? "Modifier le bénéficiaire" : "Ajouter un bénéficiaire"}
          </DialogTitle>
          <DialogDescription>
            {activeCount} / {MAX_BENEFICIAIRES} bénéficiaires actifs sur ce dossier.
          </DialogDescription>
        </DialogHeader>

        {quotaAtteint && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Quota atteint : désactivez un bénéficiaire avant d'en ajouter un nouveau. Toute
            tentative sera de toute façon rejetée par le serveur.
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ben-nom">Nom *</Label>
              <Input id="ben-nom" {...form.register("nom")} />
              {form.formState.errors.nom && (
                <p className="text-xs text-destructive">{form.formState.errors.nom.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ben-prenom">Prénom</Label>
              <Input id="ben-prenom" {...form.register("prenom")} />
            </div>

            <div className="space-y-1.5">
              <Label>Lien de parenté *</Label>
              <Select
                value={form.watch("lien")}
                onValueChange={(value) => form.setValue("lien", value as FormValues["lien"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LIEN_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Sexe</Label>
              <Select
                value={form.watch("sexe") ?? ""}
                onValueChange={(value) => form.setValue("sexe", value as "M" | "F")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ben-naissance">Date de naissance</Label>
              <Input id="ben-naissance" type="date" {...form.register("date_naissance")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ben-tel">Téléphone</Label>
              <Input id="ben-tel" {...form.register("telephone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ben-piece">Type de pièce</Label>
              <Input id="ben-piece" {...form.register("piece_type")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ben-piece-num">Numéro de pièce</Label>
              <Input id="ben-piece-num" {...form.register("piece_numero")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ben-photo">Photo (URL ou chemin)</Label>
              <Input id="ben-photo" {...form.register("photo_url")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ben-notes">Notes</Label>
            <Textarea id="ben-notes" rows={2} {...form.register("notes")} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

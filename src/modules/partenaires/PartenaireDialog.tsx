/** Fiche partenaire : identité, coordonnées, responsable et statut. */
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import {
  PARTENAIRE_TYPES,
  STATUTS_PARTENAIRE,
  useSavePartenaire,
  type PartenaireRow,
  type PartenaireType,
  type StatutPartenaire,
} from "./queries";

const EMPTY = {
  nom: "",
  type: "hopital" as PartenaireType,
  categorie: "",
  description: "",
  adresse: "",
  commune: "",
  ville: "Kinshasa",
  telephone: "",
  email: "",
  site_web: "",
  responsable_nom: "",
  responsable_fonction: "",
  responsable_telephone: "",
  responsable_email: "",
  statut: "en_attente" as StatutPartenaire,
  notes: "",
};

export function PartenaireDialog({
  open,
  onOpenChange,
  partenaire,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  partenaire?: PartenaireRow | undefined;
}) {
  const [values, setValues] = useState({ ...EMPTY });
  const save = useSavePartenaire();

  useEffect(() => {
    if (!open) return;
    setValues(
      partenaire
        ? {
            nom: partenaire.nom,
            type: partenaire.type,
            categorie: partenaire.categorie ?? "",
            description: partenaire.description ?? "",
            adresse: partenaire.adresse ?? "",
            commune: partenaire.commune ?? "",
            ville: partenaire.ville,
            telephone: partenaire.telephone ?? "",
            email: partenaire.email ?? "",
            site_web: partenaire.site_web ?? "",
            responsable_nom: partenaire.responsable_nom ?? "",
            responsable_fonction: partenaire.responsable_fonction ?? "",
            responsable_telephone: partenaire.responsable_telephone ?? "",
            responsable_email: partenaire.responsable_email ?? "",
            statut: partenaire.statut,
            notes: partenaire.notes ?? "",
          }
        : { ...EMPTY },
    );
  }, [open, partenaire]);

  const set = (key: keyof typeof EMPTY) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  async function handleSubmit() {
    if (!values.nom.trim()) {
      toast.error("La raison sociale est obligatoire.");
      return;
    }
    try {
      await save.mutateAsync({
        ...(partenaire ? { id: partenaire.id } : {}),
        ...values,
      } as never);
      toast.success(partenaire ? "Partenaire mis à jour." : "Partenaire créé.");
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {partenaire ? `Partenaire ${partenaire.numero ?? ""}` : "Nouveau partenaire"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Raison sociale *</Label>
            <Input value={values.nom} onChange={(e) => set("nom")(e.target.value)} />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={values.type} onValueChange={(v) => set("type")(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTENAIRE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Statut</Label>
            <Select value={values.statut} onValueChange={(v) => set("statut")(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUTS_PARTENAIRE.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Catégorie / spécialité</Label>
            <Input value={values.categorie} onChange={(e) => set("categorie")(e.target.value)} />
          </div>
          <div>
            <Label>Ville</Label>
            <Input value={values.ville} onChange={(e) => set("ville")(e.target.value)} />
          </div>
          <div>
            <Label>Commune</Label>
            <Input value={values.commune} onChange={(e) => set("commune")(e.target.value)} />
          </div>
          <div>
            <Label>Adresse</Label>
            <Input value={values.adresse} onChange={(e) => set("adresse")(e.target.value)} />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input value={values.telephone} onChange={(e) => set("telephone")(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={values.email}
              onChange={(e) => set("email")(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Site web</Label>
            <Input value={values.site_web} onChange={(e) => set("site_web")(e.target.value)} />
          </div>

          <div className="sm:col-span-2 border-t border-border/70 pt-3 text-sm font-semibold text-foreground">
            Responsable
          </div>
          <div>
            <Label>Nom du responsable</Label>
            <Input
              value={values.responsable_nom}
              onChange={(e) => set("responsable_nom")(e.target.value)}
            />
          </div>
          <div>
            <Label>Fonction</Label>
            <Input
              value={values.responsable_fonction}
              onChange={(e) => set("responsable_fonction")(e.target.value)}
            />
          </div>
          <div>
            <Label>Téléphone responsable</Label>
            <Input
              value={values.responsable_telephone}
              onChange={(e) => set("responsable_telephone")(e.target.value)}
            />
          </div>
          <div>
            <Label>Email responsable</Label>
            <Input
              value={values.responsable_email}
              onChange={(e) => set("responsable_email")(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <Label>Description publique</Label>
            <Textarea
              rows={3}
              value={values.description}
              onChange={(e) => set("description")(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Notes internes</Label>
            <Textarea
              rows={2}
              value={values.notes}
              onChange={(e) => set("notes")(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={save.isPending}>
            {save.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

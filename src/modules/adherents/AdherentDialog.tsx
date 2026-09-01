/**
 * Formulaire de création / modification d'un adhérent.
 * Le numéro Humanitas est généré côté base : il n'est jamais saisi ni modifiable.
 */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
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
import { TYPE_ADHESION_LABELS } from "./constants";
import { categoriesQuery, entreprisesQuery, useSaveAdherent, type AdherentRow } from "./queries";

const schema = z.object({
  nom: z.string().trim().min(2, "Nom requis").max(80),
  postnom: z.string().trim().max(80).optional().or(z.literal("")),
  prenom: z.string().trim().max(80).optional().or(z.literal("")),
  sexe: z.enum(["M", "F"]).optional(),
  date_naissance: z.string().optional().or(z.literal("")),
  email: z.string().trim().email("Email invalide").max(255).optional().or(z.literal("")),
  telephone: z.string().trim().max(30).optional().or(z.literal("")),
  adresse: z.string().trim().max(200).optional().or(z.literal("")),
  commune: z.string().trim().max(80).optional().or(z.literal("")),
  ville: z.string().trim().min(2, "Ville requise").max(80),
  type_adhesion: z.enum(["individuel", "familial", "collectif"]),
  categorie_id: z.string().optional().or(z.literal("")),
  entreprise_id: z.string().optional().or(z.literal("")),
  date_adhesion: z.string().min(1, "Date d'adhésion requise"),
  date_expiration: z.string().optional().or(z.literal("")),
  profession: z.string().trim().max(80).optional().or(z.literal("")),
  etat_civil: z.string().trim().max(40).optional().or(z.literal("")),
  nationalite: z.string().trim().max(60).optional().or(z.literal("")),
  piece_type: z.string().trim().max(40).optional().or(z.literal("")),
  piece_numero: z.string().trim().max(60).optional().or(z.literal("")),
  contact_urgence_nom: z.string().trim().max(80).optional().or(z.literal("")),
  contact_urgence_telephone: z.string().trim().max(30).optional().or(z.literal("")),
  photo_url: z.string().trim().max(400).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const empty: FormValues = {
  nom: "",
  postnom: "",
  prenom: "",
  ville: "Kinshasa",
  type_adhesion: "individuel",
  date_adhesion: new Date().toISOString().slice(0, 10),
  email: "",
  telephone: "",
  adresse: "",
  commune: "",
  categorie_id: "",
  entreprise_id: "",
  date_expiration: "",
  profession: "",
  etat_civil: "",
  nationalite: "",
  piece_type: "",
  piece_numero: "",
  contact_urgence_nom: "",
  contact_urgence_telephone: "",
  photo_url: "",
  notes: "",
  date_naissance: "",
};

function blankToNull<T extends Record<string, unknown>>(values: T) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value === "" ? null : value]),
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adherent?: AdherentRow | null;
  onSaved?: (id: string) => void;
}

export function AdherentDialog({ open, onOpenChange, adherent, onSaved }: Props) {
  const categories = useQuery(categoriesQuery());
  const entreprises = useQuery(entreprisesQuery());
  const save = useSaveAdherent();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: empty });

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (adherent) {
      form.reset({
        ...empty,
        ...(Object.fromEntries(
          Object.entries(adherent).map(([key, value]) => [key, value ?? ""]),
        ) as unknown as FormValues),
      });
    } else {
      form.reset(empty);
    }
  }, [open, adherent, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const payload = blankToNull(values) as never;
      const row = await save.mutateAsync(
        adherent ? { id: adherent.id, values: payload } : { values: payload },
      );
      toast.success(
        adherent ? "Dossier adhérent mis à jour." : `Adhérent créé — n° ${row.matricule}`,
      );
      onOpenChange(false);
      onSaved?.(row.id);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Enregistrement impossible.";
      setError(message);
      toast.error(message);
    }
  });

  const field = (name: keyof FormValues, label: string, type = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={type} {...form.register(name)} />
      {form.formState.errors[name] && (
        <p className="text-xs text-destructive">{form.formState.errors[name]?.message as string}</p>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{adherent ? "Modifier le dossier" : "Nouvel adhérent"}</DialogTitle>
          <DialogDescription>
            {adherent
              ? `Numéro Humanitas ${adherent.matricule} — non modifiable.`
              : "Le numéro Humanitas unique est attribué automatiquement à l'enregistrement."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-3">
            {field("nom", "Nom *")}
            {field("postnom", "Post-nom")}
            {field("prenom", "Prénom")}
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
            {field("date_naissance", "Date de naissance", "date")}
            {field("nationalite", "Nationalité")}
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            {field("telephone", "Téléphone")}
            {field("email", "Email", "email")}
            {field("profession", "Profession")}
            {field("adresse", "Adresse")}
            {field("commune", "Commune")}
            {field("ville", "Ville *")}
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Type d'adhésion *</Label>
              <Select
                value={form.watch("type_adhesion")}
                onValueChange={(value) =>
                  form.setValue("type_adhesion", value as FormValues["type_adhesion"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_ADHESION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select
                value={form.watch("categorie_id") ?? ""}
                onValueChange={(value) => form.setValue("categorie_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {(categories.data ?? []).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nom} — {Number(item.prix_usd)} $
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Entreprise (contrat collectif)</Label>
              <Select
                value={form.watch("entreprise_id") ?? ""}
                onValueChange={(value) => form.setValue("entreprise_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {(entreprises.data ?? []).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {field("date_adhesion", "Date d'adhésion *", "date")}
            {field("date_expiration", "Date d'expiration", "date")}
            {field("photo_url", "Photo (URL ou chemin)")}
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            {field("piece_type", "Type de pièce")}
            {field("piece_numero", "Numéro de pièce")}
            {field("contact_urgence_nom", "Contact d'urgence")}
            {field("contact_urgence_telephone", "Téléphone du contact")}
          </section>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes du dossier</Label>
            <Textarea id="notes" rows={3} {...form.register("notes")} />
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

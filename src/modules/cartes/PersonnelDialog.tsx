/**
 * Fiche agent/employé Humanitas (support de la carte personnel).
 */
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { PhotoCapture } from "./PhotoCapture";
import { useSavePersonnel, type PersonnelRow } from "./queries";

const EMPTY = {
  nom: "",
  postnom: "",
  prenom: "",
  fonction: "",
  departement: "",
  grade: "",
  email: "",
  telephone: "",
  statut: "actif",
  photo_url: "",
};

export function PersonnelDialog({
  open,
  onOpenChange,
  agent,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  agent?: PersonnelRow | undefined;
}) {
  const [values, setValues] = useState({ ...EMPTY });
  const [showPhoto, setShowPhoto] = useState(false);
  const save = useSavePersonnel();

  useEffect(() => {
    if (!open) return;
    setShowPhoto(false);
    setValues(
      agent
        ? {
            nom: agent.nom,
            postnom: agent.postnom ?? "",
            prenom: agent.prenom ?? "",
            fonction: agent.fonction ?? "",
            departement: agent.departement ?? "",
            grade: agent.grade ?? "",
            email: agent.email ?? "",
            telephone: agent.telephone ?? "",
            statut: agent.statut,
            photo_url: agent.photo_url ?? "",
          }
        : { ...EMPTY },
    );
  }, [open, agent]);

  const set = (key: keyof typeof EMPTY, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (!values.nom.trim()) {
      toast.error("Le nom est obligatoire.");
      return;
    }
    try {
      await save.mutateAsync({
        ...(agent ? { id: agent.id } : {}),
        values: {
          ...values,
          is_active: values.statut === "actif",
        },
      });
      toast.success(agent ? "Agent mis à jour." : "Agent enregistré.");
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message ?? "Enregistrement impossible.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{agent ? "Modifier l'agent" : "Nouvel agent Humanitas"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nom *" value={values.nom} onChange={(v) => set("nom", v)} />
          <Field label="Post-nom" value={values.postnom} onChange={(v) => set("postnom", v)} />
          <Field label="Prénom" value={values.prenom} onChange={(v) => set("prenom", v)} />
          <Field label="Fonction" value={values.fonction} onChange={(v) => set("fonction", v)} />
          <Field
            label="Département"
            value={values.departement}
            onChange={(v) => set("departement", v)}
          />
          <Field label="Grade" value={values.grade} onChange={(v) => set("grade", v)} />
          <Field label="Email" value={values.email} onChange={(v) => set("email", v)} />
          <Field label="Téléphone" value={values.telephone} onChange={(v) => set("telephone", v)} />
          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select value={values.statut} onValueChange={(v) => set("statut", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="suspendu">Suspendu</SelectItem>
                <SelectItem value="inactif">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Photo d'identité</Label>
          {showPhoto ? (
            <PhotoCapture
              prefix={`personnel/${agent?.id ?? "nouveau"}`}
              onUploaded={(path) => {
                set("photo_url", path);
                setShowPhoto(false);
              }}
              onCancel={() => setShowPhoto(false)}
            />
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {values.photo_url ? "Photo enregistrée." : "Aucune photo."}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowPhoto(true)}
              >
                {values.photo_url ? "Remplacer" : "Ajouter une photo"}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

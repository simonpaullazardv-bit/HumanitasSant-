/** Contrat partenaire : période, prestations autorisées, plafonds et signatures. */
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
import { STATUTS_CONTRAT, useSaveContrat, type ContratRow, type StatutContrat } from "./queries";

const EMPTY = {
  objet: "",
  date_debut: new Date().toISOString().slice(0, 10),
  date_fin: "",
  statut: "brouillon" as StatutContrat,
  prestations: "",
  conditions: "",
  plafond_acte_usd: "",
  plafond_mensuel_usd: "",
  plafond_annuel_usd: "",
  taux_couverture: "80",
  signe_humanitas_par: "",
  signe_partenaire_par: "",
  notes: "",
};

export function ContratDialog({
  open,
  onOpenChange,
  partenaireId,
  contrat,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  partenaireId: string;
  contrat?: ContratRow | undefined;
}) {
  const [values, setValues] = useState({ ...EMPTY });
  const save = useSaveContrat();

  useEffect(() => {
    if (!open) return;
    setValues(
      contrat
        ? {
            objet: contrat.objet ?? "",
            date_debut: contrat.date_debut,
            date_fin: contrat.date_fin ?? "",
            statut: contrat.statut,
            prestations: (contrat.prestations_autorisees ?? []).join(", "),
            conditions:
              contrat.conditions && Object.keys(contrat.conditions).length
                ? JSON.stringify(contrat.conditions, null, 2)
                : "",
            plafond_acte_usd: contrat.plafond_acte_usd?.toString() ?? "",
            plafond_mensuel_usd: contrat.plafond_mensuel_usd?.toString() ?? "",
            plafond_annuel_usd: contrat.plafond_annuel_usd?.toString() ?? "",
            taux_couverture: String(contrat.taux_couverture ?? 80),
            signe_humanitas_par: contrat.signe_humanitas_par ?? "",
            signe_partenaire_par: contrat.signe_partenaire_par ?? "",
            notes: contrat.notes ?? "",
          }
        : { ...EMPTY },
    );
  }, [open, contrat]);

  const set = (key: keyof typeof EMPTY) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const num = (value: string) => (value.trim() === "" ? null : Number(value));

  async function handleSubmit() {
    let conditions: Record<string, unknown> = {};
    if (values.conditions.trim()) {
      try {
        conditions = JSON.parse(values.conditions);
      } catch {
        toast.error("Les conditions doivent être un JSON valide.");
        return;
      }
    }
    try {
      await save.mutateAsync({
        ...(contrat ? { id: contrat.id } : {}),
        partenaire_id: partenaireId,
        objet: values.objet || null,
        date_debut: values.date_debut,
        date_fin: values.date_fin || null,
        statut: values.statut,
        prestations_autorisees: values.prestations
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        conditions,
        plafond_acte_usd: num(values.plafond_acte_usd),
        plafond_mensuel_usd: num(values.plafond_mensuel_usd),
        plafond_annuel_usd: num(values.plafond_annuel_usd),
        taux_couverture: Number(values.taux_couverture || 0),
        signe_humanitas_par: values.signe_humanitas_par || null,
        signe_humanitas_le: values.signe_humanitas_par ? new Date().toISOString() : null,
        signe_partenaire_par: values.signe_partenaire_par || null,
        signe_partenaire_le: values.signe_partenaire_par ? new Date().toISOString() : null,
        notes: values.notes || null,
      } as never);
      toast.success(contrat ? "Contrat mis à jour." : "Contrat créé.");
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contrat ? `Contrat ${contrat.numero}` : "Nouveau contrat"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Objet du contrat</Label>
            <Input value={values.objet} onChange={(e) => set("objet")(e.target.value)} />
          </div>
          <div>
            <Label>Date de début</Label>
            <Input
              type="date"
              value={values.date_debut}
              onChange={(e) => set("date_debut")(e.target.value)}
            />
          </div>
          <div>
            <Label>Date de fin</Label>
            <Input
              type="date"
              value={values.date_fin}
              onChange={(e) => set("date_fin")(e.target.value)}
            />
          </div>
          <div>
            <Label>Statut</Label>
            <Select value={values.statut} onValueChange={(v) => set("statut")(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUTS_CONTRAT.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Taux de couverture (%)</Label>
            <Input
              type="number"
              value={values.taux_couverture}
              onChange={(e) => set("taux_couverture")(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Prestations autorisées (séparées par des virgules)</Label>
            <Input
              placeholder="Consultation, Hospitalisation, Imagerie"
              value={values.prestations}
              onChange={(e) => set("prestations")(e.target.value)}
            />
          </div>
          <div>
            <Label>Plafond par acte (USD)</Label>
            <Input
              type="number"
              value={values.plafond_acte_usd}
              onChange={(e) => set("plafond_acte_usd")(e.target.value)}
            />
          </div>
          <div>
            <Label>Plafond mensuel (USD)</Label>
            <Input
              type="number"
              value={values.plafond_mensuel_usd}
              onChange={(e) => set("plafond_mensuel_usd")(e.target.value)}
            />
          </div>
          <div>
            <Label>Plafond annuel (USD)</Label>
            <Input
              type="number"
              value={values.plafond_annuel_usd}
              onChange={(e) => set("plafond_annuel_usd")(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Conditions particulières (JSON)</Label>
            <Textarea
              rows={3}
              placeholder='{"delai_declaration_jours": 5}'
              value={values.conditions}
              onChange={(e) => set("conditions")(e.target.value)}
            />
          </div>
          <div>
            <Label>Signé pour Humanitas par</Label>
            <Input
              value={values.signe_humanitas_par}
              onChange={(e) => set("signe_humanitas_par")(e.target.value)}
            />
          </div>
          <div>
            <Label>Signé pour le partenaire par</Label>
            <Input
              value={values.signe_partenaire_par}
              onChange={(e) => set("signe_partenaire_par")(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Notes</Label>
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

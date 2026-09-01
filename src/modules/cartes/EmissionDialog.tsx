/**
 * Émission et réimpression d'une carte.
 * Les conditions (adhésion validée, frais de carte payés, informations complètes)
 * sont évaluées en base : le dialogue ne fait que les afficher.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { adherentsQuery, type AdherentRow } from "@/modules/adherents/queries";
import { supabase } from "@/integrations/supabase/client";
import { fullName } from "@/modules/adherents/constants";
import { conditionsCarteQuery, personnelQuery, useEmettreCarte } from "./queries";

const LABELS: Record<string, string> = {
  nom: "Nom",
  prenom: "Prénom",
  date_naissance: "Date de naissance",
  telephone: "Téléphone",
  photo: "Photo d'identité",
  categorie: "Catégorie d'adhésion",
};

function Condition({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="size-4 text-accent" />
      ) : (
        <XCircle className="size-4 text-destructive" />
      )}
      <span className={ok ? "" : "text-destructive"}>{label}</span>
    </li>
  );
}

export function EmissionDialog({
  open,
  onOpenChange,
  defaultAdherentId,
  reimpression = false,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  defaultAdherentId?: string | undefined;
  reimpression?: boolean;
}) {
  const [type, setType] = useState<"adherent" | "beneficiaire" | "personnel">("adherent");
  const [adherentId, setAdherentId] = useState(defaultAdherentId ?? "");
  const [beneficiaireId, setBeneficiaireId] = useState("");
  const [personnelId, setPersonnelId] = useState("");
  const [motif, setMotif] = useState("");
  const [paiementRef, setPaiementRef] = useState("");
  const [search, setSearch] = useState("");

  const adherents = useQuery(adherentsQuery({ search }));
  const agents = useQuery(personnelQuery());
  const beneficiaires = useQuery({
    queryKey: ["cartes", "beneficiaires", search],
    enabled: type === "beneficiaire",
    queryFn: async () => {
      const { data, error } = await (supabase.from("beneficiaires") as any)
        .select("*")
        .or(`nom.ilike.%${search}%,prenom.ilike.%${search}%,code.ilike.%${search}%`)
        .eq("is_active", true)
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
  const conditions = useQuery(conditionsCarteQuery(type === "adherent" ? adherentId : undefined));
  const emettre = useEmettreCarte();

  const cond = conditions.data;
  const bloque = type === "adherent" && (!adherentId || !cond?.imprimable);

  const submit = async () => {
    try {
      await emettre.mutateAsync({
        adherentId: type === "adherent" ? adherentId : null,
        beneficiaireId: type === "beneficiaire" ? beneficiaireId : null,
        personnelId: type === "personnel" ? personnelId : null,
        motif: motif.trim() || null,
        paiementId: null,
      });
      toast.success(reimpression ? "Nouvelle carte émise." : "Carte émise avec succès.");
      onOpenChange(false);
      setMotif("");
      setPaiementRef("");
    } catch (error) {
      toast.error((error as Error).message ?? "Émission refusée.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{reimpression ? "Réimprimer une carte" : "Émettre une carte"}</DialogTitle>
          <DialogDescription>
            {reimpression
              ? "L'ancienne carte est archivée, une nouvelle carte est générée avec un nouveau jeton QR."
              : "La carte n'est générée que si toutes les conditions sont remplies."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Type de carte</Label>
            <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adherent">Carte adhérent</SelectItem>
                <SelectItem value="beneficiaire">Carte bénéficiaire</SelectItem>
                <SelectItem value="personnel">Carte personnel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "adherent" ? (
            <div className="space-y-1.5">
              <Label>Adhérent</Label>
              <Input
                placeholder="Rechercher un nom ou un matricule…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Select value={adherentId} onValueChange={setAdherentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un adhérent" />
                </SelectTrigger>
                <SelectContent>
                  {(adherents.data ?? []).map((row: AdherentRow) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.matricule} — {fullName(row)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : type === "beneficiaire" ? (
            <div className="space-y-1.5">
              <Label>Bénéficiaire</Label>
              <Input
                placeholder="Rechercher un nom, prénom ou code BEN-…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Select value={beneficiaireId} onValueChange={setBeneficiaireId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un bénéficiaire" />
                </SelectTrigger>
                <SelectContent>
                  {(beneficiaires.data ?? []).map((row: any) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.code} — {[row.nom, row.prenom].filter(Boolean).join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Agent Humanitas</Label>
              <Select value={personnelId} onValueChange={setPersonnelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un agent" />
                </SelectTrigger>
                <SelectContent>
                  {(agents.data ?? []).map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.matricule} — {[row.prenom, row.nom].filter(Boolean).join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "adherent" && adherentId && cond && (
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Conditions d'impression
              </p>
              <ul className="space-y-1">
                <Condition ok={cond.adhesion_validee} label="Adhésion validée et active" />
                <Condition ok={cond.frais_carte_payes} label="Frais de carte payés" />
                <Condition ok={cond.infos_completes} label="Informations obligatoires complètes" />
              </ul>
              {cond.champs_manquants?.length > 0 && (
                <p className="flex items-start gap-2 pt-2 text-xs text-destructive">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  Manquant : {cond.champs_manquants.map((key) => LABELS[key] ?? key).join(", ")}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Motif {reimpression ? "(obligatoire)" : "(si carte existante)"}</Label>
            <Textarea
              rows={2}
              placeholder="Perte, vol, détérioration, changement de catégorie…"
              value={motif}
              onChange={(event) => setMotif(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Référence du paiement des frais (facultatif)</Label>
            <Input
              placeholder="PAY-…"
              value={paiementRef}
              onChange={(event) => setPaiementRef(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={submit}
            disabled={
              emettre.isPending ||
              bloque ||
              (type === "beneficiaire" && !beneficiaireId) ||
              (type === "personnel" && !personnelId) ||
              (reimpression && !motif.trim())
            }
          >
            {emettre.isPending ? "Émission…" : "Émettre la carte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

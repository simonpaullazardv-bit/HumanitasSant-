/**
 * Fiche complète d'un adhérent : identité, bénéficiaires, carte, cotisations,
 * paiements, prestations, documents, notifications et historique.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarClock,
  CreditCard,
  FileText,
  IdCard,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { AdherentDialog } from "./AdherentDialog";
import { BeneficiaireDialog } from "./BeneficiaireDialog";
import {
  DOCUMENT_LABELS,
  LIEN_LABELS,
  MAX_BENEFICIAIRES,
  STATUT_BADGE,
  STATUT_LABELS,
  STATUT_TRANSITIONS,
  TYPE_ADHESION_LABELS,
  formatDate,
  formatDateTime,
  fullName,
  type StatutAdherent,
  type TypeDocument,
} from "./constants";
import {
  adherentQuery,
  beneficiairesQuery,
  documentsQuery,
  dossierFinanceQuery,
  historiqueQuery,
  uploadDossierFile,
  useAddDocument,
  useChangeStatut,
  useDeleteDocument,
  type BeneficiaireRow,
} from "./queries";

function StatutBadge({ statut }: { statut: StatutAdherent }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUT_BADGE[statut],
      )}
    >
      {STATUT_LABELS[statut]}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}

/** Sélecteur de statut limité aux transitions autorisées par le serveur. */
function StatutSwitcher({
  table,
  id,
  statut,
  disabled,
}: {
  table: "adherents" | "beneficiaires";
  id: string;
  statut: StatutAdherent;
  disabled: boolean;
}) {
  const change = useChangeStatut();
  const options = STATUT_TRANSITIONS[statut];

  if (disabled || options.length === 0) return <StatutBadge statut={statut} />;

  return (
    <div className="flex items-center gap-2">
      <StatutBadge statut={statut} />
      <Select
        value=""
        onValueChange={async (value) => {
          try {
            await change.mutateAsync({ table, id, statut: value as StatutAdherent });
            toast.success(`Statut changé en « ${STATUT_LABELS[value as StatutAdherent]} ».`);
          } catch (cause) {
            toast.error(cause instanceof Error ? cause.message : "Transition refusée.");
          }
        }}
      >
        <SelectTrigger className="h-8 w-40 text-xs">
          <SelectValue placeholder="Changer…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((value) => (
            <SelectItem key={value} value={value}>
              {STATUT_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DocumentsPanel({ adherentId, canManage }: { adherentId: string; canManage: boolean }) {
  const documents = useQuery(documentsQuery(adherentId));
  const add = useAddDocument();
  const remove = useDeleteDocument();
  const [type, setType] = useState<TypeDocument>("piece_identite");
  const [busy, setBusy] = useState(false);

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const path = await uploadDossierFile(adherentId, file);
      await add.mutateAsync({ adherent_id: adherentId, type, nom: file.name, storage_path: path });
      toast.success("Document ajouté au dossier.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Téléversement impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-[200px_1fr]">
          <div className="space-y-1.5">
            <Label>Type de document</Label>
            <Select value={type} onValueChange={(value) => setType(value as TypeDocument)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-file">Fichier</Label>
            <Input
              id="doc-file"
              type="file"
              disabled={busy}
              onChange={(event) => void onUpload(event.target.files?.[0])}
            />
            <p className="text-xs text-muted-foreground">
              Stockage privé : les documents ne sont jamais exposés publiquement.
            </p>
          </div>
        </div>
      )}

      <ul className="divide-y divide-border rounded-lg border border-border">
        {(documents.data ?? []).length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            Aucun document enregistré.
          </li>
        )}
        {(documents.data ?? []).map((doc) => (
          <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <FileText className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{doc.nom}</p>
                <p className="text-xs text-muted-foreground">
                  {DOCUMENT_LABELS[doc.type]} · {formatDateTime(doc.created_at)}
                </p>
              </div>
            </div>
            {canManage && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void remove.mutateAsync(doc.id)}
                aria-label="Supprimer le document"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdherentDossier({ adherentId }: { adherentId: string }) {
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["super_admin", "administrateur", "coordonnateur"]);
  const canAudit = hasAnyRole(["super_admin", "administrateur"]);

  const adherent = useQuery(adherentQuery(adherentId));
  const beneficiaires = useQuery(beneficiairesQuery(adherentId));
  const finance = useQuery(dossierFinanceQuery(adherentId));
  const historique = useQuery(historiqueQuery(adherentId));

  const [editOpen, setEditOpen] = useState(false);
  const [benOpen, setBenOpen] = useState(false);
  const [benEdit, setBenEdit] = useState<BeneficiaireRow | null>(null);

  if (adherent.isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement du dossier…</p>;
  }
  if (!adherent.data) {
    return (
      <p className="text-sm text-muted-foreground">
        Dossier introuvable ou non accessible avec votre rôle.
      </p>
    );
  }

  const row = adherent.data;
  const bens = beneficiaires.data ?? [];
  const actifs = bens.filter((item) => item.is_active).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-5 p-6">
          <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
            {row.photo_url ? (
              <img src={row.photo_url} alt={fullName(row)} className="size-full object-cover" />
            ) : (
              <IdCard className="size-7" />
            )}
          </div>
          <div className="min-w-48 flex-1">
            <p className="font-mono text-xs text-muted-foreground">{row.matricule}</p>
            <h2 className="font-display text-2xl font-bold">{fullName(row)}</h2>
            <p className="text-sm text-muted-foreground">
              {TYPE_ADHESION_LABELS[row.type_adhesion]} · Adhésion du{" "}
              {formatDate(row.date_adhesion)}
            </p>
          </div>
          <StatutSwitcher table="adherents" id={row.id} statut={row.statut} disabled={!canManage} />
          {canManage && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" /> Modifier
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="identite">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="identite">Identité</TabsTrigger>
          <TabsTrigger value="beneficiaires">Bénéficiaires ({actifs})</TabsTrigger>
          <TabsTrigger value="carte">Carte</TabsTrigger>
          <TabsTrigger value="finances">Cotisations & paiements</TabsTrigger>
          <TabsTrigger value="soins">Prestations</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="identite" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-3">
                <Info
                  label="Sexe"
                  value={row.sexe === "F" ? "Féminin" : row.sexe === "M" ? "Masculin" : null}
                />
                <Info label="Date de naissance" value={formatDate(row.date_naissance)} />
                <Info label="Nationalité" value={row.nationalite} />
                <Info label="Téléphone" value={row.telephone} />
                <Info label="Email" value={row.email} />
                <Info label="Profession" value={row.profession} />
                <Info label="Adresse" value={row.adresse} />
                <Info label="Commune" value={row.commune} />
                <Info label="Ville" value={row.ville} />
                <Info
                  label="Pièce d'identité"
                  value={[row.piece_type, row.piece_numero].filter(Boolean).join(" · ")}
                />
                <Info
                  label="Contact d'urgence"
                  value={[row.contact_urgence_nom, row.contact_urgence_telephone]
                    .filter(Boolean)
                    .join(" · ")}
                />
                <Info label="Expiration des droits" value={formatDate(row.date_expiration)} />
                <Info label="Notes" value={row.notes} />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="beneficiaires" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {actifs} / {MAX_BENEFICIAIRES} bénéficiaires actifs — limite appliquée côté serveur.
            </p>
            {canManage && (
              <Button
                onClick={() => {
                  setBenEdit(null);
                  setBenOpen(true);
                }}
              >
                <Plus className="size-4" /> Ajouter un bénéficiaire
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {bens.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun bénéficiaire enregistré.</p>
            )}
            {bens.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-accent/10 text-accent">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.nom} className="size-full object-cover" />
                    ) : (
                      <Users className="size-5" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="font-semibold">
                        {[item.prenom, item.nom].filter(Boolean).join(" ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {LIEN_LABELS[item.lien]} · {formatDate(item.date_naissance)}
                      </p>
                    </div>
                    <StatutSwitcher
                      table="beneficiaires"
                      id={item.id}
                      statut={item.statut}
                      disabled={!canManage}
                    />
                  </div>
                  {canManage && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setBenEdit(item);
                        setBenOpen(true);
                      }}
                      aria-label="Modifier le bénéficiaire"
                    >
                      <Pencil className="size-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="carte" className="mt-4">
          <Card>
            <CardContent className="space-y-3 p-6">
              {finance.data?.carte ? (
                <dl className="grid gap-5 sm:grid-cols-3">
                  <Info
                    label="Numéro de carte"
                    value={(finance.data.carte as { numero: string }).numero}
                  />
                  <Info
                    label="Émise le"
                    value={formatDate(
                      (finance.data.carte as { date_emission: string }).date_emission,
                    )}
                  />
                  <Info
                    label="Expire le"
                    value={formatDate(
                      (finance.data.carte as { date_expiration: string | null }).date_expiration,
                    )}
                  />
                </dl>
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="size-4" /> Aucune carte émise pour ce dossier.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finances" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cotisations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(finance.data?.cotisations ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune cotisation enregistrée.</p>
              )}
              {(finance.data?.cotisations ?? []).map((item) => {
                const cot = item as {
                  id: string;
                  periode: string;
                  montant_usd: number;
                  montant_paye: number;
                  statut: string;
                };
                return (
                  <div
                    key={cot.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <CalendarClock className="size-4 text-muted-foreground" />
                      {formatDate(cot.periode)}
                    </span>
                    <span className="text-muted-foreground">
                      {Number(cot.montant_paye)} / {Number(cot.montant_usd)} $ · {cot.statut}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paiements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(finance.data?.paiements ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun paiement enregistré.</p>
              )}
              {(finance.data?.paiements ?? []).map((item) => {
                const pay = item as {
                  id: string;
                  montant_usd: number;
                  mode: string;
                  date_paiement: string;
                };
                return (
                  <div
                    key={pay.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span>{formatDateTime(pay.date_paiement)}</span>
                    <span className="text-muted-foreground">
                      {Number(pay.montant_usd)} $ · {pay.mode}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="soins" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prestations & remboursements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Le circuit de prise en charge (déclaration hôpital, avis du médecin conseil,
                remboursement) sera raccordé à ce dossier lors du module Prestations.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Les rappels d'échéance et alertes de statut seront diffusés ici (SMS et email).
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentsPanel adherentId={adherentId} canManage={canManage} />
        </TabsContent>

        <TabsContent value="historique" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4 text-accent" /> Historique et audit
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!canAudit && (
                <p className="mb-3 text-xs text-muted-foreground">
                  Le journal d'audit détaillé est réservé aux administrateurs.
                </p>
              )}
              <ol className="space-y-3">
                {(historique.data ?? []).length === 0 && (
                  <li className="text-sm text-muted-foreground">Aucun évènement enregistré.</li>
                )}
                {(historique.data ?? []).map((event) => (
                  <li key={event.id} className="flex gap-3 border-l-2 border-border pl-4 text-sm">
                    <div>
                      <p className="font-medium">{event.evenement.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(event.created_at)}
                        {event.ancien_statut && event.nouveau_statut
                          ? ` · ${event.ancien_statut} → ${event.nouveau_statut}`
                          : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AdherentDialog open={editOpen} onOpenChange={setEditOpen} adherent={row} />
      <BeneficiaireDialog
        open={benOpen}
        onOpenChange={setBenOpen}
        adherentId={adherentId}
        beneficiaire={benEdit}
        activeCount={actifs}
      />
    </div>
  );
}

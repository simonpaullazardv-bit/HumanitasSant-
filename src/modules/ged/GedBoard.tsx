/**
 * Module Gestion Électronique Documentaire (GED) (Prompt 23)
 * Photos adhérents, cartes imprimées, contrats, pièces d'identité, ordonnances, factures, reçus & justificatifs.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileCheck,
  FileCode,
  FilePlus,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Lock,
  Search,
  Shield,
  Upload,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function GedBoard() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useAuth();

  const [form, setForm] = useState({
    titre: "",
    categorie: "piece_identite",
    filename: "",
  });

  const documentsQuery = useQuery({
    queryKey: ["ged", "documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ged_documents" as never)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data ?? []) as Array<{
        id: string;
        titre: string;
        categorie: string;
        filename: string;
        bucket_id: string;
        file_path: string;
        file_size_kb: number;
        version: number;
        created_at: string;
      }>;
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !user?.id)
        throw new Error("Sélectionnez un fichier et vérifiez votre session.");
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
      const upload = await supabase.storage.from("documents_humanitas").upload(path, selectedFile, {
        contentType: selectedFile.type || "application/octet-stream",
        upsert: false,
      });
      if (upload.error) throw upload.error;
      const { error } = await supabase.from("ged_documents" as never).insert([
        {
          titre: form.titre,
          categorie: form.categorie,
          bucket_id: "documents_humanitas",
          file_path: path,
          filename: selectedFile.name,
          mime_type: selectedFile.type || "application/octet-stream",
          file_size_kb: Math.ceil(selectedFile.size / 1024),
          owner_id: user.id,
          version: 1,
          metadata: { original_name: selectedFile.name },
        } as never,
      ]);
      if (error) {
        await supabase.storage.from("documents_humanitas").remove([path]);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Document archivé dans la GED avec versioning et chiffrement.");
      setOpenModal(false);
      setSelectedFile(null);
      setForm({ titre: "", categorie: "piece_identite", filename: "" });
      void queryClient.invalidateQueries({ queryKey: ["ged", "documents"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filteredDocs = (documentsQuery.data ?? []).filter((d) =>
    `${d.titre} ${d.categorie} ${d.filename}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight flex items-center gap-2">
            <FolderOpen className="size-6 text-primary" /> Gestion Électronique Documentaire (GED)
          </h2>
          <p className="text-sm text-muted-foreground">
            Stockage sécurisé, versionné et chiffré des contrats, pièces d'identité, ordonnances,
            photos et factures.
          </p>
        </div>

        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="size-4" /> Classer un Nouveau Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un document dans la GED</DialogTitle>
              <DialogDescription>
                Rattachement d'une pièce justificative, photo ou contrat au coffre-fort numérique
                Humanitas.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Intitulé du Document</Label>
                <Input
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  placeholder="Pièce d'identité Adhérent ADH-2026-001"
                />
              </div>

              <div>
                <Label>Catégorie Documentaire</Label>
                <Select
                  value={form.categorie}
                  onValueChange={(val) => setForm({ ...form, categorie: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo_adherent">Photo Adhérent</SelectItem>
                    <SelectItem value="photo_personnel">Photo Personnel</SelectItem>
                    <SelectItem value="carte_imprimee">Carte Imprimée (PDF/PNG)</SelectItem>
                    <SelectItem value="fiche_adhesion">Fiche d'adhésion</SelectItem>
                    <SelectItem value="contrat">Contrat Partenaire / Entreprise</SelectItem>
                    <SelectItem value="fiche_prise_en_charge">Fiche de prise en charge</SelectItem>
                    <SelectItem value="piece_identite">Pièce d'Identité / Passeport</SelectItem>
                    <SelectItem value="ordonnance">Ordonnance Médicale</SelectItem>
                    <SelectItem value="facture">Facture Prestataire</SelectItem>
                    <SelectItem value="recu">Reçu de Paiement</SelectItem>
                    <SelectItem value="journal_caisse">Journal de caisse</SelectItem>
                    <SelectItem value="justificatif_remboursement">
                      Justificatif de remboursement
                    </SelectItem>
                    <SelectItem value="liste_remboursements">Liste des remboursements</SelectItem>
                    <SelectItem value="situation_financiere">
                      Situation financière d'un adhérent
                    </SelectItem>
                    <SelectItem value="depense">Dépense</SelectItem>
                    <SelectItem value="entree">Entrée financière</SelectItem>
                    <SelectItem value="justificatif">Justificatif Administratif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fichier à scanner / importer</Label>
                <Input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setSelectedFile(file);
                    setForm((current) => ({ ...current, filename: file?.name ?? "" }));
                  }}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Le fichier est réellement envoyé dans le bucket privé documents_humanitas. Sa
                  taille enregistrée correspond au fichier reçu.
                </p>
              </div>

              <Button
                onClick={() => uploadDocMutation.mutate()}
                disabled={uploadDocMutation.isPending || !form.titre || !selectedFile}
                className="w-full"
              >
                Uploader & Classer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un document, contrat, pièce..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Coffre-Fort Numérique & Archives</CardTitle>
          <CardDescription>
            Documents sécurisés accessibles selon les rôles et autorisations RLS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Taille</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Date d'Archivage</TableHead>
                <TableHead>Sécurité</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="size-4 text-primary" /> {doc.titre}
                  </TableCell>
                  <TableCell className="capitalize">{doc.categorie.replace(/_/g, " ")}</TableCell>
                  <TableCell className="font-mono text-xs">{doc.file_size_kb} KB</TableCell>
                  <TableCell className="font-mono text-xs">v{doc.version}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 gap-1">
                      <Lock className="size-3" /> Privé + RLS
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const { data, error } = await supabase.storage
                            .from(doc.bucket_id ?? "documents_humanitas")
                            .createSignedUrl(doc.file_path, 300);
                          if (error || !data?.signedUrl) {
                            toast.error("Document indisponible.");
                            return;
                          }
                          window.open(data.signedUrl, "_blank", "noopener,noreferrer");
                        }}
                      >
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const { data, error } = await supabase.storage
                            .from(doc.bucket_id ?? "documents_humanitas")
                            .createSignedUrl(doc.file_path, 300);
                          if (error || !data?.signedUrl) {
                            toast.error("Document indisponible.");
                            return;
                          }
                          const printWindow = window.open(
                            data.signedUrl,
                            "_blank",
                            "noopener,noreferrer",
                          );
                          printWindow?.addEventListener("load", () => printWindow.print(), {
                            once: true,
                          });
                        }}
                      >
                        Imprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDocs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    Aucun document archivé pour le moment.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

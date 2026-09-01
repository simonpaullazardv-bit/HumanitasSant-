/**
 * Module Administration Humanitas & RH (Prompt 17)
 * Personnel, RH, Salaires, Départements, Fonctions, Transport, Missions, Présences, Congés, Documents RH, Budgets & Dépenses Admin
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  FolderOpen,
  MapPin,
  Plus,
  Search,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function RhBoard() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [openPersonnelModal, setOpenPersonnelModal] = useState(false);
  const [openDepenseModal, setOpenDepenseModal] = useState(false);

  // Form states
  const [personnelForm, setPersonnelForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    fonction: "Agent",
    departement: "DIR_GEN",
    salaire_base_usd: "500",
  });

  const [depenseForm, setDepenseForm] = useState({
    categorie: "fournitures",
    libelle: "",
    montant_usd: "",
    piece_justificative: "",
  });

  // Queries
  const personnelQuery = useQuery({
    queryKey: ["rh", "personnel"],
    queryFn: async () => {
      const { data, error } = await supabase.from("personnel").select("*").order("nom");
      if (error) throw error;
      return data ?? [];
    },
  });

  const depensesQuery = useQuery({
    queryKey: ["rh", "depenses_administratives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("depenses_administratives" as never)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data ?? []) as Array<{
        id: string;
        categorie: string;
        libelle: string;
        montant_usd: number;
        date_depense: string;
        statut: string;
      }>;
    },
  });

  const presencesQuery = useQuery({
    queryKey: ["rh", "presences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presences_personnel" as never)
        .select("*, personnel(nom, prenom)")
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data ?? []) as unknown as Array<{
        id: string;
        date_presence: string;
        statut: string;
        observation: string | null;
        personnel: { nom: string; prenom: string } | null;
      }>;
    },
  });

  const congesQuery = useQuery({
    queryKey: ["rh", "conges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conges_personnel" as never)
        .select("*, personnel(nom, prenom)")
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data ?? []) as unknown as Array<{
        id: string;
        type_conge: string;
        date_debut: string;
        date_fin: string;
        nombre_jours: number;
        statut: string;
        personnel: { nom: string; prenom: string } | null;
      }>;
    },
  });

  // Mutations
  const createPersonnelMutation = useMutation({
    mutationFn: async () => {
      const matricule = "EMP-" + Math.floor(100000 + Math.random() * 900000);
      const { error } = await supabase.from("personnel").insert([
        {
          nom: personnelForm.nom,
          prenom: personnelForm.prenom,
          email: personnelForm.email || null,
          telephone: personnelForm.telephone || null,
          fonction: personnelForm.fonction,
          matricule,
          departement: personnelForm.departement || null,
        } as never,
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Membre du personnel ajouté avec succès.");
      setOpenPersonnelModal(false);
      void queryClient.invalidateQueries({ queryKey: ["rh", "personnel"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createDepenseMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("depenses_administratives" as never).insert([
        {
          categorie: depenseForm.categorie,
          libelle: depenseForm.libelle,
          montant_usd: parseFloat(depenseForm.montant_usd || "0"),
          piece_justificative: depenseForm.piece_justificative || null,
          statut: "validee",
        } as never,
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dépense administrative enregistrée.");
      setOpenDepenseModal(false);
      void queryClient.invalidateQueries({ queryKey: ["rh", "depenses_administratives"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filteredPersonnel = (personnelQuery.data ?? []).filter((p) =>
    `${p.nom} ${p.prenom} ${p.matricule} ${p.fonction}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const totalMasseSalarialeEstimate = (personnelQuery.data ?? []).length * 650;
  const totalDepensesAdmin = (depensesQuery.data ?? []).reduce(
    (sum, d) => sum + Number(d.montant_usd || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* En-tête KPI RH */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Effectif Personnel</CardTitle>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personnelQuery.data?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">Collaborateurs enregistrés</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Masse Salariale Estimée</CardTitle>
            <Wallet className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalMasseSalarialeEstimate.toLocaleString("fr-FR")} $
            </div>
            <p className="text-xs text-muted-foreground">Mensuel théorique</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépenses Admin Cumulées</CardTitle>
            <DollarSign className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDepensesAdmin.toLocaleString("fr-FR")} $</div>
            <p className="text-xs text-muted-foreground">
              Achats, Loyer, Transport & Fonctionnement
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandes de Congés</CardTitle>
            <CalendarCheck className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{congesQuery.data?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">Dossiers en traitement</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions & Recherche */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un membre du personnel, matricule, fonction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={openPersonnelModal} onOpenChange={setOpenPersonnelModal}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" /> Nouveau Collaborateur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un membre du personnel</DialogTitle>
                <DialogDescription>
                  Inscrivez un nouveau collaborateur au sein de la mutuelle Humanitas Santé.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nom</Label>
                    <Input
                      value={personnelForm.nom}
                      onChange={(e) => setPersonnelForm({ ...personnelForm, nom: e.target.value })}
                      placeholder="MUKENDI"
                    />
                  </div>
                  <div>
                    <Label>Prénom</Label>
                    <Input
                      value={personnelForm.prenom}
                      onChange={(e) =>
                        setPersonnelForm({ ...personnelForm, prenom: e.target.value })
                      }
                      placeholder="David"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={personnelForm.email}
                      onChange={(e) =>
                        setPersonnelForm({ ...personnelForm, email: e.target.value })
                      }
                      placeholder="d.mukendi@humanitas.cd"
                    />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input
                      value={personnelForm.telephone}
                      onChange={(e) =>
                        setPersonnelForm({ ...personnelForm, telephone: e.target.value })
                      }
                      placeholder="+243 810 000 000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Fonction</Label>
                    <Select
                      value={personnelForm.fonction}
                      onValueChange={(val) => setPersonnelForm({ ...personnelForm, fonction: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Agent Terrain">Agent Terrain</SelectItem>
                        <SelectItem value="Coordonnateur">Coordonnateur</SelectItem>
                        <SelectItem value="Comptable">Comptable</SelectItem>
                        <SelectItem value="Médecin Conseil">Médecin Conseil</SelectItem>
                        <SelectItem value="Responsable RH">Responsable RH</SelectItem>
                        <SelectItem value="Informaticien">Informaticien</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Département</Label>
                    <Select
                      value={personnelForm.departement}
                      onValueChange={(val) =>
                        setPersonnelForm({ ...personnelForm, departement: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIR_GEN">Direction Générale</SelectItem>
                        <SelectItem value="MED_CONS">Médecine Conseil</SelectItem>
                        <SelectItem value="FIN_COMPT">Finance & Comptabilité</SelectItem>
                        <SelectItem value="RH_ADMIN">Ressources Humaines</SelectItem>
                        <SelectItem value="COORDIN">Coordination & Réseau</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Salaire de base (USD)</Label>
                  <Input
                    type="number"
                    value={personnelForm.salaire_base_usd}
                    onChange={(e) =>
                      setPersonnelForm({ ...personnelForm, salaire_base_usd: e.target.value })
                    }
                  />
                </div>

                <Button
                  onClick={() => createPersonnelMutation.mutate()}
                  disabled={
                    createPersonnelMutation.isPending || !personnelForm.nom || !personnelForm.prenom
                  }
                  className="w-full"
                >
                  Enregistrer le collaborateur
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openDepenseModal} onOpenChange={setOpenDepenseModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <DollarSign className="size-4" /> Dépense Administrative
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enregistrer une dépense d'exploitation</DialogTitle>
                <DialogDescription>
                  Saisie des frais administratifs (loyer, transport, fournitures, télécom).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Catégorie de Dépense</Label>
                  <Select
                    value={depenseForm.categorie}
                    onValueChange={(val) => setDepenseForm({ ...depenseForm, categorie: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fournitures">Fournitures de bureau</SelectItem>
                      <SelectItem value="loyer">Loyer & Immobilier</SelectItem>
                      <SelectItem value="transport">Transport & Carburant</SelectItem>
                      <SelectItem value="telecom">Télécom & Internet</SelectItem>
                      <SelectItem value="energie">Énergie & Carburant groupe</SelectItem>
                      <SelectItem value="divers">Frais divers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Libellé / Description</Label>
                  <Input
                    value={depenseForm.libelle}
                    onChange={(e) => setDepenseForm({ ...depenseForm, libelle: e.target.value })}
                    placeholder="Achat de rames de papier et cartouches d'encre"
                  />
                </div>

                <div>
                  <Label>Montant Total (USD)</Label>
                  <Input
                    type="number"
                    value={depenseForm.montant_usd}
                    onChange={(e) =>
                      setDepenseForm({ ...depenseForm, montant_usd: e.target.value })
                    }
                    placeholder="150"
                  />
                </div>

                <div>
                  <Label>N° Pièce Justificative / N° Facture</Label>
                  <Input
                    value={depenseForm.piece_justificative}
                    onChange={(e) =>
                      setDepenseForm({ ...depenseForm, piece_justificative: e.target.value })
                    }
                    placeholder="FAC-2026-88"
                  />
                </div>

                <Button
                  onClick={() => createDepenseMutation.mutate()}
                  disabled={
                    createDepenseMutation.isPending ||
                    !depenseForm.libelle ||
                    !depenseForm.montant_usd
                  }
                  className="w-full"
                >
                  Valider la dépense
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Vue par Onglets RH */}
      <Tabs defaultValue="personnel" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="personnel">Personnel & RH</TabsTrigger>
          <TabsTrigger value="depenses">Dépenses Administratives</TabsTrigger>
          <TabsTrigger value="presences">Présences & Pointage</TabsTrigger>
          <TabsTrigger value="conges">Congés & Permissions</TabsTrigger>
          <TabsTrigger value="departements">Départements & Budgets</TabsTrigger>
        </TabsList>

        <TabsContent value="personnel" className="space-y-4">
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Registre du Personnel Humanitas</CardTitle>
              <CardDescription>
                Liste exhaustive des agents, médecins conseils, cadres et personnel administratif.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Nom & Prénom</TableHead>
                    <TableHead>Fonction</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPersonnel.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono font-semibold text-xs">
                        {p.matricule}
                      </TableCell>
                      <TableCell className="font-medium">
                        {p.nom} {p.prenom}
                      </TableCell>
                      <TableCell>{p.fonction}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.telephone || p.email || "Non renseigné"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        >
                          Actif
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPersonnel.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        Aucun collaborateur trouvé.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="depenses" className="space-y-4">
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Journal des Dépenses d'Exploitation</CardTitle>
              <CardDescription>
                Historique des sorties administratives. Aucune suppression n'est autorisée.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Montant (USD)</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(depensesQuery.data ?? []).map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-xs">
                        {new Date(d.date_depense).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="capitalize">{d.categorie}</TableCell>
                      <TableCell className="font-medium">{d.libelle}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-rose-600">
                        {d.montant_usd.toLocaleString("fr-FR")} $
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                          {d.statut}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(depensesQuery.data ?? []).length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        Aucune dépense administrative enregistrée.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presences" className="space-y-4">
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Feuille de Présence & Pointage</CardTitle>
              <CardDescription>
                Suivi quotidien de la présence des équipes sur le terrain et au siège.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Collaborateur</TableHead>
                    <TableHead>Statut Pointage</TableHead>
                    <TableHead>Observations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(presencesQuery.data ?? []).map((pr) => (
                    <TableRow key={pr.id}>
                      <TableCell className="text-xs">
                        {new Date(pr.date_presence).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {pr.personnel ? `${pr.personnel.nom} ${pr.personnel.prenom}` : "Agent"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                          {pr.statut}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {pr.observation || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(presencesQuery.data ?? []).length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        Aucun registre de présence pour aujourd'hui.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conges" className="space-y-4">
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Gestion des Congés & Absences</CardTitle>
              <CardDescription>
                Demandes de congés annuels, de maladie et de circonstances.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Collaborateur</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead className="text-center">Jours</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(congesQuery.data ?? []).map((cg) => (
                    <TableRow key={cg.id}>
                      <TableCell className="font-medium">
                        {cg.personnel ? `${cg.personnel.nom} ${cg.personnel.prenom}` : "Agent"}
                      </TableCell>
                      <TableCell className="capitalize">{cg.type_conge}</TableCell>
                      <TableCell className="text-xs">
                        Du {new Date(cg.date_debut).toLocaleDateString("fr-FR")} au{" "}
                        {new Date(cg.date_fin).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-center font-mono font-semibold">
                        {cg.nombre_jours}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600">
                          {cg.statut}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(congesQuery.data ?? []).length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        Aucune demande de congé enregistrée.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departements" className="space-y-4">
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Structure Organisationnelle & Budgets</CardTitle>
              <CardDescription>Allocation budgétaire par direction fonctionnelle.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-border p-4 bg-muted/30">
                <div className="flex items-center gap-2 font-bold text-foreground mb-1">
                  <Building2 className="size-4 text-primary" /> Direction Générale
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Pilotage stratégique, communication et relations institutionnelles.
                </p>
                <div className="text-sm font-semibold">Budget Alloué : 50,000 $</div>
              </div>

              <div className="rounded-xl border border-border p-4 bg-muted/30">
                <div className="flex items-center gap-2 font-bold text-foreground mb-1">
                  <UserCheck className="size-4 text-emerald-500" /> Médecine Conseil
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Audit médical, révision des factures hospitalières et protocoles.
                </p>
                <div className="text-sm font-semibold">Budget Alloué : 35,000 $</div>
              </div>

              <div className="rounded-xl border border-border p-4 bg-muted/30">
                <div className="flex items-center gap-2 font-bold text-foreground mb-1">
                  <Wallet className="size-4 text-blue-500" /> Finance & Comptabilité
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Gestion de la caisse, recouvrement des cotisations et trésorerie.
                </p>
                <div className="text-sm font-semibold">Budget Alloué : 40,000 $</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

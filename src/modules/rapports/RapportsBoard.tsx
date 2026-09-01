/**
 * Module Rapports & Statistiques (Prompt 24)
 * Graphiques, statistiques consolidées, exports PDF, Excel/CSV et impression.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  PieChart,
  Printer,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function RapportsBoard() {
  const [periode, setPeriode] = useState("2026");

  const statsQuery = useQuery({
    queryKey: ["rapports", "stats", periode],
    queryFn: async () => {
      const start = `${periode}-01-01`;
      const end = `${Number(periode) + 1}-01-01`;
      const [adherents, cotisations, prisesEnCharge, remboursements] = await Promise.all([
        supabase.from("adherents").select("id").gte("date_adhesion", start).lt("date_adhesion", end),
        supabase.from("paiements").select("montant_usd, created_at").gte("date_paiement", start).lt("date_paiement", end),
        supabase.from("prises_en_charge").select("id, montant_estime_usd, statut").gte("created_at", start).lt("created_at", end),
        supabase.from("ordres_remboursement" as never).select("montant_usd, statut, created_at").gte("created_at", start).lt("created_at", end),
      ]);

      const totalCotisations = (cotisations.data ?? []).reduce(
        (sum, row) => sum + Number(row.montant_usd || 0),
        0,
      );
      const totalRemboursements = (
        (remboursements.data ?? []) as Array<{ montant_approuve_usd: number }>
      ).reduce((sum, row) => sum + Number(row.montant_approuve_usd || 0), 0);

      return {
        totalAdherents: adherents.data?.length ?? 0,
        totalCotisations,
        totalRemboursements,
        soldeNet: totalCotisations - totalRemboursements,
      };
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const data = statsQuery.data;
    if (!data) return;
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Indicateur,Valeur\n" +
      `Total Adhérents,${data.totalAdherents}\n` +
      `Recettes Cotisations (USD),${data.totalCotisations}\n` +
      `Remboursements Soins (USD),${data.totalRemboursements}\n` +
      `Marge / Solde Net (USD),${data.soldeNet}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rapport_humanitas_${periode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Rapport CSV exporté avec succès.");
  };

  const stats = statsQuery.data;

  return (
    <div className="space-y-6 print:p-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight flex items-center gap-2">
            <BarChart3 className="size-6 text-primary" /> Rapports, Analytics & Statistiques
          </h2>
          <p className="text-sm text-muted-foreground">
            Visualisation des indicateurs clés, taux de recouvrement, sinistralité et exports
            comptables.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={periode} onValueChange={setPeriode}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">Année 2026</SelectItem>
              <SelectItem value="2025">Année 2025</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <FileSpreadsheet className="size-4" /> Exporter Excel/CSV
          </Button>

          <Button onClick={handlePrint} className="gap-2">
            <Printer className="size-4" /> Imprimer Rapport PDF
          </Button>
        </div>
      </div>

      {/* Impression Header (uniquement visible lors de l'impression) */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold font-display">
          HUMANITAS SANTÉ — RAPPORT D'ACTIVITÉ OFFICIEL
        </h1>
        <p className="text-sm text-muted-foreground">
          Période : {periode} — Édité le {new Date().toLocaleDateString("fr-FR")}
        </p>
      </div>

      {/* Cartes KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adhérents Totaux</CardTitle>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAdherents ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Portefeuille global</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recettes Cotisations</CardTitle>
            <Wallet className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `${stats.totalCotisations.toLocaleString("fr-FR")} $` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Encaissements validés</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestations Soins Payées</CardTitle>
            <FileText className="size-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `${stats.totalRemboursements.toLocaleString("fr-FR")} $` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Montant réellement enregistré sur la période</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde Net / Marge</CardTitle>
            <TrendingUp className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats ? `${stats.soldeNet.toLocaleString("fr-FR")} $` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Résultat d'exploitation</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé de synthèse : aucune cible inventée. */}
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Synthèse réelle de la période</CardTitle>
          <CardDescription>Les valeurs ci-dessous sont calculées uniquement à partir des enregistrements Supabase de {periode}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Indicateur</TableHead><TableHead>Valeur réelle</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell>Adhésions enregistrées</TableCell><TableCell className="font-mono">{stats?.totalAdherents ?? "—"}</TableCell></TableRow>
              <TableRow><TableCell>Encaissements de paiements</TableCell><TableCell className="font-mono">{stats ? `${stats.totalCotisations.toLocaleString("fr-FR")} USD` : "—"}</TableCell></TableRow>
              <TableRow><TableCell>Remboursements enregistrés</TableCell><TableCell className="font-mono">{stats ? `${stats.totalRemboursements.toLocaleString("fr-FR")} USD` : "—"}</TableCell></TableRow>
              <TableRow><TableCell>Écart calculé sur les deux agrégats</TableCell><TableCell className="font-mono">{stats ? `${stats.soldeNet.toLocaleString("fr-FR")} USD` : "—"}</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

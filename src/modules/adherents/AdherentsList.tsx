/**
 * Liste des adhérents : recherche, filtres, création.
 * Le périmètre visible est déterminé par les policies RLS du rôle connecté.
 */
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { AdherentDialog } from "./AdherentDialog";
import {
  STATUTS,
  STATUT_BADGE,
  STATUT_LABELS,
  TYPE_ADHESION_LABELS,
  formatDate,
  fullName,
  type StatutAdherent,
  type TypeAdhesion,
} from "./constants";
import { adherentsQuery } from "./queries";

export function AdherentsList() {
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["super_admin", "administrateur", "coordonnateur"]);
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState<StatutAdherent | "tous">("tous");
  const [type, setType] = useState<TypeAdhesion | "tous">("tous");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filters = useMemo(() => ({ search, statut, type }), [search, statut, type]);
  const list = useQuery(adherentsQuery(filters));
  const rows = list.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Adhérents</h2>
          <p className="text-sm text-muted-foreground">
            {rows.length} dossier{rows.length > 1 ? "s" : ""} accessible
            {rows.length > 1 ? "s" : ""} avec votre rôle.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" /> Nouvel adhérent
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom, numéro Humanitas, téléphone, email…"
            className="pl-9"
          />
        </div>
        <Select
          value={statut}
          onValueChange={(value) => setStatut(value as StatutAdherent | "tous")}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les statuts</SelectItem>
            {STATUTS.map((value) => (
              <SelectItem key={value} value={value}>
                {STATUT_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(value) => setType(value as TypeAdhesion | "tous")}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les types</SelectItem>
            {Object.entries(TYPE_ADHESION_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Humanitas</TableHead>
              <TableHead>Identité</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden lg:table-cell">Contact</TableHead>
              <TableHead className="hidden lg:table-cell">Adhésion</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Dossier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Chargement des dossiers…
                </TableCell>
              </TableRow>
            )}
            {!list.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <Users className="mx-auto mb-2 size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Aucun adhérent pour ces critères.</p>
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-xs">{row.matricule}</TableCell>
                <TableCell className="font-medium">{fullName(row)}</TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {TYPE_ADHESION_LABELS[row.type_adhesion]}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {row.telephone ?? row.email ?? "—"}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {formatDate(row.date_adhesion)}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                      STATUT_BADGE[row.statut],
                    )}
                  >
                    {STATUT_LABELS[row.statut]}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/portail/adherents/$id" params={{ id: row.id }}>
                      Ouvrir
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AdherentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

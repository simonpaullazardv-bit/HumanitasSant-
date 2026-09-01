import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Award, CheckCircle2, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

type GratificationRow = {
  id: string;
  type_gratification: "adherent" | "entreprise";
  adherent_id: string | null;
  entreprise_id: string | null;
  periode_debut: string;
  periode_fin: string;
  statut: string;
  montant_usd: number;
  motif: string | null;
};

export function GratificationsBoard({ compact = false }: { compact?: boolean }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["gratifications-board"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("gratifications")
        .select("id,type_gratification,adherent_id,entreprise_id,periode_debut,periode_fin,statut,montant_usd,motif")
        .order("periode_fin", { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = (data ?? []) as GratificationRow[];
      return {
        rows,
        total: rows.length,
        proposed: rows.filter((r) => r.statut === "proposee").length,
        approved: rows.filter((r) => r.statut === "approuvee").length,
        awarded: rows.filter((r) => r.statut === "attribuee").length,
      };
    },
    staleTime: 15_000,
  });

  useEffect(() => {
    const channel = supabase.channel("gratifications-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "gratifications" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["gratifications-board"] });
      });
    void channel.subscribe();
    return () => void supabase.removeChannel(channel);
  }, [queryClient]);

  const data = query.data;
  return (
    <section className="mt-6 rounded-2xl border border-border/80 bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Award className="size-5" /></span>
          <div>
            <h2 className="font-display text-base font-bold">Gratifications</h2>
            <p className="text-sm text-muted-foreground">Adhérents fidèles et entreprises partenaires, sur données réelles.</p>
          </div>
        </div>
        <Badge variant="secondary">Temps réel</Badge>
      </div>
      {query.isError ? <p className="mt-4 text-sm text-destructive">Données de gratification indisponibles.</p> : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Dossiers" value={data?.total ?? "—"} icon={Award} />
            <Metric label="Proposées" value={data?.proposed ?? "—"} icon={Clock3} />
            <Metric label="Approuvées" value={data?.approved ?? "—"} icon={CheckCircle2} />
            <Metric label="Attribuées" value={data?.awarded ?? "—"} icon={CheckCircle2} />
          </div>
          {!compact && <div className="mt-5 overflow-x-auto rounded-xl border border-border/70"><table className="w-full text-sm"><thead className="bg-surface text-left text-xs text-muted-foreground"><tr><th className="p-3">Type</th><th className="p-3">Période</th><th className="p-3">Statut</th><th className="p-3 text-right">Montant USD</th></tr></thead><tbody>{(data?.rows ?? []).map((row) => <tr key={row.id} className="border-t border-border/60"><td className="p-3">{row.type_gratification === "entreprise" ? "Entreprise" : "Adhérent"}</td><td className="p-3">{row.periode_debut} → {row.periode_fin}</td><td className="p-3"><Badge variant="outline">{row.statut}</Badge></td><td className="p-3 text-right font-mono">{Number(row.montant_usd).toFixed(2)}</td></tr>)}{(data?.rows ?? []).length === 0 && <tr><td colSpan={4} className="p-5 text-center text-muted-foreground">Aucune gratification enregistrée.</td></tr>}</tbody></table></div>}
        </>
      )}
    </section>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof Award }) {
  return <div className="rounded-xl border border-border/70 bg-surface p-4"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{label}</span><Icon className="size-4 text-primary" /></div><p className="mt-2 font-display text-2xl font-bold">{value}</p></div>;
}

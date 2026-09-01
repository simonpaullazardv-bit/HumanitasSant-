import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, MessageSquareText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RequestRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  tier: string;
  status: "pending" | "contacted" | "approved" | "rejected";
  response_message: string | null;
  created_at: string;
  reviewed_by: string | null;
}

const READ_ROLES = ["super_admin", "administrateur", "directeur_general", "coordonnateur", "medecin_conseil", "financier", "agent_humanitas"] as const;

export function MembershipRequestsInbox() {
  const { roles, user } = useAuth();
  const canRespond = roles.includes("coordonnateur");
  const canRead = roles.some((role) => READ_ROLES.includes(role as (typeof READ_ROLES)[number]));
  const client = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, { status: RequestRow["status"]; response_message: string }>>({});

  const query = useQuery({
    queryKey: ["membership-requests-inbox"],
    enabled: canRead,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_requests" as never)
        .select("id,full_name,email,phone,tier,status,response_message,created_at,reviewed_by")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as RequestRow[];
    },
  });

  useEffect(() => {
    if (!canRead) return;
    const channel = supabase
      .channel("membership-requests-inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "membership_requests" }, () => {
        void client.invalidateQueries({ queryKey: ["membership-requests-inbox"] });
      });
    void channel.subscribe();
    return () => void supabase.removeChannel(channel);
  }, [canRead, client]);

  if (!canRead) return null;

  async function respond(row: RequestRow) {
    if (!canRespond || !user?.id) return;
    const draft = drafts[row.id] ?? { status: row.status, response_message: row.response_message ?? "" };
    const { error } = await supabase
      .from("membership_requests" as never)
      .update({
        status: draft.status,
        response_message: draft.response_message || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        responded_at: new Date().toISOString(),
      } as never)
      .eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Réponse de la demande enregistrée.");
    void client.invalidateQueries({ queryKey: ["membership-requests-inbox"] });
  }

  return (
    <section className="mt-6 rounded-2xl border border-border/80 bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold">Boîte des demandes d'adhésion</h2>
          <p className="text-sm text-muted-foreground">Lecture pour les responsables autorisés. Seul le Coordonnateur peut répondre ou changer le statut.</p>
        </div>
        <Badge variant={canRespond ? "default" : "secondary"}>{canRespond ? "Réponse autorisée" : "Lecture seule"}</Badge>
      </div>

      {query.isPending ? <p className="mt-5 text-sm text-muted-foreground">Chargement des demandes…</p> : null}
      {query.data?.length === 0 ? <p className="mt-5 rounded-xl bg-surface p-4 text-sm text-muted-foreground">Aucune demande d'adhésion enregistrée.</p> : null}
      <div className="mt-5 space-y-3">
        {(query.data ?? []).map((row) => {
          const draft = drafts[row.id] ?? { status: row.status, response_message: row.response_message ?? "" };
          return (
            <article key={row.id} className="rounded-xl border border-border/70 bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{row.full_name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{row.email || "Email non fourni"} · {row.phone || "Téléphone non fourni"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Catégorie : <strong>{row.tier}</strong> · {new Date(row.created_at).toLocaleString("fr-FR")}</p>
                </div>
                <Badge variant="secondary">{row.status}</Badge>
              </div>

              {canRespond ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-[180px_1fr_auto] lg:items-end">
                  <label className="text-xs font-medium">Statut<select value={draft.status} onChange={(event) => setDrafts((current) => ({ ...current, [row.id]: { ...draft, status: event.target.value as RequestRow["status"] } }))} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="pending">En attente</option><option value="contacted">Contactée</option><option value="approved">Approuvée</option><option value="rejected">Rejetée</option></select></label>
                  <label className="text-xs font-medium">Réponse du Coordonnateur<Textarea rows={2} value={draft.response_message} onChange={(event) => setDrafts((current) => ({ ...current, [row.id]: { ...draft, response_message: event.target.value } }))} placeholder="Message à transmettre au demandeur…" /></label>
                  <Button onClick={() => void respond(row)}><MessageSquareText className="mr-2 size-4" />Enregistrer</Button>
                </div>
              ) : row.response_message ? (
                <p className="mt-3 rounded-lg border border-border/60 bg-card p-3 text-sm text-muted-foreground"><CheckCircle2 className="mr-2 inline size-4 text-primary" />{row.response_message}</p>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground"><Clock3 className="mr-1 inline size-3.5" />Traitement réservé au Coordonnateur.</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

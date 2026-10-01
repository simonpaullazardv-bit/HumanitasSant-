import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Building2,
  CreditCard,
  FileText,
  HeartPulse,
  Hospital,
  Receipt,
  ShieldCheck,
  Users,
  Wallet,
  Pill,
  Microscope,
} from "lucide-react";
import { DashboardLayout, KpiCard } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { DASHBOARDS } from "./dashboardConfig";
import { supabase } from "@/integrations/supabase/client";
import { EspacePartenaire } from "@/modules/partenaires/EspacePartenaire";

function useRealtime(tableNames: string[], queryKeys: string[][]) {
  const queryClient = useQueryClient();
  const tableKey = tableNames.join("|");
  const queryKeyJson = JSON.stringify(queryKeys);
  useEffect(() => {
    const key = tableKey.replaceAll("|", "-");
    const channel = supabase.channel(`dashboard:${key}`);
    tableKey
      .split("|")
      .filter(Boolean)
      .forEach((table) => {
        channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
          JSON.parse(queryKeyJson).forEach((queryKey: string[]) => {
            void queryClient.invalidateQueries({ queryKey });
          });
        });
      });
    void channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, tableKey, queryKeyJson]);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-soft">
      <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Loading() {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
      Chargement de votre espace…
    </div>
  );
}

function BeneficiaireClaimPanel() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const claim = async () => {
    setBusy(true);
    setMessage(null);
    const { data, error } = await (supabase.rpc(
      "lier_mon_compte_beneficiaire" as never,
      { _code: code.trim() } as never,
    ) as any);
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (!data?.success) {
      setMessage(data?.message ?? "Rattachement impossible.");
      return;
    }
    setMessage("Compte bénéficiaire rattaché. Actualisation de votre espace…");
    window.location.reload();
  };
  return (
    <Section title="Rattacher mon compte bénéficiaire">
      <p className="text-sm text-muted-foreground">
        Si Humanitas a enregistré votre adresse email sur votre dossier bénéficiaire, saisissez
        votre code personnel. Le code seul ne suffit pas : l'email du compte doit correspondre au
        dossier.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="BEN-2026-000001"
        />
        <Button disabled={busy || !code.trim()} onClick={() => void claim()}>
          {busy ? "Rattachement…" : "Rattacher mon compte"}
        </Button>
      </div>
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </Section>
  );
}

function AdherentDashboard({ id }: { id: string }) {
  const dossier = useQuery({
    queryKey: ["account", "adherent", id],
    queryFn: async () => {
      const [a, card, bens, adhesions, cotisations, pec] = await Promise.all([
        supabase.from("adherents").select("*").eq("id", id).single(),
        supabase
          .from("cartes_membre")
          .select("*")
          .eq("adherent_id", id)
          .eq("statut", "active")
          .maybeSingle(),
        supabase
          .from("beneficiaires")
          .select("id,nom,prenom,lien,code,is_active")
          .eq("adherent_id", id)
          .eq("is_active", true),
        supabase
          .from("adhesions")
          .select("*")
          .eq("adherent_id", id)
          .order("date_debut", { ascending: false })
          .limit(5),
        supabase
          .from("cotisations")
          .select("*")
          .eq("adherent_id", id)
          .order("periode", { ascending: false })
          .limit(12),
        supabase
          .from("prises_en_charge")
          .select("id,numero,statut,motif,montant_estime_usd,created_at")
          .eq("adherent_id", id)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      for (const response of [a, card, bens, adhesions, cotisations, pec])
        if (response.error) throw response.error;
      return {
        adherent: a.data,
        card: card.data,
        beneficiaires: bens.data ?? [],
        adhesions: adhesions.data ?? [],
        cotisations: cotisations.data ?? [],
        pec: pec.data ?? [],
      };
    },
  });
  useRealtime(
    ["adherents", "beneficiaires", "cartes_membre", "adhesions", "cotisations", "prises_en_charge"],
    [["account", "adherent", id]],
  );
  if (dossier.isPending) return <Loading />;
  const d = dossier.data!;
  const dues = d.cotisations.reduce(
    (n, c) => n + Math.max(Number(c.montant_usd) - Number(c.montant_paye), 0),
    0,
  );
  const active = d.adhesions.some(
    (a) =>
      a.statut === "actif" && (!a.date_fin || a.date_fin >= new Date().toISOString().slice(0, 10)),
  );
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Couverture"
          value={active ? "ACTIVE" : "À vérifier"}
          hint="État de votre adhésion"
          icon={ShieldCheck}
        />
        <KpiCard
          label="Bénéficiaires"
          value={d.beneficiaires.length}
          hint="Personnes rattachées"
          icon={Users}
        />
        <KpiCard
          label="Solde à payer"
          value={`${dues.toLocaleString("fr-FR")} $`}
          hint="Cotisations restantes"
          icon={Wallet}
        />
        <KpiCard
          label="Prises en charge"
          value={d.pec.length}
          hint="Dernières demandes"
          icon={HeartPulse}
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Section title="Ma carte et mon identité">
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <span className="text-muted-foreground">Matricule</span>
              <p className="font-mono font-semibold">{d.adherent.matricule}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Nom</span>
              <p className="font-semibold">
                {[d.adherent.nom, d.adherent.postnom, d.adherent.prenom].filter(Boolean).join(" ")}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Carte</span>
              <p>{d.card?.numero ?? "Aucune carte active"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Expiration</span>
              <p>{d.card?.date_expiration ?? "—"}</p>
            </div>
          </div>
        </Section>
        <Section title="Mes bénéficiaires">
          <div className="space-y-2">
            {d.beneficiaires.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl bg-surface p-3 text-sm"
              >
                <span>
                  {b.nom} {b.prenom ?? ""} · {b.lien}
                </span>
                <Badge variant="secondary">{b.code}</Badge>
              </div>
            ))}
            {d.beneficiaires.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun bénéficiaire actif.</p>
            )}
          </div>
        </Section>
        <Section title="Mes dernières cotisations">
          <div className="space-y-2">
            {d.cotisations.slice(0, 6).map((c) => (
              <div key={c.id} className="flex justify-between rounded-xl bg-surface p-3 text-sm">
                <span>{c.periode}</span>
                <span>
                  {Number(c.montant_paye).toFixed(2)} / {Number(c.montant_usd).toFixed(2)} $ ·{" "}
                  {c.statut}
                </span>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Mes prises en charge">
          <div className="space-y-2">
            {d.pec.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className="flex justify-between gap-3 rounded-xl bg-surface p-3 text-sm"
              >
                <span className="font-mono">{p.numero}</span>
                <span>{p.motif}</span>
                <Badge variant="secondary">{p.statut}</Badge>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}

function BeneficiaireDashboard({ id }: { id: string }) {
  const dossier = useQuery({
    queryKey: ["account", "beneficiaire", id],
    queryFn: async () => {
      const [b, card, pec] = await Promise.all([
        supabase
          .from("beneficiaires")
          .select("*, adherents(id,matricule,nom,postnom,prenom,statut,categorie_id)")
          .eq("id", id)
          .single(),
        supabase
          .from("cartes_membre")
          .select("*")
          .eq("beneficiaire_id", id)
          .eq("statut", "active")
          .maybeSingle(),
        supabase
          .from("prises_en_charge")
          .select("id,numero,statut,motif,montant_estime_usd,created_at")
          .eq("beneficiaire_id", id)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      for (const response of [b, card, pec]) if (response.error) throw response.error;
      return { beneficiaire: b.data, card: card.data, pec: pec.data ?? [] };
    },
  });
  useRealtime(
    ["beneficiaires", "cartes_membre", "prises_en_charge"],
    [["account", "beneficiaire", id]],
  );
  if (dossier.isPending) return <Loading />;
  const b = dossier.data!.beneficiaire;
  const parent = Array.isArray(b.adherents) ? b.adherents[0] : b.adherents;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Mon statut"
          value={b.is_active && parent?.statut === "actif" ? "ACTIF" : "INACTIF"}
          hint="Droits hérités de la couverture familiale"
          icon={ShieldCheck}
        />
        <KpiCard
          label="Mon code"
          value={b.code ?? "—"}
          hint="À présenter à un établissement"
          icon={BadgeCheck}
        />
        <KpiCard
          label="Ma carte"
          value={dossier.data!.card?.numero ?? "—"}
          hint="Carte bénéficiaire"
          icon={CreditCard}
        />
        <KpiCard
          label="Prises en charge"
          value={dossier.data!.pec.length}
          hint="Mon historique personnel"
          icon={HeartPulse}
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Section title="Mon compte bénéficiaire">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Nom</dt>
              <dd className="font-semibold">
                {b.nom} {b.prenom ?? ""}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Lien</dt>
              <dd>{b.lien}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Code</dt>
              <dd className="font-mono">{b.code}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Adhérent titulaire</dt>
              <dd>{parent ? `${parent.matricule} · ${parent.nom} ${parent.prenom ?? ""}` : "—"}</dd>
            </div>
          </dl>
        </Section>
        <Section title="Ma carte">
          <p className="text-sm text-muted-foreground">
            Cette carte est personnelle au bénéficiaire. Son rôle de connexion reste{" "}
            <strong>adherent</strong>, mais son <strong>beneficiaire_id</strong> cloisonne son
            espace.
          </p>
          <div className="mt-4 rounded-xl bg-surface p-4 font-mono text-sm">
            {dossier.data!.card?.numero ?? "Carte non encore émise"}
          </div>
        </Section>
        <Section title="Mon historique de prise en charge">
          <div className="space-y-2">
            {dossier.data!.pec.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap justify-between gap-2 rounded-xl bg-surface p-3 text-sm"
              >
                <span>
                  {p.numero} · {p.motif}
                </span>
                <Badge variant="secondary">{p.statut}</Badge>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}

function PartenaireDashboard({
  role,
}: {
  role: "hopital" | "pharmacie" | "laboratoire" | "centre_bien_etre" | "entreprise";
}) {
  const { user } = useAuth();
  const partenaire = useQuery({
    queryKey: ["account", role, user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data: links, error } = await supabase
        .from("partenaire_membres")
        .select("partenaire_id")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .limit(1);
      if (error) throw error;
      const id = (links?.[0] as { partenaire_id: string } | undefined)?.partenaire_id;
      if (!id) return null;
      const [p, contracts, pec, invoices, employees] = await Promise.all([
        supabase.from("partenaires").select("*").eq("id", id).single(),
        supabase
          .from("contrats_partenaires")
          .select("*")
          .eq("partenaire_id", id)
          .order("date_debut", { ascending: false }),
        supabase
          .from("prises_en_charge")
          .select("id,numero,statut,montant_estime_usd,created_at")
          .eq("partenaire_id", id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("factures_partenaires")
          .select("id,numero,montant_usd,statut,created_at")
          .eq("partenaire_id", id)
          .order("created_at", { ascending: false })
          .limit(20),
        role === "entreprise"
          ? supabase
              .from("adherents")
              .select("id", { count: "exact", head: true })
              .eq("entreprise_id", id)
          : Promise.resolve({ count: null, error: null }),
      ]);
      for (const response of [p, contracts, pec, invoices, employees])
        if (response.error) throw response.error;
      return {
        id,
        partenaire: p.data,
        contracts: contracts.data ?? [],
        pec: pec.data ?? [],
        invoices: invoices.data ?? [],
        employees: employees.count ?? 0,
      };
    },
  });
  useRealtime(
    [
      "partenaires",
      "partenaire_membres",
      "contrats_partenaires",
      "prises_en_charge",
      "factures_partenaires",
    ],
    [["account", role, user?.id ?? ""]],
  );
  if (partenaire.isPending) return <Loading />;
  if (!partenaire.data)
    return (
      <Section title="Compte non rattaché">
        <p className="text-sm text-muted-foreground">
          Ce compte possède le rôle {role}, mais aucun partenaire métier ne lui est encore rattaché.
        </p>
      </Section>
    );
  const p = partenaire.data;
  const activeContract = p.contracts.find((c) => c.statut === "actif");
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Structure"
          value={p.partenaire.nom}
          hint={p.partenaire.numero ?? "Identifiant partenaire"}
          icon={
            role === "hopital"
              ? Hospital
              : role === "pharmacie"
                ? Pill
                : role === "laboratoire"
                  ? Microscope
                  : role === "centre_bien_etre"
                    ? HeartPulse
                    : Building2
          }
        />
        <KpiCard
          label="Contrat"
          value={activeContract ? "ACTIF" : "À vérifier"}
          hint={activeContract?.numero ?? "Aucun contrat actif"}
          icon={FileText}
        />
        <KpiCard
          label={role === "entreprise" ? "Collaborateurs" : "Prises en charge"}
          value={role === "entreprise" ? p.employees : p.pec.length}
          hint={role === "entreprise" ? "Couverts par l'entreprise" : "Dossiers récents"}
          icon={role === "entreprise" ? Users : HeartPulse}
        />
        <KpiCard
          label="Factures"
          value={p.invoices.length}
          hint="Dernières factures"
          icon={Receipt}
        />
      </div>
      <div className="mt-6">
        {role !== "entreprise" ? (
          <EspacePartenaire partnerType={role} />
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            <Section title="Collaborateurs couverts">
              <p className="text-sm text-muted-foreground">
                Le compte entreprise peut suivre ses collaborateurs rattachés, les périodes de
                couverture et les documents contractuels. Les données médicales individuelles
                restent cloisonnées.
              </p>
            </Section>
            <Section title="Contrat collectif">
              <p className="text-sm">
                {activeContract
                  ? `${activeContract.numero} · couverture ${activeContract.taux_couverture}%`
                  : "Aucun contrat actif"}
              </p>
            </Section>
          </div>
        )}
      </div>
    </>
  );
}

export function AccountDashboard({
  kind,
}: {
  kind:
    | "adherent"
    | "beneficiaire"
    | "hopital"
    | "pharmacie"
    | "laboratoire"
    | "centre_bien_etre"
    | "entreprise";
}) {
  const config = DASHBOARDS[kind]!;
  const { accountContext, roles, home } = useAuth();
  const expectedRole = kind === "beneficiaire" ? "adherent" : kind;
  const allowed = roles.includes(expectedRole as (typeof roles)[number]);
  const id =
    kind === "adherent"
      ? accountContext?.adherent_id
      : kind === "beneficiaire"
        ? accountContext?.beneficiaire_id
        : accountContext?.partenaire_id;
  if (!allowed) {
    return (
      <DashboardLayout title={config.title} subtitle={config.subtitle} navItems={config.nav}>
        <Section title="Accès non autorisé">
          <p className="text-sm text-muted-foreground">
            Votre rôle ne correspond pas à cet espace métier.
          </p>
          <Button className="mt-4" asChild>
            <a href={home}>Retour à mon espace</a>
          </Button>
        </Section>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout
      title={kind === "beneficiaire" ? "Mon espace bénéficiaire" : config.title}
      subtitle={
        kind === "beneficiaire"
          ? "Un compte personnel utilisant le rôle adhérent, cloisonné par votre identifiant bénéficiaire."
          : config.subtitle
      }
      navItems={config.nav}
    >
      {id ? (
        kind === "adherent" ? (
          <AdherentDashboard id={id} />
        ) : kind === "beneficiaire" ? (
          <BeneficiaireDashboard id={id} />
        ) : (
          <PartenaireDashboard role={kind} />
        )
      ) : kind === "beneficiaire" ? (
        <BeneficiaireClaimPanel />
      ) : (
        <Section title="Compte non rattaché">
          <p className="text-sm text-muted-foreground">
            Votre compte est authentifié mais aucun identifiant métier n'est encore associé. Un
            administrateur Humanitas doit rattacher votre compte à son établissement partenaire.
          </p>
        </Section>
      )}
    </DashboardLayout>
  );
}

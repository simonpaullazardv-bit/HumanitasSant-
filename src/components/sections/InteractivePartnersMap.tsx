import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "motion/react";
import {
  MapPin,
  Phone,
  Building2,
  Stethoscope,
  Pill,
  Microscope,
  HeartPulse,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PartnerLocation {
  id: string;
  name: string;
  type: "hopital" | "pharmacie" | "laboratoire" | "centre_bien_etre" | "entreprise";
  typeLabel: string;
  city: string;
  commune: string;
  address: string;
  phone: string;
  tiersPayant: boolean;
  active: boolean;
  latitude: number | null;
  longitude: number | null;
}

function usePublicPartnerLocations() {
  return useQuery({
    queryKey: ["public-partners-map"],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase.from("partenaires" as never) as any)
          .select(
            "id, nom, type, ville, commune, adresse, telephone, conventionne, is_active, is_public, latitude, longitude",
          )
          .eq("is_active", true)
          .eq("is_public", true)
          .order("ordre", { ascending: true });
        if (error) throw error;
        return (data ?? []).map((row) => ({
          id: row.id,
          name: row.nom,
          type: row.type,
          typeLabel:
            row.type === "hopital"
              ? "Hôpital"
              : row.type === "pharmacie"
                ? "Pharmacie"
                : row.type === "laboratoire"
                  ? "Laboratoire"
                  : row.type === "entreprise"
                    ? "Entreprise"
                    : "Centre de bien-être",
          city: row.ville ?? "Ville non publiée",
          commune: row.commune ?? "",
          address: row.adresse ?? "Adresse non publiée",
          phone: row.telephone ?? "Coordonnée non publiée",
          tiersPayant: row.conventionne,
          active: row.is_active,
          latitude: row.latitude == null ? null : Number(row.latitude),
          longitude: row.longitude == null ? null : Number(row.longitude),
        })) as PartnerLocation[];
      } catch {
        return [];
      }
    },
    staleTime: 30_000,
  });
}

export function InteractivePartnersMap() {
  const { data: partnerLocations = [], isPending } = usePublicPartnerLocations();
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<PartnerLocation | null>(
    partnerLocations[0] ?? null,
  );

  useEffect(() => {
    if (partnerLocations.length > 0 && !selectedPartner) setSelectedPartner(partnerLocations[0]);
  }, [partnerLocations, selectedPartner]);

  const filteredPartners = partnerLocations.filter((p) => {
    const matchesCity = selectedCity === "all" || p.city === selectedCity;
    const matchesType = selectedType === "all" || p.type === selectedType;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.commune.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesType && matchesSearch;
  });

  return (
    <Section id="carte-partenaires" className="relative overflow-hidden bg-surface/50">
      <SectionHeading
        eyebrow="Réseau national de santé"
        title="Trouvez une structure partenaire près de chez vous"
        description="Consultez les centres de soins, hôpitaux, pharmacies et laboratoires conventionnés acceptant la carte d'adhérent Humanitas sans avance de frais."
      />

      {isPending ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Chargement du réseau public validé…
        </p>
      ) : null}
      {!isPending && partnerLocations.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Le répertoire public sera affiché après validation des établissements et de leurs
          coordonnées par Humanitas.
        </div>
      ) : null}

      {/* Comptage public : uniquement les lignes réellement publiées par Supabase. */}
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Hôpitaux", "hopital"],
          ["Pharmacies", "pharmacie"],
          ["Laboratoires", "laboratoire"],
          ["Centres de bien-être", "centre_bien_etre"],
          ["Entreprises", "entreprise"],
        ].map(([label, type]) => (
          <button
            key={type}
            type="button"
            onClick={() => setSelectedType(type)}
            className="rounded-2xl border border-border/70 bg-card p-4 text-left transition hover:border-primary/40"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">
              {partnerLocations.filter((partner) => partner.type === type).length}
            </p>
            <p className="text-[11px] text-muted-foreground">établissements publiés</p>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, commune, quartier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-2xl bg-card border-border/80"
          />
        </div>

        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="rounded-2xl border border-border/80 bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Toutes les villes publiées</option>
          {[...new Set(partnerLocations.map((partner) => partner.city).filter(Boolean))]
            .sort()
            .map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="rounded-2xl border border-border/80 bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Tous les types de structures</option>
          <option value="hopital">Hôpitaux & Cliniques</option>
          <option value="pharmacie">Pharmacies conventionnées</option>
          <option value="laboratoire">Laboratoires d'imagerie</option>
          <option value="centre_bien_etre">Centres de bien-être</option>
          <option value="entreprise">Entreprises partenaires</option>
        </select>
      </div>

      {/* Map & Provider Split Layout */}
      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Provider List */}
        <div className="space-y-3 lg:col-span-5 max-h-[500px] overflow-y-auto pr-2">
          {filteredPartners.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground bg-card rounded-2xl border border-border">
              Aucun partenaire ne correspond à votre recherche.
            </p>
          ) : (
            filteredPartners.map((partner) => (
              <div
                key={partner.id}
                onClick={() => setSelectedPartner(partner)}
                className={cn(
                  "cursor-pointer rounded-2xl border p-4 transition-all duration-200",
                  selectedPartner?.id === partner.id
                    ? "border-primary bg-primary/5 shadow-soft ring-1 ring-primary/30"
                    : "border-border/70 bg-card hover:border-primary/40 hover:bg-card/80",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                    {partner.type === "hopital" && <Building2 className="size-3.5" />}
                    {partner.type === "pharmacie" && <Pill className="size-3.5" />}
                    {partner.type === "laboratoire" && <Microscope className="size-3.5" />}
                    {partner.type === "centre_bien_etre" && <HeartPulse className="size-3.5" />}
                    {partner.type === "entreprise" && <Building2 className="size-3.5" />}
                    {partner.typeLabel}
                  </span>
                  {partner.tiersPayant && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    >
                      Tiers Payant
                    </Badge>
                  )}
                </div>

                <h4 className="mt-2 font-display text-base font-bold text-foreground">
                  {partner.name}
                </h4>

                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0 text-accent" />
                  {partner.address}, {partner.commune} ({partner.city})
                </p>

                {partner.latitude != null && partner.longitude != null ? (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    GPS : {partner.latitude.toFixed(6)}, {partner.longitude.toFixed(6)}
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Coordonnées GPS non encore validées
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="size-3 text-primary" />
                    {partner.phone}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600">
                    Conventionnement publié
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Interactive Map Visual */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-primary/20 bg-card p-6 shadow-3d-elevated lg:col-span-7 min-h-[400px]">
          {/* Map background grid pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#0f4c81_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

          <div className="relative z-10 flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <MapPin className="size-4" />
              </span>
              <div>
                <h4 className="font-display text-sm font-bold text-foreground">
                  Carte interactive des partenaires Humanitas
                </h4>
                <p className="text-xs text-muted-foreground">
                  {filteredPartners.length} structures disponibles en RDC
                </p>
              </div>
            </div>
            <Badge className="bg-gradient-brand text-primary-foreground">
              Couverture Nationale
            </Badge>
          </div>

          {/* Carte géolocalisée : uniquement lorsque les coordonnées ont été validées dans Supabase. */}
          {selectedPartner?.latitude != null && selectedPartner.longitude != null ? (
            <div className="relative z-10 mt-5 overflow-hidden rounded-2xl border border-border/70 bg-surface">
              <iframe
                title={`Carte de ${selectedPartner.name}`}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedPartner.longitude - 0.015}%2C${selectedPartner.latitude - 0.01}%2C${selectedPartner.longitude + 0.015}%2C${selectedPartner.latitude + 0.01}&layer=mapnik&marker=${selectedPartner.latitude}%2C${selectedPartner.longitude}`}
                className="h-64 w-full border-0"
                loading="lazy"
              />
              <p className="px-3 py-2 text-[11px] text-muted-foreground">
                Position publiée par Humanitas : {selectedPartner.latitude.toFixed(6)},{" "}
                {selectedPartner.longitude.toFixed(6)}.
              </p>
            </div>
          ) : null}

          {/* Active Partner Feature Display */}
          {selectedPartner ? (
            <motion.div
              key={selectedPartner.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 my-6 rounded-2xl border border-primary/30 bg-card/90 p-6 shadow-soft backdrop-blur"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <ShieldCheck className="size-4 text-emerald-600" />
                Partenaire Homologué & Conventionné
              </div>

              <h3 className="mt-2 font-display text-xl font-bold text-foreground">
                {selectedPartner.name}
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                📍 {selectedPartner.address}, Commune de {selectedPartner.commune},{" "}
                {selectedPartner.city}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-surface p-3 border border-border/60">
                  <p className="text-[11px] font-medium text-muted-foreground">Téléphone direct</p>
                  <p className="font-mono text-sm font-bold text-primary">
                    {selectedPartner.phone}
                  </p>
                </div>
                <div className="rounded-xl bg-surface p-3 border border-border/60">
                  <p className="text-[11px] font-medium text-muted-foreground">Modalité de soins</p>
                  <p className="text-sm font-bold text-emerald-600">
                    {selectedPartner.tiersPayant
                      ? "Prise en charge selon les droits ouverts"
                      : "Sous convention ordinaire"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <Button size="sm" className="bg-gradient-brand text-xs">
                  Avoir un itinéraire
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                  Contacter le centre
                </Button>
              </div>
            </motion.div>
          ) : null}

          <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/60">
            <span>Réseau Humanitas Santé · République Démocratique du Congo</span>
            <span className="font-medium text-primary">GPS & Tiers Payant Synchronisés</span>
          </div>
        </div>
      </div>
    </Section>
  );
}

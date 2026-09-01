/**
 * Rendu visuel des cartes (adhérent et personnel) au format CR80 (85,6 × 53,98 mm).
 * Format ISO 7810 (plus petit qu'un format A6, taille carte de crédit / PVC).
 * Le QR code contient un jeton sécurisé de vérification.
 */
import { useQuery } from "@tanstack/react-query";
import QRCode from "react-qr-code";
import { ShieldCheck, User, Award, Building2, BadgeCheck } from "lucide-react";
import { photoUrlQuery } from "./queries";
import { SITE } from "@/data/site";

export const VERIFY_BASE =
  import.meta.env.VITE_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function Photo({ path }: { path: string | null | undefined }) {
  const signed = useQuery(photoUrlQuery(path));
  if (signed.data) {
    return (
      <img
        src={signed.data}
        alt="Photo du titulaire"
        className="size-full object-cover"
        crossOrigin="anonymous"
      />
    );
  }
  return (
    <div className="flex size-full flex-col items-center justify-center bg-slate-800 text-slate-400">
      <User className="size-7" />
      <span className="text-[6px] uppercase tracking-tighter">Photo</span>
    </div>
  );
}

export interface CarteVisuelData {
  type: "adherent" | "personnel";
  numero: string;
  token: string;
  nomComplet: string;
  photoPath?: string | null;
  /** Catégorie d'adhésion ou fonction de l'agent. */
  ligne1?: string | null;
  /** Département (personnel). */
  ligne2?: string | null;
  /** Grade (personnel) ou matricule adhérent. */
  ligne3?: string | null;
  dateEmission: string;
  dateExpiration: string | null;
  statut?: string | null;
}

export function CarteVisuel({ data, verso = false }: { data: CarteVisuelData; verso?: boolean }) {
  const isPersonnel = data.type === "personnel";
  const url = `${VERIFY_BASE}/verify/${data.token}`;

  // Verso de la carte (commun, adaptable)
  if (verso) {
    return (
      <div className="carte-cr80 relative flex w-[326px] h-[204px] sm:w-[340px] sm:h-[215px] shrink-0 flex-col justify-between rounded-xl border border-slate-700 bg-slate-950 p-3.5 text-[9px] text-slate-300 shadow-md">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="flex size-5 items-center justify-center rounded bg-primary text-[8px] font-black text-primary-foreground">
                HS
              </div>
              <span className="font-display text-[10px] font-bold text-white tracking-wider">
                HUMANITAS SANTÉ
              </span>
            </div>
            <span className="text-[8px] font-semibold text-emerald-400">
              Format ISO CR80 (85.6 × 54 mm)
            </span>
          </div>

          <p className="text-[9.5px] font-semibold text-white">Conditions d'utilisation :</p>
          <p className="text-[8px] leading-tight text-slate-300">
            {isPersonnel
              ? "Cette carte de service est strictement personnelle et atteste de l'appartenance au personnel officiel d'Humanitas Santé. Elle doit être présentée sur demande dans le cadre de vos fonctions."
              : "Cette carte d'adhérent est strictement personnelle. Elle ouvre droit au tiers-payant dans le réseau agréé sur présentation d'une pièce d'identité en cours de validité."}
          </p>
          <p className="text-[8px] text-amber-300 font-medium">
            Service Régulation & Urgences H24 : {SITE.phone || "Coordonnées non publiées"}
          </p>
        </div>

        <div className="flex items-end justify-between border-t border-slate-800 pt-2">
          <div className="space-y-0.5">
            <p className="font-semibold text-white text-[9px]">Vérification par QR Code</p>
            <p className="text-[7.5px] font-mono text-slate-400">
              {url.replace(/^https?:\/\//, "")}
            </p>
            <p className="text-[7px] text-slate-500">Puce sécurisée anti-falsification</p>
          </div>
          <div className="rounded-lg bg-white p-1 shadow-inner">
            <QRCode value={url} size={48} level="M" />
          </div>
        </div>
      </div>
    );
  }

  // --- CARTE DU PERSONNEL / AGENT HUMANITAS ---
  if (isPersonnel) {
    return (
      <div className="carte-cr80 relative overflow-hidden w-[326px] h-[204px] sm:w-[340px] sm:h-[215px] shrink-0 rounded-2xl border-2 border-primary/50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-xl">
        {/* En-tête Institutionnel Personnel */}
        <div className="flex items-center justify-between bg-gradient-brand px-3 py-1.5 text-primary-foreground shadow">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-lg bg-white font-display text-[10px] font-black text-primary shadow-sm">
              HS
            </div>
            <div>
              <p className="font-display text-[11px] font-extrabold tracking-wider leading-none">
                HUMANITAS SANTÉ
              </p>
              <p className="text-[7.5px] font-bold tracking-widest text-amber-300 uppercase leading-tight">
                Carte de Service Personnel
              </p>
            </div>
          </div>
          <BadgeCheck className="size-4 text-amber-300" />
        </div>

        {/* Corps de la carte personnel */}
        <div className="flex h-[calc(100%-34px)] gap-2.5 p-3">
          {/* Cadre Photo avec Bordure distincte */}
          <div className="size-[68px] shrink-0 overflow-hidden rounded-xl border-2 border-primary bg-slate-800 shadow-md">
            <Photo path={data.photoPath} />
          </div>

          {/* Informations Agent */}
          <div className="min-w-0 flex-1 space-y-0.5 text-left">
            <p className="truncate font-display text-xs font-bold text-white leading-tight">
              {data.nomComplet}
            </p>
            <p className="truncate text-[9.5px] font-bold text-amber-300">
              {data.ligne1 || "Agent Humanitas"}
            </p>
            {data.ligne2 && (
              <p className="truncate text-[8.5px] text-slate-300 font-medium">{data.ligne2}</p>
            )}
            {data.ligne3 && <p className="truncate text-[8px] text-slate-400">{data.ligne3}</p>}

            <div className="pt-1 flex items-center gap-2 text-[7.5px] font-mono text-slate-300">
              <span className="font-bold text-emerald-400">MAT: {data.numero}</span>
            </div>
            <p className="text-[7px] text-slate-400">
              Émission : {formatDate(data.dateEmission)} · Exp : {formatDate(data.dateExpiration)}
            </p>
          </div>

          {/* QR Code & Sceau */}
          <div className="flex shrink-0 flex-col items-center justify-between">
            <div className="rounded-lg bg-white p-1 shadow-md">
              <QRCode value={url} size={46} level="M" />
            </div>
            <div className="text-center">
              <span className="block font-serif text-[6.5px] italic text-amber-300 font-bold">
                Sceau Officiel
              </span>
              <span className="block text-[6px] text-slate-400">Direction Général</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- CARTE D'ADHÉRENT / MEMBRE MUTUELLE ---
  return (
    <div className="carte-cr80 relative overflow-hidden w-[326px] h-[204px] sm:w-[340px] sm:h-[215px] shrink-0 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white shadow-xl">
      {/* En-tête Institutionnel Adhérent */}
      <div className="flex items-center justify-between bg-emerald-700 px-3 py-1.5 text-white shadow">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-lg bg-white font-display text-[10px] font-black text-emerald-700 shadow-sm">
            HS
          </div>
          <div>
            <p className="font-display text-[11px] font-extrabold tracking-wider leading-none">
              HUMANITAS SANTÉ
            </p>
            <p className="text-[7.5px] font-bold tracking-widest text-emerald-200 uppercase leading-tight">
              Carte de Membre Adhérent
            </p>
          </div>
        </div>
        <ShieldCheck className="size-4 text-emerald-200" />
      </div>

      {/* Corps de la carte adhérent */}
      <div className="flex h-[calc(100%-34px)] gap-2.5 p-3">
        {/* Photo */}
        <div className="size-[68px] shrink-0 overflow-hidden rounded-xl border-2 border-emerald-400 bg-slate-800 shadow-md">
          <Photo path={data.photoPath} />
        </div>

        {/* Details Adhérent */}
        <div className="min-w-0 flex-1 space-y-0.5 text-left">
          <p className="truncate font-display text-xs font-bold text-white leading-tight">
            {data.nomComplet}
          </p>
          <p className="truncate text-[9.5px] font-bold text-emerald-300">
            {data.ligne1 || "Membre Adhérent"}
          </p>
          {data.ligne2 && (
            <p className="truncate text-[8.5px] text-slate-300 font-mono">{data.ligne2}</p>
          )}

          <div className="pt-1">
            <span className="font-mono text-[9px] font-bold tracking-wider text-amber-300">
              N° {data.numero}
            </span>
          </div>

          <div className="flex gap-2 text-[7.5px] text-slate-300">
            <span>Émis: {formatDate(data.dateEmission)}</span>
            <span>Exp: {formatDate(data.dateExpiration)}</span>
          </div>
        </div>

        {/* QR Code Tiers-Payant */}
        <div className="flex shrink-0 flex-col items-center justify-between">
          <div className="rounded-lg bg-white p-1 shadow-md">
            <QRCode value={url} size={46} level="M" />
          </div>
          <div className="text-center">
            <span className="block text-[6.5px] font-bold text-emerald-300 uppercase">
              Tiers-Payant
            </span>
            <span className="block text-[6px] text-slate-400">Réseau Agréé</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useRef } from "react";
import QRCode from "react-qr-code";
import { ShieldCheck, User, Printer, Sparkles, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/data/site";
import { cn } from "@/lib/utils";

export type CardCategory = "Bronze" | "Or" | "Diamant" | "Platine" | "Personnel";

export interface MemberCardData {
  type: "adherent";
  category: CardCategory;
  matricule: string;
  nomComplet: string;
  photoUrl?: string | null;
  dateEmission: string;
  dateExpiration: string;
  statut: "actif" | "suspendu" | "expire";
  beneficiairesCount?: number;
  qrToken: string;
}

export interface PersonnelCardData {
  type: "personnel";
  nomComplet: string;
  fonction: string;
  departement: string;
  grade: string;
  matricule: string;
  photoUrl?: string | null;
  dateEmission: string;
  dateExpiration: string;
  signatureText?: string;
  qrToken: string;
}

const CATEGORY_STYLES: Record<
  CardCategory,
  {
    gradient: string;
    badgeBg: string;
    border: string;
    textAccent: string;
    label: string;
  }
> = {
  Bronze: {
    gradient: "from-amber-900/30 via-slate-900 to-amber-950",
    badgeBg: "bg-amber-700 text-amber-100",
    border: "border-amber-600/40",
    textAccent: "text-amber-400",
    label: "ADHÉRENT BRONZE",
  },
  Or: {
    gradient: "from-amber-500/25 via-slate-900 to-yellow-950",
    badgeBg: "bg-amber-500 text-slate-950 font-bold",
    border: "border-amber-400/50",
    textAccent: "text-amber-300",
    label: "ADHÉRENT OR",
  },
  Diamant: {
    gradient: "from-cyan-500/25 via-slate-900 to-sky-950",
    badgeBg: "bg-cyan-400 text-slate-950 font-bold",
    border: "border-cyan-400/50",
    textAccent: "text-cyan-300",
    label: "ADHÉRENT DIAMANT",
  },
  Platine: {
    gradient: "from-slate-400/25 via-slate-900 to-slate-950",
    badgeBg: "bg-slate-200 text-slate-950 font-bold",
    border: "border-slate-300/50",
    textAccent: "text-slate-200",
    label: "ADHÉRENT PLATINE",
  },
  Personnel: {
    gradient: "from-blue-600/30 via-slate-900 to-teal-950",
    badgeBg: "bg-primary text-primary-foreground font-bold",
    border: "border-primary/50",
    textAccent: "text-sky-300",
    label: "CARTE DU PERSONNEL",
  },
};

export function PrintableMemberCard({ data }: { data: MemberCardData }) {
  const style = CATEGORY_STYLES[data.category] || CATEGORY_STYLES.Bronze;
  const qrUrl = `${import.meta.env.VITE_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")}/verify/${data.qrToken}`;

  return (
    <div className="printable-card-wrapper my-4">
      {/* Recto Card */}
      <div
        className={cn(
          "carte-cr80 relative overflow-hidden rounded-2xl border p-4 text-white shadow-2xl transition-all duration-300",
          "w-[340px] h-[215px] bg-gradient-to-br",
          style.gradient,
          style.border,
        )}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/20 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-white p-1 shadow">
              <span className="font-display text-xs font-black text-primary">HS</span>
            </div>
            <div>
              <p className="font-display text-[11px] font-extrabold tracking-wider">
                HUMANITAS SANTÉ
              </p>
              <p className="text-[8px] tracking-widest text-white/80 uppercase">
                Mutuelle & Bien-Être
              </p>
            </div>
          </div>
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[9px] uppercase tracking-wider",
              style.badgeBg,
            )}
          >
            {style.label}
          </span>
        </div>

        {/* Card Body */}
        <div className="mt-3 flex gap-3">
          {/* Photo */}
          <div className="size-16 shrink-0 overflow-hidden rounded-xl border-2 border-white/40 bg-slate-800 shadow">
            {data.photoUrl ? (
              <img src={data.photoUrl} alt={data.nomComplet} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center bg-slate-700 text-white/60">
                <User className="size-8" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 space-y-1 text-left">
            <p className="truncate font-display text-sm font-bold text-white">{data.nomComplet}</p>
            <p className="font-mono text-[11px] font-bold tracking-widest text-amber-300">
              ID: {data.matricule}
            </p>
            <div className="text-[9px] text-white/80 space-y-0.5">
              <p>Émise le : {data.dateEmission}</p>
              <p>Expire le : {data.dateExpiration}</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="rounded-lg bg-white p-1 shadow">
              {data.qrToken ? <QRCode value={qrUrl} size={48} level="M" /> : <span className="text-[7px] text-slate-500">QR généré à l’émission</span>}
            </div>
            <span className="mt-1 text-[7px] text-white/70">Scannez pour vérifier</span>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/40 px-4 py-1.5 text-[8px] backdrop-blur">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <ShieldCheck className="size-3" /> Statut: {data.statut.toUpperCase()}
          </span>
          <span className="text-white/70">TIERS PAYANT INTÉGRÉ</span>
        </div>
      </div>
    </div>
  );
}

export function PrintablePersonnelCard({ data }: { data: PersonnelCardData }) {
  const style = CATEGORY_STYLES.Personnel;
  const qrUrl = `${import.meta.env.VITE_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")}/verify/${data.qrToken}`;

  return (
    <div className="printable-card-wrapper my-4">
      <div
        className={cn(
          "carte-cr80 relative overflow-hidden rounded-2xl border p-4 text-white shadow-2xl transition-all duration-300",
          "w-[340px] h-[215px] bg-gradient-to-br",
          style.gradient,
          style.border,
        )}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/20 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-white p-1 shadow">
              <span className="font-display text-xs font-black text-primary">HS</span>
            </div>
            <div>
              <p className="font-display text-[11px] font-extrabold tracking-wider">
                HUMANITAS SANTÉ
              </p>
              <p className="text-[8px] tracking-widest text-sky-300 uppercase">
                Carte de Service Personnel
              </p>
            </div>
          </div>
          <Award className="size-4 text-amber-400" />
        </div>

        {/* Body */}
        <div className="mt-3 flex gap-3">
          {/* Photo */}
          <div className="size-16 shrink-0 overflow-hidden rounded-xl border-2 border-primary/60 bg-slate-800 shadow">
            {data.photoUrl ? (
              <img src={data.photoUrl} alt={data.nomComplet} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center bg-slate-700 text-white/60">
                <User className="size-8" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 space-y-0.5 text-left">
            <p className="truncate font-display text-xs font-bold text-white">{data.nomComplet}</p>
            <p className="truncate text-[10px] font-semibold text-sky-300">{data.fonction}</p>
            <p className="truncate text-[9px] text-white/80">
              {data.departement} · {data.grade}
            </p>
            <p className="font-mono text-[10px] font-bold text-amber-300">MAT: {data.matricule}</p>
            <p className="text-[8px] text-white/70">Expire le : {data.dateExpiration}</p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="rounded-lg bg-white p-1 shadow">
              {data.qrToken ? <QRCode value={qrUrl} size={46} level="M" /> : <span className="text-[7px] text-slate-500">QR généré à l’émission</span>}
            </div>
            <span className="mt-1 text-[7px] text-white/70">Sceau Officiel</span>
          </div>
        </div>

        {/* Signature Area */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-slate-950/80 px-4 py-1.5 text-[8px] backdrop-blur border-t border-white/10">
          <span className="text-white/70">Direction Générale Humanitas</span>
          <span className="font-serif italic text-amber-300 font-bold">Signature Autorisée</span>
        </div>
      </div>
    </div>
  );
}

export function PrintableCardSheet() {
  const sampleMember: MemberCardData = {
    type: "adherent",
    category: "Or",
    matricule: "HS-2026-9942",
    nomComplet: "KABAMBA MBUYI Jean-Pierre",
    dateEmission: "15/01/2026",
    dateExpiration: "15/01/2027",
    statut: "actif",
    qrToken: "",
  };

  const samplePersonnel: PersonnelCardData = {
    type: "personnel",
    nomComplet: "Dr. LUKUSA MUKENDI Sarah",
    fonction: "Médecin Conseil Principal",
    departement: "Direction Médicale",
    grade: "Chef de Service",
    matricule: "PERS-HS-014",
    dateEmission: "01/01/2026",
    dateExpiration: "31/12/2028",
    qrToken: "",
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 bg-card rounded-3xl border border-border">
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <div>
          <h3 className="font-display text-xl font-bold text-foreground">
            Maquette & Impression des Cartes PVC / A4
          </h3>
          <p className="text-xs text-muted-foreground">
            Format normalisé CR80 (85.6mm x 54mm) prêt pour imprimante PVC et impression A4.
          </p>
        </div>
        <Button onClick={handlePrint} className="bg-gradient-brand gap-2">
          <Printer className="size-4" /> Imprimer sur PVC / A4
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2 justify-items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 text-center">
            Carte d'Adhérent — maquette
          </p>
          <PrintableMemberCard data={sampleMember} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 text-center">
            Carte du Personnel Humanitas — maquette
          </p>
          <PrintablePersonnelCard data={samplePersonnel} />
        </div>
      </div>
    </div>
  );
}

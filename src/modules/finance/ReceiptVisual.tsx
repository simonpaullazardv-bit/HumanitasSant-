import QRCode from "react-qr-code";
import { Printer, ShieldCheck, CheckCircle2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/data/site";

export interface ReceiptData {
  numeroRecu: string;
  adherentNom: string;
  adherentMatricule: string;
  categorie: string;
  montantUsd: number;
  montantCdf?: number;
  tauxChange?: number;
  modePaiement:
    "Mobile Money (M-Pesa/Airtel/Orange)" | "Carte Bancaire" | "Virement Bancaire" | "Espèces";
  datePaiement: string;
  agentNom: string;
  motif: string;
  referenceTransaction: string;
  qrVerificationToken: string;
}

export function ReceiptVisual({ receipt }: { receipt?: ReceiptData }) {
  if (!receipt) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Sélectionnez un reçu enregistré pour le prévisualiser et l'imprimer.
      </div>
    );
  }

  const qrUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/verify/recu/${receipt.qrVerificationToken}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-8 shadow-3d-elevated print:border-none print:shadow-none print:p-0">
      {/* Receipt Action Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-5 print:hidden">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">
            Reçu Officiel de Paiement
          </h3>
          <p className="text-xs text-muted-foreground">
            Document officiel certifié par Humanitas Santé
          </p>
        </div>
        <Button onClick={handlePrint} className="bg-gradient-brand gap-2">
          <Printer className="size-4" /> Imprimer le Reçu (A4)
        </Button>
      </div>

      {/* Printable Receipt Frame */}
      <div className="relative mt-6 rounded-2xl border-2 border-primary/20 bg-card p-8 print:mt-0 print:border-slate-300">
        {/* Background Watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
          <span className="font-display text-8xl font-black text-primary">HUMANITAS</span>
        </div>

        {/* Top Header */}
        <div className="flex items-start justify-between border-b-2 border-primary/30 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-brand p-2 text-white shadow-soft">
              <span className="font-display text-lg font-black">HS</span>
            </div>
            <div>
              <h2 className="font-display text-xl font-extrabold tracking-tight text-foreground">
                HUMANITAS SANTÉ
              </h2>
              <p className="text-xs font-semibold text-primary">Mutuelle & Centre de Bien-Être</p>
              <p className="text-[11px] text-muted-foreground">{SITE.address}</p>
              <p className="text-[11px] text-muted-foreground">
                Tél : {SITE.phone} · {SITE.email}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              REÇU PAYÉ
            </span>
            <p className="mt-2 font-mono text-sm font-extrabold text-foreground">
              {receipt.numeroRecu}
            </p>
            <p className="text-xs text-muted-foreground">Date : {receipt.datePaiement}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {/* Adherent Info */}
          <div className="rounded-2xl bg-surface p-4 border border-border/60">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Bénéficiaire / Adhérent
            </p>
            <p className="mt-1 font-display text-base font-bold text-foreground">
              {receipt.adherentNom}
            </p>
            <p className="mt-0.5 font-mono text-xs font-semibold text-primary">
              N° Matricule : {receipt.adherentMatricule}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{receipt.categorie}</p>
          </div>

          {/* Payment Info */}
          <div className="rounded-2xl bg-surface p-4 border border-border/60">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Règlement & Transaction
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">{receipt.modePaiement}</p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              Réf : {receipt.referenceTransaction}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Agent : {receipt.agentNom}</p>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-border/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-primary/5 text-foreground font-bold">
              <tr>
                <th className="p-3">Description / Motif</th>
                <th className="p-3 text-right">Montant (USD)</th>
                {receipt.montantCdf && <th className="p-3 text-right">Équivalent (CDF)</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr>
                <td className="p-3 text-foreground font-medium">{receipt.motif}</td>
                <td className="p-3 text-right font-mono font-bold text-foreground">
                  {receipt.montantUsd.toFixed(2)} $
                </td>
                {receipt.montantCdf && (
                  <td className="p-3 text-right font-mono text-muted-foreground">
                    {receipt.montantCdf.toLocaleString("fr-FR")} FC
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total Box */}
        <div className="mt-6 flex items-center justify-between rounded-2xl bg-gradient-brand p-5 text-primary-foreground shadow-soft">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-90">Total encaissé</p>
            <p className="text-[11px] opacity-80">
              Taux appliqué : 1 USD = {receipt.tauxChange ?? 2800} CDF
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-black">{receipt.montantUsd.toFixed(2)} $</p>
            {receipt.montantCdf && (
              <p className="text-xs font-medium opacity-90">
                ({receipt.montantCdf.toLocaleString("fr-FR")} FC)
              </p>
            )}
          </div>
        </div>

        {/* Footer & Verification Stamp */}
        <div className="mt-8 flex items-center justify-between border-t border-border/80 pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-1.5 shadow border border-border">
              <QRCode value={qrUrl} size={60} level="M" />
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="size-4" /> Reçu Vérifié par QrCode
              </p>
              <p className="text-[10px] text-muted-foreground max-w-[200px]">
                Scannez pour valider la certitude de la transaction auprès de la caisse.
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block rounded-xl border border-primary/30 p-3 text-center bg-primary/5">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                Cachet de la Caisse
              </p>
              <p className="font-serif italic font-bold text-primary text-xs mt-1">
                HUMANITAS SANTÉ RDC
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

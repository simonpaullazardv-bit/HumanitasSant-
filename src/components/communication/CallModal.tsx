import { useState } from "react";
import QRCode from "react-qr-code";
import { Phone, ShieldCheck, Clock, QrCode, Smartphone, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SITE } from "@/data/site";

interface CallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallModal({ open, onOpenChange }: CallModalProps) {
  const primaryPhone = SITE.phone || "Coordonnée officielle non publiée";
  const rawPhone = primaryPhone.replace(/\s+/g, "");
  const telUrl = `tel:${rawPhone}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-primary/20 bg-card p-6 shadow-3d-elevated sm:p-8">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-soft">
              <Phone className="size-6 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl font-bold text-foreground">
                Appeler Humanitas Santé
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Service téléphonique selon les horaires officiels publiés
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Smartphone Direct Call Action */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Numéro Direct Caisse & Urgences
            </p>
            <p className="mt-1 font-mono text-2xl font-black text-foreground">{primaryPhone}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ligne prioritaire : coordonnée officielle à publier
            </p>

            <Button asChild size="lg" className="mt-4 w-full bg-gradient-brand shadow-soft gap-2">
              <a href={telUrl}>
                <Smartphone className="size-5" />
                Appeler Maintenant
              </a>
            </Button>
          </div>

          {/* Desktop QR Code Scanning Option */}
          <div className="rounded-2xl border border-border/80 bg-surface p-5 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-foreground">
              <QrCode className="size-4 text-primary" />
              Scanner depuis un mobile pour appeler
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Ouvrez l'appareil photo de votre smartphone pour lancer l'appel instantanément.
            </p>

            <div className="mt-4 flex justify-center">
              <div className="rounded-2xl bg-white p-3 shadow-soft border border-border/80">
                <QRCode value={telUrl} size={140} level="M" />
              </div>
            </div>
          </div>

          {/* Opening Hours Info */}
          <div className="flex items-start gap-3 rounded-xl bg-card p-3 text-xs text-muted-foreground border border-border/60">
            <Clock className="size-4 text-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-foreground">Disponibilité du service :</span>
              <p className="mt-0.5">Urgences médicales & régulation selon les modalités publiées</p>
              <p>Accueil physique & Guichet : Lun - Sam (08h00 - 17h00)</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

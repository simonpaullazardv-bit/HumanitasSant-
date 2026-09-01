import { useState } from "react";
import { useForm } from "react-hook-form";
import { PhoneCall, ShieldCheck, CheckCircle2, Clock, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitCallbackRequest } from "@/services/contact.service";
import type { CallbackRequest } from "@/types";

interface CallbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallbackModal({ open, onOpenChange }: CallbackModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Anti-spam math captcha logic
  const [num1] = useState(Math.floor(Math.random() * 5) + 3);
  const [num2] = useState(Math.floor(Math.random() * 4) + 1);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CallbackRequest>({
    defaultValues: {
      sujet: "Adhésion & Garanties",
      heure_souhaitee: "Immédiatement (sous 15 min)",
    },
  });

  const onSubmit = async (data: CallbackRequest) => {
    if (parseInt(captchaAnswer.trim(), 10) !== num1 + num2) {
      setCaptchaError(`Combinaison incorrecte. Indiquez la somme de ${num1} + ${num2}.`);
      return;
    }
    setCaptchaError("");
    setLoading(true);

    try {
      await submitCallbackRequest(data);
      setSubmitted(true);
      toast.success("Demande de rappel enregistrée !", {
        description:
          "Un conseiller de la mutuelle Humanitas vous rappellera au numéro indiqué dans les plus brefs délais.",
      });
      reset();
    } catch (err) {
      toast.error("Erreur d'envoi de la demande", {
        description: "Veuillez réessayer ou appeler directement le centre d'accueil.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setTimeout(() => setSubmitted(false), 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-3xl border-primary/20 bg-card p-6 shadow-3d-elevated sm:p-8">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-soft">
              <PhoneCall className="size-6" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl font-bold text-foreground">
                Demander un Rappel Gratuit
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Indiquez votre numéro et l'heure à laquelle notre équipe peut vous appeler.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {submitted ? (
          <div className="mt-6 text-center space-y-4 py-4">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground">
              Demande transmise avec succès
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Nos agents de régulation téléphonique sont notifiés. Un conseiller de santé Humanitas
              prendra contact avec vous.
            </p>
            <Button onClick={() => handleClose(false)} className="bg-gradient-brand w-full">
              Fermer
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {/* Nom */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nom complet *</Label>
              <Input
                placeholder="Ex: KABEYA MWAMBA Meschac"
                {...register("nom", { required: "Ce champ est obligatoire" })}
                className="rounded-xl border-border/80"
              />
              {errors.nom && <p className="text-[11px] text-destructive">{errors.nom.message}</p>}
            </div>

            {/* Téléphone */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Numéro de téléphone *</Label>
              <Input
                placeholder="+243 81 000 0000"
                {...register("telephone", { required: "Le numéro est obligatoire" })}
                className="rounded-xl border-border/80"
              />
              {errors.telephone && (
                <p className="text-[11px] text-destructive">{errors.telephone.message}</p>
              )}
            </div>

            {/* Sujet */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Sujet de l'appel *</Label>
              <select
                {...register("sujet")}
                className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Adhésion & Garanties">Informations Adhésion & Tarifs</option>
                <option value="Prise en charge médicale">Demande de Prise en charge</option>
                <option value="Remboursement de soins">Suivi de Remboursement</option>
                <option value="Partenariat médical">Partenariat & Conventionnement</option>
                <option value="Autre demande">Autre sujet</option>
              </select>
            </div>

            {/* Heure souhaitée */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Heure souhaitée pour le rappel *</Label>
              <select
                {...register("heure_souhaitee")}
                className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Immédiatement (sous 15 min)">Immédiatement (sous 15 min)</option>
                <option value="Entre 09h00 et 12h00">Ce matin (09h00 - 12h00)</option>
                <option value="Entre 12h00 et 15h00">En début d'après-midi (12h00 - 15h00)</option>
                <option value="Entre 15h00 et 18h00">En fin d'après-midi (15h00 - 18h00)</option>
              </select>
            </div>

            {/* Commentaire */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Commentaire / Précisions</Label>
              <Textarea
                placeholder="Précisez votre demande ou question particulière..."
                rows={2}
                {...register("commentaire")}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            {/* Anti-Spam Captcha */}
            <div className="rounded-xl bg-surface p-3 border border-border/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  Anti-Spam : Combien font {num1} + {num2} ? *
                </span>
              </div>
              <Input
                type="number"
                placeholder="Entrez la somme..."
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                className="rounded-lg bg-card border-border text-xs"
              />
              {captchaError && <p className="text-[11px] text-destructive">{captchaError}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-brand gap-2">
              <Send className="size-4" />
              {loading ? "Envoi de la demande..." : "Confirmer la Demande de Rappel"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Calendar as CalendarIcon,
  Clock,
  UserCheck,
  Building2,
  Stethoscope,
  CheckCircle2,
  Send,
  ShieldCheck,
} from "lucide-react";
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
import { submitAppointmentRequest } from "@/services/contact.service";
import type { AppointmentRequest } from "@/types";

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INTERVENANTS = [
  {
    id: "Humanitas",
    label: "Accueil Général Humanitas",
    icon: Building2,
    desc: "Renseignements adhésion & siège",
  },
  {
    id: "Conseiller",
    label: "Conseiller Mutuelle",
    icon: UserCheck,
    desc: "Abonnements, formules & cotisations",
  },
  {
    id: "Médecin conseil",
    label: "Médecin Conseil",
    icon: Stethoscope,
    desc: "Avis médical & prise en charge",
  },
  {
    id: "Partenaire",
    label: "Centre Médical Partenaire",
    icon: Building2,
    desc: "Hôpital, clinique ou laboratoire",
  },
] as const;

const TIME_SLOTS = ["09:00", "10:30", "11:30", "14:00", "15:30", "16:30"];

export function AppointmentModal({ open, onOpenChange }: AppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedIntervenant, setSelectedIntervenant] = useState<
    "Humanitas" | "Conseiller" | "Médecin conseil" | "Partenaire"
  >("Conseiller");
  const [selectedTime, setSelectedTime] = useState("10:30");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppointmentRequest>();

  const onSubmit = async (data: AppointmentRequest) => {
    setLoading(true);
    try {
      const payload: AppointmentRequest = {
        ...data,
        type_intervenant: selectedIntervenant,
        creneau_horaire: selectedTime,
      };
      await submitAppointmentRequest(payload);
      setSubmitted(true);
      toast.success("Rendez-vous sollicité avec succès !", {
        description: `Votre demande pour le ${data.date} à ${selectedTime} avec un ${selectedIntervenant} a été prise en compte.`,
      });
      reset();
    } catch (err) {
      toast.error("Erreur lors de la prise de rendez-vous", {
        description: "Veuillez vérifier votre connexion ou nous contacter par téléphone.",
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
      <DialogContent className="max-w-lg rounded-3xl border-primary/20 bg-card p-6 shadow-3d-elevated sm:p-8">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-soft">
              <CalendarIcon className="size-6" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl font-bold text-foreground">
                Prendre un Rendez-vous
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Planifiez un entretien avec nos conseillers, médecins ou partenaires agréés.
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
              Rendez-vous Enregistré !
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Un message de confirmation vous a été envoyé. Un agent de planification vous
              contactera pour valider l'horaire précis.
            </p>
            <Button onClick={() => handleClose(false)} className="bg-gradient-brand w-full">
              Terminer
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            {/* Type d'intervenant */}
            <div>
              <Label className="text-xs font-semibold">Avec qui souhaitez-vous échanger ? *</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {INTERVENANTS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedIntervenant === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedIntervenant(item.id)}
                      className={`flex items-start gap-2.5 rounded-2xl border p-3 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-soft ring-1 ring-primary"
                          : "border-border/80 bg-surface hover:border-primary/40"
                      }`}
                    >
                      <Icon
                        className={`size-4 shrink-0 mt-0.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <div>
                        <p className="text-xs font-bold text-foreground">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Créneau */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Date souhaitée *</Label>
                <Input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  {...register("date", { required: "Veuillez sélectionner une date" })}
                  className="rounded-xl border-border/80 text-xs"
                />
                {errors.date && (
                  <p className="text-[11px] text-destructive">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Créneau horaire *</Label>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-mono font-semibold transition-all ${
                        selectedTime === slot
                          ? "bg-primary text-primary-foreground shadow"
                          : "bg-surface border border-border/80 text-foreground hover:bg-card"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nom complet *</Label>
                <Input
                  placeholder="Votre nom"
                  {...register("nom", { required: "Nom requis" })}
                  className="rounded-xl border-border/80 text-xs"
                />
                {errors.nom && <p className="text-[11px] text-destructive">{errors.nom.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Numéro Téléphone *</Label>
                <Input
                  placeholder="+243..."
                  {...register("telephone", { required: "Téléphone requis" })}
                  className="rounded-xl border-border/80 text-xs"
                />
                {errors.telephone && (
                  <p className="text-[11px] text-destructive">{errors.telephone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Adresse Email (optionnelle)</Label>
              <Input
                type="email"
                placeholder="Ex: contact@domain.cd"
                {...register("email")}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motif de la demande *</Label>
              <Textarea
                placeholder="Ex: Renseignements pour adhésion de ma famille, prise en charge de chirurgie..."
                rows={2}
                {...register("motif", { required: "Merci d'indiquer le motif" })}
                className="rounded-xl border-border/80 text-xs"
              />
              {errors.motif && (
                <p className="text-[11px] text-destructive">{errors.motif.message}</p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-brand gap-2">
              <Send className="size-4" />
              {loading ? "Prise de rendez-vous..." : "Confirmer le Rendez-vous"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

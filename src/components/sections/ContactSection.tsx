import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Reveal } from "@/components/shared/Reveal";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { SITE } from "@/data/site";
import { sendContactMessage } from "@/services/contact.service";

const contactSchema = z.object({
  full_name: z.string().trim().min(2, "Nom trop court").max(100),
  email: z.string().trim().email("Adresse email invalide").max(255),
  phone: z.string().trim().max(30).optional(),
  subject: z.string().trim().min(3, "Objet trop court").max(150),
  message: z.string().trim().min(10, "Message trop court").max(1500),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const DETAILS = [
  { icon: Phone, label: "Téléphone principal", value: SITE.phone },
  { icon: Phone, label: "Téléphone secondaire", value: SITE.phoneSecondary },
  { icon: Mail, label: "Email principal", value: SITE.email },
  { icon: Mail, label: "Information", value: SITE.emailInfo },
  { icon: Mail, label: "Direction Générale", value: SITE.emailDG },
  { icon: Mail, label: "Coordination", value: SITE.emailCoordo },
  { icon: MapPin, label: "Adresse", value: SITE.address },
  { icon: MapPin, label: "Adresse 2", value: SITE.address2 },
];

export function ContactSection() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (values: ContactFormValues) => {
    try {
      const result = await sendContactMessage(values);
      toast.success(
        result.queued
          ? "Message enregistré. Notre équipe vous répondra très vite."
          : "Message envoyé avec succès. Merci de votre confiance.",
      );
      reset();
    } catch {
      toast.error("Envoi impossible pour le moment. Merci de réessayer.");
    }
  };

  return (
    <Section id="contact">
      <SectionHeading
        eyebrow="Nous contacter"
        title="Parlons de votre couverture santé"
        description="Notre équipe vous accompagne dans le choix de la formule la plus adaptée à votre situation."
      />

      <div className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal className="space-y-6">
          <div className="space-y-4">
            {DETAILS.map((detail) => (
              <div
                key={detail.label}
                className="card-hover flex items-start gap-4 rounded-2xl border border-border/70 bg-card p-6 shadow-soft"
              >
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <detail.icon className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {detail.label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">{detail.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-3xl border border-border/70 shadow-soft">
            <iframe
              title="Localisation Humanitas"
              src="https://www.openstreetmap.org/export/embed.html?bbox=15.24%2C-4.36%2C15.36%2C-4.28&layer=mapnik"
              className="h-64 w-full border-0"
              loading="lazy"
            />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-3xl border border-border/70 bg-card p-8 shadow-soft"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nom complet</Label>
                <Input id="full_name" placeholder="Votre nom" {...register("full_name")} />
                {errors.full_name ? (
                  <p className="text-xs text-destructive">{errors.full_name.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@email.com"
                  {...register("email")}
                />
                {errors.email ? (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" placeholder="+243 ..." {...register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Objet</Label>
                <Input id="subject" placeholder="Objet de votre demande" {...register("subject")} />
                {errors.subject ? (
                  <p className="text-xs text-destructive">{errors.subject.message}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={6}
                placeholder="Décrivez votre besoin..."
                {...register("message")}
              />
              {errors.message ? (
                <p className="text-xs text-destructive">{errors.message.message}</p>
              ) : null}
            </div>

            <Button type="submit" disabled={isSubmitting} className="mt-7 w-full bg-gradient-brand">
              <Send className="size-4" />
              {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
            </Button>
          </form>
        </Reveal>
      </div>
    </Section>
  );
}

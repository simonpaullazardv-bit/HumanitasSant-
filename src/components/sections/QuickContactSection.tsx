import { useState } from "react";
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Globe,
  Clock,
  ArrowRight,
  PhoneCall,
  Calendar,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Button } from "@/components/ui/button";
import { CallModal } from "@/components/communication/CallModal";
import { CallbackModal } from "@/components/communication/CallbackModal";
import { AppointmentModal } from "@/components/communication/AppointmentModal";
import { SITE } from "@/data/site";

export function QuickContactSection() {
  const [callOpen, setCallOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [appointmentOpen, setAppointmentOpen] = useState(false);

  const phone = SITE.phone || "Coordonnée officielle non publiée";
  const rawPhone = phone.replace(/\s+/g, "");
  const email = SITE.email || "Adresse e-mail officielle non publiée";
  const address = SITE.address || "Adresse officielle non publiée";
  const website = SITE.website;
  const whatsappUrl = SITE.whatsappLink;

  const CONTACT_CARDS = [
    {
      id: "phone",
      title: "Téléphone Principal",
      subtitle: "Service client & informations officielles",
      value: phone,
      secondaryValue: `Second contact : ${SITE.phoneSecondary}`,
      icon: Phone,
      accent: "from-blue-600/20 to-sky-600/20",
      iconColor: "text-blue-600",
      actionText: "Appeler maintenant",
      onClick: () => setCallOpen(true),
    },
    {
      id: "whatsapp",
      title: "WhatsApp Officiel",
      subtitle: "Espace de messagerie instantanée",
      value: SITE.whatsapp || "Numéro WhatsApp officiel non publié",
      secondaryValue: "",
      icon: MessageCircle,
      accent: "from-emerald-600/20 to-teal-600/20",
      iconColor: "text-emerald-600",
      actionText: "Ouvrir WhatsApp",
      href: whatsappUrl,
    },
    {
      id: "email",
      title: "Adresse Email",
      subtitle: "Correspondance & Dossiers",
      value: email,
      secondaryValue: "",
      icon: Mail,
      accent: "from-indigo-600/20 to-blue-600/20",
      iconColor: "text-indigo-600",
      actionText: "Envoyer un email",
      href: `mailto:${email}`,
    },
    {
      id: "address",
      title: "Adresse Physique",
      subtitle: "Siège social & Accueil Caisse",
      value: address,
      secondaryValue: `${SITE.address2} · ${SITE.city}`,
      icon: MapPin,
      accent: "from-rose-600/20 to-amber-600/20",
      iconColor: "text-rose-600",
      actionText: "Voir le plan d'accès",
      href: "https://www.google.com/maps/search/?api=1&query=Carrefour+des+Jeunes+Victoire+Kinshasa",
    },
    {
      id: "website",
      title: "Site Web & Portail",
      subtitle: "Espace adhérents & Partenaires",
      value: website,
      secondaryValue: "",
      icon: Globe,
      accent: "from-cyan-600/20 to-teal-600/20",
      iconColor: "text-cyan-600",
      actionText: "Naviguer sur le portail",
      href: "/",
    },
    {
      id: "hours",
      title: "Horaires d'Ouverture",
      subtitle: "Permanence téléphonique & Guichet",
      value: "Service d'urgence selon les modalités publiées",
      secondaryValue: "Guichet : Lun - Sam (08h00 - 17h00)",
      icon: Clock,
      accent: "from-amber-600/20 to-orange-600/20",
      iconColor: "text-amber-600",
      actionText: "Demander un rappel",
      onClick: () => setCallbackOpen(true),
    },
  ];

  return (
    <Section id="contact-rapide" className="relative overflow-hidden bg-surface/50">
      <SectionHeading
        eyebrow="Communication Directe"
        title="Contactez-nous facilement"
        description="Nos équipes administratives, conseillers et médecins de régulation restent à votre disposition via nos différents canaux sécurisés."
      />

      {/* Grid of grandes cartes modernes */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CONTACT_CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-3d-elevated"
            >
              {/* Card top accent icon */}
              <div className="flex items-center justify-between">
                <div
                  className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} p-3 shadow-soft transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className={`size-7 ${card.iconColor}`} />
                </div>
                <ShieldCheck className="size-5 text-emerald-600 opacity-60" />
              </div>

              {/* Card Title & Subtitle */}
              <h3 className="mt-5 font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                {card.title}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">{card.subtitle}</p>

              {/* Card Main Value */}
              <div className="mt-4 space-y-1 rounded-2xl bg-surface p-3.5 border border-border/60">
                <p className="font-mono text-sm font-bold text-foreground">{card.value}</p>
                {card.secondaryValue && (
                  <p className="text-xs text-muted-foreground">{card.secondaryValue}</p>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-5">
                {card.onClick ? (
                  <Button
                    onClick={card.onClick}
                    variant="outline"
                    className="w-full justify-between rounded-xl border-border/80 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                  >
                    <span>{card.actionText}</span>
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-between rounded-xl border-border/80 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                  >
                    <a
                      href={card.href}
                      target={card.href?.startsWith("http") ? "_blank" : "_self"}
                      rel="noreferrer"
                    >
                      <span>{card.actionText}</span>
                      <ArrowRight className="size-4" />
                    </a>
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Action Banner */}
      <div className="mt-12 rounded-3xl bg-gradient-brand p-8 text-primary-foreground shadow-3d-elevated flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-display text-xl font-bold">Besoin d'un rendez-vous sur mesure ?</h3>
          <p className="mt-1 text-xs text-primary-foreground/90 max-w-xl">
            Prenez rendez-vous directement avec nos médecins conseils ou nos chargés de clientèle
            dans nos bureaux ou en visioconférence.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Button
            onClick={() => setCallbackOpen(true)}
            size="lg"
            variant="secondary"
            className="text-xs font-bold gap-2 shadow-soft"
          >
            <PhoneCall className="size-4" />
            Demander un rappel
          </Button>
          <Button
            onClick={() => setAppointmentOpen(true)}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 text-xs font-bold gap-2 shadow-soft"
          >
            <Calendar className="size-4" />
            Prendre rendez-vous
          </Button>
        </div>
      </div>

      {/* Modals */}
      <CallModal open={callOpen} onOpenChange={setCallOpen} />
      <CallbackModal open={callbackOpen} onOpenChange={setCallbackOpen} />
      <AppointmentModal open={appointmentOpen} onOpenChange={setAppointmentOpen} />
    </Section>
  );
}

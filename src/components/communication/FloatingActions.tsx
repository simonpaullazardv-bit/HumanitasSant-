import { useState } from "react";
import { Phone, MessageCircle, Calendar, MessageSquare, Headphones, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CallModal } from "./CallModal";
import { CallbackModal } from "./CallbackModal";
import { AppointmentModal } from "./AppointmentModal";
import { ChatWidget } from "./ChatWidget";
import { SITE } from "@/data/site";

export function FloatingActions() {
  const [callOpen, setCallOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const whatsappUrl = SITE.whatsappLink;

  return (
    <>
      {/* Floating Speed Dial / Pill Stack */}
      <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              className="flex flex-col items-end gap-2.5 mb-1"
            >
              {/* Appeler Humanitas */}
              <button
                onClick={() => {
                  setCallOpen(true);
                  setExpanded(false);
                }}
                className="group flex items-center gap-2.5 rounded-full bg-card px-4 py-2 text-xs font-bold text-foreground border border-border/80 shadow-3d-elevated transition-all hover:bg-primary hover:text-primary-foreground hover:scale-105"
              >
                <span>Appeler Directement</span>
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground group-hover:bg-white group-hover:text-primary">
                  <Phone className="size-4" />
                </span>
              </button>

              {/* WhatsApp Direct : affiché uniquement après validation de la vraie URL */}
              {whatsappUrl && <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setExpanded(false)}
                className="group flex items-center gap-2.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-3d-elevated transition-all hover:bg-emerald-700 hover:scale-105"
              >
                <span>WhatsApp Instantané</span>
                <span className="flex size-8 items-center justify-center rounded-full bg-white text-emerald-600">
                  <MessageCircle className="size-4" />
                </span>
              </a>}

              {/* Prendre Rendez-vous */}
              <button
                onClick={() => {
                  setAppointmentOpen(true);
                  setExpanded(false);
                }}
                className="group flex items-center gap-2.5 rounded-full bg-card px-4 py-2 text-xs font-bold text-foreground border border-border/80 shadow-3d-elevated transition-all hover:bg-primary hover:text-primary-foreground hover:scale-105"
              >
                <span>Prendre Rendez-vous</span>
                <span className="flex size-8 items-center justify-center rounded-full bg-amber-500 text-white">
                  <Calendar className="size-4" />
                </span>
              </button>

              {/* Demande de Rappel */}
              <button
                onClick={() => {
                  setCallbackOpen(true);
                  setExpanded(false);
                }}
                className="group flex items-center gap-2.5 rounded-full bg-card px-4 py-2 text-xs font-bold text-foreground border border-border/80 shadow-3d-elevated transition-all hover:bg-primary hover:text-primary-foreground hover:scale-105"
              >
                <span>Demander un Rappel</span>
                <span className="flex size-8 items-center justify-center rounded-full bg-sky-600 text-white">
                  <Headphones className="size-4" />
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Floating Action Toggle Button */}
        <div className="flex items-center gap-2">
          {/* Direct WhatsApp Quick Pill : aucune URL fictive */}
          {whatsappUrl && <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp Humanitas"
            className="flex size-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-3d-elevated transition-transform hover:scale-110"
          >
            <MessageCircle className="size-6" />
          </a>}

          {/* Main Toggle Button */}
          <button
            onClick={() => {
              if (expanded) {
                setExpanded(false);
              } else {
                setChatOpen(true);
              }
            }}
            onMouseEnter={() => setExpanded(true)}
            aria-label="Espace Assistance Humanitas"
            className="flex items-center gap-2 rounded-full bg-gradient-brand px-4 py-3 text-xs font-bold text-primary-foreground shadow-3d-elevated transition-all hover:scale-105"
          >
            <MessageSquare className="size-5" />
            <span className="hidden sm:inline">Assistance & Contact</span>
            <ChevronUp className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Modals & Chat Widget */}
      <CallModal open={callOpen} onOpenChange={setCallOpen} />
      <CallbackModal open={callbackOpen} onOpenChange={setCallbackOpen} />
      <AppointmentModal open={appointmentOpen} onOpenChange={setAppointmentOpen} />
      <ChatWidget
        open={chatOpen}
        onOpenChange={setChatOpen}
        onOpenCallback={() => {
          setChatOpen(false);
          setCallbackOpen(true);
        }}
        onOpenAppointment={() => {
          setChatOpen(false);
          setAppointmentOpen(true);
        }}
      />
    </>
  );
}

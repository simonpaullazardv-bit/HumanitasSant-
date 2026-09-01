import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  PhoneCall,
  ShieldCheck,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendChatMessage } from "@/services/contact.service";
import type { ChatMessage } from "@/types";

interface ChatWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenCallback?: () => void;
  onOpenAppointment?: () => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    sender: "bot",
    sender_name: "Assistant Virtuel Humanitas",
    content:
      "Bonjour ! Bienvenue sur l'espace d'assistance de la mutuelle Humanitas Santé. Comment puis-je vous aider aujourd'hui ?",
    timestamp: "À l'instant",
  },
];

const QUICK_SUGGESTIONS = [
  "Quels sont les tarifs des cotisations ?",
  "Comment obtenir une prise en charge ?",
  "Trouver un hôpital partenaire",
  "Parler à un conseiller humain",
];

export function ChatWidget({
  open,
  onOpenChange,
  onOpenCallback,
  onOpenAppointment,
}: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState<"bot" | "human">("bot");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      sender_name: "Vous",
      content: text,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");

    // Notify user & send message
    toast.info("Message envoyé au support Humanitas", {
      description: "Notre système de régulation traite votre demande.",
    });

    try {
      await sendChatMessage(userMsg);
    } catch (e) {
      // Background log
    }

    // Auto-bot response simulation
    setIsTyping(true);
    setTimeout(() => {
      let botAnswer = "Merci pour votre message. Un conseiller de santé examine votre demande.";

      const lower = text.toLowerCase();
      if (lower.includes("tarif") || lower.includes("cotisation") || lower.includes("prix")) {
        botAnswer =
          "Nos formules débutent à partir de 15 $/mois (Formule Bronze) jusqu'à 85 $/mois (Formule Platine avec couverture internationale). Souhaitez-vous consulter le tableau complet ou demander un devis ?";
      } else if (
        lower.includes("prise en charge") ||
        lower.includes("soin") ||
        lower.includes("hôpital")
      ) {
        botAnswer =
          "Les prises en charge suivent les droits ouverts de votre couverture et les conventions publiées par Humanitas.";
      } else if (
        lower.includes("conseiller") ||
        lower.includes("humain") ||
        lower.includes("appel")
      ) {
        botAnswer =
          "Je vous mets en relation directe avec notre caisse d'accueil ou vous pouvez solliciter un rappel téléphonique gratuit.";
      }

      const botMsg: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        sender: "bot",
        sender_name: mode === "bot" ? "Assistant IA Humanitas" : "Agent Support Humanitas",
        content: botAnswer,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200);
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 w-[92vw] max-w-sm sm:right-6 sm:w-96">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="flex flex-col overflow-hidden rounded-3xl border border-primary/30 bg-card shadow-3d-elevated h-[500px]"
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between bg-gradient-brand p-4 text-primary-foreground shadow-soft">
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <Bot className="size-5" />
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
            </div>
            <div>
              <h4 className="font-display text-sm font-bold leading-tight">Humanitas Assistance</h4>
              <p className="text-[11px] opacity-90">
                {mode === "bot" ? "Assistant Virtuel IA & Support 24/7" : "Agent Humain connecté"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode((m) => (m === "bot" ? "human" : "bot"))}
              title="Basculer vers un conseiller"
              className="rounded-lg p-1 text-xs bg-white/10 hover:bg-white/20 transition-colors"
            >
              {mode === "bot" ? "🧑‍💻 Mode Agent" : "🤖 Mode IA"}
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-1 hover:bg-white/20 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Action Shortcuts Bar */}
        <div className="flex items-center justify-around border-b border-border/60 bg-surface/80 p-2 text-[11px] font-semibold text-primary backdrop-blur">
          {onOpenCallback && (
            <button onClick={onOpenCallback} className="flex items-center gap-1 hover:underline">
              <PhoneCall className="size-3" /> Demander un rappel
            </button>
          )}
          {onOpenAppointment && (
            <button onClick={onOpenAppointment} className="flex items-center gap-1 hover:underline">
              <Sparkles className="size-3 text-amber-500" /> Prendre rendez-vous
            </button>
          )}
        </div>

        {/* Message Area */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 bg-surface/30">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                <span className="mb-1 text-[10px] text-muted-foreground font-medium px-1">
                  {msg.sender_name || (isUser ? "Vous" : "Humanitas")} · {msg.timestamp}
                </span>
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-soft ${
                    isUser
                      ? "bg-gradient-brand text-primary-foreground rounded-br-none"
                      : "bg-card border border-border/80 text-foreground rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground italic p-2">
              <Bot className="size-4 animate-spin text-primary" />
              Humanitas écrit...
            </div>
          )}
        </div>

        {/* Quick Suggestions */}
        <div className="flex gap-1.5 overflow-x-auto p-2 bg-card border-t border-border/60 no-scrollbar">
          {QUICK_SUGGESTIONS.map((sug) => (
            <button
              key={sug}
              onClick={() => handleSend(sug)}
              className="shrink-0 rounded-full bg-surface px-3 py-1 text-[11px] font-medium text-foreground border border-border/80 hover:bg-primary/10 hover:border-primary/40 transition-all"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-3 bg-card border-t border-border/80 flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Écrivez votre message..."
            className="rounded-2xl border-border/80 text-xs bg-surface"
          />
          <Button
            onClick={() => handleSend()}
            size="icon"
            className="size-9 shrink-0 rounded-2xl bg-gradient-brand shadow-soft"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

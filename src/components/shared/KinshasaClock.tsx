import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Clock } from "lucide-react";

const TIME_ZONE = "Africa/Kinshasa";

function format(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: TIME_ZONE, ...options }).format(date);
}

export function KinshasaClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="inline-flex items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-2.5 shadow-soft backdrop-blur"
      aria-live="off"
    >
      <span className="inline-flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Clock className="size-4" />
      </span>
      <div className="leading-tight">
        <p className="font-display text-lg font-bold tabular-nums tracking-tight text-foreground">
          {now
            ? format(now, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
            : "--:--:--"}
        </p>
        <p className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
          Kinshasa{" "}
          {now ? `· ${format(now, { weekday: "short", day: "2-digit", month: "short" })}` : ""}
        </p>
      </div>
    </motion.div>
  );
}

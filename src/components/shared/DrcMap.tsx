import { useState } from "react";
import { motion } from "motion/react";
import { MapPin } from "lucide-react";
import { SITE } from "@/data/site";
import carteRdc from "@/assets/carte-rdc.png.asset.json";

/** Position de Kinshasa en pourcentage de l'image de la carte. */
const KINSHASA = { left: "30.5%", top: "62%" };

export function DrcMap() {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-sm rounded-3xl border border-border/70 bg-card/90 p-5 shadow-soft backdrop-blur"
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Localisation
      </p>
      <p className="mt-1 font-display text-base font-bold text-foreground">
        République Démocratique du Congo
      </p>

      <div className="relative mt-3 overflow-hidden rounded-2xl border border-border/60">
        <img
          src={carteRdc.url}
          alt="Carte de la République Démocratique du Congo aux couleurs du drapeau national, avec Kinshasa"
          loading="lazy"
          className="h-auto w-full object-contain"
        />

        {/* point lumineux animé sur Kinshasa */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer outline-none"
          style={{ left: KINSHASA.left, top: KINSHASA.top }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          tabIndex={0}
          aria-label="Kinshasa"
        >
          <motion.span
            className="absolute left-1/2 top-1/2 block size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#CE1021]"
            animate={{ scale: [1, 3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          />
          <span className="relative block size-2 rounded-full bg-[#CE1021] ring-2 ring-white" />
        </div>

        <motion.div
          initial={false}
          animate={hovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none absolute left-3 top-[60%] w-52 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-elevated"
        >
          <p className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
            <MapPin className="size-3.5 text-accent" />
            Kinshasa
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Siège principal de Humanitas et Centre de Bien-être.
          </p>
        </motion.div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">{SITE.address}</p>
    </motion.div>
  );
}

import { motion, useReducedMotion } from "motion/react";

/**
 * Globe terrestre 3D stylisé — sphère en dégradé, grille de méridiens
 * et bande de continents pointillés défilant en boucle (rotation lente).
 */
export function Globe({ className = "", showKinshasaMarker = false }: { className?: string; showKinshasaMarker?: boolean }) {
  const reduce = useReducedMotion();

  return (
    <div className={`relative aspect-square ${className}`} aria-hidden="true">
      {/* halo */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"
        animate={reduce ? {} : { opacity: [0.35, 0.6, 0.35], scale: [0.96, 1.04, 0.96] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative size-full overflow-hidden rounded-full border border-primary/20 bg-[radial-gradient(circle_at_32%_28%,color-mix(in_oklab,var(--color-accent)_35%,transparent),transparent_55%),radial-gradient(circle_at_70%_75%,color-mix(in_oklab,var(--color-primary)_60%,transparent),color-mix(in_oklab,var(--color-primary)_92%,black))] shadow-elevated">
        {/* continents défilants */}
        <motion.div
          className="absolute inset-y-0 left-0 flex w-[200%]"
          animate={reduce ? {} : { x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          {[0, 1].map((i) => (
            <svg key={i} viewBox="0 0 200 200" className="h-full w-1/2" preserveAspectRatio="none">
              <defs>
                <pattern id={`dots-${i}`} width="6" height="6" patternUnits="userSpaceOnUse">
                  <circle cx="1.6" cy="1.6" r="1.1" className="fill-white/70" />
                </pattern>
              </defs>
              <g fill={`url(#dots-${i})`}>
                <path d="M18 62c14-16 34-22 52-14 12 6 10 22 2 32-10 12-6 28-18 34-14 7-30-6-34-20-4-14-8-22-2-32z" />
                <path d="M96 40c16-10 40-8 52 4 10 10 4 24-6 30-12 8-30 6-42-2-10-7-12-26-4-32z" />
                <path d="M104 92c14-6 30 2 34 16 5 18-4 40-16 52-10 10-24 4-28-8-6-20 0-52 10-60z" />
                <path d="M150 128c12-4 26 4 28 16 2 12-10 22-22 20-14-2-20-14-16-24 2-6 6-10 10-12z" />
                <path d="M40 116c10-4 22 2 24 12 2 10-6 18-16 18s-18-8-16-18c1-6 4-10 8-12z" />
              </g>
            </svg>
          ))}
        </motion.div>

        {/* méridiens & parallèles */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
          <g className="stroke-white/25" fill="none" strokeWidth="0.4">
            <circle cx="50" cy="50" r="49" />
            <ellipse cx="50" cy="50" rx="49" ry="16" />
            <ellipse cx="50" cy="50" rx="49" ry="32" />
            <ellipse cx="50" cy="50" rx="16" ry="49" />
            <ellipse cx="50" cy="50" rx="32" ry="49" />
            <line x1="1" y1="50" x2="99" y2="50" />
          </g>
        </svg>

        {/* lumière & ombre sphériques */}
        <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.45),transparent_45%)]" />
        <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_-18px_-22px_50px_rgba(0,0,0,0.45)]" />
      </div>

      {showKinshasaMarker ? (
        <div className="absolute left-[57%] top-[56%] z-10 -translate-x-1/2 -translate-y-1/2" aria-label="Kinshasa, République démocratique du Congo">
          <motion.span
            className="block size-2.5 rounded-full border-2 border-white bg-accent shadow-[0_0_0_4px_rgba(255,255,255,0.18)]"
            animate={reduce ? {} : { scale: [1, 1.35, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="absolute left-3 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full bg-background/90 px-1.5 py-0.5 text-[8px] font-bold text-foreground shadow-sm sm:block">Kinshasa</span>
        </div>
      ) : null}

      {/* anneau orbital */}
      <motion.div
        className="pointer-events-none absolute -inset-[9%] rounded-full border border-dashed border-accent/40"
        style={{ transform: "rotateX(72deg)" }}
        animate={reduce ? {} : { rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

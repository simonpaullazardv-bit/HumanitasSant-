import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-soft pt-32 pb-16 sm:pt-40 sm:pb-20">
      <div className="aurora" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <nav className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-3.5 py-1 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
            <Link to="/" className="transition-colors hover:text-primary">
              Accueil
            </Link>
            <span className="text-muted-foreground/60">/</span>
            <span className="font-semibold text-primary">{eyebrow}</span>
          </nav>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">{title}</h1>
          {description ? (
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
          ) : null}
          {children}
        </motion.div>
      </div>
    </section>
  );
}

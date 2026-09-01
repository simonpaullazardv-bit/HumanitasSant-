import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, UserRound, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useScrolled } from "@/hooks/useScrolled";
import { useAuth } from "@/hooks/useAuth";
import { IMAGES, SITE } from "@/data/site";
import { NAV_GROUPS, NAV_HOME } from "@/data/navigation";
import { cn } from "@/lib/utils";
import { PublicHeaderShowcase } from "@/components/layout/PublicHeaderShowcase";

export function Navbar() {
  const scrolled = useScrolled();
  const { isAuthenticated, home } = useAuth();
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/85 shadow-soft backdrop-blur-xl"
          : "bg-background/40 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <div className="relative flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-card/90 p-1.5 shadow-soft transition-all duration-300 group-hover:scale-105 group-hover:border-primary/40 group-hover:shadow-glow-primary">
            <motion.img
              src={IMAGES.logo}
              alt="Logo Humanitas Santé"
              width={48}
              height={48}
              className="h-full w-full object-contain"
              initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="hidden leading-tight sm:block">
            <span className="block font-display text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              HUMANITAS
            </span>
            <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Santé & bien-être
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Navigation principale">
          <Link
            to={NAV_HOME.to}
            activeOptions={{ exact: true }}
            className="rounded-full px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary [&.active]:bg-primary-soft [&.active]:text-primary"
          >
            {NAV_HOME.label}
          </Link>

          {NAV_GROUPS.map((group) => (
            <div
              key={group.label}
              className="relative"
              onMouseEnter={() => setOpenGroup(group.label)}
              onMouseLeave={() => setOpenGroup(null)}
            >
              <button
                type="button"
                aria-expanded={openGroup === group.label}
                onClick={() =>
                  setOpenGroup((current) => (current === group.label ? null : group.label))
                }
                className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
              >
                {group.label}
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform",
                    openGroup === group.label && "rotate-180",
                  )}
                />
              </button>

              <AnimatePresence>
                {openGroup === group.label ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-1/2 top-full w-80 -translate-x-1/2 pt-3"
                  >
                    <div className="glass-3d rounded-2xl p-2.5 shadow-3d-elevated">
                      {group.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setOpenGroup(null)}
                          className="group/item block rounded-xl p-2.5 transition-all duration-200 hover:bg-primary/10 hover:translate-x-1"
                        >
                          <span className="block text-sm font-semibold text-foreground group-hover/item:text-primary">
                            {item.label}
                          </span>
                          {item.description ? (
                            <span className="block text-xs text-muted-foreground mt-0.5">
                              {item.description}
                            </span>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link to={home}>
                <UserRound className="size-4" />
                Mon espace
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link to="/auth" search={{ redirect: undefined }}>
                <UserRound className="size-4" />
                Connexion
              </Link>
            </Button>
          )}
          <Button asChild size="sm" className="hidden bg-gradient-brand shadow-soft sm:inline-flex">
            <Link to="/adhesion">Devenir adhérent</Link>
          </Button>
          <button
            type="button"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground xl:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <PublicHeaderShowcase />

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="max-h-[75vh] overflow-y-auto border-t border-border bg-background/97 backdrop-blur-xl xl:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-5 sm:px-8">
              <Link
                to={NAV_HOME.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
              >
                {NAV_HOME.label}
              </Link>

              {NAV_GROUPS.map((group) => (
                <div key={group.label} className="border-t border-border/60 pt-2">
                  <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}

              <div className="mt-3 flex flex-col gap-2">
                <Button asChild variant="outline">
                  {isAuthenticated ? (
                    <Link to={home} onClick={() => setOpen(false)}>
                      Mon espace
                    </Link>
                  ) : (
                    <Link
                      to="/auth"
                      search={{ redirect: undefined }}
                      onClick={() => setOpen(false)}
                    >
                      Connexion
                    </Link>
                  )}
                </Button>
                <Button asChild className="bg-gradient-brand">
                  <Link to="/adhesion" onClick={() => setOpen(false)}>
                    Devenir adhérent
                  </Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{SITE.hours}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

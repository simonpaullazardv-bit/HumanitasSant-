import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, Camera, ChevronLeft, ChevronRight, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Globe } from "@/components/shared/Globe";
import { KinshasaClock } from "@/components/shared/KinshasaClock";
import { LOCAL_MEDIA_IMAGES } from "@/data/public-fallbacks";
import { supabase } from "@/integrations/supabase/client";

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } } };

function useHeroGallery() {
  return useQuery({
    queryKey: ["hero-gallery-public"],
    queryFn: async () => {
      const local = LOCAL_MEDIA_IMAGES.map((item) => ({ id: item.id, title: item.nom, url: item.url }));
      try {
        const { data } = await supabase
          .from("gallery_images" as never)
          .select("id,title,photo_url")
          .eq("is_published", true)
          .order("created_at", { ascending: false });
        const remote = ((data ?? []) as Array<Record<string, unknown>>)
          .map((row) => ({ id: `remote-${String(row.id)}`, title: String(row.title || "Humanitas Santé"), url: String(row.photo_url || "") }))
          .filter((item) => item.url);
        const urls = new Set(remote.map((item) => item.url));
        return [...remote, ...local.filter((item) => !urls.has(item.url))];
      } catch {
        return local;
      }
    },
    staleTime: 60_000,
    retry: 1,
  });
}

function HeroGallery() {
  const { data = [] } = useHeroGallery();
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const items = useMemo(() => data.filter((item) => !failed.includes(item.id)), [data, failed]);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % items.length), 4200);
    return () => window.clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    if (index >= items.length) setIndex(0);
  }, [index, items.length]);

  const featured = items[index];
  if (!featured) return null;

  const previous = () => setIndex((current) => (current - 1 + items.length) % items.length);
  const next = () => setIndex((current) => (current + 1) % items.length);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full"
    >
      <div className="absolute -inset-3 rounded-[2rem] bg-gradient-brand opacity-20 blur-2xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-slate-950/90 shadow-3d-elevated">
        <div className="absolute inset-0 opacity-35 blur-2xl scale-110" style={{ backgroundImage: `url(${featured.url})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative aspect-[16/9] min-h-[21rem] sm:min-h-[25rem] lg:min-h-[31rem]">
          <motion.img
            key={featured.id}
            src={featured.url}
            alt={featured.title}
            onError={() => setFailed((current) => current.includes(featured.id) ? current : [...current, featured.id])}
            className="absolute inset-0 h-full w-full object-contain p-2 sm:p-4"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.75 }}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-5 pb-5 pt-20 sm:px-7 sm:pb-7">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0 text-white">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur">
                  <Camera className="size-3" /> Galerie Humanitas Santé
                </span>
                <p className="mt-2 truncate text-sm font-semibold sm:text-base">{featured.title}</p>
              </div>
              <span className="shrink-0 rounded-full bg-black/40 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
                {index + 1} / {items.length}
              </span>
            </div>
          </div>
          {items.length > 1 ? (
            <div className="absolute right-4 top-4 flex gap-2">
              <button type="button" aria-label="Image précédente" onClick={previous} className="inline-flex size-10 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur transition hover:bg-black/65">
                <ChevronLeft className="size-5" />
              </button>
              <button type="button" aria-label="Image suivante" onClick={next} className="inline-flex size-10 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur transition hover:bg-black/65">
                <ChevronRight className="size-5" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-soft pt-32 pb-16 sm:pt-40 sm:pb-20">
      <div className="aurora" aria-hidden="true" />
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:gap-14">
        <motion.div variants={container} initial="hidden" animate="visible">
          <motion.span variants={item} className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-card/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent backdrop-blur">
            <Sparkles className="size-3.5" /> Mutuelle de santé & bien-être
          </motion.span>
          <motion.h1 variants={item} className="mt-6 text-4xl font-bold leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
            Votre santé, <span className="text-gradient-brand">notre priorité.</span>
          </motion.h1>
          <motion.p variants={item} className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            HUMANITAS SANTÉ mutualise la solidarité de ses membres pour offrir une couverture santé accessible, un accompagnement humain, la prévention et un parcours de soins sécurisé.
          </motion.p>
          <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="btn-3d-primary shadow-3d-soft"><Link to="/adhesion">Adhérer<ArrowRight className="size-4" /></Link></Button>
            <Button asChild size="lg" variant="outline" className="border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all"><Link to="/partenaires">Trouver un partenaire</Link></Button>
            <Button asChild size="lg" variant="ghost" className="text-primary hover:bg-primary/10 transition-all"><Link to="/auth">Se connecter</Link></Button>
          </motion.div>
          <motion.div variants={item} className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
            <ShieldCheck className="size-5 text-accent" /> Réseau conventionné · Parcours de soins sécurisé · Accompagnement personnalisé
          </motion.div>
          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-5">
            <KinshasaClock />
            <div className="flex items-center gap-3">
              <Globe className="w-16 shrink-0" />
              <p className="max-w-[11rem] text-xs leading-relaxed text-muted-foreground">Une mutuelle ancrée à Kinshasa, ouverte sur l'international.</p>
            </div>
          </motion.div>
        </motion.div>
        <HeroGallery />
      </div>
    </section>
  );
}

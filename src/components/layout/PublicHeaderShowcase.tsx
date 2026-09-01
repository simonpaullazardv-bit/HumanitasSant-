import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { MapPin } from "lucide-react";
import { IMAGES } from "@/data/site";
import { LOCAL_GALLERY_URLS } from "@/data/public-fallbacks";
import { mediaQuery } from "@/lib/cms.queries";
import { Globe } from "@/components/shared/Globe";
import { KinshasaClock } from "@/components/shared/KinshasaClock";

/**
 * Bandeau institutionnel du header public.
 * Les images utilisées sont uniquement des fichiers déjà présents dans public/img.
 * Aucun chiffre institutionnel n'est affiché ici.
 */
export function PublicHeaderShowcase() {
  const reduce = useReducedMotion();
  const { data: remoteMedia = [] } = useQuery(mediaQuery({ type: "image", limit: 200 }));
  const gallery = useMemo(() => {
    const remote = remoteMedia.map((media) => media.url).filter((url): url is string => Boolean(url));
    return Array.from(new Set([...remote, ...LOCAL_GALLERY_URLS, ...IMAGES.gallery.filter(Boolean)]));
  }, [remoteMedia]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (gallery.length < 2 || reduce) return;
    setIndex(Math.floor(Math.random() * gallery.length));
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1 + Math.floor(Math.random() * Math.max(1, gallery.length - 1))) % gallery.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [gallery.length, reduce]);

  return (
    <div className="border-t border-border/40 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-3 px-5 sm:px-8">
        <div className="hidden items-center gap-2 md:flex">
          <div className="relative flex size-9 items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full border border-primary/25"
              animate={reduce ? {} : { rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
            <motion.img
              src={IMAGES.logo}
              alt="Humanitas"
              className="size-7 object-contain"
              animate={reduce ? {} : { rotate: [0, 360] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Humanitas
          </span>
        </div>

        <KinshasaClock />

        <div className="hidden items-center gap-2 sm:flex">
          <Globe className="w-9 shrink-0" showKinshasaMarker />
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <MapPin className="size-3 text-accent" /> Kinshasa
          </span>
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-2">
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground lg:block">
            Galerie Humanitas
          </span>
          <div className="relative h-9 w-32 overflow-hidden rounded-xl border border-border/70 bg-muted/40 sm:w-44">
            {gallery.map((src, photoIndex) => (
              <motion.img
                key={src}
                src={src}
                alt="Photographie Humanitas"
                className="absolute inset-0 size-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: photoIndex === index ? 1 : 0 }}
                transition={{ duration: 0.7 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

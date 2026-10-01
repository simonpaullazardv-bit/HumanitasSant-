import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { LOCAL_MEDIA_IMAGES } from "@/data/public-fallbacks";

export interface GalleryItem {
  id: string;
  categoryLabel: string;
  title: string;
  description: string;
  date: string;
  location?: string;
  photoUrl: string;
  source: "supabase" | "public";
}

function localGalleryItems(): GalleryItem[] {
  return LOCAL_MEDIA_IMAGES.map((item) => ({
    id: item.id,
    categoryLabel: "Humanitas Santé",
    title: item.texte_alternatif ?? item.nom,
    description: item.legende ?? "Galerie institutionnelle Humanitas Santé.",
    date: "Archive locale",
    photoUrl: item.url,
    source: "public" as const,
  }));
}

function useGalleryQuery() {
  return useQuery({
    queryKey: ["gallery_images", "hybrid-public"],
    queryFn: async (): Promise<GalleryItem[]> => {
      const local = localGalleryItems();
      let remote: GalleryItem[] = [];

      try {
        const { data } = await supabase
          .from("gallery_images" as never)
          .select("*")
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        remote = ((data ?? []) as Array<Record<string, unknown>>)
          .map((row) => ({
            id: `supabase-${String(row.id)}`,
            categoryLabel: String(row.category_label || "Humanitas Santé"),
            title: String(row.title || "Photo officielle Humanitas"),
            description: String(row.description || ""),
            date: String(row.date_label || "Publication Humanitas"),
            location: row.location ? String(row.location) : undefined,
            photoUrl: row.photo_url ? String(row.photo_url) : "",
            source: "supabase" as const,
          }))
          .filter((item) => Boolean(item.photoUrl));
      } catch {
        // Supabase indisponible : le contenu local reste pleinement fonctionnel.
      }

      // Supabase passe devant, puis les médias locaux complètent sans doublons.
      const remoteUrls = new Set(remote.map((item) => item.photoUrl));
      return [...remote, ...local.filter((item) => !remoteUrls.has(item.photoUrl))];
    },
    staleTime: 60_000,
    retry: 1,
  });
}

export function GallerySection() {
  const { data: galleryItems = [] } = useGalleryQuery();
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const items = useMemo(() => {
    const source = galleryItems.filter((item) => item.photoUrl);
    return source
      .map((item) => ({ item, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ item }) => item);
  }, [galleryItems]);

  useEffect(() => {
    if (items.length < 2) return;
    setFeaturedIndex(Math.floor(Math.random() * items.length));
    const timer = window.setInterval(() => {
      setFeaturedIndex((current) => {
        const offset = 1 + Math.floor(Math.random() * (items.length - 1));
        return (current + offset) % items.length;
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    if (featuredIndex >= items.length) setFeaturedIndex(0);
  }, [featuredIndex, items.length]);

  const featured = items[featuredIndex];

  return (
    <Section id="galerie" className="relative overflow-hidden">
      <SectionHeading
        eyebrow="Galerie dynamique Humanitas Santé"
        title="Humanitas Santé en images"
        description="Toutes les images institutionnelles disponibles peuvent participer au défilement. Les médias publiés dans Supabase sont ajoutés automatiquement, sans retirer les ressources locales du projet."
      />

      {featured ? (
        <div className="mt-10 grid gap-5 lg:grid-cols-[1.65fr_0.35fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-3d-elevated">
            <motion.img
              key={featured.id}
              src={featured.photoUrl}
              alt={featured.title}
              className="aspect-[16/8] w-full object-cover"
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-5 sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="text-white">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur">
                    <Camera className="size-3" /> {featured.categoryLabel}
                  </span>
                  <h3 className="mt-2 font-display text-xl font-bold sm:text-2xl">
                    {featured.title}
                  </h3>
                  {featured.description ? (
                    <p className="mt-1 max-w-2xl text-xs text-white/80">{featured.description}</p>
                  ) : null}
                </div>
                <span className="rounded-full bg-black/35 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  {featuredIndex + 1} / {items.length}
                </span>
              </div>
            </div>

            {items.length > 1 ? (
              <div className="absolute right-4 top-4 flex gap-2">
                <button
                  type="button"
                  aria-label="Image précédente"
                  onClick={() =>
                    setFeaturedIndex((current) => (current - 1 + items.length) % items.length)
                  }
                  className="inline-flex size-10 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur transition hover:bg-black/55"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="Image suivante"
                  onClick={() => setFeaturedIndex((current) => (current + 1) % items.length)}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur transition hover:bg-black/55"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-1">
            {items.slice(0, 4).map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFeaturedIndex(index)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-card text-left shadow-soft transition hover:-translate-y-0.5",
                  featuredIndex === index
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border/70",
                )}
              >
                <img
                  src={item.photoUrl}
                  alt=""
                  className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-[10px] font-semibold text-white">
                  {item.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          <ImageIcon className="mx-auto size-8 text-primary/60" />
          <p className="mt-3 font-semibold">Espace galerie prêt à recevoir les médias.</p>
        </div>
      )}

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => (
          <motion.button
            type="button"
            key={item.id}
            onClick={() => setFeaturedIndex(index)}
            className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card p-2 text-left shadow-soft transition hover:-translate-y-1 hover:shadow-3d-elevated"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.35, delay: Math.min(index * 0.02, 0.35) }}
          >
            <img
              src={item.photoUrl}
              alt={item.title}
              className="aspect-[4/3] w-full rounded-2xl object-cover transition duration-500 group-hover:scale-[1.02]"
              loading="lazy"
            />
            <div className="p-3">
              <p className="truncate text-xs font-bold text-foreground">{item.title}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <ShieldCheck
                  className={cn(
                    "size-3",
                    item.source === "supabase" ? "text-emerald-600" : "text-primary",
                  )}
                />
                {item.source === "supabase" ? "Publié par Supabase" : "Source locale public/img"}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
        <Sparkles className="size-4 shrink-0 text-primary" />
        <span>
          <strong>Architecture hybride :</strong> la vitrine ne dépend pas d'une base vide. Les
          médias du projet restent utilisables et Supabase prend le relais dès qu'il publie ses
          propres ressources.
        </span>
      </div>
    </Section>
  );
}

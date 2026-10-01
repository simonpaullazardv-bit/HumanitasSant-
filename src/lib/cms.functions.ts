/**
 * Server functions publiques du site vitrine.
 * Lecture seule, via le client publishable : les policies RLS n'exposent
 * que les contenus publiés et actifs. Aucune donnée privée ne transite ici.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicClient, signMediaPath } from "@/lib/cms.server";
import {
  LOCAL_MEDIA_IMAGES,
  LOCAL_MEDIA_VIDEOS,
  LOCAL_MEMBERSHIP_TIERS,
  LOCAL_SITE_SETTINGS,
  LOCAL_SOCIAL_LINKS,
  LOCAL_TEAM,
} from "@/data/public-fallbacks";
import { FAQ, EVENTS, SERVICES } from "@/data/site";

export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await publicClient()
      .from("app_parametres")
      .select("cle, valeur, categorie")
      .eq("is_public", true);
    const rows = (data ?? []).map((row) => ({
      cle: row.cle,
      categorie: row.categorie,
      valeur: JSON.stringify(row.valeur ?? null),
    }));
    return rows.length > 0 ? rows : LOCAL_SITE_SETTINGS;
  } catch {
    return LOCAL_SITE_SETTINGS;
  }
});

export const getSocialLinks = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await publicClient()
      .from("cms_reseaux_sociaux")
      .select("plateforme, url, libelle, ordre")
      .eq("is_active", true)
      .order("ordre");
    return data && data.length > 0 ? data : LOCAL_SOCIAL_LINKS;
  } catch {
    return LOCAL_SOCIAL_LINKS;
  }
});

export const getMembershipTiers = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await publicClient()
      .from("categories_adhesion")
      .select(
        "id, code, nom, prix_usd, periode, tagline, description, plafond_usd, taux_couverture, avantages, ordre, mise_en_avant",
      )
      .eq("is_active", true)
      .order("ordre");
    return data && data.length > 0 ? data : LOCAL_MEMBERSHIP_TIERS;
  } catch {
    return LOCAL_MEMBERSHIP_TIERS;
  }
});

export const getPartners = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        type: z
          .enum(["hopital", "pharmacie", "laboratoire", "centre_bien_etre", "entreprise"])
          .optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    try {
      let query = publicClient()
        .from("partenaires")
        .select(
          "id, nom, slug, type, categorie, description, logo_url, adresse, commune, ville, telephone, site_web, conventionne, ordre",
        )
        .eq("is_active", true)
        .eq("is_public", true)
        .order("ordre")
        .order("nom");
      if (data.type) query = query.eq("type", data.type);
      const { data: rows } = await query;
      return rows ?? [];
    } catch {
      return [];
    }
  });

export const getServicesContent = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await publicClient()
      .from("cms_services")
      .select("id, slug, titre, description, contenu, icone, image_url, ordre")
      .eq("statut", "publie")
      .eq("is_active", true)
      .order("ordre");
    if (data && data.length > 0) return data;
  } catch {
    // Fallback local ci-dessous.
  }
  return SERVICES.map((item, index) => ({
    id: `local-service-${index + 1}`,
    slug: item.slug,
    titre: item.title,
    description: item.description,
    contenu: item.description,
    icone: item.icon,
    image_url: null,
    ordre: index + 1,
  }));
});

export const getFaqEntries = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await publicClient()
      .from("cms_faq")
      .select("id, question, reponse, categorie, ordre")
      .eq("statut", "publie")
      .eq("is_active", true)
      .order("ordre");
    if (data && data.length > 0) return data;
  } catch {
    // Fallback local ci-dessous.
  }
  return FAQ.map((item, index) => ({
    id: `local-faq-${index + 1}`,
    question: item.question,
    reponse: item.answer,
    categorie: "Général",
    ordre: index + 1,
  }));
});

export const getTestimonials = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await publicClient()
      .from("cms_temoignages")
      .select("id, auteur, fonction, message, photo_url, note, ordre")
      .eq("statut", "publie")
      .eq("is_active", true)
      .order("ordre");
    return data ?? [];
  } catch {
    return [];
  }
});

export const getTeamMembers = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await publicClient()
      .from("cms_equipe")
      .select("id, nom, fonction, bio, photo_url, email, linkedin_url, ordre")
      .eq("statut", "publie")
      .eq("is_active", true)
      .order("ordre");
    return data && data.length > 0 ? data : LOCAL_TEAM;
  } catch {
    return LOCAL_TEAM;
  }
});

export const getBanners = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await publicClient()
      .from("cms_bannieres")
      .select("id, titre, sous_titre, image_url, bouton_libelle, bouton_lien, ordre")
      .order("ordre");
    return data ?? [];
  } catch {
    return [];
  }
});

export const getNews = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        limit: z.number().int().min(1).max(50).optional(),
        categorie: z.string().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    try {
      let query = publicClient()
        .from("cms_actualites")
        .select("id, slug, titre, extrait, image_url, categorie, auteur, date_publication")
        .eq("statut", "publie")
        .eq("is_active", true)
        .order("date_publication", { ascending: false });
      if (data.categorie) query = query.eq("categorie", data.categorie);
      if (data.limit) query = query.limit(data.limit);
      const { data: rows, error } = await query;
      if (error) throw error;
      return rows ?? [];
    } catch {
      // Pas de fausse actualité locale : l'espace reste vide jusqu'à publication officielle.
      return [];
    }
  });

export const getNewsBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    try {
      const { data: row, error } = await publicClient()
        .from("cms_actualites")
        .select("id, slug, titre, extrait, contenu, image_url, categorie, auteur, date_publication")
        .eq("slug", data.slug)
        .eq("statut", "publie")
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return row;
    } catch {
      return null;
    }
  });

export const getEvents = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ limit: z.number().int().min(1).max(50).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    try {
      let query = publicClient()
        .from("cms_evenements")
        .select("id, slug, titre, description, lieu, image_url, date_debut, date_fin")
        .eq("statut", "publie")
        .eq("is_active", true)
        .order("date_debut", { ascending: false });
      if (data.limit) query = query.limit(data.limit);
      const { data: rows } = await query;
      if (rows && rows.length > 0) return rows;
    } catch {
      // Fallback local ci-dessous.
    }
    const local = EVENTS.map((event) => ({
      id: event.id,
      slug: event.id,
      titre: event.title,
      description: event.excerpt,
      lieu: event.location,
      image_url: event.image,
      date_debut: event.date,
      date_fin: null,
    }));
    return data.limit ? local.slice(0, data.limit) : local;
  });

export const getEventBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    try {
      const { data: row, error } = await publicClient()
        .from("cms_evenements")
        .select("id, slug, titre, description, contenu, lieu, image_url, date_debut, date_fin")
        .eq("slug", data.slug)
        .eq("statut", "publie")
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      if (row) return row;
    } catch {
      // Fallback local ci-dessous.
    }

    const event = EVENTS.find((item) => item.id === data.slug);
    return event
      ? {
          id: event.id,
          slug: event.id,
          titre: event.title,
          description: event.excerpt,
          contenu: event.excerpt,
          lieu: event.location,
          image_url: event.image,
          date_debut: event.date,
          date_fin: null,
        }
      : null;
  });

export const getDownloads = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data, error } = await publicClient()
      .from("cms_telechargements")
      .select("id, titre, description, fichier_url, categorie, taille_octets, ordre")
      .eq("statut", "publie")
      .eq("is_active", true)
      .order("ordre");
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
});

export const getCmsPage = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }) => {
    try {
      const client = publicClient();
      const { data: page, error: pageError } = await client
        .from("cms_pages")
        .select(
          "id, slug, titre, sous_titre, contenu, image_url, seo_title, seo_description, og_image_url",
        )
        .eq("slug", data.slug)
        .eq("statut", "publie")
        .eq("is_active", true)
        .maybeSingle();
      if (pageError) throw pageError;
      if (!page) return null;
      const { data: sections, error: sectionError } = await client
        .from("cms_sections")
        .select("id, cle, titre, sous_titre, contenu, image_url, video_url, donnees, ordre")
        .eq("page_id", page.id)
        .eq("statut", "publie")
        .eq("is_active", true)
        .order("ordre");
      if (sectionError) throw sectionError;
      return { page, sections: sections ?? [] };
    } catch {
      return null;
    }
  });

/** Médiathèque publique : URLs signées générées côté serveur (bucket privé). */
export const getMediaLibrary = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        type: z.enum(["image", "video", "document", "audre"]).optional(),
        categorie: z.string().max(80).optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const localImages = LOCAL_MEDIA_IMAGES.filter((item) =>
      data.categorie ? item.categorie === data.categorie : true,
    );
    const localVideos = LOCAL_MEDIA_VIDEOS.filter((item) =>
      data.categorie ? item.categorie === data.categorie : true,
    );

    try {
      let query = publicClient()
        .from("cms_medias")
        .select(
          "id, nom, bucket, storage_path, url_publique, type, categorie, texte_alternatif, legende, created_at",
        )
        .eq("is_active", true)
        .eq("is_protege", false)
        .order("created_at", { ascending: false });
      if (data.type) query = query.eq("type", data.type);
      if (data.categorie) query = query.eq("categorie", data.categorie);

      const { data: rows, error } = await query;
      if (error) throw error;

      const remote = await Promise.all(
        (rows ?? []).map(async (row) => ({
          ...row,
          url: row.url_publique ?? (await signMediaPath(row.bucket, row.storage_path)),
        })),
      );

      // Le mode hybride conserve toujours les fichiers locaux : Supabase
      // enrichit la vitrine, mais ne rend jamais public le site dépendant
      // d'une base vide ou momentanément indisponible.
      const remoteUrls = new Set(remote.map((item) => item.url).filter(Boolean));
      const local =
        data.type === "video"
          ? localVideos
          : data.type === "image"
            ? localImages
            : [...localImages, ...localVideos];
      const merged = [...remote, ...local.filter((item) => !remoteUrls.has(item.url))];
      return data.limit ? merged.slice(0, data.limit) : merged;
    } catch {
      // Supabase indisponible : la vitrine continue avec les médias locaux.
      const local =
        data.type === "video"
          ? localVideos
          : data.type === "image"
            ? localImages
            : [...localImages, ...localVideos];
      return data.limit ? local.slice(0, data.limit) : local;
    }
  });

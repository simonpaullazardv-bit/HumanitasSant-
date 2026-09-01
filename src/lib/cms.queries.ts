/**
 * Options de requête React Query pour les contenus publics du CMS.
 * Toutes les données proviennent de la base : rien n'est codé en dur dans les composants.
 */
import { queryOptions } from "@tanstack/react-query";
import {
  getBanners,
  getCmsPage,
  getDownloads,
  getEventBySlug,
  getEvents,
  getFaqEntries,
  getMediaLibrary,
  getMembershipTiers,
  getNews,
  getNewsBySlug,
  getPartners,
  getPublicSettings,
  getServicesContent,
  getSocialLinks,
  getTeamMembers,
  getTestimonials,
} from "@/lib/cms.functions";

const FIVE_MIN = 5 * 60 * 1000;

export type PartnerType =
  "hopital" | "pharmacie" | "laboratoire" | "centre_bien_etre" | "entreprise";

export const settingsQuery = () =>
  queryOptions({
    queryKey: ["cms", "settings"],
    queryFn: () => getPublicSettings(),
    staleTime: FIVE_MIN,
  });

export const socialsQuery = () =>
  queryOptions({
    queryKey: ["cms", "socials"],
    queryFn: () => getSocialLinks(),
    staleTime: FIVE_MIN,
  });

export const tiersQuery = () =>
  queryOptions({
    queryKey: ["cms", "tiers"],
    queryFn: () => getMembershipTiers(),
    staleTime: FIVE_MIN,
  });

export const partnersQuery = (type?: PartnerType) =>
  queryOptions({
    queryKey: ["cms", "partners", type ?? "all"],
    queryFn: () => getPartners({ data: type ? { type } : {} }),
    staleTime: FIVE_MIN,
  });

export const servicesQuery = () =>
  queryOptions({
    queryKey: ["cms", "services"],
    queryFn: () => getServicesContent(),
    staleTime: FIVE_MIN,
  });

export const faqQuery = () =>
  queryOptions({ queryKey: ["cms", "faq"], queryFn: () => getFaqEntries(), staleTime: FIVE_MIN });

export const testimonialsQuery = () =>
  queryOptions({
    queryKey: ["cms", "testimonials"],
    queryFn: () => getTestimonials(),
    staleTime: FIVE_MIN,
  });

export const teamQuery = () =>
  queryOptions({ queryKey: ["cms", "team"], queryFn: () => getTeamMembers(), staleTime: FIVE_MIN });

export const bannersQuery = () =>
  queryOptions({ queryKey: ["cms", "banners"], queryFn: () => getBanners(), staleTime: FIVE_MIN });

export const newsQuery = (params: { limit?: number; categorie?: string } = {}) =>
  queryOptions({
    queryKey: ["cms", "news", params],
    queryFn: () => getNews({ data: params }),
    staleTime: FIVE_MIN,
  });

export const newsBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["cms", "news", "slug", slug],
    queryFn: () => getNewsBySlug({ data: { slug } }),
    staleTime: FIVE_MIN,
  });

export const eventsQuery = (params: { limit?: number } = {}) =>
  queryOptions({
    queryKey: ["cms", "events", params],
    queryFn: () => getEvents({ data: params }),
    staleTime: FIVE_MIN,
  });

export const eventBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["cms", "events", "slug", slug],
    queryFn: () => getEventBySlug({ data: { slug } }),
    staleTime: FIVE_MIN,
  });

export const downloadsQuery = () =>
  queryOptions({
    queryKey: ["cms", "downloads"],
    queryFn: () => getDownloads(),
    staleTime: FIVE_MIN,
  });

export const cmsPageQuery = (slug: string) =>
  queryOptions({
    queryKey: ["cms", "page", slug],
    queryFn: () => getCmsPage({ data: { slug } }),
    staleTime: FIVE_MIN,
  });

export const mediaQuery = (
  params: { type?: "image" | "video"; categorie?: string; limit?: number } = {},
) =>
  queryOptions({
    queryKey: ["cms", "media", params],
    queryFn: () => getMediaLibrary({ data: params }),
    staleTime: FIVE_MIN,
  });

/** Lit un paramètre public typé depuis la liste renvoyée par settingsQuery. */
export function readSetting<T>(
  settings: { cle: string; valeur: string }[] | undefined,
  cle: string,
  fallback: T,
): T {
  const row = settings?.find((item) => item.cle === cle);
  if (!row) return fallback;
  try {
    return JSON.parse(row.valeur) as T;
  } catch {
    return fallback;
  }
}

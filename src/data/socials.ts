/**
 * Catalogue local des réseaux sociaux HUMANITAS.
 *
 * Seuls les réseaux avec une URL confirmée sont affichés dans la vitrine.
 * Les comptes encore à confirmer sont préparés ici sans générer de faux liens.
 */
export const SOCIAL_NETWORK_CATALOG = [
  {
    key: "facebook",
    name: "Facebook",
    href: "https://facebook.com/humanitassante",
    icon: "facebook",
    enabled: true,
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    href: "https://wa.me/243844433025",
    icon: "whatsapp",
    enabled: true,
  },
  {
    key: "instagram",
    name: "Instagram",
    href: "https://instagram.com/humanitassante",
    icon: "instagram",
    enabled: true,
  },
  {
    key: "tiktok",
    name: "TikTok",
    href: "https://tiktok.com/@humanitassante",
    icon: "tiktok",
    enabled: true,
  },
  {
    key: "youtube",
    name: "YouTube",
    href: "https://youtube.com/@humanitassante",
    icon: "youtube",
    enabled: true,
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    href: "https://linkedin.com/company/humanitassante",
    icon: "linkedin",
    enabled: true,
  },
  { key: "x", name: "X", href: "https://x.com/humanitassante", icon: "x", enabled: true },
  {
    key: "messenger",
    name: "Messenger",
    href: null,
    icon: "messenger",
    enabled: false,
    note: "URL officielle à confirmer",
  },
  {
    key: "truth_social",
    name: "Truth Social",
    href: null,
    icon: "truth_social",
    enabled: false,
    note: "URL officielle à confirmer",
  },
  {
    key: "telegram",
    name: "Telegram",
    href: null,
    icon: "telegram",
    enabled: false,
    note: "URL officielle à confirmer",
  },
  {
    key: "threads",
    name: "Threads",
    href: null,
    icon: "threads",
    enabled: false,
    note: "URL officielle à confirmer",
  },
] as const;

export const ACTIVE_SOCIALS = SOCIAL_NETWORK_CATALOG.filter(
  (social) => social.enabled && Boolean(social.href),
).map(({ key, name, href, icon }) => ({
  key,
  name,
  href: href!,
  icon,
}));

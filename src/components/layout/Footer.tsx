import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  Twitter,
  Youtube,
} from "lucide-react";
import { IMAGES, SITE, SOCIALS } from "@/data/site";
import { FOOTER_LEGAL, NAV_GROUPS } from "@/data/navigation";
import { readSetting, settingsQuery, socialsQuery } from "@/lib/cms.queries";

const SOCIAL_ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  whatsapp: MessageCircle,
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
  tiktok: Music2,
  messenger: MessageCircle,
  truth_social: Globe,
  telegram: MessageCircle,
  threads: Globe,
};

export function Footer() {
  const { data: settings } = useQuery(settingsQuery());
  const { data: socials } = useQuery(socialsQuery());

  const phone = readSetting(settings, "contact_telephone", SITE.phone);
  const email = readSetting(settings, "contact_email", SITE.email);
  const address = readSetting(settings, "contact_adresse", SITE.address);
  const address2 = readSetting(settings, "contact_adresse_2", SITE.address2);
  const hours = readSetting(settings, "contact_horaires", SITE.hours);
  const baseline = readSetting(
    settings,
    "site_baseline",
    `${SITE.name} est une mutuelle de santé engagée pour un accès équitable à des soins de qualité. Nous protégeons les familles, les entreprises et les communautés.`,
  );

  const socialLinks =
    socials && socials.length > 0
      ? socials.map((item) => ({
          name: item.libelle ?? item.plateforme,
          href: item.url,
          icon: item.plateforme.toLowerCase(),
        }))
      : SOCIALS.map((item) => ({ name: item.name, href: item.href, icon: item.icon }));

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-card p-1.5 shadow-soft">
              <img
                src={IMAGES.logo}
                alt="Logo Humanitas"
                loading="lazy"
                width={48}
                height={48}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <span className="font-display text-base font-bold text-foreground">
                HUMANITAS SANTÉ
              </span>
              <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Centre de Bien-Être
              </span>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">{baseline}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {socialLinks.map((social) => {
              const Icon = SOCIAL_ICONS[social.icon] ?? Globe;
              return (
                <a
                  key={`${social.name}-${social.href}`}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.name}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all hover:-translate-y-1 hover:border-primary/40 hover:text-primary"
                >
                  <Icon className="size-4" />
                </a>
              );
            })}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-3">
          {NAV_GROUPS.slice(0, 3).map((group) => (
            <div key={group.label}>
              <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
              <ul className="mt-4 space-y-3">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="lg:col-span-3">
          <h3 className="text-sm font-semibold text-foreground">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-accent" />
              <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-accent" />
              <a href={`mailto:${email}`}>{email}</a>
            </li>
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>
                {address}
                <span className="mt-1 block font-semibold text-foreground">{address2}</span>
              </span>
            </li>
          </ul>
          <ul className="mt-6 space-y-3">
            {NAV_GROUPS.slice(3).flatMap((group) =>
              group.items.slice(0, 2).map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              )),
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Tous droits réservés.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {FOOTER_LEGAL.map((item) => (
              <Link key={item.to} to={item.to} className="transition-colors hover:text-primary">
                {item.label}
              </Link>
            ))}
            <span>{hours}</span>
          </div>
        </div>
        <div className="mx-auto w-full max-w-7xl px-5 pb-6 sm:px-8">
          <p className="text-[0.7rem] leading-relaxed text-muted-foreground/70">
            Concepteur IT ·{" "}
            <span className="font-medium text-muted-foreground">Simon Paul Lazard</span> ·{" "}
            <a
              href="mailto:simonpaullazardv@gmail.com"
              className="transition-colors hover:text-primary"
            >
              simonpaullazardv@gmail.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

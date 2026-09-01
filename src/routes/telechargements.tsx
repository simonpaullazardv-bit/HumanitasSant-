import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/Section";
import { Reveal } from "@/components/shared/Reveal";
import { downloadsQuery } from "@/lib/cms.queries";

const title = "Téléchargements | Humanitas Santé";
const description =
  "Formulaires d'adhésion, statuts, dépliants et documents officiels de la mutuelle Humanitas Santé.";

export const Route = createFileRoute("/telechargements")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://humanitassante.org/telechargements" },
    ],
    links: [{ rel: "canonical", href: "https://humanitassante.org/telechargements" }],
  }),
  component: DownloadsPage,
});

function formatSize(bytes: number | null) {
  if (!bytes) return null;
  const mo = bytes / (1024 * 1024);
  return mo >= 1 ? `${mo.toFixed(1)} Mo` : `${Math.round(bytes / 1024)} Ko`;
}

function DownloadsPage() {
  const { data } = useQuery(downloadsQuery());
  const items = data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Documents"
        title="Téléchargements"
        description="Retrouvez les documents officiels d'Humanitas Santé, mis à jour par l'administration."
      />
      <Section>
        {items.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Aucun document disponible pour le moment.
          </p>
        ) : (
          <div className="mx-auto grid max-w-4xl gap-4">
            {items.map((item, index) => (
              <Reveal key={item.id} delay={index * 0.04}>
                <a
                  href={item.fichier_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="card-hover flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft"
                >
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <FileText className="size-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {item.titre}
                    </span>
                    {item.description ? (
                      <span className="block text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    ) : null}
                    <span className="mt-1 block text-[11px] uppercase tracking-wider text-accent">
                      {[item.categorie, formatSize(item.taille_octets)].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <Download className="size-5 text-primary" />
                </a>
              </Reveal>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

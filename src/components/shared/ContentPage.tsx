import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/Section";
import { Reveal } from "@/components/shared/Reveal";
import { cmsPageQuery } from "@/lib/cms.queries";

export interface ContentBlock {
  titre: string;
  contenu: string;
}

/**
 * Page éditoriale : le contenu du CMS (table cms_pages/cms_sections) prime
 * lorsqu'il existe ; sinon le contenu institutionnel par défaut est affiché.
 */
export function ContentPage({
  slug,
  eyebrow,
  title,
  description,
  blocks,
}: {
  slug: string;
  eyebrow: string;
  title: string;
  description?: string;
  blocks: ContentBlock[];
}) {
  const { data } = useQuery(cmsPageQuery(slug));
  const page = data?.page;
  const sections = data?.sections ?? [];
  const resolvedBlocks: ContentBlock[] = sections.length
    ? sections.map((section) => ({
        titre: section.titre ?? "",
        contenu: section.contenu ?? "",
      }))
    : blocks;

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={page?.titre ?? title}
        {...((page?.sous_titre ?? description)
          ? { description: page?.sous_titre ?? description }
          : {})}
      />
      <Section>
        <div className="mx-auto grid max-w-4xl gap-10">
          {page?.contenu ? (
            <Reveal>
              <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">
                {page.contenu}
              </p>
            </Reveal>
          ) : null}
          {resolvedBlocks.map((block, index) => (
            <Reveal key={`${block.titre}-${index}`} delay={index * 0.05}>
              <article className="rounded-3xl border border-border/70 bg-card p-8 shadow-soft">
                {block.titre ? (
                  <h2 className="font-display text-xl font-bold text-foreground">{block.titre}</h2>
                ) : null}
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {block.contenu}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}

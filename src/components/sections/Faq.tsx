import { useQuery } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/shared/Reveal";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { FAQ } from "@/data/site";
import { faqQuery } from "@/lib/cms.queries";

/** FAQ administrable : les entrées du CMS priment sur le contenu de repli. */
export function Faq() {
  const { data } = useQuery(faqQuery());
  const entries =
    data && data.length > 0
      ? data.map((item) => ({ question: item.question, answer: item.reponse }))
      : FAQ;

  return (
    <Section id="faq">
      <SectionHeading eyebrow="FAQ" title="Vos questions, nos réponses" />

      <Reveal className="mx-auto mt-12 max-w-3xl">
        <Accordion type="single" collapsible className="space-y-4">
          {entries.map((entry, index) => (
            <AccordionItem
              key={entry.question}
              value={`item-${index}`}
              className="rounded-2xl border border-border/70 bg-card px-6 shadow-soft"
            >
              <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                {entry.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {entry.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </Section>
  );
}

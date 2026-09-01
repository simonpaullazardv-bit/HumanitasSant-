/**
 * Statistiques publiques : aucune valeur n'est codée en dur.
 * Les chiffres ne sont rendus que depuis site_settings.public_statistics
 * lorsque la ligne est explicitement is_public=true.
 */
import { animate, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Section } from "@/components/shared/Section";
import { supabase } from "@/integrations/supabase/client";

type PublicStat = { label: string; value: number; suffix?: string; source?: string };

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [inView, value]);
  const formatted = value % 1 !== 0 ? display.toFixed(1).replace(".", ",") : Math.round(display).toLocaleString("fr-FR");
  return <p ref={ref} className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">{formatted}{suffix}</p>;
}

export function Stats() {
  const { data: stats = [] } = useQuery({
    queryKey: ["public-statistics"],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase.from("site_settings" as never) as any)
          .select("value")
          .eq("key", "public_statistics")
          .eq("is_public", true)
          .maybeSingle();
        if (error) throw error;
        const raw = Array.isArray(data?.value?.items) ? data.value.items : [];
        return raw.filter((item: any) => item && typeof item.label === "string" && Number.isFinite(Number(item.value))) as PublicStat[];
      } catch {
        // Aucune statistique locale de substitution : le site n'affiche jamais de chiffre inventé.
        return [];
      }
    },
    staleTime: 60_000,
  });

  if (stats.length === 0) return null;
  return (
    <Section className="overflow-hidden bg-gradient-brand">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={`${stat.label}-${stat.value}`} className="text-center">
            <Counter value={Number(stat.value)} suffix={stat.suffix ?? ""} />
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/80 sm:text-sm">{stat.label}</p>
            {stat.source ? <p className="mt-1 text-[10px] text-primary-foreground/60">Source : {stat.source}</p> : null}
          </div>
        ))}
      </div>
    </Section>
  );
}

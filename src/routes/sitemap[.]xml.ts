import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://humanitassante.org";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/a-propos", changefreq: "monthly", priority: "0.8" },
          { path: "/vision", changefreq: "yearly", priority: "0.6" },
          { path: "/mission", changefreq: "yearly", priority: "0.6" },
          { path: "/valeurs", changefreq: "yearly", priority: "0.6" },
          { path: "/equipe", changefreq: "monthly", priority: "0.6" },
          { path: "/services", changefreq: "monthly", priority: "0.9" },
          { path: "/tarifs", changefreq: "monthly", priority: "0.9" },
          { path: "/comment-adherer", changefreq: "monthly", priority: "0.8" },
          { path: "/adhesion", changefreq: "monthly", priority: "0.9" },
          { path: "/partenaires", changefreq: "weekly", priority: "0.8" },
          { path: "/partenaires/hopitaux", changefreq: "weekly", priority: "0.7" },
          { path: "/partenaires/pharmacies", changefreq: "weekly", priority: "0.7" },
          { path: "/partenaires/laboratoires", changefreq: "weekly", priority: "0.7" },
          { path: "/partenaires/centres-bien-etre", changefreq: "weekly", priority: "0.7" },
          { path: "/partenaires/entreprises", changefreq: "weekly", priority: "0.7" },
          { path: "/partenariat", changefreq: "monthly", priority: "0.6" },
          { path: "/realisations", changefreq: "monthly", priority: "0.7" },
          { path: "/actualites", changefreq: "daily", priority: "0.8" },
          { path: "/evenements", changefreq: "weekly", priority: "0.7" },
          { path: "/galerie", changefreq: "weekly", priority: "0.6" },
          { path: "/telechargements", changefreq: "monthly", priority: "0.6" },
          { path: "/faq", changefreq: "monthly", priority: "0.7" },
          { path: "/recrutement", changefreq: "monthly", priority: "0.5" },
          { path: "/contact", changefreq: "monthly", priority: "0.7" },
          { path: "/confidentialite", changefreq: "yearly", priority: "0.3" },
          { path: "/conditions", changefreq: "yearly", priority: "0.3" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

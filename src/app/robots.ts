import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ─── Règle générale — tout indexer sauf les routes privées ────────────────
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",     // application SaaS authentifiée
          "/api/",           // routes API internes
          "/admin/",         // backoffice admin
          "/checkout/",      // tunnel de paiement (pas de valeur SEO)
          "/avis/",          // tokens privés d'avis
          "/public/devis/",  // pages de réponse aux devis (tokens privés)
          "/public/paiement-confirme/",
          "/public/proforma/",
          "/coming-soon",     // page temporaire sans valeur SEO
        ],
      },
      // ─── Bloquer les crawlers IA pour protéger le contenu ────────────────────
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "CCBot",
        disallow: "/",
      },
      {
        userAgent: "anthropic-ai",
        disallow: "/",
      },
      {
        userAgent: "Claude-Web",
        disallow: "/",
      },
    ],
    sitemap: "https://facturnow.fr/sitemap.xml",
    host: "https://facturnow.fr",
  }
}

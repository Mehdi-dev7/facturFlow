// src/app/sitemap.ts
// Génère /sitemap.xml via l'API MetadataRoute de Next.js.
// Accessible à https://facturnow.fr/sitemap.xml
//
// On n'inclut QUE les pages indexables :
//  - La homepage (landing page — priorité maximale)
//  - Les pages légales (signal de confiance pour Google, conformité RGPD)
//
// On n'inclut PAS :
//  - /signup et /login → noindex via layout auth (signal contradictoire)
//  - /dashboard/* → noindex via layout dashboard
//  - /api/*, /admin/*, /checkout/* → non publiques

import type { MetadataRoute } from "next"

const BASE_URL = "https://facturnow.fr"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ─── Homepage / Landing — priorité maximale ───────────────────────────────
    {
      url: BASE_URL,
      lastModified: new Date("2026-03-16"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    // ─── Pages SEO longue traîne — priorité haute ────────────────────────────
    {
      url: `${BASE_URL}/logiciel-facturation-freelance`,
      lastModified: new Date("2026-03-17"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/facturation-auto-entrepreneur`,
      lastModified: new Date("2026-03-17"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/facture-sepa-prelevement`,
      lastModified: new Date("2026-03-17"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/facture-pdf-gratuite`,
      lastModified: new Date("2026-03-17"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/devis-facture-freelance`,
      lastModified: new Date("2026-03-17"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/encaissement-facture-en-ligne`,
      lastModified: new Date("2026-03-17"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // ─── Blog SEO — articles longue traîne ──────────────────────────────────
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date("2026-03-17"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog/facture-electronique-obligatoire-2026`,
      lastModified: new Date("2026-03-17"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog/comment-facturer-auto-entrepreneur-2026`,
      lastModified: new Date("2026-03-17"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog/reduire-impayes-relances-automatiques`,
      lastModified: new Date("2026-03-17"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog/prelevement-sepa-guide-freelance`,
      lastModified: new Date("2026-03-17"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog/devis-vs-facture-difference`,
      lastModified: new Date("2026-03-17"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog/facture-recurrente-automatiser-revenus`,
      lastModified: new Date("2026-04-21"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // ─── Pages légales — indexées pour la confiance et la conformité RGPD ─────
    // Leur présence dans le sitemap rassure Google sur la légitimité du site
    {
      url: `${BASE_URL}/public/legal/mentions`,
      lastModified: new Date("2026-03-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/public/legal/privacy`,
      lastModified: new Date("2026-03-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/public/legal/cgv`,
      lastModified: new Date("2026-03-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]
}

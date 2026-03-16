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

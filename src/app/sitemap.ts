import type { MetadataRoute } from "next"

const BASE_URL = "https://facturnow.fr"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ─── Pages prioritaires ────────────────────────────────────────────────────
    {
      url: BASE_URL,
      lastModified: new Date("2026-03-13"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    // ─── Conversion — pages critiques pour le SEO ──────────────────────────────
    {
      url: `${BASE_URL}/signup`,
      lastModified: new Date("2026-03-13"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date("2026-03-13"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    // ─── Pages légales (indexées pour la confiance et la conformité RGPD) ───────
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

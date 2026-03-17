// src/app/(landing)/blog/page.tsx
// Page liste du blog SEO — Server Component.
// Affiche les 3 articles sous forme de grille de cards.

import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Navbar, Footer } from "@/components/landing"
import { getAllPosts } from "@/lib/blog/posts"
import { BlogGrid } from "./blog-grid"

// ─── Metadata SEO ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Blog Facturation — Conseils & Guides pour Freelances | FacturNow",
  description:
    "Guides pratiques sur la facturation pour freelances et auto-entrepreneurs : facture électronique 2026, mentions obligatoires, relances automatiques, impayés.",
  keywords: [
    "blog facturation freelance",
    "guide facturation auto-entrepreneur",
    "facture électronique 2026",
    "relances automatiques impayés",
    "conseils facturation freelance",
  ],
  alternates: {
    canonical: "https://facturnow.fr/blog",
  },
  openGraph: {
    title: "Blog Facturation — Conseils & Guides pour Freelances | FacturNow",
    description:
      "Guides pratiques sur la facturation pour freelances et auto-entrepreneurs : facture électronique 2026, mentions obligatoires, relances automatiques.",
    url: "https://facturnow.fr/blog",
    siteName: "FacturNow",
    locale: "fr_FR",
    type: "website",
  },
}

// ─── Schema.org JSON-LD ───────────────────────────────────────────────────────

const blogSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Blog FacturNow",
  description: "Guides et conseils pratiques sur la facturation pour freelances et auto-entrepreneurs français.",
  url: "https://facturnow.fr/blog",
  publisher: {
    "@type": "Organization",
    name: "FacturNow",
    url: "https://facturnow.fr",
  },
  inLanguage: "fr",
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />

      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16">
        {/* Fond radial cohérent avec les autres pages landing */}
        <div className="absolute inset-0 bg-linear-to-br from-slate-50 via-white to-slate-50">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-3xl opacity-50"
            style={{
              background:
                "radial-gradient(ellipse, rgba(79,70,229,0.2), rgba(99,102,241,0.15), rgba(6,182,212,0.08))",
            }}
          />
        </div>

        <div className="relative z-10 w-full px-4 sm:px-[8%] xl:px-[12%] py-16 xl:py-20">
          <div className="max-w-3xl mx-auto text-center space-y-6">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-primary/5">
              <span className="text-sm font-semibold text-primary">
                Ressources & Guides
              </span>
            </div>

            {/* H1 */}
            <h1 className="text-4xl md:text-5xl xl:text-6xl leading-tight text-slate-900">
              Blog{" "}
              <span className="text-gradient">FacturNow</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Guides pratiques, conseils juridiques et astuces pour freelances
              et auto-entrepreneurs. Tout ce que vous devez savoir sur la
              facturation en France.
            </p>
          </div>
        </div>
      </section>

      {/* ── Grille des articles ───────────────────────────────────────────────── */}
      <section className="w-full px-4 sm:px-[8%] xl:px-[12%] py-12 xl:py-16 bg-white">
        <BlogGrid posts={posts} />
      </section>

      {/* ── CTA Newsletter / Inscription ─────────────────────────────────────── */}
      <section className="w-full px-4 sm:px-[8%] xl:px-[12%] py-12 xl:py-16 bg-slate-50">
        <div>
          <div
            className="rounded-2xl border border-violet-200 p-6 xs:p-10 text-center"
            style={{
              background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #ffffff 100%)",
            }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Prêt à simplifier votre facturation ?
            </h2>
            <p className="text-slate-600 mb-6 max-w-xl mx-auto text-sm sm:text-base">
              Rejoignez les freelances qui ont automatisé leur gestion administrative.
              Essai gratuit 7 jours, sans carte bancaire.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white font-semibold text-sm sm:text-base hover:bg-primary/90 hover:scale-105 transition-all duration-300"
            >
              Commencer gratuitement
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}

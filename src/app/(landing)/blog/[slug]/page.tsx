// src/app/(landing)/blog/[slug]/page.tsx
// Page article de blog — Server Component.
// Génère les pages statiques pour chaque article via generateStaticParams.

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Clock, Tag, ChevronRight, Home } from "lucide-react"
import { Navbar, Footer } from "@/components/landing"
import { FaqLanding } from "@/components/landing/faq-landing"
import {
  getAllSlugs,
  getPostBySlug,
  formatDateFR,
  type BlogSection,
} from "@/lib/blog/posts"

// ─── Génération statique ──────────────────────────────────────────────────────

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

// ─── Metadata dynamique ───────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return {
    title: `${post.title} | FacturNow`,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: `https://facturnow.fr/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://facturnow.fr/blog/${post.slug}`,
      siteName: "FacturNow",
      locale: "fr_FR",
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: ["FacturNow"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  }
}

// ─── Couleurs par catégorie ───────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "Réglementation": { bg: "#eef2ff", text: "#4f46e5", border: "#c7d2fe" },
  "Guide pratique": { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" },
  "Gestion financière": { bg: "#fff7ed", text: "#d97706", border: "#fed7aa" },
}
const DEFAULT_STYLE = { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" }

// ─── Rendu des sections ───────────────────────────────────────────────────────

function RenderSection({ section }: { section: BlogSection }) {
  switch (section.type) {
    case "intro":
      return (
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed italic border-l-4 border-primary/40 pl-4 py-1 mb-6">
          {section.text}
        </p>
      )

    case "h2":
      return (
        <div className="mb-4 mt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
            {section.heading}
          </h2>
          {section.text && (
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              {section.text}
            </p>
          )}
        </div>
      )

    case "h3":
      return (
        <div className="mb-3 mt-6">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2">
            {section.heading}
          </h3>
          {section.text && (
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              {section.text}
            </p>
          )}
        </div>
      )

    case "paragraph":
      return (
        <p className="text-slate-600 leading-relaxed text-sm sm:text-base mb-4">
          {section.text}
        </p>
      )

    case "list":
      return (
        <ul className="space-y-2 mb-6 ml-1">
          {section.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-slate-600">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )

    case "cta_box":
      return (
        <div
          className="rounded-2xl border border-violet-200 p-6 my-8 text-center"
          style={{
            background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 60%, #ffffff 100%)",
          }}
        >
          {section.heading && (
            <h3 className="text-lg font-bold text-slate-900 mb-2">{section.heading}</h3>
          )}
          {section.text && (
            <p className="text-sm text-slate-600 mb-4">{section.text}</p>
          )}
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 hover:scale-105 transition-all duration-300"
          >
            Commencer gratuitement
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )

    default:
      return null
  }
}

// ─── Table des matières (extraite des H2) ────────────────────────────────────

function TableOfContents({ sections }: { sections: BlogSection[] }) {
  const headings = sections.filter((s) => s.type === "h2" && s.heading)

  if (headings.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">
        Sommaire
      </h3>
      <ol className="space-y-2">
        {headings.map((h, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-xs font-bold text-primary mt-0.5 shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-sm text-slate-600 leading-snug hover:text-primary transition-colors">
              {h.heading}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) notFound()

  const catStyle = CATEGORY_STYLES[post.category] ?? DEFAULT_STYLE

  // Schema.org Article
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      "@type": "Organization",
      name: "FacturNow",
      url: "https://facturnow.fr",
    },
    publisher: {
      "@type": "Organization",
      name: "FacturNow",
      url: "https://facturnow.fr",
      logo: {
        "@type": "ImageObject",
        url: "https://facturnow.fr/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://facturnow.fr/blog/${post.slug}`,
    },
    keywords: post.keywords.join(", "),
    inLanguage: "fr",
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Navbar />

      {/* ── Breadcrumb ────────────────────────────────────────────────────────── */}
      <div className="w-full px-4 sm:px-[8%] xl:px-[12%] pt-20 pb-4">
        <nav
          aria-label="Fil d'Ariane"
          className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 flex-wrap"
        >
          <Link href="/" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
            <Home className="h-3.5 w-3.5" />
            Accueil
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
          <Link href="/blog" className="hover:text-primary transition-colors">
            Blog
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-700 font-medium truncate max-w-[200px] sm:max-w-none">
            {post.title}
          </span>
        </nav>
      </div>

      {/* ── Hero article ──────────────────────────────────────────────────────── */}
      <section className="w-full px-4 sm:px-[8%] xl:px-[12%] pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl space-y-4">

            {/* Badge catégorie + temps de lecture */}
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
                style={{
                  backgroundColor: catStyle.bg,
                  color: catStyle.text,
                  borderColor: catStyle.border,
                }}
              >
                <Tag className="h-3 w-3" />
                {post.category}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                {post.readingTime} min de lecture
              </span>
            </div>

            {/* H1 */}
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-bold text-slate-900 leading-tight">
              {post.title}
            </h1>

            {/* Date */}
            <p className="text-sm text-slate-500">
              Publié le{" "}
              <time dateTime={post.publishedAt}>{formatDateFR(post.publishedAt)}</time>
              {post.updatedAt && post.updatedAt !== post.publishedAt && (
                <>
                  {" "}· Mis à jour le{" "}
                  <time dateTime={post.updatedAt}>{formatDateFR(post.updatedAt)}</time>
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ── Corps de l'article ────────────────────────────────────────────────── */}
      <section className="w-full px-4 sm:px-[8%] xl:px-[12%] pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 xl:gap-16">

            {/* Colonne principale (2/3) */}
            <article className="flex-1 min-w-0 prose-none">
              {post.content.map((section, i) => (
                <RenderSection key={i} section={section} />
              ))}
            </article>

            {/* Sidebar (1/3) */}
            <aside className="lg:w-72 xl:w-80 shrink-0 space-y-6 lg:sticky lg:top-24 lg:self-start">

              {/* Table des matières */}
              <TableOfContents sections={post.content} />

              {/* CTA Essai gratuit */}
              <div
                className="rounded-xl border border-violet-200 p-5 text-center"
                style={{
                  background:
                    "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 60%, #ffffff 100%)",
                }}
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white mb-3">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Essai gratuit 7 jours
                </h3>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Créez vos premières factures conformes. Sans carte bancaire.
                </p>
                <Link
                  href="/signup"
                  className="block w-full px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Commencer gratuitement
                </Link>
                <Link
                  href="/#pricing"
                  className="block mt-2 text-xs text-slate-500 hover:text-primary transition-colors"
                >
                  Voir les tarifs
                </Link>
              </div>

              {/* Autres articles */}
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  Autres guides
                </h3>
                <div className="space-y-3">
                  <Link href="/blog" className="flex items-center gap-2 text-xs text-slate-600 hover:text-primary transition-colors">
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                    Retour au blog
                  </Link>
                  <Link href="/logiciel-facturation-freelance" className="flex items-center gap-2 text-xs text-slate-600 hover:text-primary transition-colors">
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                    Logiciel de facturation freelance
                  </Link>
                  <Link href="/facturation-auto-entrepreneur" className="flex items-center gap-2 text-xs text-slate-600 hover:text-primary transition-colors">
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                    Facturation auto-entrepreneur
                  </Link>
                  <Link href="/facture-sepa-prelevement" className="flex items-center gap-2 text-xs text-slate-600 hover:text-primary transition-colors">
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                    Prélèvement SEPA
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────────── */}
      <section className="w-full px-4 sm:px-[8%] xl:px-[12%] py-12 xl:py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Questions{" "}
              <span className="text-gradient">fréquentes</span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Toutes les réponses sur ce sujet.
            </p>
          </div>
          <FaqLanding faqs={post.faq} />
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────────────────────── */}
      <section className="w-full px-4 sm:px-[8%] xl:px-[12%] py-12 xl:py-16 bg-white">
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-2xl border border-violet-200 p-6 xs:p-10 text-center"
            style={{
              background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #ffffff 100%)",
            }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Prêt à simplifier votre facturation ?
            </h2>
            <p className="text-slate-600 mb-6 text-sm sm:text-base max-w-xl mx-auto">
              FacturNow automatise vos factures, relances et paiements.
              Essai gratuit 7 jours, sans carte bancaire.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary text-white font-semibold text-sm sm:text-base hover:bg-primary/90 hover:scale-105 transition-all duration-300"
              >
                Commencer gratuitement
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm sm:text-base hover:border-primary hover:text-primary transition-all duration-300"
              >
                Voir tous les articles
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}

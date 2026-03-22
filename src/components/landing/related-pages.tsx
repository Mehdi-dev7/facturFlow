// Server Component — bloc "Voir aussi" pour maillage interne entre landing pages
import Link from "next/link"
import { ArrowRight, FileText, CreditCard, Landmark, Receipt, Briefcase, Users } from "lucide-react"

// ─── Catalogue des pages liées ──────────────────────────────────────────────

interface RelatedPage {
  href: string
  title: string
  description: string
  icon: typeof FileText
  iconColor: string
  bgColor: string
}

const ALL_PAGES: Record<string, RelatedPage> = {
  "logiciel-facturation-freelance": {
    href: "/logiciel-facturation-freelance",
    title: "Facturation Freelance",
    description: "Le meilleur logiciel de facturation pour freelances et indépendants.",
    icon: Briefcase,
    iconColor: "#4f46e5",
    bgColor: "#eef2ff",
  },
  "facturation-auto-entrepreneur": {
    href: "/facturation-auto-entrepreneur",
    title: "Facturation Auto-Entrepreneur",
    description: "Factures conformes avec mentions légales automatiques.",
    icon: Users,
    iconColor: "#0891b2",
    bgColor: "#ecfeff",
  },
  "facture-sepa-prelevement": {
    href: "/facture-sepa-prelevement",
    title: "Prélèvement SEPA",
    description: "Encaissez automatiquement par prélèvement SEPA GoCardless.",
    icon: Landmark,
    iconColor: "#059669",
    bgColor: "#ecfdf5",
  },
  "facture-pdf-gratuite": {
    href: "/facture-pdf-gratuite",
    title: "Facture PDF Gratuite",
    description: "Créez et téléchargez des factures PDF professionnelles.",
    icon: FileText,
    iconColor: "#7c3aed",
    bgColor: "#f5f3ff",
  },
  "devis-facture-freelance": {
    href: "/devis-facture-freelance",
    title: "Devis & Factures",
    description: "Devis professionnels convertis en factures en 1 clic.",
    icon: Receipt,
    iconColor: "#d97706",
    bgColor: "#fffbeb",
  },
  "encaissement-facture-en-ligne": {
    href: "/encaissement-facture-en-ligne",
    title: "Encaissement en Ligne",
    description: "Recevez vos paiements via Stripe, PayPal ou SEPA.",
    icon: CreditCard,
    iconColor: "#dc2626",
    bgColor: "#fef2f2",
  },
}

// ─── Blog articles ──────────────────────────────────────────────────────────

interface RelatedArticle {
  href: string
  title: string
}

const ALL_ARTICLES: Record<string, RelatedArticle> = {
  "facture-electronique": {
    href: "/blog/facture-electronique-obligatoire-2026",
    title: "Facture électronique obligatoire 2026 : ce qui change",
  },
  "auto-entrepreneur": {
    href: "/blog/comment-facturer-auto-entrepreneur-2026",
    title: "Comment facturer en auto-entrepreneur en 2026",
  },
  "impayes": {
    href: "/blog/reduire-impayes-relances-automatiques",
    title: "Réduire les impayés grâce aux relances automatiques",
  },
  "sepa": {
    href: "/blog/prelevement-sepa-guide-freelance",
    title: "Guide du prélèvement SEPA pour freelances",
  },
  "devis-facture": {
    href: "/blog/devis-vs-facture-difference",
    title: "Devis vs Facture : quelle différence ?",
  },
}

// ─── Composant ──────────────────────────────────────────────────────────────

interface RelatedPagesProps {
  /** Slugs des landing pages à afficher (2-3 max) */
  pages: string[]
  /** Clés des articles blog à afficher (1-2 max) */
  articles?: string[]
}

export function RelatedPages({ pages, articles = [] }: RelatedPagesProps) {
  const relatedPages = pages.map((slug) => ALL_PAGES[slug]).filter(Boolean)
  const relatedArticles = articles.map((key) => ALL_ARTICLES[key]).filter(Boolean)

  if (relatedPages.length === 0) return null

  return (
    <section className="w-full px-4 sm:px-[8%] xl:px-[12%] py-12 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
          Voir aussi
        </h2>

        {/* Landing pages liées */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {relatedPages.map((page) => {
            const Icon = page.icon
            return (
              <Link
                key={page.href}
                href={page.href}
                className="group rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-primary/30 transition-all duration-300"
              >
                <div
                  className="inline-flex p-2 rounded-lg mb-3"
                  style={{ backgroundColor: page.bgColor }}
                >
                  <Icon className="h-5 w-5" style={{ color: page.iconColor }} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">
                  {page.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {page.description}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-3 group-hover:gap-2 transition-all">
                  En savoir plus <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            )
          })}
        </div>

        {/* Articles blog liés */}
        {relatedArticles.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {relatedArticles.map((article) => (
              <Link
                key={article.href}
                href={article.href}
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition-colors px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-primary/30"
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{article.title}</span>
                <ArrowRight className="h-3 w-3 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

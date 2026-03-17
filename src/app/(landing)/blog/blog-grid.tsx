"use client"

// Grille des articles avec "load more" — Client Component
// Affiche 9 articles au départ, puis 6 de plus à chaque clic.

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Clock } from "lucide-react"
import { type BlogPost, formatDateFR } from "@/lib/blog/posts"

const INITIAL_COUNT = 9
const LOAD_MORE_COUNT = 6

// ─── Couleurs par catégorie ───────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "Réglementation":    { bg: "#eef2ff", text: "#4f46e5", border: "#c7d2fe" },
  "Guide pratique":    { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" },
  "Gestion financière":{ bg: "#fff7ed", text: "#d97706", border: "#fed7aa" },
}

const DEFAULT_STYLE = { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" }

// ─── Composant ────────────────────────────────────────────────────────────────

interface BlogGridProps {
  posts: BlogPost[]
}

export function BlogGrid({ posts }: BlogGridProps) {
  const [visible, setVisible] = useState(INITIAL_COUNT)

  const visiblePosts = posts.slice(0, visible)
  const hasMore = visible < posts.length
  const remaining = posts.length - visible

  return (
    <>
      {/* Compteur */}
      <p className="text-sm text-slate-500 mb-8">
        {posts.length} article{posts.length > 1 ? "s" : ""} disponible{posts.length > 1 ? "s" : ""}
      </p>

      {/* Grille */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
        {visiblePosts.map((post) => {
          const s = CATEGORY_STYLES[post.category] ?? DEFAULT_STYLE

          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-2xl border p-6 gap-5 hover:shadow-md transition-all duration-300 h-full"
              style={{ backgroundColor: s.bg, borderColor: s.border }}
            >
              {/* Badge catégorie + temps de lecture */}
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
                  style={{ backgroundColor: s.text }}
                >
                  {post.category}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  {post.readingTime} min
                </span>
              </div>

              {/* Titre + description */}
              <div className="flex flex-col gap-1 flex-1">
                <h2 className="text-lg font-bold text-slate-900 leading-snug group-hover:underline">
                  {post.title}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed mt-1">
                  {post.description}
                </p>
              </div>

              {/* Footer : date + CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-black/10">
                <span className="text-xs text-slate-400">
                  {formatDateFR(post.publishedAt)}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all duration-200"
                  style={{ color: s.text }}
                >
                  Lire l&apos;article
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Bouton load more */}
      {hasMore && (
        <div className="flex justify-center mt-12">
          <button
            onClick={() => setVisible((v) => v + LOAD_MORE_COUNT)}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border-2 border-primary/30 bg-primary/5 text-primary font-semibold text-sm hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 cursor-pointer"
          >
            Afficher plus d&apos;articles
            <span className="text-xs opacity-70">
              (+{Math.min(LOAD_MORE_COUNT, remaining)})
            </span>
          </button>
        </div>
      )}
    </>
  )
}

// og:image dynamique par article de blog
// Chaque article a sa propre image avec son titre + sa catégorie
// Générée à la volée par Next.js — aucun fichier PNG à gérer

import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { getPostBySlug } from "@/lib/blog/posts"

export const runtime = "nodejs"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Couleurs par catégorie — cohérent avec blog-grid.tsx
const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  "Réglementation":    { bg: "rgba(79,70,229,0.3)",  text: "#a5b4fc", label: "Réglementation" },
  "Guide pratique":    { bg: "rgba(5,150,105,0.3)",  text: "#6ee7b7", label: "Guide pratique" },
  "Gestion financière":{ bg: "rgba(217,119,6,0.3)",  text: "#fcd34d", label: "Gestion financière" },
}
const DEFAULT_COLOR = { bg: "rgba(255,255,255,0.1)", text: "#cbd5e1", label: "Article" }

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  // Police Kanit Bold — TTF obligatoire (woff2 non supporté par Satori)
  const kanitFont = await readFile(join(process.cwd(), "public/fonts/kanit-700.ttf"))

  // Données de l'article (fallback si slug inconnu)
  const title = post?.title ?? "Article FacturNow"
  const category = post?.category ?? "Guide pratique"
  const readingTime = post?.readingTime ?? 5
  const catColor = CATEGORY_COLORS[category] ?? DEFAULT_COLOR

  // Tronque le titre si trop long pour tenir sur 2 lignes
  const displayTitle = title.length > 72 ? title.slice(0, 69) + "…" : title

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #1e0a4a 0%, #2d1280 40%, #1e3a8a 100%)",
          fontFamily: "'Kanit', sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Orbes de lumière décoratifs */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 70%)",
          }}
        />

        {/* Contenu — padding général */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            padding: "56px 72px",
            zIndex: 10,
          }}
        >
          {/* Haut : logo FacturNow */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 30px rgba(124,58,237,0.5)",
              }}
            >
              <span style={{ color: "white", fontSize: 28, fontWeight: 700 }}>F</span>
            </div>
            <span style={{ color: "white", fontSize: 30, fontWeight: 700 }}>
              FacturNow
            </span>
            <span style={{ color: "rgba(148,163,184,0.6)", fontSize: 22, marginLeft: 8 }}>
              — Blog
            </span>
          </div>

          {/* Centre : catégorie + titre */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Badge catégorie */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  padding: "8px 20px",
                  borderRadius: 30,
                  background: catColor.bg,
                  border: `1px solid ${catColor.text}40`,
                  color: catColor.text,
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                {catColor.label}
              </div>
              <div
                style={{
                  padding: "8px 16px",
                  borderRadius: 30,
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(148,163,184,0.8)",
                  fontSize: 16,
                }}
              >
                {`${readingTime} min de lecture`}
              </div>
            </div>

            {/* Titre de l'article */}
            <div
              style={{
                display: "flex",
                fontSize: 52,
                fontWeight: 700,
                color: "white",
                lineHeight: 1.2,
                letterSpacing: "-0.5px",
                maxWidth: 950,
              }}
            >
              {displayTitle}
            </div>
          </div>

          {/* Bas : URL */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                color: "rgba(148,163,184,0.7)",
                fontSize: 18,
              }}
            >
              facturnow.fr/blog
            </div>
            {/* Ligne décorative */}
            <div
              style={{
                height: 2,
                width: 200,
                background: "linear-gradient(90deg, rgba(124,58,237,0.6), transparent)",
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Kanit",
          data: kanitFont,
          style: "normal",
          weight: 700,
        },
      ],
    }
  )
}

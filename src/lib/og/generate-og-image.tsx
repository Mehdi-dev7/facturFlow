// Helper partagé pour générer les og:image des pages longue traîne
// Utilisé par chaque opengraph-image.tsx des pages landing SEO

import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

interface OgImageOptions {
  title: string        // Titre principal affiché en grand
  subtitle: string     // Sous-titre / accroche
  badge: string        // Badge coloré en haut (ex: "Freelances", "Auto-entrepreneurs")
  features: string[]   // 3 points forts affichés en bas
}

export async function generateLandingOgImage(options: OgImageOptions) {
  const { title, subtitle, badge, features } = options

  const kanitFont = await readFile(join(process.cwd(), "public/fonts/kanit-700.ttf"))

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
        {/* Orbes déco */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 70%)" }} />

        {/* Contenu */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            padding: "52px 72px",
            zIndex: 10,
          }}
        >
          {/* Logo */}
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
            <span style={{ color: "white", fontSize: 30, fontWeight: 700 }}>FacturNow</span>
          </div>

          {/* Centre : badge + titre + sous-titre */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Badge */}
            <div
              style={{
                display: "flex",
                padding: "8px 20px",
                borderRadius: 30,
                background: "rgba(124,58,237,0.3)",
                border: "1px solid rgba(167,139,250,0.4)",
                color: "#c4b5fd",
                fontSize: 18,
                fontWeight: 600,
                width: 320,
              }}
            >
              {badge}
            </div>

            {/* Titre */}
            <div
              style={{
                display: "flex",
                fontSize: 54,
                fontWeight: 700,
                color: "white",
                lineHeight: 1.15,
                letterSpacing: "-0.5px",
                maxWidth: 900,
              }}
            >
              {title}
            </div>

            {/* Sous-titre */}
            <div
              style={{
                display: "flex",
                fontSize: 24,
                color: "rgba(196,181,253,0.9)",
                maxWidth: 800,
              }}
            >
              {subtitle}
            </div>
          </div>

          {/* Bas : features + URL */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 12 }}>
              {features.map((f) => (
                <div
                  key={f}
                  style={{
                    display: "flex",
                    padding: "8px 18px",
                    borderRadius: 30,
                    background: "rgba(99,102,241,0.2)",
                    border: "1px solid rgba(99,102,241,0.4)",
                    color: "#a5b4fc",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {`✓ ${f}`}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", color: "rgba(148,163,184,0.7)", fontSize: 18 }}>
              facturnow.fr
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [{ name: "Kanit", data: kanitFont, style: "normal", weight: 700 }],
    }
  )
}

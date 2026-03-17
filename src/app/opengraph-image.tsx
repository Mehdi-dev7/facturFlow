// Génération dynamique de l'og:image via Next.js ImageResponse
// → utilisée automatiquement pour toutes les pages qui n'ont pas leur propre og:image
// → accessible à /opengraph-image (et aussi via metadataBase + /og-image.png)
import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const runtime = "nodejs"
export const alt = "FacturNow — Facturation intelligente avec paiement en 1 clic Stripe, PayPal ou SEPA"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  // Chargement de la police locale Kanit Bold (TTF — seul format supporté par Satori/ImageResponse)
  const kanitFont = await readFile(join(process.cwd(), "public/fonts/kanit-700.ttf"))

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          // Fond dégradé violet → indigo — même palette que la landing
          background: "linear-gradient(135deg, #1e0a4a 0%, #2d1280 40%, #1e3a8a 100%)",
          fontFamily: "'Kanit', sans-serif",
          position: "relative",
        }}
      >
        {/* Orbe de lumière centre-gauche */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "30%",
            transform: "translate(-50%, -50%)",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)",
          }}
        />

        {/* Orbe de lumière bas-droite */}
        <div
          style={{
            position: "absolute",
            bottom: -80,
            right: 80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(79,70,229,0.3) 0%, transparent 70%)",
          }}
        />

        {/* Contenu principal */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 32,
            zIndex: 1,
            padding: "0 80px",
          }}
        >
          {/* Logo + nom */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* Icône F */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 40px rgba(124,58,237,0.6)",
              }}
            >
              <span style={{ color: "white", fontSize: 44, fontWeight: 700 }}>F</span>
            </div>

            <span
              style={{
                color: "white",
                fontSize: 56,
                fontWeight: 700,
                letterSpacing: "-1px",
              }}
            >
              FacturNow
            </span>
          </div>

          {/* Tagline principale */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              fontSize: 38,
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.2,
              maxWidth: 900,
            }}
          >
            <span style={{ color: "white" }}>Facturation intelligente avec&nbsp;</span>
            <span style={{ color: "#a78bfa" }}>paiement en 1 clic Stripe, PayPal ou SEPA</span>
          </div>

          {/* Sous-titre */}
          <div
            style={{
              color: "rgba(196,181,253,0.9)",
              fontSize: 22,
              textAlign: "center",
              maxWidth: 700,
            }}
          >
            Pour freelances, auto-entrepreneurs, PME françaises
          </div>

          {/* Badges features */}
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            {["Essai gratuit 7 jours", "SEPA automatique", "Zéro impayés"].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 20px",
                  borderRadius: 40,
                  border: "1px solid rgba(124,58,237,0.5)",
                  background: "rgba(124,58,237,0.15)",
                  color: "#c4b5fd",
                  fontSize: 18,
                  backdropFilter: "blur(8px)",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* URL en bas */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            right: 48,
            color: "rgba(148,163,184,0.7)",
            fontSize: 18,
          }}
        >
          facturnow.fr
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

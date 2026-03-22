// Génère dynamiquement l'icône PWA via ImageResponse (Next.js App Router)
// Accessible à /icon → utilisée par le manifest et les navigateurs
// Design : éclair (lightning bolt) sur fond dégradé indigo→cyan

import { ImageResponse } from "next/og"

export const size = { width: 512, height: 512 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4F46E5, #06B6D4)",
          borderRadius: "112px",
        }}
      >
        {/* Ombre de l'éclair */}
        <svg
          viewBox="0 0 32 32"
          width="380"
          height="380"
          style={{ position: "absolute" }}
        >
          <polygon
            points="20,4 13,16 17,16 11,28 23,15 18,15"
            fill="#3330B8"
            opacity="0.4"
          />
        </svg>
        {/* Éclair principal blanc */}
        <svg
          viewBox="0 0 32 32"
          width="380"
          height="380"
          style={{ position: "absolute" }}
        >
          <polygon
            points="21,4 13,17 18,17 11,28 23,15 18,15"
            fill="white"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}

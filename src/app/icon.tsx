// Génère dynamiquement l'icône PWA via ImageResponse (Next.js App Router)
// Accessible à /icon → utilisée par le manifest et les navigateurs

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
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          borderRadius: "112px",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: 220,
            fontWeight: 700,
            fontFamily: "sans-serif",
            letterSpacing: "-8px",
          }}
        >
          FN
        </span>
      </div>
    ),
    { ...size }
  )
}

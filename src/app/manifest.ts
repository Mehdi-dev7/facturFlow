import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FacturNow",
    short_name: "FacturNow",
    description: "Gérez vos factures, devis et acomptes en toute simplicité.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#7c3aed",
    orientation: "portrait",
    id: "/dashboard",
    icons: [
      {
        // Icône standard — requis par Chrome pour l'installation (purpose "any")
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Icône maskable — pour les launchers Android (bords arrondis adaptés)
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["finance", "business", "productivity"],
  }
}

// app/layout.tsx — colle ce bloc dans ton metadata export
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FacturNow",
  description: "Facturation instantanée pour freelances et PME",
  icons: {
    icon: [
      { url: "/logo/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/logo/apple-icon.png", // génère depuis icon.svg si besoin
  },
  openGraph: {
    title: "FacturNow",
    description: "Facturation instantanée pour freelances et PME",
    images: ["/og-image.png"], // 1200×630 à créer depuis logo-white.svg
  },
};

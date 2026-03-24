import type { Metadata } from "next";
import { Inter, Golos_Text, Kanit, Merriweather } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

// Inter pour le texte principal
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Golos Text pour les h1
const golosText = Golos_Text({
  variable: "--font-golos-text",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Kanit 
const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  display: "swap",
});

// Merriweather
const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});


export const metadata: Metadata = {
  // Base URL utilisée pour résoudre toutes les URLs relatives (og:image, canonical, etc.)
  metadataBase: new URL("https://facturnow.fr"),
  title: {
    default: "FacturNow — Logiciel de facturation en ligne",
    template: "%s | FacturNow",
  },
  description: "Facturation intelligente avec paiement en 1 clic Stripe, PayPal ou SEPA. Pour freelances, auto-entrepreneurs, PME françaises.",
  keywords: ["logiciel facturation", "facturation en ligne", "devis en ligne", "prélèvement SEPA", "GoCardless", "Stripe", "PayPal", "paiement en 1 clic", "auto-entrepreneur", "freelance", "PME"],
  authors: [{ name: "FacturNow", url: "https://facturnow.fr" }],
  creator: "FacturNow",
  publisher: "FacturNow",
  // Robots par défaut — les layouts/pages peuvent surcharger
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Open Graph global — l'image est générée par /app/opengraph-image.tsx (Next.js ImageResponse)
  // Next.js la résout automatiquement. Les pages individuelles peuvent surcharger ces valeurs.
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://facturnow.fr",
    siteName: "FacturNow",
    // Titre et description OG de fallback (utilisés si une page ne définit pas les siens)
    title: "FacturNow — Logiciel de facturation en ligne",
    description: "Facturation intelligente avec paiement en 1 clic Stripe, PayPal ou SEPA. Pour freelances, auto-entrepreneurs, PME françaises.",
  },
  // Favicon & icônes statiques (PNG générés par scripts/generate-icons.mjs)
  // Google utilise le 32×32 / 48×48 pour les résultats de recherche
  // favicon.ico = fallback universel (tous navigateurs/robots)
  icons: {
    icon: [
      { url: "/favicon.ico",       sizes: "32x32",  type: "image/x-icon" },
      { url: "/favicon-16x16.png", sizes: "16x16",  type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32",  type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48",  type: "image/png" },
      { url: "/icon-192x192.png",  sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png",  sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // Twitter Card global — fallback pour toutes les pages sans twitter metadata propres
  twitter: {
    card: "summary_large_image",
    site: "@facturnow",
    title: "FacturNow — Logiciel de facturation en ligne",
    description: "Facturation intelligente avec paiement en 1 clic Stripe, PayPal ou SEPA. Pour freelances, auto-entrepreneurs, PME françaises.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${golosText.variable} ${kanit.variable} ${merriweather.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}

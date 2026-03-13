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
  description: "Créez, gérez et encaissez vos factures en ligne. Facturation intelligente avec prélèvement SEPA automatique pour freelances, auto-entrepreneurs et PME françaises.",
  keywords: ["logiciel facturation", "facturation en ligne", "devis en ligne", "prélèvement SEPA", "GoCardless", "auto-entrepreneur", "freelance", "PME"],
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
  // Next.js la résout automatiquement, pas besoin de la déclarer ici
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "FacturNow",
  },
  // Twitter Card global
  twitter: {
    card: "summary_large_image",
    site: "@facturnow",
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

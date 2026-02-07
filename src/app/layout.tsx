import type { Metadata } from "next";
import { Inter, Golos_Text, Kanit, Merriweather } from "next/font/google";
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
  title: "FacturFlow - Gestion de factures intelligente",
  description: "Créez, gérez et suivez vos factures en toute simplicité",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${golosText.variable} ${kanit.variable} ${merriweather.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

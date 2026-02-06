import type { Metadata } from "next";
import { Inter, Golos_Text } from "next/font/google";
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
      <body className={`${inter.variable} ${golosText.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next"

// Les pages auth ne sont pas indexées — elles n'ont pas de valeur SEO
// Mais on garde un titre correct pour l'onglet navigateur et les partages
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

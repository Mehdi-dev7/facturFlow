import type { Metadata } from "next"

// Les pages auth ne doivent pas être indexées par les moteurs de recherche
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

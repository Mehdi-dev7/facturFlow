// Server Component — permet d'exporter les metadata même si le contenu est "use client"
import type { Metadata } from "next"
import SignUpContent from "./signup-content"

export const metadata: Metadata = {
  title: "Créer un compte gratuit",
  description: "Créez votre compte FacturNow gratuitement. Essai Pro 7 jours inclus, sans carte bancaire. Prêt en 2 minutes.",
  // Pas de canonical — page noindex via le layout auth
}

export default function SignUpPage() {
  return <SignUpContent />
}

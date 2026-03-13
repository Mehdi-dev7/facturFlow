// Server Component — permet d'exporter les metadata même si le contenu est "use client"
import type { Metadata } from "next"
import LoginContent from "./login-content"

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace FacturNow pour gérer vos factures, devis et paiements.",
  // Pas de canonical — page noindex via le layout auth
}

export default function LoginPage() {
  return <LoginContent />
}

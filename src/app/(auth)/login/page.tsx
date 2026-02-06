"use client"

import { useState } from "react"
import Link from "next/link"
import { signIn } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Github, Chrome } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleOAuthSignIn = async (provider: "google" | "github" | "microsoft") => {
    try {
      setError("")
      await signIn.social({
        provider,
        callbackURL: "/dashboard",
      })
    } catch (err) {
      setError("Erreur lors de la connexion avec " + provider)
      console.error(err)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      })
    } catch (err) {
      setError("Email ou mot de passe incorrect")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="text-2xl font-bold text-white">F</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-heading">
            Connexion
          </CardTitle>
          <CardDescription className="text-center text-base">
            Accédez à votre espace FacturFlow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section OAuth */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-11 border-slate-300 hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => handleOAuthSignIn("google")}
            >
              <Chrome className="mr-2 h-5 w-5" />
              Continuer avec Google
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 border-slate-300 hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => handleOAuthSignIn("github")}
            >
              <Github className="mr-2 h-5 w-5" />
              Continuer avec GitHub
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 border-slate-300 hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => handleOAuthSignIn("microsoft")}
            >
              <Mail className="mr-2 h-5 w-5" />
              Continuer avec Microsoft
            </Button>
          </div>

          {/* Séparateur */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm font-medium">
              <span className="bg-white px-4 text-slate-500">
                Ou continuer avec
              </span>
            </div>
          </div>

          {/* Formulaire Email/Password */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 border-slate-300 focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 border-slate-300 focus:border-primary focus:ring-primary"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-primary hover:opacity-90 transition-opacity font-semibold" 
              disabled={isLoading}
            >
              {isLoading ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </form>

          {/* Lien vers inscription */}
          <div className="text-center text-sm pt-2">
            <span className="text-slate-600">Pas encore de compte ? </span>
            <Link href="/signup" className="text-primary hover:text-secondary font-semibold transition-colors">
              Créer un compte
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false },
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
      {/* Blobs décoratifs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 -left-48 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, rgba(79, 70, 229, 0.4), transparent)" }}
        />
        <div
          className="absolute bottom-1/4 -right-48 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, rgba(6, 182, 212, 0.4), transparent)" }}
        />
      </div>

      <div className="relative z-10 text-center space-y-6 max-w-md">
        {/* Logo */}
        <Link href="/" className="flex justify-center mb-6 group">
          <div className="h-14 w-14 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <span className="text-2xl font-bold text-white">F</span>
          </div>
        </Link>

        {/* 404 */}
        <div>
          <p className="text-8xl font-bold text-gradient">404</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Page introuvable</h1>
          <p className="mt-3 text-slate-600">
            Cette page n&apos;existe pas ou a été déplacée.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="gradient" asChild>
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Mon tableau de bord</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

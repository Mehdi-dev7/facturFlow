"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
      <div className="w-full px-4 sm:px-[8%] lg:px-[12%]">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-lg font-bold text-white font-heading">F</span>
            </div>
            <span className="text-xl font-bold font-heading text-gradient">
              FacturFlow
            </span>
          </Link>

          {/* Navigation centrale */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="#features" 
              className="text-slate-600 hover:text-primary transition-colors font-medium font-ui"
            >
              Fonctionnalités
            </Link>
            <Link 
              href="#pricing" 
              className="text-slate-600 hover:text-primary transition-colors font-medium font-ui"
            >
              Tarifs
            </Link>
            <Link 
              href="#faq" 
              className="text-slate-600 hover:text-primary transition-colors font-medium font-ui"
            >
              FAQ
            </Link>
          </div>

          {/* Bouton connexion */}
          <Link href="/login">
            <Button 
              variant="outline" 
              className="font-ui font-semibold border-slate-300 hover:border-primary hover:bg-primary/5"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Connexion
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

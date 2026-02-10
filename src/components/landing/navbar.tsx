"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogIn, Menu, X } from "lucide-react"

const navLinks = [
  { href: "#features", label: "Fonctionnalités" },
  { href: "#pricing", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="w-full px-4 sm:px-[8%] xl:px-[12%]">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-lg font-bold text-white font-heading">F</span>
              </div>
              <span className="text-xl lg:text-2xl font-semibold golos-text font-heading text-gradient">
                FacturFlow
              </span>
            </Link>

            {/* Navigation centrale - Desktop */}
            <div className="hidden md:flex items-center space-x-20">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative kanit text-xl text-secondary hover:text-primary transition-colors font-heading group"
                >
                  {link.label}
                  <span className="absolute left-1/2 -bottom-1 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full group-hover:left-0" />
                </Link>
              ))}
            </div>

            {/* Desktop - Bouton connexion */}
            <div className="hidden md:block">
              <Link href="/login">
                <Button
                  variant="outline"
                  className="kanit text-lg text-primary border-primary/30 bg-primary/5 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 cursor-pointer"
                >
                  <LogIn className="mr-2 h-5 w-5" strokeWidth={2.7} />
                  Connexion
                </Button>
              </Link>
            </div>

            {/* Mobile - Hamburger */}
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className="md:hidden relative z-50 p-2 text-secondary hover:text-primary transition-colors cursor-pointer"
              aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              <div className="relative w-6 h-6">
                <Menu
                  className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${
                    isOpen ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
                  }`}
                  strokeWidth={2.5}
                />
                <X
                  className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${
                    isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
                  }`}
                  strokeWidth={2.5}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay - en dehors du nav */}
      <div
        className={`md:hidden fixed top-16 left-0 right-0 z-40 bg-linear-to-b from-violet-50 via-violet-100 to-violet-50 border-b border-slate-200 shadow-lg rounded-b-2xl transition-all duration-300 ease-out ${
          isOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-4"
        }`}
      >
        <div className="flex flex-col items-center py-10 mb-10 gap-8 px-6">
          {navLinks.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className={`kanit text-2xl text-secondary hover:text-primary transition-all duration-300 font-heading ${
                isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
              style={{ transitionDelay: isOpen ? `${(i + 1) * 75}ms` : "0ms" }}
            >
              {link.label}
            </Link>
          ))}

          <div className="w-106 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />

          <Link
            href="/login"
            onClick={close}
            className={`transition-all duration-300 ${
              isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: isOpen ? `${(navLinks.length + 1) * 75}ms` : "0ms" }}
          >
            <Button
              variant="outline"
              className="kanit text-lg text-primary border-primary/30 bg-primary/5 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 cursor-pointer px-8 py-6"
            >
              <LogIn className="mr-2 h-5 w-5" strokeWidth={2.7} />
              Connexion
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}

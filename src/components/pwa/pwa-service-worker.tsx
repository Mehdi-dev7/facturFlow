"use client"

import { useEffect } from "react"

// Enregistre le Service Worker dès le chargement du dashboard
// Indépendant de la bannière d'installation — requis pour que Chrome
// détecte l'app comme installable (critère PWA)
export function PwaServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }
  }, [])

  return null
}

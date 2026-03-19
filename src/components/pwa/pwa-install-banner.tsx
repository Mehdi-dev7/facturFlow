"use client"

import { useEffect, useState } from "react"
import { Smartphone, X, Share } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const STORAGE_KEY_FIRST_VISIT  = "facturnow_first_visit"
const STORAGE_KEY_DISMISSED    = "facturnow_pwa_dismissed"    // permanent (après install)
const STORAGE_KEY_SNOOZED      = "facturnow_pwa_snoozed"      // temporaire (× = snooze 7j)
const SESSION_KEY_DISMISSED    = "facturnow_pwa_sess_dismissed" // sessionStorage — survit au refresh mobile
const DAYS_BEFORE_PROMPT       = 3
const DAYS_SNOOZE              = 7

// ─── Helpers localStorage (safe — évite les exceptions Safari ITP / privé) ────

function lsGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function lsSet(key: string, value: string): void {
  try { localStorage.setItem(key, value) } catch { /* ignore */ }
}

// ─── Helpers sessionStorage (survit aux refreshs dans le même onglet) ─────────
// Sur mobile, le module JS peut être réinitialisé au refresh → sessionDismissed
// repasse à false. sessionStorage compense ce cas sans bloquer les nouvelles sessions.
function ssGet(key: string): string | null {
  try { return sessionStorage.getItem(key) } catch { return null }
}
function ssSet(key: string, value: string): void {
  try { sessionStorage.setItem(key, value) } catch { /* ignore */ }
}

// ─── Flags module-level : persistent tant que le module JS est chargé ────────
// Survivent aux soft-nav Next.js, resets uniquement sur full reload
let sessionDismissed = false
let inMemorySnoozedAt = 0 // timestamp dismissal in-memory (fallback si localStorage KO)

// ─── Composant ────────────────────────────────────────────────────────────────

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow]         = useState(false)
  const [isIos, setIsIos]       = useState(false)
  const [showIosTip, setShowIosTip] = useState(false)

  useEffect(() => {
    // 1. Déjà dismissé dans cette session JS (soft nav)
    if (sessionDismissed) return

    // 2. App déjà installée
    if (window.matchMedia("(display-mode: standalone)").matches) return

    // 3. Dismissé définitivement (après install acceptée)
    if (lsGet(STORAGE_KEY_DISMISSED)) return

    // 4. Snooze : vérifier in-memory D'ABORD (fonctionne même si localStorage KO)
    //    puis localStorage comme source de persistance cross-sessions
    const inMemorySnoozeActive =
      inMemorySnoozedAt > 0 &&
      (Date.now() - inMemorySnoozedAt) / (1000 * 60 * 60 * 24) < DAYS_SNOOZE
    if (inMemorySnoozeActive) return

    const snoozedAt = parseInt(lsGet(STORAGE_KEY_SNOOZED) ?? "0", 10)
    if (snoozedAt && (Date.now() - snoozedAt) / (1000 * 60 * 60 * 24) < DAYS_SNOOZE) return

    // 5. sessionStorage — backup pour refresh mobile dans le même onglet
    if (ssGet(SESSION_KEY_DISMISSED)) return

    // Détecter iOS (pas de beforeinstallprompt sur Safari)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIos(ios)

    // Enregistrer la première visite
    if (!lsGet(STORAGE_KEY_FIRST_VISIT)) {
      lsSet(STORAGE_KEY_FIRST_VISIT, Date.now().toString())
    }

    // Vérifier les 3 jours
    const firstVisit = parseInt(lsGet(STORAGE_KEY_FIRST_VISIT) ?? "0", 10)
    const daysSince  = (Date.now() - firstVisit) / (1000 * 60 * 60 * 24)
    if (daysSince < DAYS_BEFORE_PROMPT) return

    if (ios) {
      setShow(true)
      return
    }

    // Chrome/Android → attendre l'event d'installation
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (isIos) { setShowIosTip(true); return }
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      sessionDismissed = true
      setShow(false)
      lsSet(STORAGE_KEY_DISMISSED, "true")
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    const now = Date.now()
    sessionDismissed = true                        // soft nav
    inMemorySnoozedAt = now                        // fallback si localStorage KO
    ssSet(SESSION_KEY_DISMISSED, "1")              // refresh mobile même onglet
    lsSet(STORAGE_KEY_SNOOZED, now.toString())    // snooze 7j cross-sessions
    setShow(false)
    setShowIosTip(false)
  }

  if (!show) return null

  return (
    <>
      {/* Overlay semi-transparent sur mobile uniquement */}
      <div
        className="fixed inset-0 z-40 bg-black/30 sm:hidden"
        onClick={handleDismiss}
      />

      {/* Card — centré sur mobile, bas-droite sur md+ */}
      <div className={`
        fixed z-50 w-[calc(100%-2rem)] max-w-sm
        left-1/2 -translate-x-1/2 bottom-6
        sm:left-auto sm:translate-x-0 sm:right-6 sm:bottom-6 sm:w-80
        rounded-2xl border border-violet-200 dark:border-violet-400/30
        bg-white dark:bg-[#1e1845]
        shadow-xl dark:shadow-violet-950/50
        p-4
        animate-in slide-in-from-bottom-4 duration-300
      `}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 shadow-md">
              <Smartphone className="size-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Installer FacturNow
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                Accès rapide depuis votre écran
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 mt-0.5 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Plus tard"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Instruction iOS */}
        {showIosTip ? (
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-400/30 px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
            <span>Appuyez sur</span>
            <Share className="size-3.5 shrink-0 text-blue-500" />
            <span>puis <strong>Sur l&apos;écran d&apos;accueil</strong></span>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="w-full cursor-pointer rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
          >
            Installer l&apos;app
          </button>
        )}

        {/* Sous-texte */}
        <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
          Gratuit · Aucune app store requise
        </p>
      </div>
    </>
  )
}

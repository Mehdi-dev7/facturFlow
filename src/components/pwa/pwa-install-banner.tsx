"use client"

import { useEffect, useState, useRef } from "react"
import { Smartphone, X, Share } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const LS_DISMISSED = "facturnow_pwa_dismissed"       // permanent (localStorage)
const LS_FIRST_VISIT = "facturnow_first_visit"       // date première visite
const SS_DISMISSED = "facturnow_pwa_dismissed_session" // session uniquement (sessionStorage)
const DAYS_BEFORE_PROMPT = 3

// ─── Helpers storage ────────────────────────────────────────────────────────

function lsGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function lsSet(key: string, value: string): void {
  try { localStorage.setItem(key, value) } catch { /* ignore */ }
}
function ssGet(key: string): string | null {
  try { return sessionStorage.getItem(key) } catch { return null }
}
function ssSet(key: string, value: string): void {
  try { sessionStorage.setItem(key, value) } catch { /* ignore */ }
}

// ─── Bannière modale ────────────────────────────────────────────────────────
// S'affiche une seule fois après 3 jours d'utilisation.
// Une fois fermée (dismiss ou install), ne réapparaît plus jamais (localStorage)
// ni pendant la session en cours (sessionStorage — survit aux soft navigations).

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosTip, setShowIosTip] = useState(false)

  useEffect(() => {
    // ── Vérifications bloquantes ──
    // Déjà fermé cette session ? (sessionStorage persiste entre soft navs)
    if (ssGet(SS_DISMISSED)) return
    // Déjà fermé définitivement ?
    if (lsGet(LS_DISMISSED)) return
    // App déjà installée en standalone ?
    if (window.matchMedia("(display-mode: standalone)").matches) return

    // ── Première visite : enregistrer la date ──
    if (!lsGet(LS_FIRST_VISIT)) {
      lsSet(LS_FIRST_VISIT, Date.now().toString())
    }

    // ── Attendre 3 jours avant d'afficher ──
    const firstVisit = parseInt(lsGet(LS_FIRST_VISIT) ?? "0", 10)
    const daysSince = (Date.now() - firstVisit) / (1000 * 60 * 60 * 24)
    if (daysSince < DAYS_BEFORE_PROMPT) return

    // ── iOS : afficher directement ──
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIos(ios)

    if (ios) {
      setShow(true)
      return
    }

    // ── Chrome/Android : attendre l'event natif ──
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, []) // [] = un seul run au montage

  // ── Installation ──
  const handleInstall = async () => {
    if (isIos) { setShowIosTip(true); return }
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    dismiss()
  }

  // ── Fermeture — permanent + session ──
  const dismiss = () => {
    lsSet(LS_DISMISSED, "true")
    ssSet(SS_DISMISSED, "true")
    setShow(false)
    setShowIosTip(false)
    toast("Vous pouvez installer l'app à tout moment depuis le bas de la barre de navigation.", {
      icon: <Smartphone className="size-4 text-violet-500" />,
      duration: 6000,
    })
  }

  if (!show) return null

  return (
    <>
      {/* Overlay semi-transparent sur mobile */}
      <div
        className="fixed inset-0 z-40 bg-black/30 sm:hidden"
        onClick={dismiss}
      />

      {/* Card — centré mobile, bas-droite desktop */}
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
            onClick={dismiss}
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

        <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
          Retrouvez l&apos;option dans le menu si vous changez d&apos;avis.
        </p>
      </div>
    </>
  )
}

// ─── Bouton sidebar — toujours visible après fermeture de la bannière ─────────

export function PwaInstallSidebarButton({ collapsed = false }: { collapsed?: boolean }) {
  const [visible, setVisible] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return
    if (lsGet(LS_DISMISSED) === "installed") return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIos(ios)
    setVisible(true)

    const handler = (e: Event) => {
      e.preventDefault()
      promptRef.current = e as BeforeInstallPromptEvent
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleClick = async () => {
    if (isIos) { setShowTip((v) => !v); return }
    if (promptRef.current) {
      await promptRef.current.prompt()
      const { outcome } = await promptRef.current.userChoice
      if (outcome === "accepted") {
        lsSet(LS_DISMISSED, "installed")
        setVisible(false)
      }
      promptRef.current = null
    } else {
      setShowTip((v) => !v)
    }
  }

  if (!visible) return null

  const btn = (
    <button
      onClick={handleClick}
      className={`
        flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm
        text-slate-500 dark:text-slate-400
        hover:bg-violet-50 hover:text-violet-600
        dark:hover:bg-violet-950/40 dark:hover:text-violet-300
        transition-colors
        ${collapsed ? "justify-center" : ""}
      `}
      aria-label="Installer l'application"
    >
      <Smartphone className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">Installer l&apos;app</span>}
    </button>
  )

  return (
    <div>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="right">Installer l&apos;app</TooltipContent>
        </Tooltip>
      ) : btn}

      {showTip && !collapsed && (
        <div className="mx-3 mt-1 flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-400/30 px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
          <Share className="size-3 shrink-0 text-blue-500" />
          <span>Appuyez sur <strong>Partager</strong> puis <strong>Sur l&apos;écran d&apos;accueil</strong></span>
        </div>
      )}
    </div>
  )
}

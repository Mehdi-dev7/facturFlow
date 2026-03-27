"use client";

// ─── PageLoader ───────────────────────────────────────────────────────────────
// Loader global aux couleurs du site (violet/indigo).
// Utilisé dans le DashboardShell lors des navigations entre pages.
// S'affiche en haut de l'écran (style NProgress) + spinner centré optionnel.

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// ─── Barre de progression en haut (style NProgress) ──────────────────────────
export function TopProgressBar({ loading }: { loading: boolean }) {
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  // Timestamp du début de navigation — permet de savoir si c'était instantané
  const startRef = useRef<number | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => {
    if (loading) {
      startRef.current = Date.now();
      clearTimers();

      // N'affiche la barre qu'après 150ms — si la page est déjà en cache
      // (navigation instantanée), loading repassera à false avant ce délai
      // et la barre n'apparaîtra jamais
      const tShow = setTimeout(() => {
        setVisible(true);
        setWidth(30);
        const t1 = setTimeout(() => setWidth(60), 200);
        const t2 = setTimeout(() => setWidth(80), 500);
        timersRef.current.push(t1, t2);
      }, 150);
      timersRef.current.push(tShow);

    } else {
      clearTimers();
      const elapsed = startRef.current ? Date.now() - startRef.current : 0;
      startRef.current = null;

      // Navigation trop rapide → barre jamais affichée, rien à faire
      if (elapsed < 150) return;

      // Sinon : compléter à 100% puis masquer
      setWidth(100);
      const t = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 200);
      timersRef.current.push(t);
    }
  }, [loading]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-linear-to-r from-violet-500 via-indigo-500 to-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]"
        style={{
          width: `${width}%`,
          transition: loading
            ? "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
            : "width 0.2s ease-out",
        }}
      />
    </div>
  );
}

// ─── Spinner standalone (pour usages ponctuels dans les composants) ───────────
export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-7 w-7 border-2",
    lg: "h-10 w-10 border-[3px]",
  };

  return (
    <div
      className={`${sizes[size]} rounded-full border-violet-200 dark:border-violet-800 border-t-violet-500 dark:border-t-violet-400 animate-spin`}
    />
  );
}

// ─── Hook : détecte les navigations pour afficher le loader ──────────────────
// Stratégie :
//   1. Écoute les clics sur les liens internes → démarre le loader AU CLIC
//   2. usePathname change (page chargée) → arrête le loader
export function useRouteLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  // Démarre le loader dès le clic sur un lien interne
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      // Ignorer les liens externes, ancres, mailto, et même page
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto")) return;
      if (href === pathname) return;
      setLoading(true);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  // Arrête le loader quand la nouvelle page est montée (pathname a changé)
  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  return loading;
}

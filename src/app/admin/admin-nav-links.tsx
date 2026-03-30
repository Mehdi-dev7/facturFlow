"use client";
// src/app/admin/admin-nav-links.tsx
// Nav links du panel admin avec dismiss du dot "nouveaux users" via localStorage.
// Logique : on stocke le compteur vu lors de la dernière visite sur /admin.
// Le dot réapparaît si de nouveaux users s'inscrivent APRÈS cette visite.

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, MessageSquare, Users2 } from "lucide-react";

const LS_KEY = "admin_new_users_seen_count";

interface Props {
  newUsers: number;
  pendingReviews: number;
}

export function AdminNavLinks({ newUsers, pendingReviews }: Props) {
  const pathname = usePathname();

  // Nombre de nouveaux users vus lors de la dernière visite sur /admin
  const [seenCount, setSeenCount] = useState<number>(() => {
    if (typeof window === "undefined") return newUsers; // SSR safe
    return parseInt(localStorage.getItem(LS_KEY) ?? String(newUsers), 10);
  });

  // Quand on arrive sur /admin (exactement) : marquer les users actuels comme "vus"
  useEffect(() => {
    if (pathname === "/admin" && newUsers > 0) {
      localStorage.setItem(LS_KEY, String(newUsers));
      setSeenCount(newUsers);
    }
  }, [pathname, newUsers]);

  // Quand plus aucun nouveau user (48h écoulées) : remettre le compteur à 0
  useEffect(() => {
    if (newUsers === 0) {
      localStorage.setItem(LS_KEY, "0");
      setSeenCount(0);
    }
  }, [newUsers]);

  // Le dot s'allume seulement si de nouveaux users se sont inscrits APRÈS la dernière visite
  const showUsersDot = newUsers > seenCount;

  return (
    <nav className="flex flex-col gap-1 p-3 flex-1">
      <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Navigation
      </p>

      <NavLink href="/admin" icon={LayoutDashboard} label="Dashboard" dot={showUsersDot} />
      <NavLink href="/admin/avis" icon={MessageSquare} label="Avis" badge={pendingReviews} />
      <NavLink href="/admin/partners" icon={Users2} label="Partenaires" />
    </nav>
  );
}

// ─── Helper NavLink ───────────────────────────────────────────────────────────

function NavLink({
  href,
  icon: Icon,
  label,
  badge = 0,
  dot = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  dot?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {/* Badge numérique (ex: nombre d'avis en attente) */}
      {badge > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
      {/* Dot pulsant (ex: nouveaux utilisateurs) */}
      {dot && !badge && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      )}
    </Link>
  );
}

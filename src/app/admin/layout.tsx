// src/app/admin/layout.tsx
// Layout réservé à l'admin (vérifié côté serveur via ADMIN_EMAIL).
// Redirige vers /dashboard si l'utilisateur n'est pas admin.

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Shield, Users, LayoutDashboard } from "lucide-react";

export const metadata = {
  title: "Admin — FacturNow",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  // Accès interdit si pas admin
  if (
    !session?.user?.email ||
    !process.env.ADMIN_EMAIL ||
    session.user.email !== process.env.ADMIN_EMAIL
  ) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar admin */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-slate-800 bg-slate-900">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-5 border-b border-slate-800">
          <Shield className="h-5 w-5 text-violet-400 shrink-0" />
          <span className="text-lg font-bold text-white">Admin Panel</span>
          <span className="ml-auto rounded-full bg-violet-600/30 border border-violet-500/40 px-2 py-0.5 text-[10px] font-semibold text-violet-300 uppercase tracking-wide">
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Navigation
          </p>
          <AdminNavLink href="/admin" icon={LayoutDashboard} label="Dashboard" exact />
          <AdminNavLink href="/admin/users" icon={Users} label="Utilisateurs" />
        </nav>

        {/* Footer : lien retour dashboard */}
        <div className="p-3 border-t border-slate-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ← Retour au dashboard
          </Link>
          <p className="mt-2 px-3 text-xs text-slate-600 truncate">{session.user.email}</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header mobile */}
        <header className="md:hidden flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-900 px-4">
          <Shield className="h-5 w-5 text-violet-400" />
          <span className="font-semibold text-white">Admin</span>
          <Link href="/dashboard" className="ml-auto text-xs text-slate-400 hover:text-white">
            ← Dashboard
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// Petit helper de nav link pour éviter d'importer usePathname côté server
// (on passe par un composant client minimal ou on utilise des classes statiques)
function AdminNavLink({
  href,
  icon: Icon,
  label,
  exact = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  exact?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

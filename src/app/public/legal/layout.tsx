import Link from "next/link";
import { ArrowLeft, FileText, Shield, ScrollText } from "lucide-react";

const LEGAL_LINKS = [
  { href: "/public/legal/mentions",  label: "Mentions légales",   icon: FileText },
  { href: "/public/legal/privacy",   label: "Confidentialité",    icon: Shield },
  { href: "/public/legal/cgv",       label: "CGU / CGV",          icon: ScrollText },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#110c29]">
      {/* Hero header */}
      <div className="bg-white dark:bg-[#160c30] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Logo + retour */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-lg">FacturNow</span>
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour au dashboard
            </Link>
          </div>

          {/* Navigation légale */}
          <nav className="flex gap-2 flex-wrap">
            {LEGAL_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary dark:hover:text-primary transition-colors border border-slate-200 dark:border-slate-700"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-8">
          © {new Date().getFullYear()} FacturNow — Tous droits réservés ·{" "}
          <a href="mailto:contact@facturnow.fr" className="hover:text-primary transition-colors">
            contact@facturnow.fr
          </a>
        </p>
      </div>
    </div>
  );
}

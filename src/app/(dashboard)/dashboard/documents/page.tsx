// Page Documents — hub central de tous les types de documents
// Server Component (statique, pas de data fetching)

import Link from "next/link";
import { Metadata } from "next";
import {
  FileText,
  FileCheck,
  Banknote,
  Receipt,
  FileMinus,
  ShoppingCart,
  Truck,
  FileStack,
  ArrowRight,
  CheckCircle2,
  Clock,
  FolderOpen,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Documents | FacturNow",
  description: "Tous vos types de documents en un seul endroit",
};

// ─── Config des documents ────────────────────────────────────────────────────

interface DocCard {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  accent: string;         // couleur bande top + icône bg
  iconColor: string;      // couleur de l'icône
  available: boolean;
}

const DOCS: DocCard[] = [
  {
    icon: FileText,
    label: "Factures",
    description: "Créez et envoyez des factures professionnelles. Suivez les paiements et relancez automatiquement.",
    href: "/dashboard/invoices",
    accent: "#7c3aed",
    iconColor: "text-violet-600 dark:text-violet-400",
    available: true,
  },
  {
    icon: FileCheck,
    label: "Devis",
    description: "Rédigez des devis que vos clients peuvent accepter ou refuser en un clic depuis leur email.",
    href: "/dashboard/quotes",
    accent: "#4f46e5",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    available: true,
  },
  {
    icon: Banknote,
    label: "Acomptes",
    description: "Demandez un acompte avant de démarrer. Généré automatiquement depuis un devis accepté.",
    href: "/dashboard/deposits",
    accent: "#059669",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    available: true,
  },
  {
    icon: Receipt,
    label: "Reçus",
    description: "Générez des reçus instantanément après encaissement. PDF prêt à télécharger en un clic.",
    href: "/dashboard/receipts",
    accent: "#d97706",
    iconColor: "text-amber-600 dark:text-amber-400",
    available: true,
  },
  {
    icon: FileMinus,
    label: "Avoirs",
    description: "Annulez totalement ou partiellement une facture avec un avoir officiel.",
    href: "/dashboard/avoirs",
    accent: "#dc2626",
    iconColor: "text-red-500 dark:text-red-400",
    available: true,
  },
  {
    icon: ShoppingCart,
    label: "Bons de commande",
    description: "Formalisez vos commandes fournisseurs ou clients avec un document officiel.",
    href: "/dashboard/documents",
    accent: "#0891b2",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    available: false,
  },
  {
    icon: Truck,
    label: "Bons de livraison",
    description: "Accompagnez chaque livraison d'un bon récapitulant les produits et quantités.",
    href: "/dashboard/livraisons",
    accent: "#0d9488",
    iconColor: "text-teal-600 dark:text-teal-400",
    available: true,
  },
  {
    icon: FileStack,
    label: "Proforma",
    description: "Émettez une facture proforma indicative avant confirmation définitive de la commande.",
    href: "/dashboard/proformas",
    accent: "#ea580c",
    iconColor: "text-orange-600 dark:text-orange-400",
    available: true,
  },
];

// ─── Card document ────────────────────────────────────────────────────────────

function DocCard({ doc }: { doc: DocCard }) {
  const Icon = doc.icon;

  const inner = (
    <div className={`group relative bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden shadow-sm transition-all duration-200 h-full flex flex-col
      ${doc.available
        ? "border-slate-200 dark:border-slate-800 hover:border-primary/40 dark:hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
        : "border-slate-200 dark:border-slate-800 opacity-60 cursor-default"
      }`}
    >
      {/* Bande colorée en haut */}
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: doc.accent }} />

      <div className="p-4 xs:p-5 flex flex-col gap-4 flex-1">
        {/* Header : icône + badge */}
        <div className="flex items-start justify-between gap-2">
          <div
            className="flex items-center justify-center w-10 h-10 xs:w-11 xs:h-11 rounded-xl border shrink-0"
            style={{
              backgroundColor: doc.accent + "18",
              borderColor: doc.accent + "35",
            }}
          >
            <Icon className={`h-5 w-5 ${doc.iconColor}`} />
          </div>

          {doc.available ? (
            <span className="flex items-center gap-1 text-[10px] xs:text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full shrink-0">
              <CheckCircle2 className="h-3 w-3" />
              Disponible
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] xs:text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full shrink-0">
              <Clock className="h-3 w-3" />
              Bientôt
            </span>
          )}
        </div>

        {/* Titre + description */}
        <div className="flex-1">
          <h3 className="text-sm xs:text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">
            {doc.label}
          </h3>
          <p className="text-xs xs:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {doc.description}
          </p>
        </div>

        {/* CTA */}
        {doc.available && (
          <div className="flex items-center gap-1 text-xs xs:text-sm font-semibold text-primary group-hover:gap-2 transition-all duration-200 mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
            Accéder
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
    </div>
  );

  // Seuls les docs disponibles sont cliquables
  if (doc.available) {
    return <Link href={doc.href} className="h-full">{inner}</Link>;
  }

  return <div className="h-full">{inner}</div>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const availableDocs = DOCS.filter((d) => d.available);
  const comingSoonDocs = DOCS.filter((d) => !d.available);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 shrink-0">
          <FolderOpen className="h-5 w-5 xs:h-6 xs:w-6" />
        </div>
        <div>
          <h1 className="text-xl xs:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Documents
          </h1>
          <p className="text-xs xs:text-sm text-slate-500 dark:text-slate-400">
            Tous vos types de documents en un seul endroit
          </p>
        </div>
      </div>

      {/* Docs disponibles */}
      <section>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 xs:mb-4">
          Disponibles maintenant
        </p>
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 xs:gap-4">
          {availableDocs.map((doc) => (
            <DocCard key={doc.label} doc={doc} />
          ))}
        </div>
      </section>

      {/* Docs à venir */}
      <section>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 xs:mb-4">
          Prochainement
        </p>
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 xs:gap-4">
          {comingSoonDocs.map((doc) => (
            <DocCard key={doc.label} doc={doc} />
          ))}
        </div>
      </section>
    </div>
  );
}

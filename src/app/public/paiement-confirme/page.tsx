// src/app/public/paiement-confirme/page.tsx
// Page publique affichée au client après un paiement réussi (Stripe ou PayPal).
// Pas d'authentification requise.

import Link from "next/link";
import { CheckCircle2, FileText, Zap, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paiement confirmé | FacturNow",
  description: "Votre paiement a bien été reçu.",
  // Page transactionnelle publique — pas d'intérêt à indexer
  robots: { index: false, follow: false },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getInvoiceInfo(invoiceId: string) {
  try {
    return await prisma.document.findFirst({
      where: { id: invoiceId, type: "INVOICE" },
      select: {
        number: true,
        total: true,
        user: { select: { companyName: true, name: true } },
      },
    });
  } catch {
    return null;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PaiementConfirmePage({
  searchParams,
}: {
  searchParams: Promise<{ invoice?: string; provider?: string }>;
}) {
  const { invoice: invoiceId, provider } = await searchParams;
  const invoiceInfo = invoiceId ? await getInvoiceInfo(invoiceId) : null;

  const emetteur =
    invoiceInfo?.user?.companyName || invoiceInfo?.user?.name || "votre prestataire";

  const providerLabel =
    provider === "paypal" ? "PayPal"
    : provider === "sepa"  ? "prélèvement SEPA"
    : "carte bancaire";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 flex flex-col items-center justify-center px-4 py-16">

      {/* ── Carte confirmation ─────────────────────────────────────────── */}
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">

          {/* Header vert */}
          <div className="bg-linear-to-r from-green-500 to-emerald-500 px-8 py-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <CheckCircle2 className="h-9 w-9 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">Paiement confirmé !</h1>
            <p className="text-green-100 text-sm mt-1">
              {provider === "sepa"
                ? "Votre mandat SEPA a été signé — le prélèvement aura lieu sous 2–5 jours ouvrés"
                : "Votre règlement a bien été reçu"}
            </p>
          </div>

          {/* Corps */}
          <div className="px-8 py-6 space-y-4">

            {/* Détails facture */}
            {invoiceInfo && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Facture {invoiceInfo.number}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {emetteur} · Payé par {providerLabel}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {Number(invoiceInfo.total).toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </p>
                </div>
              </div>
            )}

            <p className="text-sm text-slate-600 dark:text-slate-400 text-center leading-relaxed">
              Vous pouvez fermer cette page.
            </p>
          </div>
        </div>

        {/* ── Pub FacturNow ─────────────────────────────────────────────── */}
        <div className="mt-6 bg-linear-to-r from-violet-600 to-violet-500 rounded-2xl px-6 py-5 text-white shadow-lg shadow-violet-500/20">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">
                Facture générée avec FacturNow
              </p>
              <p className="text-xs text-violet-200 mt-0.5 leading-relaxed">
                Créez, envoyez et encaissez vos factures automatiquement.
                Essai gratuit 7 jours, sans carte bancaire.
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold bg-white text-violet-600 hover:bg-violet-50 transition-colors px-4 py-2.5 rounded-xl w-full"
          >
            Découvrir FacturNow gratuitement
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

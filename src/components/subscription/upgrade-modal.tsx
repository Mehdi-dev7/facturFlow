"use client";
// src/components/subscription/upgrade-modal.tsx
// Dialog affiché quand l'utilisateur tente d'utiliser une feature verrouillée.
// Affiche le plan cible requis, les avantages, et un bouton vers la page abonnement.

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Check, ArrowRight, Zap } from "lucide-react";
import type { Feature } from "@/lib/feature-gate";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature: Feature;
  plan: string;
}

// Map feature → plan cible requis
const FEATURE_REQUIRED_PLAN: Partial<Record<Feature, "PRO" | "BUSINESS">> = {
  unlimited_documents: "PRO",
  unlimited_clients:   "PRO",
  custom_appearance:   "PRO",
  payment_stripe:      "PRO",
  payment_paypal:      "PRO",
  payment_gocardless:  "PRO",
  auto_reminders:      "PRO",
  recurring_invoices:  "PRO",
  statistics:          "PRO",
  business_templates:  "PRO",
  csv_export:          "PRO",
  einvoice_100:        "PRO",
  einvoice_unlimited:  "BUSINESS",
  fec_export:          "BUSINESS",
  monthly_accounting_report: "BUSINESS",
  annual_report:       "BUSINESS",
  legal_archiving:     "BUSINESS",
  api_webhooks:        "BUSINESS",
  priority_support:    "BUSINESS",
  multi_users:         "BUSINESS",
};

// Label lisible par feature
const FEATURE_LABELS: Partial<Record<Feature, string>> = {
  unlimited_documents: "Documents illimités",
  unlimited_clients:   "Clients illimités",
  custom_appearance:   "Apparence personnalisée",
  payment_stripe:      "Paiement par carte (Stripe)",
  payment_paypal:      "Paiement PayPal",
  payment_gocardless:  "Prélèvement SEPA automatique",
  auto_reminders:      "Relances automatiques",
  recurring_invoices:  "Factures récurrentes",
  statistics:          "Statistiques avancées",
  business_templates:  "Templates métiers",
  csv_export:          "Export CSV",
  einvoice_100:        "Facturation électronique (100/mois)",
  einvoice_unlimited:  "Facturation électronique illimitée",
  fec_export:          "Export FEC comptable",
  monthly_accounting_report: "Rapport mensuel comptable",
  annual_report:       "Bilan annuel & URSSAF",
  legal_archiving:     "Archivage légal 10 ans",
  api_webhooks:        "API & Webhooks",
  priority_support:    "Support prioritaire",
  multi_users:         "Multi-utilisateurs (3 comptes)",
};

// Features du plan PRO à afficher dans la modale
const PRO_HIGHLIGHTS = [
  "Documents & clients illimités",
  "Paiements Stripe, PayPal, GoCardless SEPA",
  "Relances automatiques",
  "Factures récurrentes",
  "Statistiques & export CSV",
  "Facturation électronique certifiée",
];

// Features supplémentaires Business
const BUSINESS_HIGHLIGHTS = [
  "Tout ce qui est inclus dans Pro",
  "3 utilisateurs par compte",
  "Export FEC comptable",
  "Rapport mensuel comptable",
  "Archivage légal 10 ans",
  "API & Webhooks",
];

export function UpgradeModal({ open, onClose, feature }: UpgradeModalProps) {
  const requiredPlan = FEATURE_REQUIRED_PLAN[feature] ?? "PRO";
  const isPro = requiredPlan === "PRO";

  const price = isPro ? "9,99€/mois" : "25€/mois";
  const highlights = isPro ? PRO_HIGHLIGHTS : BUSINESS_HIGHLIGHTS;
  const featureLabel = FEATURE_LABELS[feature] ?? feature;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md p-3 xs:p-3 sm:p-5 bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#1e1845] dark:to-[#1a1438] border border-primary/20 dark:border-violet-400/30 shadow-xl dark:shadow-violet-950/50 rounded-2xl">
        {/* Icône */}
        <div className="flex justify-center pt-2">
          <div className={`flex items-center justify-center w-14 h-14 rounded-2xl ${isPro ? "bg-violet-100 dark:bg-violet-900/40" : "bg-amber-100 dark:bg-amber-900/30"}`}>
            {isPro
              ? <Zap className="h-7 w-7 text-violet-600 dark:text-violet-300" />
              : <Crown className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            }
          </div>
        </div>

        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-base xs:text-xl font-bold text-slate-900 dark:text-slate-100">
            {isPro ? "Fonctionnalité Pro" : "Fonctionnalité Business"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-primary dark:text-violet-300">{featureLabel}</span> est disponible à partir du plan{" "}
            <span className="font-semibold">{requiredPlan === "PRO" ? "Pro" : "Business"}</span>.
          </DialogDescription>
        </DialogHeader>

        {/* Liste avantages */}
        <div className="space-y-2 py-2">
          {highlights.map((item) => (
            <div key={item} className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
                <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300">{item}</span>
            </div>
          ))}
        </div>

        {/* Prix */}
        <div className="text-center py-2">
          <span className="text-2xl font-bold text-gradient">{price}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">HT · sans engagement</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pb-2">
          <Button
            variant="gradient"
            className="w-full gap-2 cursor-pointer"
            onClick={() => { window.location.href = "/dashboard/subscription"; }}
          >
            <Sparkles className="h-4 w-4" />
            Voir les plans
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="w-full text-slate-500 dark:text-slate-400 cursor-pointer"
            onClick={onClose}
          >
            Pas maintenant
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

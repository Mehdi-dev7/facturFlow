"use client";
// src/app/checkout/cancel/page.tsx
// Page affichée quand l'utilisateur annule le processus de paiement Stripe.
// Ton rassurant — aucune modification n'a eu lieu.

import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-b from-slate-50 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg p-8 sm:p-10 text-center space-y-6"
      >
        {/* Icône */}
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800">
            <ShieldCheck className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          </div>
        </div>

        {/* Textes */}
        <div className="space-y-3">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Pas de problème !
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            Votre abonnement n&apos;a pas été modifié. Aucun paiement n&apos;a été effectué.
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            Vous pouvez upgrader à tout moment depuis votre espace abonnement.
          </p>
        </div>

        {/* Info supplémentaire */}
        <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-left">
          <Clock className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            Si vous étiez en période d&apos;essai, elle reste active jusqu&apos;à sa date de fin.
            Pas de pression — vous décidez quand vous voulez.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button variant="gradient" className="w-full gap-2" asChild>
            <Link href="/dashboard/subscription">
              Voir les plans
            </Link>
          </Button>
          <Button variant="ghost" className="w-full gap-2 text-slate-500" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Retour au dashboard
            </Link>
          </Button>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 text-sm text-slate-400 dark:text-slate-600"
      >
        FacturNow — Facturation simplifiée
      </motion.p>
    </div>
  );
}

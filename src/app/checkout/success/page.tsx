"use client";
// src/app/checkout/success/page.tsx
// Page de confirmation après souscription réussie.
// Affiche le bon plan (Pro ou Business) selon le query param `plan`.

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const circleVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
};

const checkVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.4, ease: [0, 0, 0.2, 1], delay: 0.5 },
  },
};

// Contenu selon le plan souscrit
const PLAN_CONTENT = {
  pro: {
    title: "Bienvenue dans FacturNow Pro !",
    description: "Votre abonnement Pro est maintenant actif. Toutes les fonctionnalités sont disponibles immédiatement.",
    features: [
      "Documents & clients illimités",
      "Paiements Stripe, PayPal et SEPA",
      "Relances automatiques activées",
      "Factures récurrentes disponibles",
    ],
  },
  business: {
    title: "Bienvenue dans FacturNow Business !",
    description: "Votre abonnement Business est maintenant actif. Toutes les fonctionnalités avancées sont disponibles immédiatement.",
    features: [
      "Multi-utilisateurs (3 comptes)",
      "Export comptable FEC & URSSAF",
      "E-invoicing illimité (SuperPDP)",
      "API & Webhooks activés",
    ],
  },
};

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") === "business" ? "business" : "pro";
  const content = PLAN_CONTENT[plan];

  useEffect(() => {
    document.title = content.title;
  }, [content.title]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-b from-violet-50 via-white to-white dark:from-[#1e1b4b] dark:via-slate-950 dark:to-slate-950 px-4">
      {/* Card centrale */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800 rounded-3xl shadow-xl dark:shadow-violet-950/40 p-8 sm:p-10 text-center space-y-6"
      >
        {/* Checkmark animé */}
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="46" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="2" />
              <motion.circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="#22c55e"
                strokeWidth="4"
                strokeLinecap="round"
                variants={circleVariants}
                initial="hidden"
                animate="visible"
                style={{ rotate: -90, originX: "50%", originY: "50%" }}
              />
              <motion.path
                d="M28 52 L44 68 L72 36"
                fill="none"
                stroke="#16a34a"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={checkVariants}
                initial="hidden"
                animate="visible"
              />
            </svg>
          </div>
        </div>

        {/* Titre & description */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500 animate-pulse" />
            <h1 className="text-2xl font-bold text-gradient">{content.title}</h1>
            <Sparkles className="h-5 w-5 text-violet-500 animate-pulse" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            {content.description}
          </p>
        </motion.div>

        {/* Features débloquées */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="bg-violet-50 dark:bg-violet-950/40 rounded-2xl p-4 space-y-2 text-left"
        >
          {content.features.map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-violet-700 dark:text-violet-300">
              <CheckCircle className="h-4 w-4 text-violet-500 shrink-0" />
              {item}
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.4 }}
        >
          <Button variant="gradient" size="lg" className="w-full gap-2" asChild>
            <Link href="/dashboard">
              Accéder au dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* Logo discret en bas */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="mt-8 text-sm text-slate-400 dark:text-slate-600"
      >
        FacturNow — Facturation simplifiée
      </motion.p>
    </div>
  );
}

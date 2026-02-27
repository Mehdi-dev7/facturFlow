import { Metadata } from "next";
import {
  ScrollText, Layers, UserPlus, Sparkles, CreditCard, RotateCcw,
  ShieldCheck, Wifi, Database, PenLine, Scale, Globe,
} from "lucide-react";

export const metadata: Metadata = {
  title: "CGU / CGV | FacturFlow",
  description: "Conditions générales d'utilisation et de vente de FacturFlow",
};

// ─── Composants partagés ─────────────────────────────────────────────────────

function Section({
  num, title, icon: Icon, children,
}: {
  num: string; title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="flex gap-5 py-7 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex flex-col items-center gap-2 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-xs font-bold text-slate-300 dark:text-slate-700">{num}</span>
      </div>
      <div className="flex-1 pt-1">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">{title}</h2>
        <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CgvPage() {
  return (
    <>
      {/* En-tête */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-medium text-primary mb-2 uppercase tracking-wider">
          <ScrollText className="h-3.5 w-3.5" />
          Conditions générales
        </div>
        <h1 className="text-2xl font-bold text-gradient mb-1">CGU / CGV</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Dernière mise à jour : mars 2025 — Applicables à tout utilisateur de FacturFlow
        </p>
      </div>

      <div className="px-8">
        <Section num="01" title="Objet" icon={ScrollText}>
          <p>
            Les présentes Conditions Générales d&apos;Utilisation et de Vente (CGU/CGV) régissent
            l&apos;accès et l&apos;utilisation de FacturFlow, plateforme SaaS de facturation en
            ligne accessible à{" "}
            <a href="https://facturflow.fr" className="text-primary hover:underline">facturflow.fr</a>.
            En créant un compte ou en utilisant le service, vous acceptez l&apos;intégralité
            de ces conditions.
          </p>
        </Section>

        <Section num="02" title="Description du service" icon={Layers}>
          <p>FacturFlow est un logiciel de facturation destiné aux freelances, auto-entrepreneurs et PME françaises. Il permet notamment de :</p>
          <ul className="space-y-1.5 mt-2">
            {[
              "Créer, envoyer et gérer des factures, devis et acomptes",
              "Générer des PDF professionnels",
              "Encaisser des paiements via Stripe, PayPal et GoCardless (SEPA)",
              "Automatiser les relances et les factures récurrentes",
              "Gérer un portefeuille clients et exporter des rapports comptables",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section num="03" title="Inscription et compte" icon={UserPlus}>
          <p>
            L&apos;accès au service requiert la création d&apos;un compte avec une adresse
            email valide. Vous êtes responsable de la confidentialité de vos identifiants
            et de toute activité effectuée depuis votre compte.
          </p>
          <p>
            Vous vous engagez à fournir des informations exactes et à les maintenir à jour.
            FacturFlow se réserve le droit de suspendre ou supprimer tout compte en cas
            d&apos;utilisation frauduleuse.
          </p>
        </Section>

        <Section num="04" title="Plans et tarifs" icon={Sparkles}>
          <div className="space-y-3">
            {/* Gratuit */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">Plan Gratuit</span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">0 €</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                10 documents/mois, 5 clients, 1 utilisateur. Aucune carte requise.
              </p>
            </div>

            {/* Pro */}
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 dark:bg-primary/10">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">Plan Pro</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">14 €/mois</span>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">ou 134 €/an</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Documents illimités, SEPA, relances auto, factures récurrentes, rapports URSSAF.
              </p>
            </div>

            {/* Business */}
            <div className="p-4 rounded-xl border border-violet-300/40 dark:border-violet-400/20 bg-linear-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/20">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">Plan Business</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">29 €/mois</span>
                  <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">ou 278 €/an</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tout Pro + multi-utilisateurs (3 comptes), API & webhooks, facturation électronique illimitée.
              </p>
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
              Prix HT. TVA 20% applicable pour les clients français.
            </p>
          </div>
        </Section>

        <Section num="05" title="Paiement et renouvellement" icon={CreditCard}>
          <p>
            Les abonnements sont payables par carte bancaire (Stripe) ou PayPal.
            Le prélèvement est effectué automatiquement à chaque échéance (mensuelle ou annuelle).
          </p>
          <p>
            En cas d&apos;échec de paiement, vous serez notifié par email et disposerez
            d&apos;un délai de 7 jours pour régulariser avant suspension du compte.
          </p>
        </Section>

        <Section num="06" title="Résiliation et remboursement" icon={RotateCcw}>
          <p>
            Vous pouvez résilier votre abonnement à tout moment depuis{" "}
            <strong>Mon compte → Abonnement</strong>. La résiliation prend effet à la fin
            de la période en cours, sans remboursement au prorata.
          </p>
          <p>
            Conformément à l&apos;article L221-28 du Code de la consommation, le droit de
            rétractation de 14 jours ne s&apos;applique pas aux services SaaS dont
            l&apos;exécution a commencé avec votre accord exprès.
          </p>
        </Section>

        <Section num="07" title="Utilisation acceptable" icon={ShieldCheck}>
          <p className="mb-2">Vous vous engagez à utiliser FacturFlow uniquement pour des activités légales. Il est notamment interdit de :</p>
          <ul className="space-y-1.5">
            {[
              "Émettre des factures frauduleuses ou pour des prestations fictives",
              "Usurper l'identité d'un tiers",
              "Tenter de contourner les mécanismes de sécurité",
              "Revendre l'accès au service à des tiers",
              "Utiliser le service pour des activités illicites",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section num="08" title="Disponibilité" icon={Wifi}>
          <p>
            FacturFlow s&apos;engage à maintenir une disponibilité du service de <strong>99,5%</strong> par
            mois (hors maintenance planifiée). Des interruptions peuvent survenir pour
            des opérations de maintenance, annoncées avec 48h de préavis si possible.
          </p>
        </Section>

        <Section num="09" title="Propriété des données" icon={Database}>
          <p>
            Vous restez propriétaire de l&apos;intégralité des données que vous saisissez
            (factures, clients, produits). FacturFlow agit en qualité de sous-traitant
            au sens du RGPD. Vous pouvez exporter vos données à tout moment et demander
            leur suppression à la résiliation.
          </p>
        </Section>

        <Section num="10" title="Limitation de responsabilité" icon={PenLine}>
          <p>
            FacturFlow est un outil de gestion, pas un conseil juridique, fiscal ou comptable.
            Vous restez seul responsable du respect de vos obligations légales et fiscales.
          </p>
          <p>
            En cas de dommage direct résultant d&apos;une défaillance prouvée, notre
            responsabilité est limitée aux montants effectivement payés au cours des 12
            derniers mois.
          </p>
        </Section>

        <Section num="11" title="Modification des conditions" icon={Scale}>
          <p>
            FacturFlow peut modifier ces conditions à tout moment. En cas de modification
            substantielle, vous serez informé par email avec un préavis de 30 jours.
            La poursuite de l&apos;utilisation vaut acceptation des nouvelles conditions.
          </p>
        </Section>

        <Section num="12" title="Droit applicable et litiges" icon={Globe}>
          <p>
            Ces CGU/CGV sont soumises au droit français. En cas de litige, une solution
            amiable sera recherchée en priorité. À défaut, les tribunaux de{" "}
            <span className="text-slate-400">[À COMPLÉTER]</span> seront compétents.
          </p>
          <p>
            Pour les consommateurs, recours possible via la plateforme de médiation UE :{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              ec.europa.eu/consumers/odr
            </a>.
          </p>
        </Section>
      </div>

      <div className="px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl">
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Des questions sur ces conditions ?{" "}
          <a href="mailto:contact@facturflow.fr" className="text-primary hover:underline">
            Contactez-nous
          </a>
        </p>
      </div>
    </>
  );
}

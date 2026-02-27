import { Metadata } from "next";
import {
  Shield, User, Target, Scale, Clock, Share2, UserCheck, Lock, Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Politique de confidentialité | FacturFlow",
  description: "Comment FacturFlow collecte, utilise et protège vos données personnelles — RGPD",
};

// ─── Composants partagés ─────────────────────────────────────────────────────

function Section({
  num,
  title,
  icon: Icon,
  children,
}: {
  num: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
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

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="font-medium text-slate-700 dark:text-slate-300 w-48 shrink-0 text-sm">{label}</span>
      <span className="text-slate-600 dark:text-slate-400 text-sm">{value}</span>
    </div>
  );
}

function SubprocessorBadge({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
      <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{name}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{detail}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PrivacyPage() {
  return (
    <>
      {/* En-tête */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-medium text-primary mb-2 uppercase tracking-wider">
          <Shield className="h-3.5 w-3.5" />
          RGPD — Règlement UE 2016/679
        </div>
        <h1 className="text-2xl font-bold text-gradient mb-1">Politique de confidentialité</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Dernière mise à jour : mars 2025
        </p>
      </div>

      <div className="px-8">
        <Section num="01" title="Responsable du traitement" icon={User}>
          <DataRow label="Société" value="FacturFlow" />
          <DataRow label="SIRET" value="[À COMPLÉTER]" />
          <DataRow label="Adresse" value="[À COMPLÉTER]" />
          <div className="flex items-start gap-3 py-2">
            <span className="font-medium text-slate-700 dark:text-slate-300 w-48 shrink-0 text-sm">Email DPO</span>
            <a href="mailto:privacy@facturflow.fr" className="text-primary hover:underline text-sm">
              privacy@facturflow.fr
            </a>
          </div>
        </Section>

        <Section num="02" title="Données collectées" icon={Target}>
          <p className="mb-3">Dans le cadre de l&apos;utilisation de FacturFlow, nous collectons :</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { cat: "Compte", detail: "Nom, email, mot de passe haché, téléphone (optionnel)" },
              { cat: "Entreprise", detail: "Raison sociale, SIRET/SIREN, TVA, adresse, logo" },
              { cat: "Facturation", detail: "Factures, devis, clients, montants, paiements" },
              { cat: "Connexion", detail: "Adresse IP, navigateur, horodatages (logs sécurité)" },
            ].map(({ cat, detail }) => (
              <div key={cat} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">{cat}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{detail}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section num="03" title="Finalités du traitement" icon={Target}>
          <ul className="space-y-1.5">
            {[
              "Fourniture et gestion du service de facturation",
              "Authentification et sécurisation de votre compte",
              "Envoi de factures, devis et emails transactionnels",
              "Gestion de votre abonnement FacturFlow",
              "Support client et réponse à vos demandes",
              "Amélioration du service (analyses anonymisées)",
              "Respect des obligations légales et comptables",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section num="04" title="Base légale" icon={Scale}>
          <div className="space-y-2">
            {[
              { base: "Exécution du contrat", usage: "Fourniture du service, gestion de l'abonnement" },
              { base: "Obligation légale", usage: "Conservation des données comptables (10 ans)" },
              { base: "Intérêt légitime", usage: "Sécurité, prévention de la fraude, amélioration du service" },
              { base: "Consentement", usage: "Emails marketing (si applicable)" },
            ].map(({ base, usage }) => (
              <div key={base} className="flex gap-3">
                <span className="font-semibold text-slate-700 dark:text-slate-300 w-44 shrink-0">{base}</span>
                <span>{usage}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section num="05" title="Durée de conservation" icon={Clock}>
          <DataRow label="Données de compte" value="Durée du contrat + 3 ans après résiliation" />
          <DataRow label="Données de facturation" value="10 ans (obligation comptable française)" />
          <DataRow label="Logs de connexion" value="12 mois" />
          <DataRow label="Données de support" value="2 ans après clôture du ticket" />
        </Section>

        <Section num="06" title="Sous-traitants" icon={Share2}>
          <p className="mb-3">Vos données ne sont jamais vendues. Elles peuvent être partagées avec :</p>
          <div className="space-y-2">
            <SubprocessorBadge name="Supabase" detail="Base de données — Union Européenne" />
            <SubprocessorBadge name="Vercel" detail="Hébergement — USA (clauses contractuelles types)" />
            <SubprocessorBadge name="Resend" detail="Emails transactionnels" />
            <SubprocessorBadge name="Stripe" detail="Paiements CB — certifié PCI-DSS" />
            <SubprocessorBadge name="PayPal" detail="Paiements PayPal" />
            <SubprocessorBadge name="GoCardless" detail="Prélèvements SEPA — agréé FCA" />
          </div>
        </Section>

        <Section num="07" title="Vos droits RGPD" icon={UserCheck}>
          <p className="mb-3">Vous disposez des droits suivants :</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { right: "Accès", detail: "Obtenir une copie de vos données" },
              { right: "Rectification", detail: "Corriger des données inexactes" },
              { right: "Effacement", detail: "Supprimer vos données (droit à l'oubli)" },
              { right: "Portabilité", detail: "Recevoir vos données en format standard" },
              { right: "Opposition", detail: "Vous opposer à certains traitements" },
              { right: "Limitation", detail: "Restreindre temporairement un traitement" },
            ].map(({ right, detail }) => (
              <div key={right} className="p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                <p className="font-semibold text-primary text-sm">{right}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{detail}</p>
              </div>
            ))}
          </div>
          <p className="mt-3">
            Pour exercer ces droits, écrivez à{" "}
            <a href="mailto:privacy@facturflow.fr" className="text-primary hover:underline font-medium">
              privacy@facturflow.fr
            </a>{" "}
            — réponse sous 30 jours. Vous pouvez aussi saisir la{" "}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              CNIL
            </a>.
          </p>
        </Section>

        <Section num="08" title="Sécurité" icon={Lock}>
          <p>
            FacturFlow met en œuvre des mesures techniques appropriées : chiffrement AES-256
            des données sensibles, HTTPS obligatoire, authentification forte (OAuth + OTP),
            accès restreint aux seuls besoins opérationnels.
          </p>
          <p>
            Les données de paiement (IBAN, numéros de carte) ne transitent jamais par nos
            serveurs — elles sont gérées directement par Stripe (PCI-DSS) et GoCardless.
          </p>
        </Section>

        <Section num="09" title="Contact" icon={Mail}>
          <p>
            Pour toute question relative à cette politique ou à vos données personnelles :{" "}
            <a href="mailto:privacy@facturflow.fr" className="text-primary hover:underline font-medium">
              privacy@facturflow.fr
            </a>
          </p>
        </Section>
      </div>

      <div className="px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl">
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Questions sur vos données ?{" "}
          <a href="mailto:privacy@facturflow.fr" className="text-primary hover:underline">
            privacy@facturflow.fr
          </a>
        </p>
      </div>
    </>
  );
}

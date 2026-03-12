import { Metadata } from "next";
import { Building2, Server, Copyright, Lock, Cookie, AlertTriangle, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Mentions légales | FacturNow",
  description: "Mentions légales de FacturNow — éditeur, hébergeur, propriété intellectuelle",
};

// ─── Composant section réutilisable ──────────────────────────────────────────

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
      {/* Numéro + icône */}
      <div className="flex flex-col items-center gap-2 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-xs font-bold text-slate-300 dark:text-slate-700">{num}</span>
      </div>
      {/* Contenu */}
      <div className="flex-1 pt-1">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">{title}</h2>
        <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Row info ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="font-medium text-slate-700 dark:text-slate-300 w-44 shrink-0">{label}</span>
      <span>{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MentionsLegalesPage() {
  return (
    <>
      {/* En-tête de page */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-medium text-primary mb-2 uppercase tracking-wider">
          <Building2 className="h-3.5 w-3.5" />
          Informations légales
        </div>
        <h1 className="text-2xl font-bold text-gradient mb-1">Mentions légales</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Dernière mise à jour : mars 2026
        </p>
      </div>

      {/* Sections */}
      <div className="px-8">
        <Section num="01" title="Éditeur du site" icon={Building2}>
          <InfoRow label="Nom" value="MD Tech Digital (éditeur de FacturNow)" />
          <InfoRow label="Forme juridique" value="Entreprise individuelle" />
          <InfoRow label="SIRET" value="10107710500019" />
          <InfoRow label="SIREN" value="101077105" />
          <InfoRow label="Adresse" value="7, Allée André Malraux 93430 villetaneuse" />
          <InfoRow
            label="Email"
            value={
              <a href="mailto:contact@facturnow.fr" className="text-primary hover:underline">
                contact@facturnow.fr
              </a>
            }
          />
          <InfoRow label="Directeur de publication" value="Didou Wilfrid" />
        </Section>

        <Section num="02" title="Hébergement" icon={Server}>
          <InfoRow label="Hébergeur" value="Vercel Inc." />
          <InfoRow label="Adresse" value="340 Pine Street, Suite 701, San Francisco, CA 94104, USA" />
          <InfoRow
            label="Site"
            value={
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                vercel.com
              </a>
            }
          />
          <InfoRow label="Base de données" value="Supabase (Union Européenne)" />
        </Section>

        <Section num="03" title="Propriété intellectuelle" icon={Copyright}>
          <p>
            L&apos;ensemble du contenu de ce site (textes, images, logos, code source, interface)
            est la propriété exclusive de FacturNow, protégé par le droit français et
            international de la propriété intellectuelle.
          </p>
          <p>
            Toute reproduction, même partielle, est strictement interdite sans autorisation
            préalable écrite de FacturNow.
          </p>
        </Section>

        <Section num="04" title="Données personnelles" icon={Lock}>
          <p>
            Le traitement de vos données personnelles est détaillé dans notre{" "}
            <a href="/public/legal/privacy" className="text-primary hover:underline font-medium">
              Politique de confidentialité
            </a>. Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès,
            de rectification, d&apos;effacement et de portabilité.
          </p>
          <p>
            Pour exercer vos droits :{" "}
            <a href="mailto:contact@facturnow.fr" className="text-primary hover:underline">
              contact@facturnow.fr
            </a>
          </p>
        </Section>

        <Section num="05" title="Cookies" icon={Cookie}>
          <p>
            FacturNow utilise uniquement des cookies strictement nécessaires au fonctionnement
            du service (session d&apos;authentification). Aucun cookie publicitaire ou de
            tracking tiers n&apos;est déposé sans votre consentement.
          </p>
        </Section>

        <Section num="06" title="Limitation de responsabilité" icon={AlertTriangle}>
          <p>
            FacturNow s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées
            mais ne peut en garantir l&apos;exhaustivité. L&apos;utilisateur reconnaît utiliser
            le service sous sa responsabilité exclusive.
          </p>
        </Section>

        <Section num="07" title="Droit applicable" icon={Globe}>
          <p>
            Les présentes mentions légales sont soumises au droit français. En cas de litige,
            et après tentative de résolution amiable, les tribunaux français seront seuls compétents.
          </p>
        </Section>
      </div>

      {/* Bas de page */}
      <div className="px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl">
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Des questions sur ces mentions ?{" "}
          <a href="mailto:contact@facturnow.fr" className="text-primary hover:underline">
            Contactez-nous
          </a>
        </p>
      </div>
    </>
  );
}

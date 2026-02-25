"use client";

// Aperçu live d'une facture — reproduction fidèle du style InvoicePreviewStatic
// Les couleurs violet sont remplacées par le themeColor dynamique

import Image from "next/image";
import { colorToGradient, getFontFamily } from "./theme-config";

// ─── Props ────────────────────────────────────────────────────────────────────

interface InvoicePreviewProps {
  themeColor: string;   // hex 6 chiffres ex: "#7c3aed"
  companyFont: string;  // id font
  companyName: string;
  logo: string | null;  // base64 ou URL
  mini?: boolean;       // version compacte sticky mobile
}

// ─── Fausses données ──────────────────────────────────────────────────────────

const FAKE_LINES = [
  { desc: "Développement interface web", qty: "40h", unit: "80,00 €", total: "3 200,00 €" },
  { desc: "Intégration API paiement",    qty: "8h",  unit: "80,00 €", total: "640,00 €" },
  { desc: "Déploiement & mise en prod.", qty: "1",   unit: "250,00 €", total: "250,00 €" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convertit un hex 6-digit + alpha (0-255) en rgba CSS */
function hexAlpha(hex: string, alpha: string) {
  // Ajoute le suffixe alpha hex directement (8-digit hex, supporté CSS modern)
  return hex + alpha;
}

// ─── Version mini (sticky mobile) ────────────────────────────────────────────

function InvoicePreviewMini({ themeColor, companyFont, companyName, logo }: Omit<InvoicePreviewProps, "mini">) {
  const gradient    = colorToGradient(themeColor);
  const fontFamily  = getFontFamily(companyFont);
  const displayName = companyName.trim() || "Votre Entreprise";
  const bgTint      = hexAlpha(themeColor, "12"); // ~7%
  const borderTint  = hexAlpha(themeColor, "33"); // ~20%

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200 w-full">

      {/* Header */}
      <div style={{ background: gradient }} className="p-2.5 text-white">
        <div className="flex items-center gap-2">
          {/* Gauche : type + numéro */}
          <div className="flex-1">
            <p className="text-sm font-bold tracking-wide">FACTURE</p>
            <p className="text-[9px] text-white/80">N° FAC-2025-0042</p>
          </div>

          {/* Centre : logo + nom entreprise */}
          <div className="flex-1 flex flex-col items-center gap-1">
            {logo && (
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white/20">
                <Image src={logo} alt="Logo" fill className="object-contain p-0.5" unoptimized />
              </div>
            )}
            <p style={{ fontFamily }} className="text-[11px] font-bold text-white text-center leading-tight break-words max-w-[100px]">
              {displayName}
            </p>
          </div>

          {/* Droite : vide pour équilibrer */}
          <div className="flex-1" />
        </div>
      </div>

      {/* Corps */}
      <div className="p-2 space-y-2">
        {/* Tableau réduit */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: bgTint }}>
                <th className="text-left p-1.5 text-[8px] font-medium uppercase tracking-wide" style={{ color: themeColor }}>Description</th>
                <th className="text-right p-1.5 text-[8px] font-medium uppercase tracking-wide" style={{ color: themeColor }}>Total HT</th>
              </tr>
            </thead>
            <tbody>
              {FAKE_LINES.map((l, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="p-1.5 text-[8px] text-slate-700 truncate max-w-[120px]">{l.desc}</td>
                  <td className="p-1.5 text-[8px] text-right font-medium" style={{ color: themeColor }}>{l.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total rapide */}
        <div className="flex justify-end">
          <div className="rounded-lg p-2 border w-40 space-y-1" style={{ backgroundColor: bgTint, borderColor: borderTint }}>
            <div className="flex justify-between text-[8px]">
              <span style={{ color: themeColor }}>Sous-total HT :</span>
              <span className="text-slate-900 font-medium">4 090,00 €</span>
            </div>
            <div className="flex justify-between text-[8px] font-bold border-t pt-1" style={{ borderColor: borderTint }}>
              <span className="text-slate-900">Total TTC :</span>
              <span style={{ color: themeColor }}>4 908,00 €</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Version complète (desktop) ───────────────────────────────────────────────

function InvoicePreviewFull({ themeColor, companyFont, companyName, logo }: Omit<InvoicePreviewProps, "mini">) {
  const gradient    = colorToGradient(themeColor);
  const fontFamily  = getFontFamily(companyFont);
  const displayName = companyName.trim() || "Votre Entreprise";
  const bgTint      = hexAlpha(themeColor, "12"); // ~7%
  const bgTint2     = hexAlpha(themeColor, "1a"); // ~10%
  const borderTint  = hexAlpha(themeColor, "33"); // ~20%

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-5">

      {/* ── Header gradient ── */}
      <div style={{ background: gradient }} className="rounded-lg p-4 text-white">
        <div className="flex items-start gap-4">
          {/* Gauche : type + numéro */}
          <div className="flex-1">
            <h1 className="text-lg font-bold mb-1">FACTURE</h1>
            <p className="text-white/90 text-xs">N° FAC-2025-0042</p>
          </div>

          {/* Centre : logo + nom entreprise */}
          <div className="flex-1 flex flex-col items-center gap-2">
            {logo && (
              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-white/20">
                <Image src={logo} alt="Logo" fill className="object-contain p-1" unoptimized />
              </div>
            )}
            <p style={{ fontFamily }} className="text-sm font-bold text-white text-center leading-tight break-words max-w-[140px]">
              {displayName}
            </p>
          </div>

          {/* Droite : dates */}
          <div className="flex-1 flex flex-col items-end space-y-0.5">
            <p className="text-[10px] text-white/90">Date : 25/02/2025</p>
            <p className="text-[10px] text-white/90">Échéance : 25/03/2025</p>
          </div>
        </div>
      </div>

      {/* ── Émetteur / Destinataire ── */}
      <div className="grid grid-cols-2 gap-5">
        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide" style={{ color: themeColor }}>
            Émetteur
          </h3>
          <p className="text-xs font-medium text-slate-900">Votre Entreprise</p>
          <p className="text-[10px] text-slate-500 mt-0.5">12 rue de la Paix, 75001 Paris</p>
          <p className="text-[10px] text-slate-500">SIRET : 123 456 789 00012</p>
          <p className="text-[10px] text-slate-500">contact@votre-entreprise.fr</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide" style={{ color: themeColor }}>
            Destinataire
          </h3>
          <p className="text-xs font-medium text-slate-900">Acme Corp.</p>
          <p className="text-[10px] text-slate-500 mt-0.5">45 avenue des Champs, 69000 Lyon</p>
          <p className="text-[10px] text-slate-500">compta@acme.fr</p>
        </div>
      </div>

      <div className="h-px bg-slate-200" />

      {/* ── Tableau de lignes ── */}
      <div>
        <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide" style={{ color: themeColor }}>
          Détails
        </h3>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead style={{ backgroundColor: bgTint2 }}>
              <tr>
                <th className="text-left p-2 text-[9px] font-medium uppercase tracking-wide" style={{ color: themeColor }}>Description</th>
                <th className="text-right p-2 text-[9px] font-medium uppercase tracking-wide" style={{ color: themeColor }}>Qté</th>
                <th className="text-right p-2 text-[9px] font-medium uppercase tracking-wide" style={{ color: themeColor }}>Prix unit.</th>
                <th className="text-right p-2 text-[9px] font-medium uppercase tracking-wide" style={{ color: themeColor }}>Total HT</th>
              </tr>
            </thead>
            <tbody>
              {FAKE_LINES.map((l, i) => (
                <tr key={i} className="border-t border-slate-200 bg-slate-50/50">
                  <td className="p-2 text-[10px] text-slate-900">{l.desc}</td>
                  <td className="p-2 text-[10px] text-right text-slate-900">{l.qty}</td>
                  <td className="p-2 text-[10px] text-right text-slate-900">{l.unit}</td>
                  <td className="p-2 text-[10px] text-right font-medium" style={{ color: themeColor }}>{l.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="h-px bg-slate-200" />

      {/* ── Totaux ── */}
      <div className="flex justify-end">
        <div className="w-56 space-y-2 rounded-lg p-3 border" style={{ backgroundColor: bgTint, borderColor: borderTint }}>
          <div className="flex justify-between text-xs">
            <span style={{ color: themeColor }}>Sous-total HT :</span>
            <span className="text-slate-900 font-medium">4 090,00 €</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: themeColor }}>TVA (20%) :</span>
            <span className="text-slate-900 font-medium">818,00 €</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-2" style={{ borderColor: borderTint }}>
            <span className="text-slate-900 text-sm">Total TTC :</span>
            <span className="text-sm" style={{ color: themeColor }}>4 908,00 €</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────

export function InvoicePreview({ themeColor, companyFont, companyName, logo, mini = false }: InvoicePreviewProps) {
  if (mini) {
    return <InvoicePreviewMini themeColor={themeColor} companyFont={companyFont} companyName={companyName} logo={logo} />;
  }
  return <InvoicePreviewFull themeColor={themeColor} companyFont={companyFont} companyName={companyName} logo={logo} />;
}

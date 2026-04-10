"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";
import { type RecurringFormData } from "@/lib/validations/recurring";
import { useClients } from "@/hooks/use-clients";
import {
  DEFAULT_THEME,
  getFontFamily,
  getFontWeight,
} from "@/components/appearance/theme-config";
import { useAppearance } from "@/hooks/use-appearance";
import { formatCurrency } from "@/lib/utils/calculs-facture";

// ─── Props ────────────────────────────────────────────────────────────────────

interface RecurringPreviewProps {
  form: UseFormReturn<RecurringFormData>;
  themeColor?: string;
  companyFont?: string;
  companyLogo?: string | null;
  companyName?: string;
  companyInfo?: {
    name: string;
    email?: string;
    address?: string;
    city?: string;
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: "Hebdo",
  BIWEEKLY: "Bi-hebdo",
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  SEMIYEARLY: "Semestriel",
  YEARLY: "Annuel",
};

/** Couleur du badge fréquence */
const FREQUENCY_BADGE_COLORS: Record<string, string> = {
  WEEKLY: "#f97316",
  BIWEEKLY: "#f59e0b",
  MONTHLY: "#7c3aed",
  QUARTERLY: "#2563eb",
  SEMIYEARLY: "#0d9488",
  YEARLY: "#4338ca",
};

/** Formate une date ISO en dd/mm/yyyy */
function formatDateFR(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR");
}

/** Formate un montant (devise injectée depuis le hook useAppearance) */
function makeFormatEuro(currency: string) {
  return (value: number): string => formatCurrency(value, currency);
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function RecurringPreview({
  form,
  themeColor = DEFAULT_THEME.primary,
  companyFont = "inter",
  companyLogo,
  companyName = "",
  companyInfo,
}: RecurringPreviewProps) {
  // useWatch pour réagir aux changements en temps réel sans re-render excessif
  const clientId = useWatch({ control: form.control, name: "clientId" });
  const label = useWatch({ control: form.control, name: "label" });
  const frequency = useWatch({ control: form.control, name: "frequency" });
  const startDate = useWatch({ control: form.control, name: "startDate" });
  const endDate = useWatch({ control: form.control, name: "endDate" });
  const lines = useWatch({ control: form.control, name: "lines" });
  const notes = useWatch({ control: form.control, name: "notes" });

  // Résoudre le nom du client depuis l'ID
  const { data: clients = [] } = useClients();
  const selectedClient = clients.find((c) => c.id === clientId);

  const clientName = selectedClient
    ? selectedClient.companyName ||
      [selectedClient.firstName, selectedClient.lastName].filter(Boolean).join(" ") ||
      selectedClient.email
    : null;

  // Calculs des totaux
  const subtotalHT = lines.reduce((sum, line) => {
    return sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
  }, 0);

  const taxTotal = lines.reduce((sum, line) => {
    const ht = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
    return sum + ht * ((Number(line.vatRate) || 0) / 100);
  }, 0);

  const totalTTC = subtotalHT + taxTotal;

  // Styles dynamiques basés sur themeColor
  const fontFamily = getFontFamily(companyFont);
  const fontWeight = getFontWeight(companyFont);
  const { currency } = useAppearance();
  const formatEuro = makeFormatEuro(currency);
  const badgeColor = FREQUENCY_BADGE_COLORS[frequency] ?? themeColor;
  const freqLabel = FREQUENCY_LABELS[frequency] ?? frequency;

  return (
    <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden">
      {/* Bandeau "Aperçu temps réel" */}
      <div
        className="flex items-center justify-between px-4 py-2 text-white text-xs font-medium"
        style={{ backgroundColor: themeColor }}
      >
        <span>Aperçu temps réel</span>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ backgroundColor: badgeColor + "33", color: "white", border: `1px solid ${badgeColor}` }}
        >
          {freqLabel}
        </span>
      </div>

      {/* Corps du preview */}
      <div className="p-5 space-y-4 text-sm">

        {/* ─── Header document ───────────────────────────────────────────── */}
        <div
          className="rounded-xl p-4 flex items-center justify-between gap-3"
          style={{ backgroundColor: themeColor + "15" }}
        >
          {/* Logo + nom société */}
          <div className="flex items-center gap-3 min-w-0">
            {companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={companyLogo}
                alt="Logo"
                className="size-10 rounded-lg object-contain shrink-0"
              />
            ) : (
              <div
                className="size-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ backgroundColor: themeColor }}
              >
                {(companyInfo?.name || companyName || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p
                className="font-bold truncate text-slate-900 dark:text-slate-100"
                style={{ fontFamily, fontWeight }}
              >
                {companyInfo?.name || companyName || "Votre entreprise"}
              </p>
              {companyInfo?.email && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {companyInfo.email}
                </p>
              )}
            </div>
          </div>

          {/* Titre + fréquence */}
          <div className="text-right shrink-0">
            <p
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: themeColor }}
            >
              Facture récurrente
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {label || "Sans titre"}
            </p>
          </div>
        </div>

        {/* ─── Émetteur / Client ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          {/* Émetteur */}
          <div className="space-y-0.5">
            <p
              className="text-[10px] font-semibold uppercase tracking-wide mb-1"
              style={{ color: themeColor }}
            >
              De
            </p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {companyInfo?.name || companyName || "Votre entreprise"}
            </p>
            {companyInfo?.address && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {companyInfo.address}
              </p>
            )}
            {companyInfo?.city && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {companyInfo.city}
              </p>
            )}
            {companyInfo?.email && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {companyInfo.email}
              </p>
            )}
          </div>

          {/* Client */}
          <div className="space-y-0.5">
            <p
              className="text-[10px] font-semibold uppercase tracking-wide mb-1"
              style={{ color: themeColor }}
            >
              Pour
            </p>
            {clientName ? (
              <>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {clientName}
                </p>
                {selectedClient?.email && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedClient.email}
                  </p>
                )}
              </>
            ) : (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                Aucun client sélectionné
              </p>
            )}
          </div>
        </div>

        {/* ─── Planification ────────────────────────────────────────────── */}
        <div
          className="rounded-lg p-3 grid grid-cols-2 gap-2"
          style={{ backgroundColor: themeColor + "0d" }}
        >
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Début</p>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
              {startDate ? formatDateFR(startDate) : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Fin</p>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
              {endDate ? formatDateFR(endDate) : "Indéfinie"}
            </p>
          </div>
        </div>

        {/* ─── Tableau des lignes ────────────────────────────────────────── */}
        <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-violet-400/20">
          {/* Header tableau */}
          <div
            className="grid grid-cols-12 gap-1 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: themeColor + "1a",
              color: themeColor,
            }}
          >
            <span className="col-span-5">Description</span>
            <span className="col-span-2 text-center">Qté</span>
            <span className="col-span-2 text-right">P.U. HT</span>
            <span className="col-span-3 text-right">Total HT</span>
          </div>

          {/* Lignes */}
          {lines.length > 0 && lines.some((l) => l.description) ? (
            lines
              .filter((l) => l.description)
              .map((line, i) => {
                const totalHT =
                  (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
                return (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-1 px-3 py-2 text-[11px] border-t border-slate-100 dark:border-violet-400/10"
                  >
                    <span className="col-span-5 text-slate-700 dark:text-slate-300 truncate">
                      {line.description}
                    </span>
                    <span className="col-span-2 text-center text-slate-600 dark:text-slate-400">
                      {line.quantity}
                    </span>
                    <span className="col-span-2 text-right text-slate-600 dark:text-slate-400">
                      {formatEuro(Number(line.unitPrice) || 0)}
                    </span>
                    <span className="col-span-3 text-right font-medium text-slate-800 dark:text-slate-200">
                      {formatEuro(totalHT)}
                    </span>
                  </div>
                );
              })
          ) : (
            <div className="px-3 py-4 text-center text-[11px] text-slate-400 dark:text-slate-500 italic">
              Aucune prestation renseignée
            </div>
          )}
        </div>

        {/* ─── Totaux ───────────────────────────────────────────────────── */}
        <div
          className="rounded-lg p-3 space-y-1.5"
          style={{ backgroundColor: themeColor + "0d" }}
        >
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Sous-total HT</span>
            <span>{formatEuro(subtotalHT)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>TVA</span>
            <span>{formatEuro(taxTotal)}</span>
          </div>
          <div className="h-px bg-slate-200 dark:bg-violet-400/20 my-1" />
          <div className="flex justify-between text-sm font-bold">
            <span style={{ color: themeColor }}>Total TTC / échéance</span>
            <span style={{ color: themeColor }}>{formatEuro(totalTTC)}</span>
          </div>
        </div>

        {/* ─── Notes ────────────────────────────────────────────────────── */}
        {notes && (
          <div className="rounded-lg p-3 border border-slate-100 dark:border-violet-400/15 bg-slate-50/50 dark:bg-[#221c48]/30">
            <p
              className="text-[10px] font-semibold uppercase tracking-wide mb-1"
              style={{ color: themeColor }}
            >
              Notes
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
              {notes}
            </p>
          </div>
        )}

        {/* ─── Footer document ──────────────────────────────────────────── */}
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 pt-1">
          Document généré par FacturNow
        </p>
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { Eye } from "lucide-react";
import type { CompanyInfo } from "@/lib/validations/invoice";

interface DepositFormData {
  clientId: string;
  amount: number;
  vatRate: 0 | 5.5 | 10 | 20;
  date: string;
  dueDate: string;
  description: string;
  notes?: string;
  paymentLinks: {
    stripe: boolean;
    paypal: boolean;
    sepa: boolean;
  };
}

interface DepositPreviewProps {
  form: UseFormReturn<DepositFormData>;
  depositNumber: string;
  companyInfo: CompanyInfo | null;
}

export function DepositPreview({ form, depositNumber, companyInfo }: DepositPreviewProps) {
  // Watch tous les champs pour la réactivité temps réel
  const formData = useWatch({ control: form.control });

  // Calculs automatiques
  const calculations = useMemo(() => {
    const subtotal = Number(formData.amount) || 0;
    // ?? 20 : gère le cas 0% (exonéré) qui serait falsy avec ||
    const rate = formData.vatRate ?? 20;
    const taxAmount = (subtotal * Number(rate)) / 100;
    const total = subtotal + taxAmount;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }, [formData.amount, formData.vatRate]);

  return (
    <div className="rounded-2xl border border-slate-300/80 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/75 dark:bg-[#1a1438] backdrop-blur-lg overflow-hidden">
      {/* Header avec bandeau coloré */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-500 p-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Eye className="size-4 text-white" />
          Aperçu temps réel
        </h2>
      </div>

      {/* Preview content */}
      <div className="p-6 overflow-auto max-h-[calc(100vh-200px)]">
        <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6 space-y-6 shadow-sm">
          {/* En-tête du document avec bandeau coloré */}
          <div className="bg-linear-to-r from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-500 rounded-lg p-4 text-white mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold mb-1">
                  DEMANDE D&apos;ACOMPTE
                </h1>
                <p className="text-white/90 text-sm">
                  N° {depositNumber}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="text-white/90">
                  Date : {formData.date ? new Date(formData.date).toLocaleDateString('fr-FR') : "—"}
                </p>
                <p className="text-white/90">
                  Échéance : {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString('fr-FR') : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Émetteur et destinataire */}
          <div className="grid grid-cols-2 gap-6">
            {/* Émetteur */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
                Émetteur
              </h3>
              {companyInfo ? (
                <div className="text-sm space-y-0.5">
                  <p className="font-medium text-slate-900 dark:text-slate-50">{companyInfo.name}</p>
                  <p className="text-slate-600 dark:text-slate-400">{companyInfo.address}</p>
                  <p className="text-slate-600 dark:text-slate-400">{companyInfo.zipCode} {companyInfo.city}</p>
                  <p className="text-slate-600 dark:text-slate-400">SIRET : {companyInfo.siret}</p>
                  <p className="text-slate-600 dark:text-slate-400">{companyInfo.email}</p>
                  {companyInfo.phone && (
                    <p className="text-slate-600 dark:text-slate-400">{companyInfo.phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 italic text-sm">Informations manquantes</p>
              )}
            </div>

            {/* Destinataire */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
                Destinataire
              </h3>
              {formData.clientId ? (
                <div className="text-sm space-y-0.5">
                  <p className="text-slate-400 italic">Client sélectionné</p>
                  {/* TODO: Afficher les infos du client sélectionné */}
                </div>
              ) : (
                <p className="text-slate-400 italic text-sm">Aucun client sélectionné</p>
              )}
            </div>
          </div>

          {/* Détails de l'acompte */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-3 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
              Détails
            </h3>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                      Description
                    </th>
                    <th className="text-right p-3 text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                      Montant HT
                    </th>
                    <th className="text-right p-3 text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                      TVA
                    </th>
                    <th className="text-right p-3 text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                      Total TTC
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                    <td className="p-3 text-sm text-slate-900 dark:text-slate-50">
                      {formData.description || "Description de l'acompte"}
                    </td>
                    <td className="p-3 text-sm text-right text-slate-900 dark:text-slate-50">
                      {calculations.subtotal > 0 ? calculations.subtotal.toFixed(2) : "0,00"} €
                    </td>
                    <td className="p-3 text-sm text-right text-slate-900 dark:text-slate-50">
                      {calculations.taxAmount > 0 ? calculations.taxAmount.toFixed(2) : "0,00"} €
                    </td>
                    <td className="p-3 text-sm text-right font-medium text-violet-600 dark:text-violet-400">
                      {calculations.total > 0 ? calculations.total.toFixed(2) : "0,00"} €
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 rounded-lg p-4 border border-violet-200/50 dark:border-violet-500/20">
              <div className="flex justify-between text-sm">
                <span className="text-violet-700 dark:text-violet-300">Sous-total HT :</span>
                <span className="text-slate-900 dark:text-slate-50 font-medium">{calculations.subtotal > 0 ? calculations.subtotal.toFixed(2) : "0,00"} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-violet-700 dark:text-violet-300">TVA ({formData.vatRate ?? 20}%) :</span>
                <span className="text-slate-900 dark:text-slate-50 font-medium">{calculations.taxAmount > 0 ? calculations.taxAmount.toFixed(2) : "0,00"} €</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-violet-200 dark:border-violet-500/30 pt-2">
                <span className="text-slate-900 dark:text-slate-50">Total TTC :</span>
                <span className="text-violet-600 dark:text-violet-400">{calculations.total > 0 ? calculations.total.toFixed(2) : "0,00"} €</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {formData.notes && formData.notes.trim() && (
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
                Notes
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {formData.notes}
                </p>
              </div>
            </div>
          )}

          {/* Liens de paiement */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-3 text-xs uppercase tracking-wide text-violet-600 dark:text-violet-400">
              Modalités de paiement
            </h3>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p>• Paiement attendu avant le {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString('fr-FR') : "—"}</p>
              <p>• Liens de paiement sécurisés inclus dans l&apos;email</p>
              
              {(formData.paymentLinks?.stripe || formData.paymentLinks?.paypal || formData.paymentLinks?.sepa) && (
                <div className="mt-3 space-y-2">
                  {formData.paymentLinks?.stripe && (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <div className="w-3 h-3 rounded bg-blue-500"></div>
                      <span>Carte bancaire (Stripe)</span>
                    </div>
                  )}
                  {formData.paymentLinks?.paypal && (
                    <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                      <div className="w-3 h-3 rounded bg-linear-to-r from-blue-500 to-yellow-500"></div>
                      <span>PayPal</span>
                    </div>
                  )}
                  {formData.paymentLinks?.sepa && (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <div className="w-3 h-3 rounded bg-emerald-500"></div>
                      <span>Prélèvement SEPA (GoCardless)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
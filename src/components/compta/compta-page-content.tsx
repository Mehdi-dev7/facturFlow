"use client";

// src/components/compta/compta-page-content.tsx
// Page Comptabilité — exports FEC, URSSAF, rapport annuel, journal mensuel + email comptable

import { useState, useCallback } from "react";
import {
  Calculator,
  Download,
  FileText,
  FileSpreadsheet,
  CalendarDays,
  BarChart3,
  Mail,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FeatureGate } from "@/components/subscription/feature-gate";
import {
  exportFec,
  exportMonthlyReport,
  getUrssafData,
  getAnnualReportData,
  updateAccountantEmail,
} from "@/lib/actions/accounting";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ─── Props ───────────────────────────────────────────────────────────────────

interface ComptaPageContentProps {
  plan: string;
  effectivePlan: string;
  initialAccountantEmail: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getYearOptions() {
  const current = new Date().getFullYear();
  return [current, current - 1, current - 2];
}

function getMonthOptions() {
  return Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: format(new Date(2026, i, 1), "MMMM", { locale: fr }),
  }));
}

// ─── Téléchargement helper ─────────────────────────────────────────────────

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Export card ──────────────────────────────────────────────────────────────

function ExportCard({
  title,
  description,
  icon: Icon,
  iconColor,
  iconBg,
  loading,
  onExport,
  children,
}: {
  title: string;
  description: string;
  icon: typeof FileText;
  iconColor: string;
  iconBg: string;
  loading: boolean;
  onExport: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/80 dark:bg-[#1a1438] backdrop-blur-lg p-5">
      <div className="flex items-start gap-4">
        {/* Icône */}
        <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${iconBg} shrink-0`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {description}
          </p>

          {/* Sélecteur additionnel (mois pour journal) */}
          {children && <div className="mt-3">{children}</div>}

          {/* Bouton télécharger */}
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={onExport}
            className="mt-3 cursor-pointer gap-2 rounded-xl border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-md transition-all dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-900/40 dark:hover:border-emerald-400/60 dark:shadow-emerald-950/30"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Télécharger
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ComptaPageContent({
  plan,
  effectivePlan,
  initialAccountantEmail,
}: ComptaPageContentProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth());
  const [loadingExport, setLoadingExport] = useState<string | null>(null);
  const years = getYearOptions();
  const months = getMonthOptions();

  // Email comptable
  const [accountantEmail, setAccountantEmail] = useState(initialAccountantEmail ?? "");
  const [savingEmail, setSavingEmail] = useState(false);

  // ─── Export handlers ────────────────────────────────────────────────────────

  const handleExportFec = useCallback(async () => {
    setLoadingExport("fec");
    try {
      const result = await exportFec(year);
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Erreur lors de l'export FEC");
        return;
      }
      downloadFile(result.data, result.filename!, "text/plain");
      toast.success("FEC téléchargé");
    } catch {
      toast.error("Erreur lors de l'export FEC");
    } finally {
      setLoadingExport(null);
    }
  }, [year]);

  const handleExportUrssaf = useCallback(async () => {
    setLoadingExport("urssaf");
    try {
      const result = await getUrssafData(year);
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Erreur lors de l'export URSSAF");
        return;
      }
      // Chargement dynamique pour ne pas alourdir le bundle initial
      const { downloadUrssafPdf } = await import("@/lib/pdf/accounting/urssaf-pdf");
      await downloadUrssafPdf(result.data);
      toast.success("Récap URSSAF téléchargé");
    } catch {
      toast.error("Erreur lors de l'export URSSAF");
    } finally {
      setLoadingExport(null);
    }
  }, [year]);

  const handleExportAnnual = useCallback(async () => {
    setLoadingExport("annual");
    try {
      const result = await getAnnualReportData(year);
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Erreur lors de l'export");
        return;
      }
      // Chargement dynamique pour ne pas alourdir le bundle initial
      const { downloadRapportAnnuelPdf } = await import("@/lib/pdf/accounting/rapport-annuel-pdf");
      await downloadRapportAnnuelPdf(result.data);
      toast.success("Rapport annuel téléchargé");
    } catch {
      toast.error("Erreur lors de l'export du rapport annuel");
    } finally {
      setLoadingExport(null);
    }
  }, [year]);

  const handleExportMonthly = useCallback(async () => {
    setLoadingExport("monthly");
    try {
      const result = await exportMonthlyReport(year, month);
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Erreur lors de l'export");
        return;
      }
      downloadFile(result.data, result.filename!, "text/csv");
      toast.success("Journal mensuel téléchargé");
    } catch {
      toast.error("Erreur lors de l'export du journal mensuel");
    } finally {
      setLoadingExport(null);
    }
  }, [year, month]);

  // ─── Email comptable handler ────────────────────────────────────────────────

  const handleSaveEmail = useCallback(async () => {
    setSavingEmail(true);
    try {
      const result = await updateAccountantEmail(accountantEmail.trim());
      if (!result.success) {
        toast.error(result.error ?? "Erreur lors de la sauvegarde");
        return;
      }
      toast.success(
        accountantEmail.trim()
          ? "Email comptable enregistré"
          : "Email comptable supprimé"
      );
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSavingEmail(false);
    }
  }, [accountantEmail]);

  return (
    <div>
      {/* Header — titre + sélecteur année */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <Calculator className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl xs:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Comptabilité
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Exports comptables et déclarations
            </p>
          </div>
        </div>

        {/* Sélecteur année */}
        <Select
          value={String(year)}
          onValueChange={(v) => setYear(Number(v))}
        >
          <SelectTrigger className="w-32 bg-white dark:bg-slate-900 border-slate-200 dark:border-violet-400 dark:text-violet-400">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-linear-to-b from-violet-100 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/30 rounded-xl shadow-xl dark:shadow-violet-950/50 z-50">
            {years.map((y) => (
              <SelectItem
                key={y}
                value={String(y)}
                className="cursor-pointer rounded-lg transition-colors text-xs dark:text-slate-100 hover:bg-violet-200/70 data-[highlighted]:bg-violet-200/70 dark:hover:bg-violet-500/25 dark:data-[highlighted]:bg-violet-500/25 data-[highlighted]:text-violet-900 dark:data-[highlighted]:text-slate-50"
              >
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cartes d'export — grid 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* FEC */}
        <FeatureGate feature="fec_export" effectivePlan={effectivePlan} plan={plan}>
          <ExportCard
            title="Export FEC"
            description="Fichier des Écritures Comptables — norme DGFiP (tab-separated .txt)"
            icon={FileText}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            loading={loadingExport === "fec"}
            onExport={handleExportFec}
          />
        </FeatureGate>

        {/* URSSAF */}
        <FeatureGate feature="annual_report" effectivePlan={effectivePlan} plan={plan}>
          <ExportCard
            title="Récap URSSAF"
            description="CA encaissé par trimestre — déclaration trimestrielle (.pdf)"
            icon={FileSpreadsheet}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            loading={loadingExport === "urssaf"}
            onExport={handleExportUrssaf}
          />
        </FeatureGate>

        {/* Rapport annuel */}
        <FeatureGate feature="annual_report" effectivePlan={effectivePlan} plan={plan}>
          <ExportCard
            title="Rapport annuel"
            description="Synthèse CA, TVA, taux d'encaissement, avoirs, client principal (.pdf)"
            icon={BarChart3}
            iconColor="text-violet-600 dark:text-violet-400"
            iconBg="bg-violet-100 dark:bg-violet-900/30"
            loading={loadingExport === "annual"}
            onExport={handleExportAnnual}
          />
        </FeatureGate>

        {/* Journal mensuel — avec sélecteur de mois */}
        <FeatureGate feature="monthly_accounting_report" effectivePlan={effectivePlan} plan={plan}>
          <ExportCard
            title="Journal mensuel"
            description="Journal des ventes du mois — factures avec détails"
            icon={CalendarDays}
            iconColor="text-amber-600 dark:text-amber-400"
            iconBg="bg-amber-100 dark:bg-amber-900/30"
            loading={loadingExport === "monthly"}
            onExport={handleExportMonthly}
          >
            <Select
              value={String(month)}
              onValueChange={(v) => setMonth(Number(v))}
            >
              <SelectTrigger className="w-44 bg-white dark:bg-slate-900 border-slate-200 dark:border-violet-400 dark:text-violet-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-linear-to-b from-violet-100 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/30 rounded-xl shadow-xl dark:shadow-violet-950/50 z-50">
                {months.map((m) => (
                  <SelectItem
                    key={m.value}
                    value={m.value}
                    className="cursor-pointer rounded-lg transition-colors text-xs capitalize dark:text-slate-100 hover:bg-violet-200/70 data-[highlighted]:bg-violet-200/70 dark:hover:bg-violet-500/25 dark:data-[highlighted]:bg-violet-500/25 data-[highlighted]:text-violet-900 dark:data-[highlighted]:text-slate-50"
                  >
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ExportCard>
        </FeatureGate>
      </div>

      {/* Section email comptable */}
      <FeatureGate feature="monthly_accounting_report" effectivePlan={effectivePlan} plan={plan}>
        <div className="rounded-2xl border border-slate-200 dark:border-violet-500/20 shadow-lg shadow-slate-200/50 dark:shadow-violet-950/40 bg-white/80 dark:bg-[#1a1438] backdrop-blur-lg p-5">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
              <Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Email comptable
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Recevez un récap mensuel (FEC + journal) chaque 1er du mois, envoyé directement à votre comptable.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-3">
                <Input
                  type="email"
                  placeholder="comptable@cabinet.fr"
                  value={accountantEmail}
                  onChange={(e) => setAccountantEmail(e.target.value)}
                  className="w-full sm:w-72 bg-white dark:bg-slate-900 border-slate-200 dark:border-violet-400/30"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={savingEmail}
                  onClick={handleSaveEmail}
                  className="cursor-pointer gap-2 rounded-xl border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-md transition-all dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-900/40 dark:hover:border-emerald-400/60 dark:shadow-emerald-950/30"
                >
                  {savingEmail ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Enregistrer
                </Button>
              </div>

              {accountantEmail.trim() && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                  Le FEC et le journal du mois précédent seront envoyés le 1er de chaque mois.
                </p>
              )}
            </div>
          </div>
        </div>
      </FeatureGate>
    </div>
  );
}

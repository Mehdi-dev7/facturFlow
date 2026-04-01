"use client";

// Modal d'import clients depuis un fichier Excel (.xlsx, .xls) ou CSV
// Flux : Upload → Preview avec statuts → Import → Résultat

import { useState, useCallback, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Download,
  SkipForward,
} from "lucide-react";
import { importClients, type ImportClientRow } from "@/lib/actions/clients";
import { toast } from "sonner";

// ─── Mapping colonnes → champs FacturNow ────────────────────────────────────
// Supporte les en-têtes français et anglais courants des logiciels de facturation

const COLUMN_MAP: Record<string, keyof ImportClientRow> = {
  // Nom / Raison sociale
  nom: "name", name: "name", société: "name", societe: "name",
  "raison sociale": "name", raison_sociale: "name", company: "name",
  entreprise: "name", "nom entreprise": "name", client: "name",
  // Email
  email: "email", mail: "email", "e-mail": "email", courriel: "email",
  // Téléphone
  tel: "phone", tél: "phone", telephone: "phone", téléphone: "phone",
  phone: "phone", mobile: "phone", portable: "phone", "tél.": "phone",
  // SIRET / SIREN
  siret: "siret", siren: "siren",
  // TVA
  tva: "vatNumber", "n° tva": "vatNumber", "numéro tva": "vatNumber",
  "numero tva": "vatNumber", vat: "vatNumber", "no tva": "vatNumber",
  // Adresse
  adresse: "address", address: "address", rue: "address",
  voie: "address", "adresse 1": "address",
  // Ville
  ville: "city", city: "city",
  // Code postal
  cp: "zipCode", "code postal": "zipCode", code_postal: "zipCode",
  zip: "zipCode", postal: "zipCode",
  // Notes / Remarques
  notes: "notes", remarques: "notes", commentaire: "notes", note: "notes",
};

// ─── Type interne pour la preview ───────────────────────────────────────────

type RowStatus = "valid" | "duplicate" | "invalid";

interface PreviewRow extends ImportClientRow {
  _rowIndex: number;
  _status: RowStatus;
  _reason?: string;  // Raison si invalide
}

// ─── Parsing du fichier ─────────────────────────────────────────────────────

// xlsx chargé dynamiquement — uniquement quand un fichier est réellement déposé
async function parseFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const XLSX = await import("xlsx");
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Prend le premier onglet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convertit en tableau d'objets — defval "" pour les cellules vides
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

        // Normalise toutes les valeurs en string
        const normalized = rows.map((row) =>
          Object.fromEntries(
            Object.entries(row).map(([k, v]) => [k, String(v ?? "").trim()]),
          ),
        ) as Record<string, string>[];

        resolve(normalized);
      } catch {
        reject(new Error("Impossible de lire le fichier — vérifiez le format"));
      }
    };

    reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Mapping d'une ligne brute vers ImportClientRow ─────────────────────────

function mapRow(raw: Record<string, string>, index: number): PreviewRow {
  const mapped: Partial<ImportClientRow> = {};

  // Parcourt les colonnes du fichier et mappe selon COLUMN_MAP
  for (const [col, value] of Object.entries(raw)) {
    const normalizedCol = col.toLowerCase().trim();
    const field = COLUMN_MAP[normalizedCol];
    if (field && value) {
      (mapped as Record<string, string>)[field] = value;
    }
  }

  // Détection auto du type : si SIRET/SIREN présent → entreprise, sinon particulier
  if (!mapped.type) {
    mapped.type = (mapped.siret || mapped.siren) ? "entreprise" : "particulier";
  }

  // Validation basique
  if (!mapped.name && !mapped.email) {
    return { ...mapped as ImportClientRow, _rowIndex: index, _status: "invalid", _reason: "Nom et email manquants" };
  }
  if (!mapped.name) {
    return { ...mapped as ImportClientRow, _rowIndex: index, _status: "invalid", _reason: "Nom manquant" };
  }
  if (!mapped.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mapped.email)) {
    return { ...mapped as ImportClientRow, _rowIndex: index, _status: "invalid", _reason: "Email invalide ou manquant" };
  }

  return { ...(mapped as ImportClientRow), _rowIndex: index, _status: "valid" };
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ImportClientsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

// ─── Étapes ─────────────────────────────────────────────────────────────────

type Step = "upload" | "preview" | "done";

// ─── Composant principal ────────────────────────────────────────────────────

export function ImportClientsModal({ open, onOpenChange, onImported }: ImportClientsModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [result, setResult] = useState<{ imported: number; skipped: number; capped: number } | null>(null);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Reset quand on ferme ───────────────────────────────────────────────
  const handleOpenChange = useCallback((val: boolean) => {
    if (!val) {
      setTimeout(() => {
        setStep("upload");
        setRows([]);
        setResult(null);
        setFileName("");
      }, 300);
    }
    onOpenChange(val);
  }, [onOpenChange]);

  // ─── Traitement du fichier uploadé ─────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    const allowed = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel", "text/csv", "application/csv"];

    if (!allowed.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error("Format non supporté — utilisez Excel (.xlsx, .xls) ou CSV");
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      const rawRows = await parseFile(file);

      if (rawRows.length === 0) {
        toast.error("Le fichier est vide ou ne contient pas de données");
        return;
      }

      const parsed = rawRows.map((raw, i) => mapRow(raw, i + 1));
      setRows(parsed);
      setStep("preview");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de lecture du fichier");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Drag & drop handlers ───────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset l'input pour permettre de recharger le même fichier
    e.target.value = "";
  }, [processFile]);

  // ─── Lancer l'import ────────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    const validRows = rows.filter((r) => r._status === "valid");
    if (validRows.length === 0) return;

    setIsLoading(true);

    try {
      // Nettoie les champs internes avant d'envoyer au serveur
      const toSend = validRows.map(({ _rowIndex: _r, _status: _s, _reason: _re, ...row }) => row);
      const res = await importClients(toSend);

      if (!res.success) {
        toast.error(res.error ?? "Erreur lors de l'import");
        return;
      }

      setResult({ imported: res.imported, skipped: res.skipped, capped: res.capped });
      setStep("done");
      onImported();
    } catch {
      toast.error("Erreur lors de l'import — réessayez");
    } finally {
      setIsLoading(false);
    }
  }, [rows, onImported]);

  // ─── Compteurs pour la preview — une seule passe sur le tableau ─────────
  const { validCount, invalidCount, duplicateCount } = useMemo(() => {
    let valid = 0, invalid = 0, duplicate = 0;
    for (const r of rows) {
      if (r._status === "valid") valid++;
      else if (r._status === "invalid") invalid++;
      else duplicate++;
    }
    return { validCount: valid, invalidCount: invalid, duplicateCount: duplicate };
  }, [rows]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#1e1845] dark:to-[#1a1438] border border-primary/20 dark:border-violet-400/30 shadow-lg dark:shadow-violet-950/50 rounded-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-base xs:text-lg flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-violet-500 shrink-0" />
            Importer des clients
          </DialogTitle>
          <DialogDescription className="text-xs xs:text-sm">
            {step === "upload" && "Importez vos clients depuis Excel ou CSV — colonnes détectées automatiquement."}
            {step === "preview" && `${rows.length} ligne(s) détectée(s) dans « ${fileName} »`}
            {step === "done" && "Import terminé"}
          </DialogDescription>
        </DialogHeader>

        {/* ── ÉTAPE 1 : Upload ── */}
        {step === "upload" && (
          <div className="space-y-4">
            {/* Zone drag & drop */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-violet-400 bg-violet-50 dark:bg-violet-500/10"
                  : "border-violet-200 dark:border-violet-500/30 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-500/5"
              }`}
            >
              {isLoading ? (
                <Loader2 className="size-10 text-violet-400 animate-spin" />
              ) : (
                <Upload className="size-10 text-violet-400" />
              )}
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {isLoading ? "Lecture du fichier..." : "Glissez votre fichier ici"}
                </p>
                <p className="text-xs text-slate-400 mt-1">ou cliquez pour parcourir</p>
                <p className="text-xs text-slate-400 mt-1">Excel (.xlsx, .xls) ou CSV</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Colonnes supportées */}
            <div className="rounded-xl border border-violet-100 dark:border-violet-500/20 bg-violet-50/50 dark:bg-violet-900/10 p-3 space-y-2">
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">
                Colonnes reconnues automatiquement
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["Nom / Société", "Email ✱", "Téléphone", "SIRET", "SIREN", "Adresse", "Ville", "Code Postal", "TVA", "Notes"].map((col) => (
                  <span key={col} className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-violet-900/30 border border-violet-200 dark:border-violet-500/30 text-slate-600 dark:text-slate-300">
                    {col}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">✱ Email requis — les doublons sont automatiquement ignorés</p>
            </div>

            {/* Bouton télécharger modèle */}
            <Button
              variant="outline"
              size="sm"
              className="w-full border-violet-200 dark:border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 cursor-pointer"
              onClick={() => downloadTemplate()}
            >
              <Download className="size-3.5 mr-2" />
              Télécharger le modèle Excel
            </Button>
          </div>
        )}

        {/* ── ÉTAPE 2 : Preview ── */}
        {step === "preview" && (
          <div className="space-y-4">
            {/* Résumé statistiques */}
            <div className="grid grid-cols-3 gap-2">
              <StatChip icon={<CheckCircle2 className="size-3.5" />} label="Valides" value={validCount} color="emerald" />
              <StatChip icon={<SkipForward className="size-3.5" />} label="Doublons" value={duplicateCount} color="amber" />
              <StatChip icon={<XCircle className="size-3.5" />} label="Invalides" value={invalidCount} color="red" />
            </div>

            {/* Tableau preview — max 10 lignes affichées */}
            <div className="rounded-xl border border-slate-200 dark:border-violet-500/20 overflow-hidden">
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-violet-900/30 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Statut</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Nom</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Email</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Type</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Ville</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-violet-500/10">
                    {rows.map((row) => (
                      <tr
                        key={row._rowIndex}
                        className={`transition-colors ${
                          row._status === "valid"
                            ? "bg-white dark:bg-transparent hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5"
                            : row._status === "duplicate"
                            ? "bg-amber-50/50 dark:bg-amber-900/10"
                            : "bg-red-50/50 dark:bg-red-900/10"
                        }`}
                      >
                        <td className="px-3 py-2">
                          <StatusBadge status={row._status} reason={row._reason} />
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200 max-w-[140px] truncate">
                          {row.name || <span className="text-slate-400 italic">—</span>}
                        </td>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400 max-w-[160px] truncate">
                          {row.email || <span className="italic">—</span>}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${
                            row.type === "entreprise"
                              ? "border-orange-300 text-orange-600 dark:text-orange-400"
                              : "border-sky-300 text-sky-600 dark:text-sky-400"
                          }`}>
                            {row.type === "entreprise" ? "Entreprise" : "Particulier"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                          {row.city || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Message si invalides */}
            {invalidCount > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-900/10 px-3 py-2">
                <AlertCircle className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {invalidCount} ligne(s) ignorée(s) — email manquant ou invalide.
                  Les lignes valides seront quand même importées.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setStep("upload"); setRows([]); }}
                className="cursor-pointer border-slate-200 dark:border-violet-500/30"
              >
                Changer de fichier
              </Button>
              <Button
                size="sm"
                disabled={validCount === 0 || isLoading}
                onClick={handleImport}
                className="cursor-pointer bg-violet-600 hover:bg-violet-700 text-white"
              >
                {isLoading
                  ? <><Loader2 className="size-3.5 mr-2 animate-spin" />Import en cours...</>
                  : `Importer ${validCount} client${validCount > 1 ? "s" : ""}`
                }
              </Button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : Résultat ── */}
        {step === "done" && result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/15 p-5 text-center space-y-2">
              <CheckCircle2 className="size-10 text-emerald-500 mx-auto" />
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                {result.imported} client{result.imported > 1 ? "s" : ""} importé{result.imported > 1 ? "s" : ""} !
              </p>
            </div>

            <div className="space-y-2">
              {result.skipped > 0 && (
                <ResultLine icon={<SkipForward className="size-3.5" />} color="amber"
                  text={`${result.skipped} doublon(s) ignoré(s) — email déjà présent`} />
              )}
              {result.capped > 0 && (
                <ResultLine icon={<AlertCircle className="size-3.5" />} color="orange"
                  text={`${result.capped} client(s) non importé(s) — limite du plan gratuit atteinte`}
                  cta={{ label: "Passer au Pro", href: "/dashboard/subscription" }} />
              )}
            </div>

            <Button
              className="w-full cursor-pointer bg-violet-600 hover:bg-violet-700 text-white"
              onClick={() => handleOpenChange(false)}
            >
              Voir mes clients
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Sous-composants utilitaires ────────────────────────────────────────────

function StatChip({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number;
  color: "emerald" | "amber" | "red";
}) {
  const colors = {
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300",
    red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300",
  };
  return (
    <div className={`flex flex-col items-center gap-1 rounded-xl border p-2 ${colors[color]}`}>
      <div className="flex items-center gap-1">{icon}<span className="text-lg font-bold">{value}</span></div>
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  );
}

function StatusBadge({ status, reason }: { status: RowStatus; reason?: string }) {
  if (status === "valid") {
    return <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"><CheckCircle2 className="size-3" />OK</span>;
  }
  if (status === "duplicate") {
    return <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium"><SkipForward className="size-3" />Doublon</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 font-medium" title={reason}>
      <XCircle className="size-3" />{reason ?? "Invalide"}
    </span>
  );
}

function ResultLine({ icon, color, text, cta }: {
  icon: React.ReactNode; color: "amber" | "orange"; text: string;
  cta?: { label: string; href: string };
}) {
  const colors = {
    amber: "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-300",
    orange: "border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-300",
  };
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${colors[color]}`}>
      {icon}<span className="flex-1">{text}</span>
      {cta && (
        <a href={cta.href} className="underline underline-offset-2 font-semibold shrink-0 cursor-pointer">{cta.label}</a>
      )}
    </div>
  );
}

// ─── Télécharger le modèle Excel ────────────────────────────────────────────
// Génère un .xlsx exemple avec les bonnes colonnes pour guider l'utilisateur

async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const headers = ["Nom", "Email", "Telephone", "SIRET", "SIREN", "Adresse", "Ville", "Code Postal", "TVA", "Notes"];
  const example = ["ACME SARL", "contact@acme.fr", "0612345678", "12345678901234", "123456789", "10 rue de la Paix", "Paris", "75001", "FR12345678901", "Client prioritaire"];

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws["!cols"] = headers.map(() => ({ wch: 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clients");
  XLSX.writeFile(wb, "modele-import-clients-facturnow.xlsx");
}

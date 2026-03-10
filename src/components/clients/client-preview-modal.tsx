"use client";

// Modale de prévisualisation d'un client
// Même style que quote-preview-modal / deposit-preview-modal (gradient violet)

import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  X,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building2,
  User,
  Hash,
  BadgeEuro,
  FileText,
} from "lucide-react";
import type { SavedClient } from "@/hooks/use-clients";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ClientPreviewModalProps {
  client: SavedClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (client: SavedClient) => void;
  onDelete: (client: SavedClient) => void;
  isDeleting?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatEuros(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ─── Ligne d'info réutilisable (icône + label + valeur) ───────────────────────

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/20">
        <span className="text-violet-600 dark:text-violet-400">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-slate-500 dark:text-violet-300/70 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xs xs:text-sm text-slate-800 dark:text-slate-100 font-medium break-all">
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Carte statistique ──────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  colorClass: string;
}

function StatCard({ label, value, colorClass }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-2 xs:p-3 text-center ${colorClass}`}>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-xs xs:text-sm font-bold mt-0.5 truncate">{value}</p>
    </div>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────────

export function ClientPreviewModal({
  client,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  isDeleting = false,
}: ClientPreviewModalProps) {
  const isEntreprise = client?.type === "entreprise";

  const hasLegalInfo =
    client &&
    (client.companySiret || client.companySiren || client.companyVatNumber);

  const hasAddress =
    client && (client.address || client.postalCode || client.city);

  const fullAddress = client
    ? [
        client.address,
        [client.postalCode, client.city].filter(Boolean).join(" "),
      ]
        .filter(Boolean)
        .join(", ")
    : null;

  const handleEdit = useCallback(() => {
    if (!client) return;
    onEdit(client);
  }, [client, onEdit]);

  const handleDelete = useCallback(() => {
    if (!client) return;
    onDelete(client);
  }, [client, onDelete]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] max-w-lg max-h-[90dvh] overflow-hidden flex flex-col bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] border border-primary/20 dark:border-violet-400/25 shadow-lg dark:shadow-violet-950/40 rounded-xl p-0"
        showCloseButton={false}
      >
        {/* ─── Header ─── */}
        <DialogHeader className="px-4 xs:px-5 pt-4 xs:pt-5 pb-3 border-b border-slate-200 dark:border-violet-500/20 shrink-0">
          {/* Ligne 1 : avatar + nom + badge type + croix */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Icône type */}
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                  isEntreprise
                    ? "bg-violet-100 dark:bg-violet-500/20"
                    : "bg-sky-100 dark:bg-sky-500/20"
                }`}
              >
                {isEntreprise ? (
                  <Building2 className="size-4 text-violet-600 dark:text-violet-400" />
                ) : (
                  <User className="size-4 text-sky-600 dark:text-sky-400" />
                )}
              </div>

              {/* Nom + badge */}
              <div className="min-w-0">
                <DialogTitle className="text-xs xs:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                  {client?.name ?? "Client"}
                </DialogTitle>
              </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isEntreprise
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border border-orange-300 dark:border-orange-500/40"
                      : "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40"
                  }`}
                >
                  {isEntreprise ? "Entreprise" : "PME & Freelance"}
                </span>
            </div>

            {/* Bouton fermer */}
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Fermer"
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700/50 transition-colors cursor-pointer shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Ligne 2 : actions (Edit à gauche, Delete à droite) */}
          <div className="flex items-center justify-between mt-3">
            {/* Modifier */}
            <button
              onClick={handleEdit}
              disabled={!client}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs xs:text-sm font-medium transition-colors border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-500 dark:text-violet-400 dark:hover:bg-violet-500/10 disabled:opacity-50 cursor-pointer"
            >
              <Pencil size={14} />
              {/* Sur mobile : icône seule. xs+ : icône + texte */}
              <span className="hidden xs:inline">Modifier</span>
            </button>

            {/* Supprimer */}
            <button
              onClick={handleDelete}
              disabled={!client || isDeleting}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs xs:text-sm font-medium transition-colors border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 size={14} />
              <span className="hidden xs:inline">
                {isDeleting ? "Suppression..." : "Supprimer"}
              </span>
            </button>
          </div>
        </DialogHeader>

        {/* ─── Corps scrollable ─── */}
        <div className="overflow-y-auto flex-1 px-4 xs:px-5 py-4 space-y-5">
          {client ? (
            <>
              {/* Contact */}
              <section className="space-y-3">
                <h3 className="text-[10px] font-semibold text-slate-500 dark:text-violet-300/70 uppercase tracking-wide">
                  Contact
                </h3>
                <div className="space-y-2.5">
                  <InfoRow icon={<Mail size={14} />} label="Email" value={client.email} />
                  <InfoRow icon={<Phone size={14} />} label="Téléphone" value={client.phone} />
                </div>
              </section>

              {/* Identité légale */}
              {hasLegalInfo && (
                <>
                  <div className="h-px bg-linear-to-r from-transparent via-primary/20 dark:via-violet-200/20 to-transparent" />
                  <section className="space-y-3">
                    <h3 className="text-[10px] font-semibold text-slate-500 dark:text-violet-300/70 uppercase tracking-wide">
                      Identité légale
                    </h3>
                    <div className="space-y-2.5">
                      <InfoRow icon={<Hash size={14} />} label="SIRET" value={client.companySiret} />
                      <InfoRow icon={<Hash size={14} />} label="SIREN" value={client.companySiren} />
                      <InfoRow
                        icon={<BadgeEuro size={14} />}
                        label="N° TVA Intracommunautaire"
                        value={client.companyVatNumber}
                      />
                    </div>
                  </section>
                </>
              )}

              {/* Adresse */}
              {hasAddress && (
                <>
                  <div className="h-px bg-linear-to-r from-transparent via-primary/20 dark:via-violet-200/20 to-transparent" />
                  <section className="space-y-3">
                    <h3 className="text-[10px] font-semibold text-slate-500 dark:text-violet-300/70 uppercase tracking-wide">
                      Adresse
                    </h3>
                    <InfoRow
                      icon={<MapPin size={14} />}
                      label="Adresse complète"
                      value={fullAddress}
                    />
                  </section>
                </>
              )}

              {/* Statistiques */}
              <div className="h-px bg-linear-to-r from-transparent via-primary/20 dark:via-violet-200/20 to-transparent" />
              <section className="space-y-3">
                <h3 className="text-[10px] font-semibold text-slate-500 dark:text-violet-300/70 uppercase tracking-wide">
                  Statistiques
                </h3>
                <div className="grid grid-cols-3 gap-2 xs:gap-3">
                  <StatCard
                    label="Total facturé"
                    value={formatEuros(client.totalInvoiced)}
                    colorClass="border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400"
                  />
                  <StatCard
                    label="Encaissé"
                    value={formatEuros(client.totalPaid)}
                    colorClass="border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  />
                  <StatCard
                    label="Documents"
                    value={String(client.documentCount)}
                    colorClass="border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                  />
                </div>
              </section>

              {/* Notes internes */}
              {client.notes && (
                <>
                  <div className="h-px bg-linear-to-r from-transparent via-primary/20 dark:via-violet-200/20 to-transparent" />
                  <section className="space-y-2">
                    <h3 className="text-[10px] font-semibold text-slate-500 dark:text-violet-300/70 uppercase tracking-wide">
                      Notes internes
                    </h3>
                    <div className="rounded-xl border border-slate-200 dark:border-violet-500/20 bg-slate-50 dark:bg-[#1a1438] p-3">
                      <div className="flex gap-2 items-start">
                        <FileText size={13} className="mt-0.5 text-slate-400 dark:text-violet-400/60 shrink-0" />
                        <p className="text-xs xs:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">
                          {client.notes}
                        </p>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {/* Footer : date de création */}
              <div className="pt-1 text-center text-[10px] text-slate-400 dark:text-slate-500">
                Client depuis le {formatDate(client.createdAt)}
              </div>
            </>
          ) : (
            /* Skeleton de chargement */
            <div className="space-y-4 animate-pulse">
              <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-36 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";
// src/app/admin/partners/partners-client.tsx
// Interface interactive du dashboard partenaires admin.
// Permet de créer, modifier, voir le détail et payer les commissions des partenaires.

import { useState, useCallback, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createPartner,
  updatePartner,
  deletePartner,
  getPartnerStats,
  markAllPendingPaid,
  markCommissionPaid,
} from "@/lib/actions/partners";
import type { PartnerWithStats, PartnerStatsData, PartnerCommissionDetail } from "@/lib/actions/partners";
import {
  Plus, Copy, Eye, Pause, Play, Trash2, CheckCircle2,
  ExternalLink, Loader2, Euro, Users2, Clock, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copié !`));
}

// Badge statut commission
function CommissionStatusBadge({ status }: { status: string }) {
  if (status === "PAID") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/40 border border-emerald-700/50 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
        <CheckCircle2 className="h-3 w-3" /> Payé
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-900/40 border border-amber-700/50 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
      <Clock className="h-3 w-3" /> En attente
    </span>
  );
}

// Badge statut partenaire
function PartnerStatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-900/40 border border-emerald-700/50 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
        Actif
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-800 border border-slate-700/50 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
      Pausé
    </span>
  );
}

// ─── Dialog création partenaire ───────────────────────────────────────────────

interface CreatePartnerDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreatePartnerDialog({ open, onClose, onSuccess }: CreatePartnerDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    email: "",
    code: "",
    commissionMonthly: 10,
    commissionYearly: 15,
    iban: "",
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.name || !form.email || !form.code) {
        toast.error("Nom, email et code sont requis");
        return;
      }
      startTransition(async () => {
        const result = await createPartner({
          name: form.name,
          email: form.email,
          code: form.code,
          commissionMonthly: form.commissionMonthly,
          commissionYearly: form.commissionYearly,
          iban: form.iban || undefined,
        });
        if (result.success) {
          toast.success("Partenaire créé avec succès !");
          setForm({ name: "", email: "", code: "", commissionMonthly: 10, commissionYearly: 15, iban: "" });
          onSuccess();
          onClose();
        } else {
          toast.error(result.error ?? "Erreur lors de la création");
        }
      });
    },
    [form, onSuccess, onClose]
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Nouveau partenaire</DialogTitle>
          <DialogDescription className="text-slate-400">
            Créez un compte partenaire. Un lien de portail sera généré automatiquement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Nom */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Nom *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Paul Dupont"
              className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Email *</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="paul@example.com"
              className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          {/* Code partenaire */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Code partenaire *</label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="PAUL2026"
              className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 uppercase"
            />
            <p className="text-xs text-slate-500">Ce code sera utilisé par les users au checkout Stripe</p>
          </div>

          {/* Commissions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Commission Monthly (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={form.commissionMonthly}
                onChange={(e) => setForm((f) => ({ ...f, commissionMonthly: parseFloat(e.target.value) || 10 }))}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Commission Yearly (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={form.commissionYearly}
                onChange={(e) => setForm((f) => ({ ...f, commissionYearly: parseFloat(e.target.value) || 15 }))}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>
          </div>

          {/* IBAN (optionnel) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">IBAN (optionnel)</label>
            <Input
              value={form.iban}
              onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))}
              placeholder="FR76 3000 6000 0112 3456 7890 189"
              className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 text-slate-400 hover:text-white cursor-pointer"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Créer le partenaire
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dialog détail partenaire ─────────────────────────────────────────────────

interface PartnerDetailDialogProps {
  partnerId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

function PartnerDetailDialog({ partnerId, onClose, onSuccess }: PartnerDetailDialogProps) {
  const [data, setData] = useState<PartnerStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Charger les stats dès que le dialog s'ouvre
  const loadData = useCallback(async (id: string) => {
    setLoading(true);
    const result = await getPartnerStats(id);
    setLoading(false);
    if (result.success && result.data) setData(result.data);
    else toast.error(result.error ?? "Erreur de chargement");
  }, []);

  // Déclencher le chargement quand partnerId change
  useEffect(() => {
    if (partnerId) {
      setData(null);
      loadData(partnerId);
    }
  }, [partnerId, loadData]);

  // Recharger les données
  const reload = useCallback(() => {
    if (partnerId) loadData(partnerId);
  }, [partnerId, loadData]);

  // Payer toutes les commissions en attente
  const handleMarkAllPaid = useCallback(() => {
    if (!partnerId) return;
    startTransition(async () => {
      const result = await markAllPendingPaid(partnerId);
      if (result.success) {
        toast.success(`${result.count} commission(s) marquée(s) comme payée(s)`);
        reload();
        onSuccess();
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  }, [partnerId, reload, onSuccess]);

  // Payer une commission individuelle
  const handlePayOne = useCallback(
    (commission: PartnerCommissionDetail) => {
      if (commission.status === "PAID") return;
      startTransition(async () => {
        const result = await markCommissionPaid(commission.id);
        if (result.success) {
          toast.success("Commission marquée comme payée");
          reload();
          onSuccess();
        } else {
          toast.error(result.error ?? "Erreur");
        }
      });
    },
    [reload, onSuccess]
  );

  if (!partnerId) return null;

  return (
    <Dialog open={!!partnerId} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-3xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {loading ? "Chargement..." : data ? `Détail — ${data.partner.name}` : "Partenaire"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Referrals et historique des commissions
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
        )}

        {!loading && data && (
          <div className="space-y-6 mt-2">
            {/* Stats rapides */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-slate-800 border border-slate-700 p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Users référés</p>
                <p className="text-xl font-bold text-white">{data.referrals.length}</p>
              </div>
              <div className="rounded-lg bg-amber-950/40 border border-amber-800/40 p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Dues</p>
                <p className="text-xl font-bold text-amber-400">{formatCurrency(data.totalDue)}</p>
              </div>
              <div className="rounded-lg bg-emerald-950/40 border border-emerald-800/40 p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Payées</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(data.totalPaid)}</p>
              </div>
            </div>

            {/* Lien portail */}
            <div className="rounded-lg bg-slate-800 border border-slate-700 p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-0.5">Lien portail partenaire</p>
                <p className="text-xs text-slate-300 truncate font-mono">
                  {typeof window !== "undefined" ? window.location.origin : ""}/partner/{data.partner.token}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-slate-400 hover:text-white cursor-pointer"
                onClick={() =>
                  copyToClipboard(
                    `${window.location.origin}/partner/${data.partner.token}`,
                    "Lien portail"
                  )
                }
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="shrink-0 text-slate-400 hover:text-white cursor-pointer"
              >
                <a
                  href={`/partner/${data.partner.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>

            {/* Referrals */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Users2 className="h-4 w-4" /> Referrals ({data.referrals.length})
              </h3>
              {data.referrals.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Aucun referral pour l'instant</p>
              ) : (
                <div className="rounded-lg border border-slate-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-500 text-xs">Plan</TableHead>
                        <TableHead className="text-slate-500 text-xs">Cycle</TableHead>
                        <TableHead className="text-slate-500 text-xs">Montant</TableHead>
                        <TableHead className="text-slate-500 text-xs">Taux</TableHead>
                        <TableHead className="text-slate-500 text-xs">Commissions</TableHead>
                        <TableHead className="text-slate-500 text-xs">Statut</TableHead>
                        <TableHead className="text-slate-500 text-xs">Inscrit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.referrals.map((referral) => (
                        <TableRow key={referral.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell className="text-xs text-slate-200">{referral.plan}</TableCell>
                          <TableCell className="text-xs text-slate-400">{referral.billingCycle}</TableCell>
                          <TableCell className="text-xs text-slate-300">{formatCurrency(referral.monthlyAmount)}</TableCell>
                          <TableCell className="text-xs text-violet-400">{referral.commissionRate}%</TableCell>
                          <TableCell className="text-xs">
                            <span className="text-amber-400">{formatCurrency(referral.commissionsPending)}</span>
                            {" / "}
                            <span className="text-emerald-400">{formatCurrency(referral.commissionsPaid)}</span>
                          </TableCell>
                          <TableCell>
                            <span className={`text-[11px] font-medium ${referral.status === "ACTIVE" ? "text-emerald-400" : "text-slate-500"}`}>
                              {referral.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {new Date(referral.createdAt).toLocaleDateString("fr-FR")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Commissions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Euro className="h-4 w-4" /> Commissions ({data.commissions.length})
                </h3>
                {data.totalDue > 0 && (
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={handleMarkAllPaid}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 cursor-pointer"
                  >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                    Tout marquer payé
                  </Button>
                )}
              </div>

              {data.commissions.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Aucune commission générée</p>
              ) : (
                <div className="rounded-lg border border-slate-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-500 text-xs">Période</TableHead>
                        <TableHead className="text-slate-500 text-xs">Montant</TableHead>
                        <TableHead className="text-slate-500 text-xs">Statut</TableHead>
                        <TableHead className="text-slate-500 text-xs">Payé le</TableHead>
                        <TableHead className="text-slate-500 text-xs">Généré le</TableHead>
                        <TableHead className="text-slate-500 text-xs text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.commissions.map((commission) => (
                        <TableRow key={commission.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell className="text-xs text-slate-400">
                            Période {commission.periodIndex}/12
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-white">
                            {formatCurrency(commission.amount)}
                          </TableCell>
                          <TableCell>
                            <CommissionStatusBadge status={commission.status} />
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {commission.paidAt
                              ? new Date(commission.paidAt).toLocaleDateString("fr-FR")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {new Date(commission.createdAt).toLocaleDateString("fr-FR")}
                          </TableCell>
                          <TableCell className="text-right">
                            {commission.status === "PENDING" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isPending}
                                onClick={() => handlePayOne(commission)}
                                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 text-xs h-7 px-2 cursor-pointer"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Payer
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Component principal ──────────────────────────────────────────────────────

interface Props {
  initialPartners: PartnerWithStats[];
}

export default function PartnersClient({ initialPartners }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // États des dialogs
  const [showCreate, setShowCreate] = useState(false);
  const [detailPartnerId, setDetailPartnerId] = useState<string | null>(null);

  // Loading par row
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Rafraîchir après une action
  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  // Toggle statut ACTIVE/PAUSED
  const handleToggleStatus = useCallback(
    async (partner: PartnerWithStats) => {
      setLoadingId(partner.id);
      const newStatus = partner.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
      const result = await updatePartner(partner.id, { status: newStatus });
      setLoadingId(null);
      if (result.success) {
        toast.success(`Partenaire ${newStatus === "ACTIVE" ? "réactivé" : "mis en pause"}`);
        refresh();
      } else {
        toast.error(result.error ?? "Erreur");
      }
    },
    [refresh]
  );

  // Supprimer un partenaire
  const handleDelete = useCallback(
    async (partner: PartnerWithStats) => {
      if (!confirm(`Supprimer le partenaire ${partner.name} ?`)) return;
      setLoadingId(partner.id);
      const result = await deletePartner(partner.id);
      setLoadingId(null);
      if (result.success) {
        toast.success("Partenaire supprimé");
        refresh();
      } else {
        toast.error(result.error ?? "Erreur");
      }
    },
    [refresh]
  );

  // Copier le lien du portail
  const handleCopyPortal = useCallback((token: string) => {
    const url = `${window.location.origin}/partner/${token}`;
    copyToClipboard(url, "Lien portail");
  }, []);

  return (
    <>
      {/* Table des partenaires */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <span className="text-sm text-slate-400">
            {initialPartners.length} partenaire{initialPartners.length > 1 ? "s" : ""}
          </span>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nouveau partenaire
          </Button>
        </div>

        {/* Table */}
        <div className={`overflow-x-auto transition-opacity ${isPending ? "opacity-60" : ""}`}>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-500 font-medium">Partenaire</TableHead>
                <TableHead className="text-slate-500 font-medium">Code</TableHead>
                <TableHead className="text-slate-500 font-medium">Commissions</TableHead>
                <TableHead className="text-slate-500 font-medium">Referrals</TableHead>
                <TableHead className="text-slate-500 font-medium">Dues</TableHead>
                <TableHead className="text-slate-500 font-medium">Payées</TableHead>
                <TableHead className="text-slate-500 font-medium">Statut</TableHead>
                <TableHead className="text-slate-500 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialPartners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-slate-500 py-12">
                    Aucun partenaire — créez le premier via le bouton ci-dessus
                  </TableCell>
                </TableRow>
              ) : (
                initialPartners.map((partner) => {
                  const isLoading = loadingId === partner.id;
                  return (
                    <TableRow key={partner.id} className="border-slate-800 hover:bg-slate-800/50">
                      {/* Partenaire */}
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-100">{partner.name}</p>
                          <p className="text-xs text-slate-500 truncate">{partner.email}</p>
                          {partner.iban && (
                            <p className="text-xs text-slate-600 font-mono truncate">{partner.iban}</p>
                          )}
                        </div>
                      </TableCell>

                      {/* Code */}
                      <TableCell>
                        <span className="font-mono text-sm text-violet-300 bg-violet-900/30 border border-violet-700/40 rounded px-2 py-0.5">
                          {partner.code}
                        </span>
                      </TableCell>

                      {/* Taux commissions */}
                      <TableCell>
                        <p className="text-xs text-slate-400">Monthly: <span className="text-violet-400">{partner.commissionMonthly}%</span></p>
                        <p className="text-xs text-slate-400">Yearly: <span className="text-violet-400">{partner.commissionYearly}%</span></p>
                      </TableCell>

                      {/* Referrals */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Users2 className="h-3.5 w-3.5 text-slate-500" />
                          <span className="text-sm font-medium">{partner.referralsCount}</span>
                        </div>
                      </TableCell>

                      {/* Dues */}
                      <TableCell>
                        <span className={`text-sm font-semibold ${partner.totalDue > 0 ? "text-amber-400" : "text-slate-600"}`}>
                          {formatCurrency(partner.totalDue)}
                        </span>
                      </TableCell>

                      {/* Payées */}
                      <TableCell>
                        <span className={`text-sm font-semibold ${partner.totalPaid > 0 ? "text-emerald-400" : "text-slate-600"}`}>
                          {formatCurrency(partner.totalPaid)}
                        </span>
                      </TableCell>

                      {/* Statut */}
                      <TableCell>
                        <PartnerStatusBadge status={partner.status} />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400 ml-auto" />
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            {/* Copier le lien portail */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyPortal(partner.token)}
                              className="text-slate-400 hover:text-white h-7 px-2 cursor-pointer"
                              title="Copier le lien portail"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>

                            {/* Voir le détail */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDetailPartnerId(partner.id)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 h-7 px-2 cursor-pointer"
                              title="Voir le détail"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            {/* Pause / Reprendre */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(partner)}
                              className={`h-7 px-2 cursor-pointer ${
                                partner.status === "ACTIVE"
                                  ? "text-amber-400 hover:text-amber-300 hover:bg-amber-950/30"
                                  : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30"
                              }`}
                              title={partner.status === "ACTIVE" ? "Mettre en pause" : "Réactiver"}
                            >
                              {partner.status === "ACTIVE" ? (
                                <Pause className="h-3.5 w-3.5" />
                              ) : (
                                <Play className="h-3.5 w-3.5" />
                              )}
                            </Button>

                            {/* Supprimer */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(partner)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-7 px-2 cursor-pointer"
                              title="Supprimer (uniquement si aucun referral)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog création partenaire */}
      <CreatePartnerDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={refresh}
      />

      {/* Dialog détail partenaire */}
      {detailPartnerId && (
        <PartnerDetailDialog
          partnerId={detailPartnerId}
          onClose={() => setDetailPartnerId(null)}
          onSuccess={refresh}
        />
      )}
    </>
  );
}

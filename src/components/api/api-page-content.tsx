"use client";

// src/components/api/api-page-content.tsx
// Page API & Webhooks — 3 sections :
//  1. Clés API (créer, supprimer, afficher prefix)
//  2. Endpoints webhooks (créer, toggle actif, supprimer)
//  3. Logs de livraison (20 dernières entrées)

import { useState, useCallback } from "react";
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Check,
  Globe,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Code2,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { SavedApiKey } from "@/lib/actions/api-keys";
import type {
  SavedWebhookEndpoint,
  SavedDelivery,
} from "@/lib/actions/webhook-endpoints";
import {
  createApiKey,
  deleteApiKey,
  listApiKeys,
} from "@/lib/actions/api-keys";
import {
  createWebhookEndpoint,
  deleteWebhookEndpoint,
  toggleWebhookEndpoint,
  listWebhookEndpoints,
  getRecentDeliveries,
} from "@/lib/actions/webhook-endpoints";
import { WEBHOOK_EVENTS } from "@/lib/webhook-dispatcher";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ApiPageContentProps {
  initialApiKeys: SavedApiKey[];
  initialEndpoints: SavedWebhookEndpoint[];
  initialDeliveries: (SavedDelivery & { endpointUrl: string })[];
}

// ─── Petit utilitaire : copier dans le presse-papiers ─────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [value]);

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
      aria-label="Copier"
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

// ─── Section : Clés API ───────────────────────────────────────────────────────

function ApiKeysSection({
  apiKeys,
  onRefresh,
}: {
  apiKeys: SavedApiKey[];
  onRefresh: (keys: SavedApiKey[]) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // ── Créer une clé
  const handleCreate = useCallback(async () => {
    if (!keyName.trim()) return;
    setLoading(true);
    const result = await createApiKey(keyName);
    setLoading(false);

    if (!result.success || !result.token) {
      toast.error(result.error ?? "Erreur lors de la création");
      return;
    }

    setCreatedToken(result.token);
    setKeyName("");

    // Rafraîchir la liste
    const list = await listApiKeys();
    if (list.success) onRefresh(list.data);
  }, [keyName, onRefresh]);

  // ── Supprimer une clé
  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    const result = await deleteApiKey(deleteId);
    setDeleteId(null);

    if (!result.success) {
      toast.error(result.error ?? "Erreur");
      return;
    }
    toast.success("Clé supprimée");
    const list = await listApiKeys();
    if (list.success) onRefresh(list.data);
  }, [deleteId, onRefresh]);

  // ── Fermeture modale création (token affiché → confirmé lu)
  const handleCloseCreate = useCallback(() => {
    setCreateOpen(false);
    setCreatedToken(null);
    setShowToken(false);
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-violet-500/20 bg-white dark:bg-slate-900 p-3 sm:p-5">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-violet-500/20">
            <KeyRound className="h-5 w-5 text-primary dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Clés API
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Authentifiez vos intégrations externes
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="gap-2 bg-primary hover:bg-primary/90 text-white cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouvelle clé</span>
        </Button>
      </div>

      {/* Documentation rapide */}
      <div className="mb-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 sm-p-4">
        <div className="flex items-start gap-2">
          <Code2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <p className="font-medium text-slate-800 dark:text-slate-200 mb-1">
              Utilisation
            </p>
            <code className="block bg-slate-900 dark:bg-slate-950 text-green-400 rounded-lg px-3 py-2 text-[11px] font-mono">
              Authorization: Bearer fnk_xxxxxxxx...
            </code>
            <p className="mt-2">
              Base URL :{" "}
              <code className="text-primary dark:text-violet-400">
                https://factur-now.fr/api/v1
              </code>
            </p>
          </div>
        </div>
      </div>

      {/* Liste des clés */}
      {apiKeys.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          Aucune clé API. Créez-en une pour commencer.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                  {key.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  {key.keyPrefix}••••••••••••••••••••••••
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] text-slate-400">
                  {key.lastUsedAt
                    ? `Utilisée ${format(new Date(key.lastUsedAt), "dd/MM/yy", { locale: fr })}`
                    : "Jamais utilisée"}
                </p>
                <p className="text-[11px] text-slate-400">
                  Créée le {format(new Date(key.createdAt), "dd/MM/yy", { locale: fr })}
                </p>
              </div>
              <button
                onClick={() => setDeleteId(key.id)}
                className="shrink-0 p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                aria-label="Supprimer la clé"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modale de création */}
      <Dialog open={createOpen} onOpenChange={handleCloseCreate}>
        <DialogContent
          className="sm:max-w-md max-h-[90dvh] overflow-y-auto bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#1e1845] dark:to-[#1a1438] border border-primary/20 dark:border-violet-400/30 shadow-lg dark:shadow-violet-950/50"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-base xs:text-lg">
              {createdToken ? "Clé créée — Copiez-la maintenant" : "Créer une clé API"}
            </DialogTitle>
          </DialogHeader>

          {/* Étape 1 : saisir le nom */}
          {!createdToken && (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs xs:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Nom de la clé
                </label>
                <Input
                  placeholder="ex: n8n production, Zapier..."
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                  className="text-xs xs:text-sm"
                />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Utilisez un nom descriptif pour retrouver l&apos;usage de cette clé.
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleCloseCreate} className="cursor-pointer">
                  Annuler
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={loading || !keyName.trim()}
                  className="bg-primary hover:bg-primary/90 text-white cursor-pointer"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Créer
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Étape 2 : afficher le token (une seule fois) */}
          {createdToken && (
            <div className="space-y-4 py-2">
              {/* Warning */}
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Cette clé ne sera <strong>jamais réaffichée</strong>. Copiez-la et
                  conservez-la en lieu sûr avant de fermer cette fenêtre.
                </p>
              </div>

              {/* Token + toggle visibilité + bouton copier */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all text-[11px] font-mono text-slate-800 dark:text-slate-200">
                    {showToken ? createdToken : createdToken.slice(0, 12) + "••••••••••••••••••••••••••••••••"}
                  </code>
                  <button
                    onClick={() => setShowToken((v) => !v)}
                    className="shrink-0 p-1.5 text-slate-400 hover:text-primary transition-colors"
                    aria-label={showToken ? "Masquer" : "Afficher"}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <CopyButton value={createdToken} />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleCloseCreate}
                  className="bg-primary hover:bg-primary/90 text-white cursor-pointer"
                >
                  J&apos;ai copié ma clé, fermer
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent className="bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#1e1845] dark:to-[#1a1438] border border-primary/20 dark:border-violet-400/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette clé API ?</AlertDialogTitle>
            <AlertDialogDescription>
              Toute intégration utilisant cette clé cessera de fonctionner immédiatement.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

// ─── Section : Webhooks ───────────────────────────────────────────────────────

// Labels lisibles pour chaque event
const EVENT_LABELS: Record<string, string> = {
  "invoice.created": "Facture créée",
  "invoice.paid": "Facture payée",
  "invoice.overdue": "Facture en retard",
  "invoice.sent": "Facture envoyée",
  "client.created": "Client créé",
  "quote.accepted": "Devis accepté",
  "quote.refused": "Devis refusé",
};

function WebhooksSection({
  endpoints,
  onRefresh,
}: {
  endpoints: SavedWebhookEndpoint[];
  onRefresh: (eps: SavedWebhookEndpoint[]) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());

  const toggleEvent = useCallback((event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  }, []);

  const handleCreate = useCallback(async () => {
    if (!url.trim() || selectedEvents.length === 0) return;
    setLoading(true);
    const result = await createWebhookEndpoint({ url: url.trim(), events: selectedEvents });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "Erreur lors de la création");
      return;
    }
    toast.success("Endpoint créé");
    setCreateOpen(false);
    setUrl("");
    setSelectedEvents([]);

    const list = await listWebhookEndpoints();
    if (list.success) onRefresh(list.data);
  }, [url, selectedEvents, onRefresh]);

  const handleToggle = useCallback(
    async (id: string, currentActive: boolean) => {
      setTogglingId(id);
      const result = await toggleWebhookEndpoint(id, !currentActive);
      setTogglingId(null);

      if (!result.success) {
        toast.error(result.error ?? "Erreur");
        return;
      }
      const list = await listWebhookEndpoints();
      if (list.success) onRefresh(list.data);
    },
    [onRefresh]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    const result = await deleteWebhookEndpoint(deleteId);
    setDeleteId(null);

    if (!result.success) {
      toast.error(result.error ?? "Erreur");
      return;
    }
    toast.success("Endpoint supprimé");
    const list = await listWebhookEndpoints();
    if (list.success) onRefresh(list.data);
  }, [deleteId, onRefresh]);

  const toggleSecretVisibility = useCallback((id: string) => {
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-violet-500/20 bg-white dark:bg-slate-900 p-3 sm:p-5">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/20">
            <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Webhooks
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recevez des notifications en temps réel
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="gap-2 bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </div>

      {/* Endpoints */}
      {endpoints.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          Aucun endpoint configuré.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {endpoints.map((ep) => (
            <div
              key={ep.id}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4"
            >
              {/* URL + actions */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {ep.url}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Toggle actif/inactif */}
                  <button
                    onClick={() => handleToggle(ep.id, ep.active)}
                    disabled={togglingId === ep.id}
                    className="p-1.5 rounded-md transition-colors cursor-pointer text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10"
                    aria-label={ep.active ? "Désactiver" : "Activer"}
                  >
                    {togglingId === ep.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : ep.active ? (
                      <ToggleRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteId(ep.id)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Statut + events */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge
                  variant="outline"
                  className={
                    ep.active
                      ? "border-green-300 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-500/10 dark:text-green-400"
                      : "border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400"
                  }
                >
                  {ep.active ? "Actif" : "Inactif"}
                </Badge>
                {ep.events.map((event) => (
                  <Badge
                    key={event}
                    variant="outline"
                    className="text-[10px] border-violet-200 text-violet-700 dark:border-violet-600 dark:text-violet-300"
                  >
                    {EVENT_LABELS[event] ?? event}
                  </Badge>
                ))}
              </div>

              {/* Secret HMAC */}
              <div className="flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2">
                <span className="text-[11px] text-slate-500 shrink-0">Secret :</span>
                <code className="flex-1 text-[11px] font-mono text-slate-700 dark:text-slate-300 truncate">
                  {revealedSecrets.has(ep.id)
                    ? ep.secret
                    : ep.secret.slice(0, 8) + "••••••••••••••••••••••••"}
                </code>
                <button
                  onClick={() => toggleSecretVisibility(ep.id)}
                  className="shrink-0 p-1 text-slate-400 hover:text-primary transition-colors"
                  aria-label="Afficher/masquer le secret"
                >
                  {revealedSecrets.has(ep.id) ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
                <CopyButton value={ep.secret} />
              </div>

              {/* Compteur livraisons */}
              {ep.recentDeliveries.length > 0 && (
                <p className="mt-2 text-[11px] text-slate-400">
                  {ep.recentDeliveries.length} livraison(s) récente(s) —{" "}
                  {ep.recentDeliveries.filter((d) => d.success).length} réussie(s)
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modale création endpoint */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) { setCreateOpen(false); setUrl(""); setSelectedEvents([]); } }}>
        <DialogContent
          className="sm:max-w-md max-h-[90dvh] overflow-y-auto bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#1e1845] dark:to-[#1a1438] border border-primary/20 dark:border-violet-400/30 shadow-lg dark:shadow-violet-950/50"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-base xs:text-lg">Ajouter un endpoint</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* URL */}
            <div>
              <label className="text-xs xs:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                URL de destination
              </label>
              <Input
                placeholder="https://mon-app.fr/webhooks/facturmow"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="text-xs xs:text-sm"
              />
            </div>

            {/* Events */}
            <div>
              <label className="text-xs xs:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Événements à écouter
              </label>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <label
                    key={event}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="accent-primary h-3.5 w-3.5"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      {EVENT_LABELS[event] ?? event}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { setCreateOpen(false); setUrl(""); setSelectedEvents([]); }}
                className="cursor-pointer"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading || !url.trim() || selectedEvents.length === 0}
                className="bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent className="bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#1e1845] dark:to-[#1a1438] border border-primary/20 dark:border-violet-400/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet endpoint ?</AlertDialogTitle>
            <AlertDialogDescription>
              Il ne recevra plus aucune notification. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

// ─── Section : Logs de livraison ──────────────────────────────────────────────

function DeliveryLogsSection({
  deliveries,
}: {
  deliveries: (SavedDelivery & { endpointUrl: string })[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-violet-500/20 bg-white dark:bg-slate-900 p-3 sm:p-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/20">
          <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Logs de livraison
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            20 dernières tentatives
          </p>
        </div>
      </div>

      {deliveries.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          Aucune livraison pour le moment.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Statut
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Événement
                </th>
                <th className="hidden sm:table-cell px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Endpoint
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Code
                </th>
                <th className="hidden xs:table-cell px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-3 py-2.5">
                    {d.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center rounded-full bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-600">
                      {d.event}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-3 py-2.5 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                    {d.endpointUrl}
                  </td>
                  <td className="px-3 py-2.5">
                    {d.statusCode ? (
                      <span
                        className={`font-mono font-semibold ${
                          d.statusCode >= 200 && d.statusCode < 300
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {d.statusCode}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="hidden xs:table-cell px-3 py-2.5 text-slate-400 whitespace-nowrap">
                    {format(new Date(d.createdAt), "dd/MM/yy HH:mm", { locale: fr })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ApiPageContent({
  initialApiKeys,
  initialEndpoints,
  initialDeliveries,
}: ApiPageContentProps) {
  const [apiKeys, setApiKeys] = useState<SavedApiKey[]>(initialApiKeys);
  const [endpoints, setEndpoints] = useState<SavedWebhookEndpoint[]>(initialEndpoints);
  const [deliveries, setDeliveries] = useState<(SavedDelivery & { endpointUrl: string })[]>(
    initialDeliveries
  );

  // Après une action sur les endpoints, rafraîchir aussi les logs
  const handleEndpointsRefresh = useCallback(async (eps: SavedWebhookEndpoint[]) => {
    setEndpoints(eps);
    const logsResult = await getRecentDeliveries();
    if (logsResult.success) setDeliveries(logsResult.data);
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl xs:text-2xl font-bold text-slate-900 dark:text-slate-100">
          API & Webhooks
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Intégrez FacturNow avec vos outils externes via l&apos;API REST ou les webhooks.
        </p>
      </div>

      {/* Section 1 : Clés API */}
      <ApiKeysSection apiKeys={apiKeys} onRefresh={setApiKeys} />

      {/* Section 2 : Webhooks */}
      <WebhooksSection endpoints={endpoints} onRefresh={handleEndpointsRefresh} />

      {/* Section 3 : Logs */}
      <DeliveryLogsSection deliveries={deliveries} />
    </div>
  );
}

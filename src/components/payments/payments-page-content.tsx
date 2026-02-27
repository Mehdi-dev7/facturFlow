"use client";
// src/components/payments/payments-page-content.tsx
// Interface de connexion/déconnexion des providers de paiement

import { useState, useCallback } from "react";
import { SiStripe, SiPaypal } from "react-icons/si";
import { Banknote, CheckCircle2, XCircle, ChevronDown, ChevronUp, Eye, EyeOff, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  connectStripe,
  connectPayPal,
  connectGoCardless,
  disconnectProvider,
  type PaymentAccountInfo,
} from "@/lib/actions/payments";
import type { PaymentProvider } from "@prisma/client";

// ─── Props ────────────────────────────────────────────────────────────────────

interface PaymentsPageContentProps {
  initialAccounts: PaymentAccountInfo[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isConnected(accounts: PaymentAccountInfo[], provider: PaymentProvider): boolean {
  return accounts.some((a) => a.provider === provider && a.isActive);
}

function getConnectedAt(accounts: PaymentAccountInfo[], provider: PaymentProvider): string | null {
  const a = accounts.find((acc) => acc.provider === provider);
  if (!a) return null;
  return new Date(a.connectedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function PaymentsPageContent({ initialAccounts }: PaymentsPageContentProps) {
  const [accounts, setAccounts] = useState<PaymentAccountInfo[]>(initialAccounts);

  // Stripe form state
  const [stripeOpen, setStripeOpen] = useState(false);
  const [stripeKey, setStripeKey] = useState("");
  const [stripeWebhook, setStripeWebhook] = useState("");
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);

  // PayPal form state
  const [paypalOpen, setPaypalOpen] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalSecret, setPaypalSecret] = useState("");
  const [showPaypalSecret, setShowPaypalSecret] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);

  // GoCardless form state
  const [gcOpen, setGcOpen] = useState(false);
  const [gcToken, setGcToken] = useState("");
  const [showGcToken, setShowGcToken] = useState(false);
  const [gcLoading, setGcLoading] = useState(false);

  // Déconnexion en cours
  const [disconnecting, setDisconnecting] = useState<PaymentProvider | null>(null);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleConnectStripe = useCallback(async () => {
    if (!stripeKey.trim()) return;
    setStripeLoading(true);

    const result = await connectStripe(stripeKey.trim(), stripeWebhook.trim() || undefined);

    if (result.success) {
      toast.success("Stripe connecté avec succès !");
      setStripeOpen(false);
      setStripeKey("");
      setStripeWebhook("");
      // Rafraîchir la liste locale
      setAccounts((prev) => {
        const filtered = prev.filter((a) => a.provider !== "STRIPE");
        return [...filtered, { provider: "STRIPE", isActive: true, connectedAt: new Date().toISOString() }];
      });
    } else {
      toast.error(result.error ?? "Erreur lors de la connexion Stripe");
    }

    setStripeLoading(false);
  }, [stripeKey, stripeWebhook]);

  const handleConnectPayPal = useCallback(async () => {
    if (!paypalClientId.trim() || !paypalSecret.trim()) return;
    setPaypalLoading(true);

    const result = await connectPayPal(paypalClientId.trim(), paypalSecret.trim());

    if (result.success) {
      toast.success("PayPal connecté !");
      setPaypalOpen(false);
      setPaypalClientId("");
      setPaypalSecret("");
      setAccounts((prev) => {
        const filtered = prev.filter((a) => a.provider !== "PAYPAL");
        return [...filtered, { provider: "PAYPAL", isActive: true, connectedAt: new Date().toISOString() }];
      });
    } else {
      toast.error(result.error ?? "Erreur lors de la connexion PayPal");
    }

    setPaypalLoading(false);
  }, [paypalClientId, paypalSecret]);

  const handleConnectGC = useCallback(async () => {
    if (!gcToken.trim()) return;
    setGcLoading(true);

    const result = await connectGoCardless(gcToken.trim());

    if (result.success) {
      toast.success("GoCardless connecté !");
      setGcOpen(false);
      setGcToken("");
      setAccounts((prev) => {
        const filtered = prev.filter((a) => a.provider !== "GOCARDLESS");
        return [...filtered, { provider: "GOCARDLESS", isActive: true, connectedAt: new Date().toISOString() }];
      });
    } else {
      toast.error(result.error ?? "Erreur lors de la connexion GoCardless");
    }

    setGcLoading(false);
  }, [gcToken]);

  const handleDisconnect = useCallback(async (provider: PaymentProvider) => {
    setDisconnecting(provider);
    const result = await disconnectProvider(provider);

    if (result.success) {
      toast.success(`${provider} déconnecté`);
      setAccounts((prev) => prev.filter((a) => a.provider !== provider));
    } else {
      toast.error(result.error ?? "Erreur lors de la déconnexion");
    }

    setDisconnecting(null);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  const stripeConnected = isConnected(accounts, "STRIPE");
  const paypalConnected = isConnected(accounts, "PAYPAL");
  const gcConnected = isConnected(accounts, "GOCARDLESS");

  return (
    <div className="space-y-6">
      {/* Info frais */}
      <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-700/30 rounded-xl p-4">
        <p className="text-sm text-violet-700 dark:text-violet-300">
          <strong>L&apos;argent va directement sur votre compte</strong> — FacturFlow ne touche jamais à vos fonds.
          Nous générons les liens de paiement et mettons à jour le statut automatiquement via webhooks.
        </p>
      </div>

      {/* Cards providers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ── STRIPE ──────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          {/* Header card */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#635BFF]/10">
                <SiStripe className="h-5 w-5 text-[#635BFF]" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Stripe</h3>
                <p className="text-xs text-slate-500">CB · Apple Pay · Google Pay</p>
              </div>
            </div>
            {/* Badge statut */}
            {stripeConnected ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Connecté
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                <XCircle className="h-3.5 w-3.5" /> Non connecté
              </span>
            )}
          </div>

          {/* Date de connexion */}
          {stripeConnected && (
            <p className="text-xs text-slate-500">
              Depuis le {getConnectedAt(accounts, "STRIPE")}
            </p>
          )}

          {/* Frais */}
          <p className="text-xs text-slate-400">~1,5% + 0,25€ par transaction</p>

          {/* Actions */}
          {stripeConnected ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              onClick={() => handleDisconnect("STRIPE")}
              disabled={disconnecting === "STRIPE"}
            >
              {disconnecting === "STRIPE" ? "Déconnexion..." : "Déconnecter"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setStripeOpen((v) => !v)}
            >
              {stripeOpen ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
              Connecter Stripe
            </Button>
          )}

          {/* Formulaire dépliable */}
          {stripeOpen && !stripeConnected && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              {/* Tutoriel */}
              <div className="text-xs text-slate-500 space-y-1">
                <p className="font-medium text-slate-700 dark:text-slate-300">Comment récupérer votre clé Stripe :</p>
                <ol className="list-decimal ml-4 space-y-0.5">
                  <li>Connectez-vous à <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline inline-flex items-center gap-0.5">dashboard.stripe.com <ExternalLink className="h-2.5 w-2.5" /></a></li>
                  <li>Allez dans <strong>Développeurs → Clés API</strong></li>
                  <li>Copiez la <strong>Clé secrète</strong> (sk_live_… ou sk_test_…)</li>
                </ol>
              </div>

              {/* Champ clé secrète */}
              <div className="space-y-1.5">
                <Label className="text-xs">Clé secrète Stripe *</Label>
                <div className="relative">
                  <Input
                    type={showStripeKey ? "text" : "password"}
                    placeholder="sk_test_..."
                    value={stripeKey}
                    onChange={(e) => setStripeKey(e.target.value)}
                    className="text-xs pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStripeKey((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showStripeKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Champ webhook secret (optionnel) */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Webhook Secret <span className="text-slate-400">(optionnel — pour mise à jour auto du statut)</span>
                </Label>
                <Input
                  type="text"
                  placeholder="whsec_..."
                  value={stripeWebhook}
                  onChange={(e) => setStripeWebhook(e.target.value)}
                  className="text-xs"
                />
                <p className="text-[11px] text-slate-400">
                  Configurez dans Stripe : Développeurs → Webhooks → Ajouter un endpoint → <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">https://votredomaine.com/api/webhooks/stripe</code>
                </p>
              </div>

              <Button
                size="sm"
                className="w-full bg-[#635BFF] hover:bg-[#4F46E5] text-white"
                onClick={handleConnectStripe}
                disabled={stripeLoading || !stripeKey.trim()}
              >
                {stripeLoading ? "Vérification..." : "Connecter"}
              </Button>
            </div>
          )}
        </div>

        {/* ── PAYPAL ──────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#003087]/10">
                <SiPaypal className="h-5 w-5 text-[#003087] dark:text-[#009CDE]" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">PayPal</h3>
                <p className="text-xs text-slate-500">Paiements PayPal</p>
              </div>
            </div>
            {paypalConnected ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Connecté
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                <XCircle className="h-3.5 w-3.5" /> Non connecté
              </span>
            )}
          </div>

          {paypalConnected && (
            <p className="text-xs text-slate-500">
              Depuis le {getConnectedAt(accounts, "PAYPAL")}
            </p>
          )}

          <p className="text-xs text-slate-400">~2,5–3,5% par transaction</p>

          {/* Badge bientôt fonctionnel */}
          <div className="px-2 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/30 rounded-lg">
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Connexion disponible — génération de liens en cours de développement
            </p>
          </div>

          {paypalConnected ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              onClick={() => handleDisconnect("PAYPAL")}
              disabled={disconnecting === "PAYPAL"}
            >
              {disconnecting === "PAYPAL" ? "Déconnexion..." : "Déconnecter"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setPaypalOpen((v) => !v)}
            >
              {paypalOpen ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
              Connecter PayPal
            </Button>
          )}

          {paypalOpen && !paypalConnected && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="text-xs text-slate-500 space-y-1">
                <p className="font-medium text-slate-700 dark:text-slate-300">Comment récupérer vos clés PayPal :</p>
                <ol className="list-decimal ml-4 space-y-0.5">
                  <li>Allez sur <a href="https://developer.paypal.com/dashboard/applications/live" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline inline-flex items-center gap-0.5">developer.paypal.com <ExternalLink className="h-2.5 w-2.5" /></a></li>
                  <li>Créez une application → copiez <strong>Client ID</strong> et <strong>Secret</strong></li>
                </ol>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Client ID *</Label>
                <Input
                  type="text"
                  placeholder="AeA1..."
                  value={paypalClientId}
                  onChange={(e) => setPaypalClientId(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Client Secret *</Label>
                <div className="relative">
                  <Input
                    type={showPaypalSecret ? "text" : "password"}
                    placeholder="ELt0..."
                    value={paypalSecret}
                    onChange={(e) => setPaypalSecret(e.target.value)}
                    className="text-xs pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPaypalSecret((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPaypalSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <Button
                size="sm"
                className="w-full bg-[#003087] hover:bg-[#002970] text-white"
                onClick={handleConnectPayPal}
                disabled={paypalLoading || !paypalClientId.trim() || !paypalSecret.trim()}
              >
                {paypalLoading ? "Sauvegarde..." : "Enregistrer"}
              </Button>
            </div>
          )}
        </div>

        {/* ── GOCARDLESS ──────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">GoCardless</h3>
                <p className="text-xs text-slate-500">Prélèvement SEPA</p>
              </div>
            </div>
            {gcConnected ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Connecté
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                <XCircle className="h-3.5 w-3.5" /> Non connecté
              </span>
            )}
          </div>

          {gcConnected && (
            <p className="text-xs text-slate-500">
              Depuis le {getConnectedAt(accounts, "GOCARDLESS")}
            </p>
          )}

          <p className="text-xs text-slate-400">1% + 0,20€ par prélèvement</p>

          <div className="px-2 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/30 rounded-lg">
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Connexion disponible — génération de mandats SEPA en cours de développement
            </p>
          </div>

          {gcConnected ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              onClick={() => handleDisconnect("GOCARDLESS")}
              disabled={disconnecting === "GOCARDLESS"}
            >
              {disconnecting === "GOCARDLESS" ? "Déconnexion..." : "Déconnecter"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setGcOpen((v) => !v)}
            >
              {gcOpen ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
              Connecter GoCardless
            </Button>
          )}

          {gcOpen && !gcConnected && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="text-xs text-slate-500 space-y-1">
                <p className="font-medium text-slate-700 dark:text-slate-300">Comment récupérer votre token GoCardless :</p>
                <ol className="list-decimal ml-4 space-y-0.5">
                  <li>Allez sur <a href="https://manage.gocardless.com/developers/access-tokens" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline inline-flex items-center gap-0.5">manage.gocardless.com <ExternalLink className="h-2.5 w-2.5" /></a></li>
                  <li>Créez un <strong>Access Token</strong> avec les permissions Read/Write</li>
                </ol>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Access Token *</Label>
                <div className="relative">
                  <Input
                    type={showGcToken ? "text" : "password"}
                    placeholder="live_..."
                    value={gcToken}
                    onChange={(e) => setGcToken(e.target.value)}
                    className="text-xs pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGcToken((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showGcToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleConnectGC}
                disabled={gcLoading || !gcToken.trim()}
              >
                {gcLoading ? "Sauvegarde..." : "Enregistrer"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Section test en dev */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Tester en local (Stripe)
        </h3>
        <ol className="text-xs text-slate-500 space-y-1 list-decimal ml-4">
          <li>Installez Stripe CLI : <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">brew install stripe/stripe-cli/stripe</code></li>
          <li>Connectez-vous : <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">stripe login</code></li>
          <li>Forwarding local : <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">stripe listen --forward-to localhost:3000/api/webhooks/stripe</code></li>
          <li>Le CLI affiche un <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">whsec_...</code> à utiliser comme Webhook Secret ci-dessus</li>
          <li>Carte de test Stripe : <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">4242 4242 4242 4242</code></li>
        </ol>
      </div>
    </div>
  );
}

"use client";
// src/components/payments/payments-page-content.tsx

import { useState, useCallback } from "react";
import Link from "next/link";
import { SiStripe, SiPaypal } from "react-icons/si";
import { CheckCircle2, Eye, EyeOff, ExternalLink, Unlink } from "lucide-react";
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
type PaymentProvider = "STRIPE" | "PAYPAL" | "GOCARDLESS";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isConnected(accounts: PaymentAccountInfo[], provider: PaymentProvider) {
  return accounts.some((a) => a.provider === provider && a.isActive);
}

function getConnectedAt(accounts: PaymentAccountInfo[], provider: PaymentProvider) {
  const a = accounts.find((acc) => acc.provider === provider);
  if (!a) return null;
  return new Date(a.connectedAt).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

// ─── Logo GoCardless (SVG inline) ────────────────────────────────────────────

function GoCardlessLogo({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 64 64">
      <rect width="64" height="64" rx="8.8" fill="#0854b3" />
      <path d="M34 32.4c0-6 4.5-10.9 10.9-10.9 4 0 6.3 1.3 8.3 3.2l-2.9 3.4c-1.6-1.5-3.3-2.4-5.4-2.4-3.5 0-6.1 2.9-6.1 6.5v.1c0 3.6 2.5 6.6 6.1 6.6 2.4 0 3.9-1 5.5-2.5l2.9 3c-2.2 2.3-4.6 3.7-8.6 3.7-6.2.1-10.7-4.7-10.7-10.7z" fill="#fff" />
      <path d="M22 43.2c-6.7 0-11.3-4.7-11.3-11.1 0-6.1 4.8-11.2 11.3-11.2 3.9 0 6.2 1 8.4 3l-3 3.6c-1.7-1.4-3.1-2.2-5.6-2.2-3.4 0-6.2 3.1-6.2 6.7 0 3.9 2.8 6.8 6.5 6.8 1.7 0 3.3-.4 4.5-1.3v-3.1h-4.8v-4.1h9.3v9.4c-2.1 1.9-5.2 3.5-9.1 3.5" fill="#fff" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

// ─── Provider Card ────────────────────────────────────────────────────────────

interface ProviderCardProps {
  accent: string;         // couleur de l'accent (border top + badge)
  logo: React.ReactNode;
  name: string;
  tagline: string;
  fees: string;
  connected: boolean;
  connectedAt: string | null;
  comingSoon?: boolean;   // badge "bientôt" si génération de liens pas encore dispo
  formOpen: boolean;
  onToggleForm: () => void;
  onDisconnect: () => void;
  isDisconnecting: boolean;
  children: React.ReactNode; // formulaire de connexion
}

function ProviderCard({
  accent, logo, name, tagline, fees,
  connected, connectedAt, comingSoon,
  formOpen, onToggleForm, onDisconnect, isDisconnecting,
  children,
}: ProviderCardProps) {
  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      {/* Bande de couleur en haut */}
      <div className="h-1 w-full" style={{ backgroundColor: accent }} />

      <div className="px-2 xs:px-4 py-8 xl:py-10 space-y-5 xl:space-y-6">
        {/* Header : logo + nom + statut */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 xl:gap-4">
            <div className="flex items-center justify-center w-8 h-8 xl:w-10 xl:h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              {logo}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm xl:text-base">{name}</h3>
              <p className="text-[10px] xs:text-xs  text-slate-400">{tagline}</p>
            </div>
          </div>

          {/* Badge statut */}
          {connected ? (
            <span className="flex items-center gap-1.5 text-[9px] xs:text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3" />
              Connecté
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[9px] xs:text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
              Non connecté
            </span>
          )}
        </div>

        {/* Date + frais */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{connected ? `Depuis le ${connectedAt}` : fees}</span>
          {connected && <span>{fees}</span>}
        </div>

        {/* Badge "bientôt" si génération non encore dispo */}
        {comingSoon && connected && (
          <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/30 rounded-lg px-3 py-1.5">
            Connexion active — génération de liens en cours de développement
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-2">
          {connected ? (
            <button
              onClick={onDisconnect}
              disabled={isDisconnecting}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Unlink className="h-3.5 w-3.5" />
              {isDisconnecting ? "Déconnexion..." : "Déconnecter"}
            </button>
          ) : (
            <button
              onClick={onToggleForm}
              className="w-full text-sm font-semibold py-2 md:py-2.5 px-4 rounded-xl text-white transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: accent }}
            >
              {formOpen ? "Annuler" : `Connecter ${name}`}
            </button>
          )}
        </div>

        {/* Formulaire de connexion (dépliable) */}
        {formOpen && !connected && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Champ password avec toggle visibilité ────────────────────────────────────

function SecretInput({
  label, placeholder, value, onChange, hint,
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; hint?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-600 dark:text-slate-200">{label}</Label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs pr-9 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      {hint && <p className="text-[11px] text-slate-400 leading-relaxed">{hint}</p>}
    </div>
  );
}

// ─── Tutoriel steps ───────────────────────────────────────────────────────────

function TutoSteps({ steps }: { steps: { text: React.ReactNode }[] }) {
  return (
    <ol className="space-y-1">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-2 text-[11px] text-slate-500">
          <span className="shrink-0 w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
            {i + 1}
          </span>
          <span className="leading-4 pt-0.5">{s.text}</span>
        </li>
      ))}
    </ol>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function PaymentsPageContent({ initialAccounts }: { initialAccounts: PaymentAccountInfo[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [disconnecting, setDisconnecting] = useState<PaymentProvider | null>(null);

  // Une seule carte ouverte à la fois
  const [openProvider, setOpenProvider] = useState<PaymentProvider | null>(null);

  const toggleForm = useCallback((provider: PaymentProvider) => {
    setOpenProvider((v) => (v === provider ? null : provider));
  }, []);

  // Stripe
  const [stripeKey, setStripeKey] = useState("");
  const [stripeWebhook, setStripeWebhook] = useState("");
  const [stripeLoading, setStripeLoading] = useState(false);

  // PayPal
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalSecret, setPaypalSecret] = useState("");
  const [paypalWebhookId, setPaypalWebhookId] = useState("");
  const [paypalSandbox, setPaypalSandbox] = useState(true);
  const [paypalLoading, setPaypalLoading] = useState(false);

  // GoCardless
  const [gcToken, setGcToken] = useState("");
  const [gcLoading, setGcLoading] = useState(false);

  // ── Ajout d'un compte dans la liste locale ────────────────────────────────

  const addAccount = useCallback((provider: PaymentProvider) => {
    setAccounts((prev) => [
      ...prev.filter((a) => a.provider !== provider),
      { provider, isActive: true, connectedAt: new Date().toISOString() },
    ]);
  }, []);

  // ── Handlers connexion ────────────────────────────────────────────────────

  const handleConnectStripe = useCallback(async () => {
    if (!stripeKey.trim() || !stripeWebhook.trim()) return;
    setStripeLoading(true);
    const result = await connectStripe(stripeKey.trim(), stripeWebhook.trim());
    if (result.success) {
      toast.success("Stripe connecté !");
      setOpenProvider(null); setStripeKey(""); setStripeWebhook("");
      addAccount("STRIPE");
    } else {
      toast.error(result.error ?? "Erreur Stripe");
    }
    setStripeLoading(false);
  }, [stripeKey, stripeWebhook, addAccount]);

  const handleConnectPayPal = useCallback(async () => {
    if (!paypalClientId.trim() || !paypalSecret.trim()) return;
    setPaypalLoading(true);
    const result = await connectPayPal(
      paypalClientId.trim(),
      paypalSecret.trim(),
      paypalSandbox,
      paypalWebhookId.trim() || undefined,
    );
    if (result.success) {
      toast.success("PayPal connecté !");
      setOpenProvider(null);
      setPaypalClientId(""); setPaypalSecret(""); setPaypalWebhookId("");
      addAccount("PAYPAL");
    } else {
      toast.error(result.error ?? "Erreur PayPal");
    }
    setPaypalLoading(false);
  }, [paypalClientId, paypalSecret, paypalSandbox, paypalWebhookId, addAccount]);

  const handleConnectGC = useCallback(async () => {
    if (!gcToken.trim()) return;
    setGcLoading(true);
    const result = await connectGoCardless(gcToken.trim());
    if (result.success) {
      toast.success("GoCardless connecté !");
      setOpenProvider(null); setGcToken("");
      addAccount("GOCARDLESS");
    } else {
      toast.error(result.error ?? "Erreur GoCardless");
    }
    setGcLoading(false);
  }, [gcToken, addAccount]);

  const handleDisconnect = useCallback(async (provider: PaymentProvider) => {
    setDisconnecting(provider);
    const result = await disconnectProvider(provider);
    if (result.success) {
      toast.success(`${provider} déconnecté`);
      setAccounts((prev) => prev.filter((a) => a.provider !== provider));
    } else {
      toast.error(result.error ?? "Erreur");
    }
    setDisconnecting(null);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  const stripeConnected = isConnected(accounts, "STRIPE");
  const paypalConnected = isConnected(accounts, "PAYPAL");
  const gcConnected = isConnected(accounts, "GOCARDLESS");

  return (
    <div className="space-y-6">
      {/* Bandeau info */}
      <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900/50 border border-violet-500 dark:border-violet-700 rounded-xl px-4 py-3">
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          L&apos;argent va <strong className="text-slate-700 dark:text-slate-300">directement sur votre compte</strong> — FacturNow génère les liens de paiement et met à jour le statut automatiquement.
        </p>
      </div>

      {/* 3 cards — empilées jusqu'à lg, puis 3 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7 xl:gap-8 items-start">

        {/* ── STRIPE ───────────────────────────────────────────────────── */}
        <ProviderCard
          accent="#635BFF"
          logo={<SiStripe className="h-4 w-4 xl:h-5 xl:w-5 text-[#635BFF]" />}
          name="Stripe"
          tagline="CB · Apple Pay · Google Pay"
          fees="~1,5% + 0,25€ / transaction"
          connected={stripeConnected}
          connectedAt={getConnectedAt(accounts, "STRIPE")}
          formOpen={openProvider === "STRIPE"}
          onToggleForm={() => toggleForm("STRIPE")}
          onDisconnect={() => handleDisconnect("STRIPE")}
          isDisconnecting={disconnecting === "STRIPE"}
        >
          <TutoSteps steps={[
            { text: <>Connectez-vous sur <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-[#635BFF] hover:underline inline-flex items-center gap-0.5">dashboard.stripe.com <ExternalLink className="h-2.5 w-2.5" /></a></> },
            { text: <>Développeurs → Clés API → copiez la <strong>Clé secrète</strong></> },
          ]} />

          <SecretInput
            label="Clé secrète *"
            placeholder="sk_test_... ou sk_live_..."
            value={stripeKey}
            onChange={setStripeKey}
          />
          <SecretInput
            label="Webhook Secret *"
            placeholder="whsec_..."
            value={stripeWebhook}
            onChange={setStripeWebhook}
          />
          <button
            onClick={handleConnectStripe}
            disabled={stripeLoading || !stripeKey.trim() || !stripeWebhook.trim()}
            className="w-full text-sm font-semibold py-2.5 px-4 rounded-xl text-white bg-[#635BFF] hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
          >
            {stripeLoading ? "Vérification..." : "Connecter"}
          </button>
        </ProviderCard>

        {/* ── PAYPAL ───────────────────────────────────────────────────── */}
        <div className="space-y-2">
        <ProviderCard
          accent="#003087"
          logo={<SiPaypal className="h-4 w-4 xl:h-5 xl:w-5 text-[#003087] dark:text-[#009CDE]" />}
          name="PayPal"
          tagline="Paiements PayPal"
          fees="~2,5–3,5% / transaction"
          connected={paypalConnected}
          connectedAt={getConnectedAt(accounts, "PAYPAL")}
          formOpen={openProvider === "PAYPAL"}
          onToggleForm={() => toggleForm("PAYPAL")}
          onDisconnect={() => handleDisconnect("PAYPAL")}
          isDisconnecting={disconnecting === "PAYPAL"}
        >
          <TutoSteps steps={[
            { text: <>Allez sur <a href="https://developer.paypal.com/dashboard/applications" target="_blank" rel="noopener noreferrer" className="text-[#003087] dark:text-[#009CDE] hover:underline inline-flex items-center gap-0.5">developer.paypal.com <ExternalLink className="h-2.5 w-2.5" /></a></> },
            { text: <>Créez une app Sandbox → copiez <strong>Client ID</strong> et <strong>Secret</strong></> },
            { text: <>Webhooks → New → URL : <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded">facturnow.fr/api/webhooks/paypal</code> → event : <strong>PAYMENT.CAPTURE.COMPLETED</strong> → copiez le Webhook ID (optionnel)</> },
          ]} />

          {/* Toggle sandbox / live */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Mode :</span>
            <button
              type="button"
              onClick={() => setPaypalSandbox(true)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${paypalSandbox ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}
            >
              Sandbox (test)
            </button>
            <button
              type="button"
              onClick={() => setPaypalSandbox(false)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${!paypalSandbox ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}
            >
              Production
            </button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 dark:text-slate-200">Client ID *</Label>
            <Input type="text" placeholder="AeA1..." value={paypalClientId} onChange={(e) => setPaypalClientId(e.target.value)} className="text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500" />
          </div>
          <SecretInput
            label="Client Secret *"
            placeholder="ELt0..."
            value={paypalSecret}
            onChange={setPaypalSecret}
          />
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600 dark:text-slate-200">Webhook ID <span className="text-slate-400 font-normal">(optionnel — recommandé en prod)</span></Label>
            <Input type="text" placeholder="WH-xxxx..." value={paypalWebhookId} onChange={(e) => setPaypalWebhookId(e.target.value)} className="text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500" />
          </div>
          <button
            onClick={handleConnectPayPal}
            disabled={paypalLoading || !paypalClientId.trim() || !paypalSecret.trim()}
            className="w-full text-sm font-semibold py-2.5 px-4 rounded-xl text-white bg-[#003087] hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
          >
            {paypalLoading ? "Vérification..." : "Connecter"}
          </button>
        </ProviderCard>

        {/* Lien tuto — visible uniquement si PayPal non connecté */}
        {!paypalConnected && (
          <Link
            href="/dashboard/tutorials/paypal"
            className="block text-center text-xs text-[#003087] dark:text-[#009CDE] hover:underline"
          >
            Pas encore de compte ? Créez-en un en 5 min →
          </Link>
        )}
        </div>

        {/* ── GOCARDLESS ───────────────────────────────────────────────── */}
        <ProviderCard
          accent="#00A27B"
          logo={<GoCardlessLogo size={16} />}
          name="GoCardless"
          tagline="Prélèvement SEPA automatique"
          fees="1% + 0,20€ / prélèvement"
          connected={gcConnected}
          connectedAt={getConnectedAt(accounts, "GOCARDLESS")}
          comingSoon
          formOpen={openProvider === "GOCARDLESS"}
          onToggleForm={() => toggleForm("GOCARDLESS")}
          onDisconnect={() => handleDisconnect("GOCARDLESS")}
          isDisconnecting={disconnecting === "GOCARDLESS"}
        >
          <TutoSteps steps={[
            { text: <>Allez sur <a href="https://manage.gocardless.com/developers/access-tokens" target="_blank" rel="noopener noreferrer" className="text-[#00A27B] hover:underline inline-flex items-center gap-0.5">manage.gocardless.com <ExternalLink className="h-2.5 w-2.5" /></a></> },
            { text: <>Créez un <strong>Access Token</strong> en lecture/écriture</> },
          ]} />

          <SecretInput
            label="Access Token *"
            placeholder="live_..."
            value={gcToken}
            onChange={setGcToken}
          />
          <button
            onClick={handleConnectGC}
            disabled={gcLoading || !gcToken.trim()}
            className="w-full text-sm font-semibold py-2.5 px-4 rounded-xl text-white bg-[#00A27B] hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
          >
            {gcLoading ? "Sauvegarde..." : "Connecter"}
          </button>
        </ProviderCard>

      </div>

      {/* Note dev Stripe CLI */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Test local Stripe (webhook)</p>
        <code className="block text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 font-mono">
          stripe listen --api-key sk_test_... --forward-to localhost:3000/api/webhooks/stripe
        </code>
        <p className="text-[11px] text-slate-400">Copie le <code>whsec_...</code> généré dans le champ Webhook Secret ci-dessus.</p>
      </div>
    </div>
  );
}

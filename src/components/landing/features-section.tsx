// Server Component — pas de hooks React ni event handlers
import { Bell, PieChart, Palette, FileStack, Zap, CreditCard, CheckCircle2, Send, Workflow, ArrowRight, ScanText, User, Hash, Package } from "lucide-react"

// ─── Petites feature cards (4 items) ─────────────────────────────────────────

const smallFeatures = [
  {
    icon: FileStack,
    title: "Tous vos documents",
    description: "Factures, devis, avoirs, bons de livraison, reçus... tout en un.",
    iconColor: "#06b6d4",
    bgColor: "#ecfeff",
  },
  {
    icon: Bell,
    title: "Relances automatiques",
    description: "3 niveaux de relances envoyés automatiquement à vos clients en retard.",
    iconColor: "#ef4444",
    bgColor: "#fee2e2",
  },
  {
    icon: PieChart,
    title: "Statistiques détaillées",
    description: "CA, TVA, clients actifs — exportable en CSV ou FEC comptable.",
    iconColor: "#3b82f6",
    bgColor: "#dbeafe",
  },
  {
    icon: Palette,
    title: "Design professionnel",
    description: "Logo, couleurs, templates métiers — entièrement personnalisable.",
    iconColor: "#a855f7",
    bgColor: "#f3e8ff",
  },
]

// ─── Animation 1 — Email + bouton paiement ────────────────────────────────────

function EmailPaymentDemo() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      {/* Mock email */}
      <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden text-left">
        {/* Header email */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-slate-400 w-6">De :</span>
            <span className="text-[11px] font-medium text-slate-600">contact@facturnow.fr</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-slate-400 w-6">À :</span>
            <span className="text-[11px] text-slate-600">client@entreprise.fr</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 w-6">Obj :</span>
            <span className="text-[11px] font-semibold text-slate-800">Facture FAC-2025-042 — 2 450,00 €</span>
          </div>
        </div>

        {/* Corps email */}
        <div className="px-4 py-4 space-y-3">
          <p className="text-[11px] text-slate-600">Bonjour,</p>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Veuillez trouver ci-joint votre facture <strong>FAC-2025-042</strong> d&apos;un montant de <strong>2 450,00 €</strong>.
          </p>
          <div className="flex items-center gap-2 py-2">
            <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center shrink-0">
              <Send className="h-3 w-3 text-slate-400" />
            </div>
            <span className="text-[10px] text-slate-500">facture-042.pdf</span>
          </div>

          {/* Bouton paiement + curseur positionné dessus */}
          <div className="pt-1 relative">
            <div className="email-pay-btn w-full py-2.5 rounded-lg text-white text-[12px] font-semibold text-center select-none overflow-hidden relative">
              <span className="email-btn-label transition-all duration-300">💳 Payer maintenant</span>
              {/* Ripple au clic */}
              <span className="email-ripple absolute inset-0 rounded-lg pointer-events-none" />
            </div>
            {/* Curseur ancré sur le bouton */}
            <div className="email-cursor absolute pointer-events-none" style={{ bottom: "-6px", right: "18px" }}>
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <path d="M4 2L16 10L10 11L7 17L4 2Z" fill="white" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Curseur : arrive depuis le bas-droite, se pose sur le btn, clique, repart */
        .email-cursor {
          animation: cursor-move 5s ease-in-out infinite;
          transform-origin: top left;
        }
        @keyframes cursor-move {
          0%    { transform: translate(60px, 50px); opacity: 0; }
          28%   { transform: translate(0, 0);             opacity: 1; }
          40%   { transform: translate(0, 0) scale(0.72); opacity: 1; }
          44%   { transform: translate(0, 0) scale(1);    opacity: 1; }
          75%   { transform: translate(0, 0);             opacity: 1; }
          100%  { transform: translate(60px, 50px); opacity: 0; }
        }

        /* Bouton — press et curseur synchronisés sur 40%/44% */
        .email-pay-btn {
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          animation: btn-state 5s linear infinite;
        }
        @keyframes btn-state {
          0%, 28%  { background: linear-gradient(135deg, #7c3aed, #a855f7); transform: scale(1); }
          40%      { background: linear-gradient(135deg, #5b21b6, #7c3aed); transform: scale(0.96); }
          44%      { background: linear-gradient(135deg, #5b21b6, #7c3aed); transform: scale(1.02); }
          48%, 80% { background: linear-gradient(135deg, #059669, #10b981); transform: scale(1); }
          92%      { background: linear-gradient(135deg, #7c3aed, #a855f7); transform: scale(1); }
        }

        /* Ripple — déclenché exactement à 40% */
        .email-ripple { animation: ripple 5s linear infinite; }
        @keyframes ripple {
          0%, 39%  { box-shadow: none; opacity: 0; }
          40%      { box-shadow: 0 0 0 0px rgba(255,255,255,0.6); opacity: 1; }
          47%      { box-shadow: 0 0 0 14px rgba(255,255,255,0); opacity: 0; }
          100%     { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ─── Animation 2 — Tableau dashboard + badge PAYÉE ────────────────────────────

function DashboardBadgeDemo() {
  const rows = [
    { num: "FAC-2025-041", client: "Studio Créatif", amount: "890,00 €",  status: "payee" },
    { num: "FAC-2025-042", client: "Agence Lumière", amount: "2 450,00 €", status: "anim" },
    { num: "FAC-2025-043", client: "Tech Solutions", amount: "1 200,00 €", status: "envoyee" },
  ]

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
        {/* Header tableau */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Factures récentes</span>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-slate-400">En direct</span>
          </div>
        </div>

        {/* Lignes */}
        <div className="divide-y divide-slate-50">
          {rows.map((row) => (
            <div key={row.num} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/50 transition-colors">
              <div>
                <p className="text-[11px] font-semibold text-violet-600">{row.num}</p>
                <p className="text-[10px] text-slate-400">{row.client}</p>
              </div>
              <p className="text-[11px] font-bold text-slate-800">{row.amount}</p>
              {row.status === "payee" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Payée</span>
              )}
              {row.status === "envoyee" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Envoyée</span>
              )}
              {row.status === "anim" && (
                <span className="relative inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold badge-anim-bg">
                  <span className="badge-text-envoyee">Envoyée</span>
                  <span className="badge-text-payee absolute inset-0 flex items-center justify-center">Payée</span>
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Mini KPIs */}
        <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-slate-50 border-t border-slate-100">
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">24</p>
            <p className="text-[9px] text-slate-400">Factures</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-emerald-600">18</p>
            <p className="text-[9px] text-slate-400">Payées</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-amber-600">6</p>
            <p className="text-[9px] text-slate-400">En attente</p>
          </div>
        </div>
      </div>

      <style>{`
        /* Fond du badge */
        .badge-anim-bg { animation: badge-bg 3.5s ease-in-out infinite; }
        @keyframes badge-bg {
          0%, 35%  { background-color: #fef3c7; transform: scale(1); }
          48%      { background-color: #d1fae5; transform: scale(1.12); }
          55%      { transform: scale(1); }
          85%, 100%{ background-color: #d1fae5; }
        }

        /* Texte "Envoyée" disparaît */
        .badge-text-envoyee { animation: text-out 3.5s ease-in-out infinite; color: #b45309; }
        @keyframes text-out {
          0%, 35%  { opacity: 1; }
          45%, 100%{ opacity: 0; }
        }

        /* Texte "Payée" apparaît */
        .badge-text-payee { animation: text-in 3.5s ease-in-out infinite; color: #065f46; }
        @keyframes text-in {
          0%, 38%  { opacity: 0; }
          50%, 100%{ opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ─── Animation 3 — Création de facture rapide ────────────────────────────────

function InvoiceCreationDemo() {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">

        {/* Header formulaire */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-amber-50/60">
          <span className="text-xs font-semibold text-slate-700">Nouvelle facture</span>
          <span className="text-[10px] text-amber-600 font-medium bg-amber-100 px-2 py-0.5 rounded-full">Brouillon</span>
        </div>

        <div className="px-4 py-3 space-y-3">
          {/* Champ client */}
          <div>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Client</p>
            <div className="h-7 rounded-lg border border-slate-200 bg-slate-50 px-2.5 flex items-center overflow-hidden">
              <span className="text-[11px] text-slate-700 form-field-1">Agence Lumière SAS</span>
            </div>
          </div>

          {/* Ligne de prestation */}
          <div>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Prestation</p>
            <div className="h-7 rounded-lg border border-slate-200 bg-slate-50 px-2.5 flex items-center overflow-hidden">
              <span className="text-[11px] text-slate-700 form-field-2">Développement site web — Lot 3</span>
            </div>
          </div>

          {/* Montant + TVA */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Montant HT</p>
              <div className="h-7 rounded-lg border border-slate-200 bg-slate-50 px-2.5 flex items-center">
                <span className="text-[11px] font-bold text-slate-800 form-field-3">2 450,00 €</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">TVA</p>
              <div className="h-7 rounded-lg border border-slate-200 bg-slate-50 px-2.5 flex items-center">
                <span className="text-[11px] text-slate-600">20% — 490,00 €</span>
              </div>
            </div>
          </div>

          {/* Total + bouton */}
          <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-400">Total TTC</p>
              <p className="text-sm font-bold text-slate-900 form-field-3">2 940,00 €</p>
            </div>
            <div className="create-btn px-3 py-1.5 rounded-lg text-white text-[11px] font-semibold cursor-pointer"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
              Envoyer par email →
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .form-field-1 { animation: field-appear 5s ease-in-out infinite; }
        .form-field-2 { animation: field-appear 5s ease-in-out 0.4s infinite; }
        .form-field-3 { animation: field-appear 5s ease-in-out 0.8s infinite; }
        @keyframes field-appear {
          0%, 10%  { opacity: 0; transform: translateX(-6px); }
          25%, 80% { opacity: 1; transform: translateX(0); }
          95%, 100%{ opacity: 0; transform: translateX(-6px); }
        }
        .create-btn { animation: btn-appear 5s ease-in-out 1.2s infinite; }
        @keyframes btn-appear {
          0%, 20%  { opacity: 0; transform: scale(0.9); }
          35%, 80% { opacity: 1; transform: scale(1); }
          88%      { opacity: 1; transform: scale(0.95); }
          92%      { opacity: 1; transform: scale(1.03); box-shadow: 0 0 0 4px rgba(124,58,237,0.2); }
          100%     { opacity: 0; transform: scale(0.9); }
        }
      `}</style>
    </div>
  )
}

// ─── Animation 4 — Import IA de bon de commande ───────────────────────────────

function BcImportDemo() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-xs space-y-3">

        {/* Document PDF source */}
        <div className="bc-pdf relative bg-white rounded-xl border-2 border-slate-200 shadow-md p-3 overflow-hidden">
          {/* Ligne de scan IA */}
          <div className="bc-scan-line absolute left-0 right-0 h-0.5 pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent 0%, #8b5cf6 30%, #a78bfa 50%, #8b5cf6 70%, transparent 100%)", boxShadow: "0 0 8px 2px rgba(139,92,246,0.45)" }} />

          {/* En-tête PDF */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-9 rounded flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #ef4444, #f87171)" }}>
              <span className="text-[7px] font-bold text-white leading-none">PDF</span>
            </div>
            <div className="flex-1">
              <div className="h-2 w-28 bg-slate-200 rounded mb-1" />
              <div className="h-1.5 w-20 bg-slate-100 rounded" />
            </div>
            <div className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">BC</div>
          </div>
          {/* Lignes de contenu simulées */}
          <div className="space-y-1.5">
            <div className="h-1.5 w-full bg-slate-100 rounded" />
            <div className="h-1.5 w-5/6 bg-slate-100 rounded" />
            <div className="h-1.5 w-4/5 bg-slate-100 rounded" />
            <div className="grid grid-cols-3 gap-1 pt-0.5">
              <div className="h-1.5 bg-slate-100 rounded" />
              <div className="h-1.5 bg-slate-100 rounded" />
              <div className="h-1.5 bg-slate-100 rounded" />
            </div>
          </div>
        </div>

        {/* Indicateur IA en traitement */}
        <div className="bc-ai-processing flex items-center justify-center gap-2 py-1">
          <div className="flex gap-1">
            <div className="bc-dot-1 w-1.5 h-1.5 rounded-full bg-violet-400" />
            <div className="bc-dot-2 w-1.5 h-1.5 rounded-full bg-violet-400" />
            <div className="bc-dot-3 w-1.5 h-1.5 rounded-full bg-violet-400" />
          </div>
          <span className="text-[10px] text-violet-500 font-medium">Extraction en cours…</span>
        </div>

        {/* Données extraites */}
        <div className="space-y-1.5">
          <div className="bc-field-1 flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-lg px-2.5 py-1.5">
            <User className="h-3.5 w-3.5 text-violet-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[8px] text-violet-400 font-semibold uppercase tracking-wide">Client</span>
              <p className="text-[11px] font-semibold text-slate-800 truncate">Acheteur Express SARL</p>
            </div>
          </div>
          <div className="bc-field-2 flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-lg px-2.5 py-1.5">
            <Hash className="h-3.5 w-3.5 text-violet-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[8px] text-violet-400 font-semibold uppercase tracking-wide">Référence BC</span>
              <p className="text-[11px] font-semibold text-slate-800">BC-2025-0089</p>
            </div>
          </div>
          <div className="bc-field-3 flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-lg px-2.5 py-1.5">
            <Package className="h-3.5 w-3.5 text-violet-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[8px] text-violet-400 font-semibold uppercase tracking-wide">Prestation · Montant HT</span>
              <p className="text-[11px] font-semibold text-slate-800 truncate">Intégration e-commerce · 3 200,00 €</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Scan line ── */
        .bc-scan-line {
          top: 0;
          animation: bc-scan 7s ease-in-out infinite;
        }
        @keyframes bc-scan {
          0%, 5%   { top: 0%; opacity: 0; }
          8%       { opacity: 1; }
          42%      { top: 100%; opacity: 1; }
          46%      { top: 100%; opacity: 0; }
          100%     { top: 0%; opacity: 0; }
        }

        /* PDF — glow violet pendant le scan */
        .bc-pdf {
          animation: bc-pdf-glow 7s ease-in-out infinite;
        }
        @keyframes bc-pdf-glow {
          0%, 5%   { border-color: #e2e8f0; }
          15%      { border-color: #a78bfa; box-shadow: 0 0 0 3px rgba(139,92,246,0.12); }
          45%      { border-color: #e2e8f0; box-shadow: none; }
          100%     { border-color: #e2e8f0; }
        }

        /* ── Dots "traitement IA" — apparaissent après le scan ── */
        .bc-ai-processing { animation: bc-processing-show 7s ease-in-out infinite; opacity: 0; }
        @keyframes bc-processing-show {
          0%, 44%  { opacity: 0; }
          50%, 60% { opacity: 1; }
          65%, 100%{ opacity: 0; }
        }

        /* Dots rebond décalé */
        .bc-dot-1 { animation: bc-dot-bounce 0.8s ease-in-out 0s infinite, bc-dot-visible 7s ease-in-out infinite; }
        .bc-dot-2 { animation: bc-dot-bounce 0.8s ease-in-out 0.15s infinite, bc-dot-visible 7s ease-in-out infinite; }
        .bc-dot-3 { animation: bc-dot-bounce 0.8s ease-in-out 0.30s infinite, bc-dot-visible 7s ease-in-out infinite; }
        @keyframes bc-dot-bounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        @keyframes bc-dot-visible {
          0%, 44%  { opacity: 0; }
          50%, 60% { opacity: 1; }
          65%, 100%{ opacity: 0; }
        }

        /* ── Champs extraits — apparaissent un par un ── */
        .bc-field-1 { opacity: 0; animation: bc-field-in 7s ease-in-out 0s infinite; }
        .bc-field-2 { opacity: 0; animation: bc-field-in 7s ease-in-out 0.25s infinite; }
        .bc-field-3 { opacity: 0; animation: bc-field-in 7s ease-in-out 0.5s infinite; }
        @keyframes bc-field-in {
          0%, 60%  { opacity: 0; transform: translateX(-10px); }
          70%, 88% { opacity: 1; transform: translateX(0); }
          96%, 100%{ opacity: 0; transform: translateX(-10px); }
        }
      `}</style>
    </div>
  )
}

// ─── Section principale ───────────────────────────────────────────────────────

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white">
      <div className="w-full px-4 sm:px-[8%] xl:px-[12%] py-16 xl:py-20">

        {/* Titre */}
        <div className="text-center mb-16">

          <h2 className="text-4xl md:text-5xl mb-4">
            <span className="text-gradient">Tout ce dont vous avez besoin</span>
            <br />
            <span className="text-slate-900">pour gérer vos factures</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Une solution complète qui automatise votre facturation de A à Z
          </p>
        </div>

        {/* ── Bento grid — 3 colonnes à partir de 1200px ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 wide:grid-cols-3 gap-5">

          {/* ── Ligne 1 : 3 grandes cartes animées ── */}

          {/* Grande carte 1 — Email + paiement animé */}
          <div className="rounded-2xl border border-indigo-200 bg-linear-to-br from-indigo-50 to-white shadow-sm overflow-hidden min-h-80 flex flex-col">
            <div className="p-6 pb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 mb-3">
                <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-600">Paiement en 1 clic</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Email + PDF + lien de paiement</h3>
              <p className="text-sm text-slate-500 mt-1">
                Vos clients reçoivent la facture et paient directement depuis l&apos;email — Stripe, PayPal ou SEPA.
              </p>
            </div>
            <div className="flex-1">
              <EmailPaymentDemo />
            </div>
          </div>

          {/* Grande carte 2 — Dashboard badge animé */}
          <div className="rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-white shadow-sm overflow-hidden min-h-80 flex flex-col">
            <div className="p-6 pb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 mb-3">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-600">Temps réel</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Tableau de bord en direct</h3>
              <p className="text-sm text-slate-500 mt-1">
                Statuts mis à jour automatiquement dès qu&apos;un paiement est reçu.
              </p>
            </div>
            <div className="flex-1">
              <DashboardBadgeDemo />
            </div>
          </div>

          {/* Grande carte 3 — Création facture animée */}
          <div className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 to-white shadow-sm overflow-hidden min-h-75 flex flex-col">
            <div className="p-6 pb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 mb-3">
                <Zap className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs font-semibold text-amber-600">Création ultra-rapide</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Une facture en moins de 2 minutes</h3>
              <p className="text-sm text-slate-500 mt-1">
                Client, prestation, montant — rempli en quelques clics avec l&apos;auto-complétion - clients et produits pré enregistrés. PDF généré instantanément.
              </p>
            </div>
            <div className="flex-1">
              <InvoiceCreationDemo />
            </div>
          </div>

          {/* ── Ligne 2 : Grande carte BC (col 1, 2 lignes) + 4 petites cartes (cols 2-3) ── */}

          {/* Grande carte BC — Import IA (occupe 2 lignes sur desktop) */}
          <div className="wide:col-span-1 wide:row-span-2 rounded-2xl border border-violet-200 bg-linear-to-br from-violet-50 to-white shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 pb-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100">
                  <ScanText className="h-3.5 w-3.5 text-violet-600" />
                  <span className="text-xs font-semibold text-violet-600">Import IA</span>
                </div>
                <span className="text-[10px] font-semibold text-violet-500 bg-violet-100 border border-violet-200 px-2 py-0.5 rounded-full">Business</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Bons de commande en 1 clic</h3>
              <p className="text-sm text-slate-500 mt-1">
                Uploadez le BC de votre client — l&apos;IA extrait le client, les prestations et les montants pour pré-remplir votre facture en quelques secondes.
              </p>
            </div>
            <div className="flex-1 min-h-64">
              <BcImportDemo />
            </div>
          </div>

          {/* 4 petites cartes — remplissent les 2 cols restants sur 2 lignes */}
          {smallFeatures.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 group"
                style={{ background: `linear-gradient(135deg, ${feature.bgColor} 0%, white 60%)` }}
              >
                <div
                  className="inline-flex p-2.5 rounded-xl mb-4"
                  style={{ backgroundColor: feature.iconColor }}
                >
                  <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            )
          })}

          {/* ── Ligne 4 : Carte Automatisations — pleine largeur ── */}
          <div className="md:col-span-2 wide:col-span-3 rounded-2xl border border-orange-200 bg-linear-to-br from-orange-50 to-white shadow-sm p-6 hover:shadow-md hover:border-orange-300 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="inline-flex p-2.5 rounded-xl bg-orange-500 shrink-0 self-start">
                <Workflow className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 mb-1">Automatisations intelligentes</h3>
                <p className="text-sm text-slate-500 mb-4">
                  FacturNow travaille pour vous — les tâches répétitives sont déclenchées automatiquement.
                </p>
                <div className="grid grid-cols-1 wide:grid-cols-3 gap-3">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-orange-100 shadow-sm">
                    <ArrowRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Devis accepté</p>
                      <p className="text-xs text-slate-500 mt-0.5">Acompte envoyé automatiquement au client dès l&apos;acceptation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-orange-100 shadow-sm">
                    <ArrowRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Devis → Facture</p>
                      <p className="text-xs text-slate-500 mt-0.5">Convertissez un devis en facture définitive en 1 clic</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-orange-100 shadow-sm">
                    <ArrowRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">API & Webhooks</p>
                      <p className="text-xs text-slate-500 mt-0.5">Connectez n8n, Zapier ou votre CRM via nos webhooks temps réel</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

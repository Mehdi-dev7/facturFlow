"use client"

import { Bell, PieChart, Palette, FileStack, Zap, CreditCard, CheckCircle2, Send } from "lucide-react"

// ─── Petites feature cards ─────────────────────────────────────────────────────

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

        {/* ── Bento grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Grande carte 1 — Email + paiement animé */}
          <div className="lg:col-span-1 rounded-2xl border border-indigo-200 bg-linear-to-br from-indigo-50 to-white shadow-sm overflow-hidden min-h-[320px] flex flex-col">
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
          <div className="lg:col-span-1 rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-white shadow-sm overflow-hidden min-h-[320px] flex flex-col">
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
          <div className="lg:col-span-1 rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 to-white shadow-sm overflow-hidden min-h-[300px] flex flex-col">
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

          {/* Petites cartes */}
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
        </div>

      </div>
    </section>
  )
}

// Server Component — pas de hooks ni event handlers
import { Calendar, AlertCircle, ArrowRight, CheckCircle2, Building2, Zap, ShieldCheck } from "lucide-react"
import Link from "next/link"

// ─── Section Facturation Électronique 2026 ────────────────────────────────────
// Cible les mots-clés : "facturation électronique obligatoire 2026",
// "facture électronique grandes entreprises", "conformité Factur-X France"

export function EInvoicingSection() {
  return (
    <section id="facturation-electronique" className="w-full px-4 sm:px-[8%] xl:px-[12%] py-16 xl:py-20">
      <div className="max-w-7xl mx-auto">

        <div className="rounded-2xl overflow-hidden border border-violet-200 bg-linear-to-br from-violet-50 via-white to-indigo-50">
          <div className="grid lg:grid-cols-2">

            {/* ── Colonne gauche — explication ──────────────────────────────── */}
            <div className="px-4 sm:px-[8%] xl:px-[12%] py-10 xl:py-20">

              {/* Badge "disponible maintenant" */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 mb-6">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Disponible maintenant</span>
              </div>

              {/* H2 optimisé SEO */}
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Facturation électronique :{" "}
                <span className="text-gradient">FacturNow est déjà conforme</span>
              </h2>

              <p className="text-slate-600 mb-4 leading-relaxed">
                À partir de <strong>septembre 2026</strong>, toutes les entreprises françaises B2B
                doivent émettre des <strong>factures électroniques conformes</strong> via
                une plateforme agréée. FacturNow est déjà opérationnel via{" "}
                <strong>SuperPDP</strong>, partenaire certifié DGFiP, sur le réseau <strong>Peppol</strong>.
              </p>

              {/* Callout grandes entreprises */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 mb-6">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">
                  <strong>Grandes entreprises & ETI :</strong> l&apos;obligation est dans{" "}
                  <strong>3 mois</strong>. FacturNow envoie vos factures via Peppol dès aujourd&apos;hui.
                </p>
              </div>

              {/* Checklist conformité — tout coché */}
              <ul className="space-y-3 mb-8">
                {[
                  "Format EN 16931 / CII conforme DGFiP",
                  "Transmission via réseau Peppol (SuperPDP certifié)",
                  "Inclus dès le plan Pro — sans surcoût",
                  "Opérationnel en production depuis juin 2026",
                ].map((label, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-violet-600 shrink-0" />
                    <span className="text-sm text-slate-700">{label}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Commencer gratuitement
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* ── Colonne droite — timeline ──────────────────────────────────── */}
            <div className="bg-slate-900 p-8 xl:p-12 flex flex-col justify-center">

              <div className="flex items-center gap-2 mb-8">
                <Calendar className="h-5 w-5 text-violet-400" />
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                  Calendrier d&apos;obligation
                </span>
              </div>

              <div className="space-y-0">

                {/* Étape 1 — Sept. 2026 Grandes entreprises */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="w-0.5 flex-1 min-h-[3rem] bg-slate-700 mt-2 mb-2" />
                  </div>
                  <div className="pt-1 pb-8">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 mb-2">
                      <span className="text-xs font-bold text-red-400">Sept. 2026 — Dans 3 mois</span>
                    </div>
                    <p className="text-white font-semibold text-sm">Grandes entreprises & PME</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Obligation d&apos;émettre et recevoir des factures B2B électroniques
                    </p>
                  </div>
                </div>

                {/* Étape 2 — Sept. 2027 Freelances */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-orange-400" />
                    </div>
                    <div className="w-0.5 flex-1 min-h-[3rem] bg-slate-700 mt-2 mb-2" />
                  </div>
                  <div className="pt-1 pb-8">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/20 mb-2">
                      <span className="text-xs font-bold text-orange-400">Sept. 2027</span>
                    </div>
                    <p className="text-white font-semibold text-sm">Freelances & auto-entrepreneurs</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Extension aux indépendants et micro-entreprises
                    </p>
                  </div>
                </div>

                {/* Badge "déjà opérationnel" — vert */}
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                  <Zap className="h-8 w-8 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-white font-semibold text-sm">FacturNow est déjà opérationnel</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Envoi via Peppol / SuperPDP actif depuis juin 2026 — prenez de l&apos;avance
                    </p>
                  </div>
                </div>

              </div>

              {/* Bloc "Pour les grandes entreprises" */}
              <div className="mt-6 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-start gap-3">
                <Building2 className="h-5 w-5 text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm mb-1">Vous êtes une grande entreprise ?</p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Vos fournisseurs freelances et PME doivent pouvoir vous envoyer des factures électroniques.
                    Avec FacturNow, ils sont conformes Peppol en quelques minutes.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

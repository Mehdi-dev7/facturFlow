// Server Component — pas de hooks ni event handlers
import { Calendar, AlertCircle, ArrowRight, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"

// ─── Section Facturation Électronique 2026 ────────────────────────────────────
// Cible les mots-clés : "facturation électronique obligatoire 2026",
// "facture électronique freelance", "conformité Factur-X France"

export function EInvoicingSection() {
  return (
    <section id="facturation-electronique" className="w-full px-4 sm:px-[8%] xl:px-[12%] py-16 xl:py-20">
      <div className="max-w-7xl mx-auto">

        <div className="rounded-2xl overflow-hidden border border-violet-200 bg-linear-to-br from-violet-50 via-white to-indigo-50">
          <div className="grid lg:grid-cols-2">

            {/* ── Colonne gauche — explication ──────────────────────────────── */}
            <div className="px-4 sm:px-[8%] xl:px-[12%] py-10 xl:py-20">

              {/* Badge "bientôt dispo" */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 border border-violet-200 mb-6">
                <Clock className="h-4 w-4 text-violet-600 shrink-0" />
                <span className="text-xs font-bold text-violet-700 uppercase tracking-wide">Disponible très prochainement</span>
              </div>

              {/* H2 optimisé SEO */}
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Facturation électronique :{" "}
                <span className="text-gradient">FacturNow vous prépare dès maintenant</span>
              </h2>

              <p className="text-slate-600 mb-8 leading-relaxed">
                À partir de <strong>septembre 2026</strong>, toutes les entreprises françaises B2B
                devront émettre et recevoir des <strong>factures électroniques conformes Factur-X</strong> via
                une plateforme agréée. Cette fonctionnalité est en cours de finalisation — elle sera
                intégrée via <strong>SuperPDP</strong>, partenaire certifié par la DGFiP, bien avant la date limite.
              </p>

              {/* Checklist conformité */}
              <ul className="space-y-3 mb-8">
                {[
                  { label: "Format Factur-X / EN 16931 conforme DGFiP", done: true },
                  { label: "Transmission via réseau Peppol (SuperPDP certifié)", done: true },
                  { label: "Inclus dès le plan Pro — sans surcoût", done: true },
                  { label: "Déploiement en cours — disponible avant l'été 2026", done: false },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    {item.done
                      ? <CheckCircle2 className="h-5 w-5 text-violet-600 shrink-0" />
                      : <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                    }
                    <span className={`text-sm ${item.done ? "text-slate-700" : "text-amber-700 font-medium"}`}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Être notifié à la sortie
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

                {/* Étape 1 — 2026 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="w-0.5 flex-1 min-h-[3rem] bg-slate-700 mt-2 mb-2" />
                  </div>
                  <div className="pt-1 pb-8">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 mb-2">
                      <span className="text-xs font-bold text-red-400">Sept. 2026 — Urgent</span>
                    </div>
                    <p className="text-white font-semibold text-sm">Entreprises & PME</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Obligation d&apos;émettre et de recevoir des factures électroniques B2B
                    </p>
                  </div>
                </div>

                {/* Étape 2 — 2027 */}
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

                {/* Badge transition en cours */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                  <Clock className="h-8 w-8 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-white font-semibold text-sm">Transition en douceur — bientôt disponible</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Intégration SuperPDP en cours de finalisation, bien avant l&apos;échéance légale
                    </p>
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

import Link from "next/link"

export function Footer() {
  return (
    <div className="px-4 sm:px-[8%] xl:px-[12%] py-12 sm:py-13 pb-0 bg-slate-900 relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 sm:pb-10">
        {/* Colonne 1 - Brand */}
        <div>
          <Link
            href="/"
            className="text-2xl  xl:text-4xl golos-text font-bold text-white"
          >
            Factur<span className="text-gradient">Now</span>
          </Link>
          <p className="text-slate-300 text-sm  my-4 sm:my-5 leading-relaxed">
            La solution de facturation intelligente pour freelances, PME et entreprises.
            Créez, envoyez et recevez vos paiements en toute simplicité.
          </p>
        </div>

        {/* Colonne 2 - Produit */}
        <div>
          <h3 className="text-base sm:text-lg  lg:text-xl text-white font-semibold mb-3 sm:mb-4">
            Produit
          </h3>
          <ul className="flex flex-col space-y-2">
            <Link href="#features"  className="text-slate-300 text-sm lg:text-base transition-all duration-300 hover:text-secondary hover:ml-2">Fonctionnalités</Link>
            <Link href="#pricing"   className="text-slate-300 text-sm lg:text-base transition-all duration-300 hover:text-secondary hover:ml-2">Tarifs</Link>
            <Link href="#payments"  className="text-slate-300 text-sm lg:text-base transition-all duration-300 hover:text-secondary hover:ml-2">Paiements sécurisés</Link>
            <Link href="#how"       className="text-slate-300 text-sm lg:text-base transition-all duration-300 hover:text-secondary hover:ml-2">Comment ça marche</Link>
            <Link href="/signup"    className="text-slate-300 text-sm lg:text-base transition-all duration-300 hover:text-secondary hover:ml-2">Essai gratuit 7 jours</Link>
          </ul>
        </div>

        {/* Colonne 3 - Support */}
        <div>
          <h3 className="text-base sm:text-lg lg:text-xl text-white font-semibold mb-3 sm:mb-4">
            Support & Aide
          </h3>
          <ul className="flex flex-col space-y-2">
            <Link href="#faq"                        className="text-slate-300 text-sm lg:text-base transition-all duration-300 hover:text-secondary hover:ml-2">Questions fréquentes</Link>
            <Link href="mailto:support@facturnow.fr" className="text-slate-300 text-sm lg:text-base transition-all duration-300 hover:text-secondary hover:ml-2">Nous contacter</Link>
            <Link href="mailto:support@facturnow.fr" className="text-slate-300 text-sm lg:text-base transition-all duration-300 hover:text-secondary hover:ml-2">support@facturnow.fr</Link>
          </ul>
        </div>

        {/* Colonne 4 - Ressources SEO — liens vers les pages longue traîne */}
        <div>
          <h3 className="text-base sm:text-lg lg:text-xl text-white font-semibold mb-3 sm:mb-4">
            Ressources
          </h3>
          <ul className="flex flex-col space-y-2">
            <Link href="/logiciel-facturation-freelance"   className="text-slate-300 text-sm lg:text-base transition-all duration-300 hover:text-secondary hover:ml-2">Facturation freelance</Link>
            <Link href="/facturation-auto-entrepreneur"    className="text-slate-300 text-sm lg:text-base transition-all duration-300 hover:text-secondary hover:ml-2">Facturation auto-entrepreneur</Link>
            <Link href="/facture-sepa-prelevement"         className="text-slate-300 text-sm lg:text-base transition-all duration-300 hover:text-secondary hover:ml-2">Prélèvement SEPA automatique</Link>
            <Link href="/facture-pdf-gratuite"             className="text-slate-300 text-sm lg:text-base transition-all duration-300 hover:text-secondary hover:ml-2">Facture PDF gratuite</Link>
            <Link href="/devis-facture-freelance"          className="text-slate-300 text-sm lg:text-base transition-all duration-300 hover:text-secondary hover:ml-2">Devis et facture freelance</Link>
            <Link href="/encaissement-facture-en-ligne"    className="text-slate-300 text-sm lg:text-base transition-all duration-300 hover:text-secondary hover:ml-2">Encaissement en ligne</Link>
          </ul>
        </div>

        {/* Colonne 5 - Légal */}
        <div>
          <h3 className="text-base sm:text-lg lg:text-xl text-white font-semibold mb-3 sm:mb-4">
            Légal
          </h3>
          <ul className="flex flex-col space-y-2">
            <Link href="/public/legal/mentions"  className="text-slate-300 text-sm lg:text-base transition-all duration-300 hover:text-secondary hover:ml-2">Mentions légales</Link>
            <Link href="/public/legal/privacy"   className="text-slate-300 text-sm lg:text-base transition-all duration-300 hover:text-secondary hover:ml-2">Politique de confidentialité</Link>
            <Link href="/public/legal/cgv"       className="text-slate-300 text-sm lg:text-base transition-all duration-300 hover:text-secondary hover:ml-2">CGU / CGV</Link>
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="flex flex-col justify-center items-center py-6 sm:py-8 border-t border-slate-700">
        <p className="text-slate-300 text-xs sm:text-base text-center">
          © 2026 FacturNow - Tous droits réservés. Développé avec ❤️ en France
        </p>
        <p className="text-slate-400 text-[11px] sm:text-sm mt-2 sm:mt-3 text-center max-w-3xl leading-relaxed">
          FacturNow est une solution SaaS de facturation conforme aux réglementations françaises et européennes.
          Stripe, PayPal et GoCardless sont des marques déposées de leurs propriétaires respectifs.
        </p>
        <div className="flex items-center space-x-4 sm:space-x-6 mt-3 sm:mt-4 text-xs sm:text-sm text-slate-400">
          <span>🇫🇷 Hébergé en France</span>
          <span>🔒 Certifié RGPD</span>
          <span>⚡ 99.9% uptime</span>
        </div>
      </div>
    </div>
  )
}

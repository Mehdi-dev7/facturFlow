import Link from "next/link"

export function Footer() {
  return (
    <div className="px-4 sm:px-[8%] lg:px-[12%] py-20 pb-0 bg-slate-900 relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-15">
        {/* Colonne 1 - Brand */}
        <div>
          <Link
            href="/"
            className="text-3xl lg:text-3xl golos-text xl:text-4xl font-bold text-white"
          >
            Factur<span className="text-gradient">Flow</span>
          </Link>
          <p className="text-slate-300 text-base my-5 leading-relaxed">
            La solution de facturation intelligente pour freelances, PME et entreprises. 
            Créez, envoyez et recevez vos paiements en toute simplicité.
          </p>
          <div className="flex space-x-4 mt-6">
            
          </div>
        </div>

        {/* Colonne 2 - Produit */}
        <div>
          <h3 className="text-xl text-white font-semibold mb-4">
            Produit
          </h3>
          <ul className="flex flex-col space-y-2">
            <Link
              href="#features"
              className="text-slate-300 text-base transition-all duration-300 hover:text-secondary hover:ml-2"
            >
              Fonctionnalités
            </Link>
            <Link
              href="#pricing"
              className="text-slate-300 text-base transition-all duration-300 hover:text-secondary hover:ml-2"
            >
              Tarifs
            </Link>
            <Link
              href="/demo"
              className="text-slate-300 text-base transition-all duration-300 hover:text-secondary hover:ml-2"
            >
              Démo en ligne
            </Link>
            <Link
              href="/templates"
              className="text-slate-300 text-base transition-all duration-300 hover:text-secondary hover:ml-2"
            >
              Templates de factures
            </Link>
            <Link
              href="/integrations"
              className="text-slate-300 text-base transition-all duration-300 hover:text-secondary hover:ml-2"
            >
              Intégrations
            </Link>
          </ul>
        </div>

        {/* Colonne 3 - Support */}
        <div>
          <h3 className="text-xl text-white font-semibold mb-4">
            Support & Aide
          </h3>
          <ul className="flex flex-col space-y-2">
            <Link
              href="#faq"
              className="text-slate-300 text-base transition-all duration-300 hover:text-secondary hover:ml-2"
            >
              Questions fréquentes
            </Link>
            <Link
              href="/contact"
              className="text-slate-300 text-base transition-all duration-300 hover:text-secondary hover:ml-2"
            >
              Nous contacter
            </Link>
            <Link
              href="/tutoriels"
              className="text-slate-300 text-base transition-all duration-300 hover:text-secondary hover:ml-2"
            >
              Guides d&apos;utilisation
            </Link>
            <Link
              href="/blog"
              className="text-slate-300 text-base transition-all duration-300 hover:text-secondary hover:ml-2"
            >
              Blog & Actualités
            </Link>
            <Link
              href="mailto:support@facturflow.fr"
              className="text-slate-300 text-base transition-all duration-300 hover:text-secondary hover:ml-2"
            >
              support@facturflow.fr
            </Link>
          </ul>
        </div>

        {/* Colonne 4 - Légal */}
        <div>
          <h3 className="text-xl text-white font-semibold mb-4">
            Légal
          </h3>
          <ul className="flex flex-col space-y-2">
            <Link
              href="/mentions-legales"
              className="text-slate-300 text-base transition-all duration-300 hover:text-secondary hover:ml-2"
            >
              Mentions légales
            </Link>
            <Link
              href="/confidentialite"
              className="text-slate-300 text-base transition-all duration-300 hover:text-secondary hover:ml-2"
            >
              Politique de confidentialité
            </Link>
            <Link
              href="/cgu"
                className="text-slate-300 text-base transition-all duration-300 hover:text-secondary hover:ml-2"
            >
              Conditions d&apos;utilisation
            </Link>
            <Link
              href="/cookies"
              className="text-slate-300 text-base transition-all duration-300 hover:text-secondary hover:ml-2"
            >
              Gestion des cookies
            </Link>
            <Link
              href="/securite"
              className="text-slate-300 text-base transition-all duration-300 hover:text-secondary hover:ml-2"
            >
              Sécurité & RGPD
            </Link>
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="flex flex-col justify-center items-center py-8 border-t border-slate-700">
        <p className="text-slate-300 text-base text-center">
          © 2026 FacturFlow - Tous droits réservés. Développé avec ❤️ en France
        </p>
        <p className="text-slate-400 text-sm mt-3 text-center max-w-3xl leading-relaxed">
          FacturFlow est une solution SaaS de facturation conforme aux réglementations françaises et européennes. 
          Stripe, PayPal et GoCardless sont des marques déposées de leurs propriétaires respectifs.
        </p>
        <div className="flex items-center space-x-6 mt-4 text-sm text-slate-400">
          <span>🇫🇷 Hébergé en France</span>
          <span>🔒 Certifié RGPD</span>
          <span>⚡ 99.9% uptime</span>
        </div>
      </div>
    </div>
  )
}
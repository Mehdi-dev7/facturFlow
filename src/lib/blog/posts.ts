// src/lib/blog/posts.ts
// Données statiques des articles de blog SEO.
// Chaque article est structuré en sections pour le rendu côté page.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlogSection {
  type: "intro" | "h2" | "h3" | "paragraph" | "list" | "cta_box"
  heading?: string
  text?: string
  items?: string[]
}

export interface BlogFaq {
  question: string
  answer: string
}

export interface BlogPost {
  slug: string
  title: string
  description: string
  publishedAt: string        // ISO "YYYY-MM-DD"
  updatedAt?: string
  category: string
  readingTime: number        // minutes
  keywords: string[]
  content: BlogSection[]
  faq: BlogFaq[]
}

// ─── Articles ─────────────────────────────────────────────────────────────────

export const blogPosts: BlogPost[] = [

  // ── Article 1 : Facture électronique 2026-2027 ───────────────────────────

  {
    slug: "facture-electronique-obligatoire-2026",
    title: "Facture Électronique Obligatoire en 2026-2027 : Ce Que Doit Savoir Chaque Freelance",
    description:
      "À partir de septembre 2026, la facture électronique devient obligatoire en France. Découvrez le calendrier, les formats acceptés et comment vous y préparer dès maintenant.",
    publishedAt: "2026-03-17",
    category: "Réglementation",
    readingTime: 8,
    keywords: [
      "facture électronique obligatoire 2026",
      "e-facture freelance",
      "réforme facturation électronique France",
      "Factur-X",
      "PDP plateforme dématérialisation",
      "facture électronique auto-entrepreneur",
      "SuperPDP",
      "DGFiP facturation électronique",
    ],
    content: [
      {
        type: "intro",
        text: "Depuis plusieurs années, l'administration fiscale française pousse vers la dématérialisation totale des factures B2B. En 2026, ce n'est plus une option : la facture électronique devient une obligation légale pour toutes les entreprises assujetties à la TVA, y compris les freelances et auto-entrepreneurs. Voici tout ce que vous devez savoir pour être en conformité.",
      },
      {
        type: "h2",
        heading: "Qu'est-ce que la facture électronique obligatoire ?",
        text: "La facture électronique (ou e-facture) est bien plus qu'un simple PDF envoyé par email. Il s'agit d'un document structuré dans un format standardisé — comme Factur-X, UBL ou CII — qui peut être lu et traité automatiquement par les logiciels de comptabilité et par l'administration fiscale. L'objectif de la réforme est double : lutter contre la fraude à la TVA et simplifier les obligations déclaratives des entreprises.",
      },
      {
        type: "h2",
        heading: "Le calendrier d'obligation : qui est concerné et quand ?",
        text: "La réforme se déploie en plusieurs phases selon la taille de l'entreprise :",
      },
      {
        type: "list",
        items: [
          "Septembre 2026 : toutes les entreprises doivent être capables de RECEVOIR des factures électroniques. Les grandes entreprises (plus de 5 000 salariés) doivent également ÉMETTRE en électronique.",
          "Septembre 2027 : obligation d'ÉMISSION pour les PME (250 à 5 000 salariés) et les ETI.",
          "Septembre 2027 : obligation pour les TPE, micro-entreprises, freelances et auto-entrepreneurs.",
        ],
      },
      {
        type: "paragraph",
        text: "Même si l'obligation d'émission pour les freelances est fixée à septembre 2027, il est fortement conseillé de se préparer dès maintenant. La transition d'un système de facturation traditionnel vers la facture électronique prend du temps, et les retardataires risquent des pénalités.",
      },
      {
        type: "h2",
        heading: "Les formats de facture électronique acceptés",
        text: "La DGFiP (Direction Générale des Finances Publiques) reconnaît trois formats principaux :",
      },
      {
        type: "list",
        items: [
          "Factur-X : format hybride PDF/XML, lisible par un humain (PDF) ET par un logiciel (XML embarqué). C'est le format recommandé pour les petites structures.",
          "UBL 2.1 (Universal Business Language) : format XML pur, standard international utilisé dans tout le secteur public européen.",
          "CII (Cross Industry Invoice) : format XML défini par UN/CEFACT, proche du Factur-X en termes de structure.",
        ],
      },
      {
        type: "h2",
        heading: "Qu'est-ce qu'une PDP (Plateforme de Dématérialisation Partenaire) ?",
        text: "Pour émettre et recevoir des factures électroniques conformes, vous devez passer par une PDP — une plateforme agréée par l'État. Ces plateformes servent d'intermédiaires entre votre logiciel de facturation et le Portail Public de Facturation (PPF) géré par la DGFiP. Elles garantissent l'authenticité, l'intégrité et la lisibilité des factures, conformément aux exigences légales.",
      },
      {
        type: "paragraph",
        text: "Il existe plusieurs PDP agréées en France. FacturNow a sélectionné SuperPDP comme partenaire technique — une plateforme certifiée ISO 27001, membre du réseau Peppol, qui garantit la transmission sécurisée de vos factures électroniques vers vos clients professionnels.",
      },
      {
        type: "h2",
        heading: "Ce qui change concrètement pour les freelances",
        text: "Pour un freelance, la transition vers la facture électronique implique plusieurs changements pratiques :",
      },
      {
        type: "list",
        items: [
          "Vous devrez renseigner votre SIREN dans votre logiciel de facturation — il sert d'identifiant électronique sur le réseau Peppol.",
          "Vos factures devront être transmises via une PDP, et non plus envoyées manuellement par email.",
          "Votre client recevra la facture directement sur sa plateforme de dématérialisation, sans intervention manuelle.",
          "Les statuts de factures (envoyée, reçue, acceptée, refusée, payée) seront automatiquement synchronisés entre vendeur et acheteur.",
        ],
      },
      {
        type: "h2",
        heading: "Les sanctions en cas de non-conformité",
        text: "Ne pas respecter l'obligation de facturation électronique expose à des pénalités financières. L'amende prévue est de 15 euros par facture non conforme, dans la limite de 15 000 euros par année civile. Pour un freelance qui émet plusieurs dizaines de factures par mois, le montant peut rapidement devenir significatif.",
      },
      {
        type: "h2",
        heading: "Comment FacturNow vous prépare dès aujourd'hui",
        text: "FacturNow intègre nativement la facturation électronique via SuperPDP. Concrètement, depuis votre tableau de bord, vous pouvez envoyer n'importe quelle facture sur le réseau Peppol en un seul clic. Le format Factur-X est généré automatiquement, sans aucune connaissance technique requise de votre part.",
      },
      {
        type: "list",
        items: [
          "Génération automatique du format Factur-X (hybride PDF/XML)",
          "Transmission via SuperPDP sur le réseau Peppol",
          "Suivi des statuts en temps réel (envoyée, reçue, acceptée, payée)",
          "Badge 'Conforme e-facturation 2026' visible sur votre tableau de bord",
          "Aucune configuration technique requise — il suffit d'activer la fonctionnalité",
        ],
      },
      {
        type: "h2",
        heading: "Les avantages méconnus de la facture électronique",
        text: "Au-delà de la simple conformité légale, la facturation électronique présente des avantages concrets pour votre activité :",
      },
      {
        type: "list",
        items: [
          "Délais de paiement réduits : les grandes entreprises traitent les e-factures plus rapidement que les PDF.",
          "Moins d'erreurs : les champs structurés éliminent les erreurs de ressaisie côté client.",
          "Archivage automatique : les plateformes PDP conservent vos factures pendant 10 ans.",
          "Pré-remplissage de la déclaration de TVA : à terme, la DGFiP exploitera les données pour simplifier vos obligations fiscales.",
          "Image professionnelle : être déjà conforme rassure vos grands clients donneurs d'ordre.",
        ],
      },
      {
        type: "h2",
        heading: "Les cas particuliers : transactions B2C et exportations",
        text: "La réforme ne concerne que les transactions B2B (entre professionnels assujettis à la TVA en France). Si vous facturez des particuliers (B2C) ou des clients à l'étranger, les règles actuelles s'appliquent toujours. Cependant, il est probable que les obligations s'étendent progressivement aux transactions internationales dans les années à venir.",
      },
      {
        type: "h2",
        heading: "Comment passer à la facture électronique en 5 étapes",
      },
      {
        type: "list",
        items: [
          "Étape 1 — Vérifier votre SIREN : il est obligatoire pour émettre sur le réseau Peppol. Sans SIREN valide, l'envoi électronique est impossible.",
          "Étape 2 — Choisir un logiciel compatible PDP : FacturNow intègre SuperPDP nativement, sans configuration supplémentaire.",
          "Étape 3 — Activer la fonctionnalité e-facturation dans vos paramètres FacturNow.",
          "Étape 4 — Tester avec une facture sandbox pour vérifier que tout fonctionne correctement.",
          "Étape 5 — Communiquer à vos clients professionnels que vous êtes désormais compatible e-facturation.",
        ],
      },
      {
        type: "cta_box",
        heading: "FacturNow est déjà prêt pour 2026",
        text: "Activez la facturation électronique en 1 clic depuis vos paramètres. Partenaire SuperPDP agréé DGFiP.",
      },
    ],
    faq: [
      {
        question: "La facture électronique est-elle obligatoire pour les auto-entrepreneurs ?",
        answer:
          "Oui, mais à partir de septembre 2027 pour l'émission. En revanche, tous les professionnels doivent être capables de recevoir des factures électroniques dès septembre 2026. Il est conseillé de se préparer dès maintenant.",
      },
      {
        question: "Un PDF envoyé par email est-il une facture électronique valide ?",
        answer:
          "Non. Un simple PDF par email n'est pas considéré comme une facture électronique au sens de la réforme. Une e-facture doit être dans un format structuré (Factur-X, UBL, CII) et transmise via une Plateforme de Dématérialisation Partenaire (PDP) agréée.",
      },
      {
        question: "Qu'est-ce que Factur-X et pourquoi est-il recommandé ?",
        answer:
          "Factur-X est un format hybride qui combine un PDF lisible par un humain et un fichier XML structuré lisible par les logiciels. C'est le format recommandé pour les petites structures car il reste visuellement identique à une facture classique tout en étant conforme aux exigences légales.",
      },
      {
        question: "Ai-je besoin d'un SIREN pour envoyer des factures électroniques ?",
        answer:
          "Oui, le SIREN est indispensable. Il sert d'adresse électronique sur le réseau Peppol et permet d'identifier de manière unique votre entreprise lors des échanges de factures. Sans SIREN valide, l'émission électronique est impossible.",
      },
      {
        question: "Que se passe-t-il si je ne respecte pas l'obligation ?",
        answer:
          "L'amende prévue est de 15 euros par facture non conforme, plafonnée à 15 000 euros par année civile. Pour un freelance émettant régulièrement des factures, ce montant peut être significatif.",
      },
      {
        question: "La facturation électronique concerne-t-elle les clients particuliers ?",
        answer:
          "Non. La réforme porte uniquement sur les transactions B2B entre professionnels assujettis à la TVA en France. Si vous facturez des particuliers (B2C) ou des clients à l'étranger, les règles actuelles continuent de s'appliquer.",
      },
      {
        question: "FacturNow gère-t-il automatiquement la facture électronique ?",
        answer:
          "Oui. FacturNow génère automatiquement le format Factur-X et transmet la facture via SuperPDP (PDP agréée DGFiP) en un seul clic depuis votre tableau de bord. Aucune configuration technique n'est requise.",
      },
      {
        question: "Quelle est la différence entre la PPF et une PDP ?",
        answer:
          "La PPF (Portail Public de Facturation) est la plateforme gérée directement par l'État. Une PDP (Plateforme de Dématérialisation Partenaire) est un acteur privé agréé par la DGFiP, comme SuperPDP. Les PDP offrent généralement plus de fonctionnalités et une meilleure intégration avec les logiciels de gestion.",
      },
    ],
  },

  // ── Article 2 : Comment facturer en auto-entrepreneur 2026 ────────────────

  {
    slug: "comment-facturer-auto-entrepreneur-2026",
    title: "Comment Facturer en tant qu'Auto-Entrepreneur en 2026 : Guide Complet",
    description:
      "Mentions obligatoires, numérotation, TVA, délais légaux : tout ce qu'un auto-entrepreneur doit savoir pour émettre des factures conformes en 2026.",
    publishedAt: "2026-03-17",
    category: "Guide pratique",
    readingTime: 9,
    keywords: [
      "facturer auto-entrepreneur 2026",
      "facture auto-entrepreneur mentions obligatoires",
      "numéro SIRET facture",
      "TVA auto-entrepreneur",
      "délai paiement facture freelance",
      "pénalités retard facture",
      "logiciel facturation auto-entrepreneur",
      "facture conforme micro-entreprise",
    ],
    content: [
      {
        type: "intro",
        text: "Lorsque vous démarrez votre activité en tant qu'auto-entrepreneur, la facturation peut sembler complexe. Pourtant, avec les bons réflexes et un bon outil, émettre des factures conformes à la loi est simple et rapide. Ce guide vous explique tout ce que vous devez savoir pour facturer correctement en 2026, éviter les erreurs courantes et vous faire payer dans les délais.",
      },
      {
        type: "h2",
        heading: "Qui doit émettre une facture en auto-entrepreneur ?",
        text: "En tant qu'auto-entrepreneur (ou micro-entrepreneur), vous êtes dans l'obligation d'émettre une facture pour toute prestation réalisée pour un professionnel ou une entreprise. Pour les clients particuliers, la facture est obligatoire uniquement si le client la demande ou si la prestation dépasse 25 euros TTC. Dans les faits, il est conseillé de toujours émettre une facture, quelle que soit la nature du client.",
      },
      {
        type: "h2",
        heading: "Les mentions obligatoires sur une facture auto-entrepreneur",
        text: "Une facture auto-entrepreneur doit impérativement contenir les informations suivantes pour être légalement valide :",
      },
      {
        type: "list",
        items: [
          "Vos nom et prénom (ou raison sociale), adresse complète",
          "Votre numéro SIRET (14 chiffres) — obligatoire, sans exception",
          "Le numéro de facture (séquentiel, sans trous)",
          "La date d'émission de la facture",
          "Les coordonnées complètes du client (nom, adresse)",
          "La description détaillée de la prestation ou du produit",
          "La quantité et le prix unitaire hors taxe",
          "Le taux de TVA applicable (ou mention d'exonération)",
          "Le montant total HT et TTC",
          "La date ou le délai de paiement",
          "Les pénalités de retard applicables",
          "L'indemnité forfaitaire de recouvrement (40 euros pour les professionnels)",
        ],
      },
      {
        type: "h2",
        heading: "La mention TVA spécifique aux auto-entrepreneurs",
        text: "La plupart des auto-entrepreneurs bénéficient de la franchise en base de TVA, ce qui signifie qu'ils ne collectent pas et ne déduisent pas la TVA. Dans ce cas, la mention suivante est obligatoire sur toutes vos factures : 'TVA non applicable — article 293 B du CGI'. Cette mention remplace le taux de TVA et le montant TTC.",
      },
      {
        type: "paragraph",
        text: "Attention : si votre chiffre d'affaires dépasse les seuils de franchise (36 800 euros pour les services en 2026), vous basculez automatiquement dans le régime TVA. Vous devrez alors facturer la TVA à 20% (ou au taux applicable), la déclarer et la reverser à l'État. FacturNow gère automatiquement cette bascule en fonction de votre paramétrage.",
      },
      {
        type: "h2",
        heading: "La numérotation des factures : une règle souvent méconnue",
        text: "La numérotation de vos factures doit suivre une séquence chronologique continue et sans trous. Vous ne pouvez pas supprimer une facture déjà émise — vous devez émettre un avoir si une erreur est constatée. Le format recommandé est : préfixe + année + numéro séquentiel (ex. : FAC-2026-0042).",
      },
      {
        type: "list",
        items: [
          "Ne jamais recommencer la numérotation en cours d'année",
          "Ne jamais sauter un numéro ou laisser des trous dans la séquence",
          "Ne jamais supprimer une facture — émettre un avoir à la place",
          "Conserver toutes les factures pendant 10 ans minimum",
        ],
      },
      {
        type: "h2",
        heading: "Les délais de paiement légaux en 2026",
        text: "La loi encadre strictement les délais de paiement entre professionnels. Par défaut, le délai est de 30 jours à compter de la date de réception de la facture ou d'exécution de la prestation. Ce délai peut être porté à 60 jours calendaires (ou 45 jours fin de mois) par accord entre les parties, mais jamais au-delà.",
      },
      {
        type: "paragraph",
        text: "Pour les particuliers, aucun délai légal n'est imposé, mais il est courant de prévoir 15 à 30 jours. Il est recommandé de préciser explicitement la date d'échéance sur chaque facture pour éviter les malentendus.",
      },
      {
        type: "h2",
        heading: "Les pénalités de retard : ce que vous pouvez réclamer",
        text: "Si un client professionnel ne vous paie pas dans les délais, vous êtes en droit de lui facturer des pénalités de retard. Celles-ci s'appliquent automatiquement, sans mise en demeure préalable. En 2026, le taux légal minimum est de 3 fois le taux d'intérêt légal (soit environ 12% par an).",
      },
      {
        type: "list",
        items: [
          "Pénalités de retard : minimum 3 fois le taux d'intérêt légal (taux pratiqué en 2026 : environ 12% annuel)",
          "Indemnité forfaitaire de recouvrement : 40 euros par facture impayée (obligatoire à mentionner sur la facture)",
          "Ces pénalités s'appliquent dès le lendemain de la date d'échéance, sans relance préalable",
          "Elles doivent être mentionnées sur toutes vos factures à destination de professionnels",
        ],
      },
      {
        type: "h2",
        heading: "Les erreurs de facturation les plus fréquentes",
        text: "Voici les erreurs que commettent le plus souvent les auto-entrepreneurs dans leur facturation :",
      },
      {
        type: "list",
        items: [
          "Oublier le numéro SIRET — c'est la mention la plus souvent manquante",
          "Ne pas indiquer la mention TVA non applicable (article 293 B du CGI)",
          "Omettre les pénalités de retard et l'indemnité forfaitaire de 40 euros",
          "Numérotation discontinue ou recommencer à 1 chaque année",
          "Date d'échéance absente ou floue ('paiement à réception' sans date précise)",
          "Description trop vague de la prestation ('prestation de service' sans détail)",
          "Conserver les factures uniquement en PDF non structuré (non conforme à la réforme 2026)",
        ],
      },
      {
        type: "h2",
        heading: "Comment FacturNow simplifie la facturation auto-entrepreneur",
        text: "FacturNow a été conçu spécifiquement pour les auto-entrepreneurs et freelances français. Le logiciel génère automatiquement toutes les mentions obligatoires, applique la bonne règle TVA selon votre statut, et numérote vos factures de façon séquentielle sans risque d'erreur.",
      },
      {
        type: "list",
        items: [
          "Mention 'TVA non applicable — art. 293 B du CGI' ajoutée automatiquement si vous êtes en franchise",
          "SIRET, SIREN, adresse : renseignés une seule fois dans vos paramètres, présents sur toutes les factures",
          "Numérotation automatique au format personnalisable (FAC-2026-XXXX)",
          "Pénalités de retard et indemnité de 40 euros incluses dans le pied de facture",
          "PDF professionnel généré en 1 clic, envoyé par email avec bouton de paiement",
          "Conforme à la réforme e-facturation 2026 via SuperPDP",
        ],
      },
      {
        type: "h2",
        heading: "Combien de temps conserver ses factures ?",
        text: "En tant qu'auto-entrepreneur, vous devez conserver vos factures pendant 10 ans à compter de leur date d'émission. Cette conservation peut être numérique, à condition que les documents soient lisibles et intègres. FacturNow archive automatiquement vos factures dans un espace sécurisé accessible à tout moment depuis votre tableau de bord.",
      },
      {
        type: "h2",
        heading: "Facture pro forma, avoir, acompte : les documents complémentaires",
        text: "Au-delà de la facture classique, votre activité peut nécessiter d'autres types de documents :",
      },
      {
        type: "list",
        items: [
          "Devis : document de présentation non exigible, envoyé avant la prestation pour accord client",
          "Acompte : facture partielle émise lors d'une commande, avant réalisation complète",
          "Facture proforma : document préparatoire sans valeur comptable, souvent utilisé pour valider un projet",
          "Avoir : document correctif émis pour annuler ou corriger une facture déjà émise",
          "Bon de livraison : document accompagnant une livraison physique, sans montant",
        ],
      },
      {
        type: "cta_box",
        heading: "Créez votre première facture conforme en 2 minutes",
        text: "FacturNow génère automatiquement toutes les mentions obligatoires. Essai gratuit 7 jours, sans carte bancaire.",
      },
    ],
    faq: [
      {
        question: "Suis-je obligé d'émettre une facture pour chaque prestation ?",
        answer:
          "Pour les clients professionnels, oui, systématiquement. Pour les particuliers, la facture est obligatoire si le montant dépasse 25 euros TTC ou si le client la demande. Dans tous les cas, il est fortement conseillé de toujours facturer.",
      },
      {
        question: "Quelle mention TVA mettre sur ma facture si je suis en franchise ?",
        answer:
          "Vous devez écrire : 'TVA non applicable — article 293 B du CGI'. Cette mention est obligatoire si votre chiffre d'affaires est en dessous des seuils de franchise (36 800 euros pour les prestations de service en 2026).",
      },
      {
        question: "Puis-je utiliser n'importe quel logiciel de facturation ?",
        answer:
          "Vous pouvez utiliser n'importe quel outil, mais il doit générer des factures avec toutes les mentions obligatoires et une numérotation séquentielle. Avec l'obligation de facturation électronique qui approche, préférez un logiciel compatible PDP comme FacturNow.",
      },
      {
        question: "Comment calculer les pénalités de retard ?",
        answer:
          "Le taux minimal légal est de 3 fois le taux d'intérêt légal (environ 12% par an en 2026). Pour une facture de 1 000 euros en retard de 30 jours : 1 000 × 12% × (30/365) = environ 9,86 euros de pénalités, plus 40 euros d'indemnité forfaitaire.",
      },
      {
        question: "Que faire si j'ai fait une erreur sur une facture émise ?",
        answer:
          "Vous ne pouvez pas modifier ou supprimer une facture émise. Vous devez émettre un avoir (facture négative) pour annuler la facture erronée, puis réémettre une nouvelle facture corrigée avec un nouveau numéro.",
      },
      {
        question: "Dois-je mentionner mon SIRET sur mes factures ?",
        answer:
          "Oui, c'est obligatoire. Le SIRET (14 chiffres) est l'identifiant unique de votre auto-entreprise. Son absence peut rendre votre facture non conforme et compliquer la déduction de TVA par votre client professionnel.",
      },
      {
        question: "Quel format pour numéroter mes factures ?",
        answer:
          "Il n'existe pas de format imposé, mais la numérotation doit être continue et chronologique. Le format recommandé est : préfixe + année + numéro (ex. FAC-2026-0001). Vous ne pouvez pas sauter de numéros ni recommencer à zéro en cours d'année.",
      },
      {
        question: "Combien de temps dois-je conserver mes factures ?",
        answer:
          "10 ans minimum à compter de la date d'émission. Cette conservation peut être numérique. FacturNow archive automatiquement toutes vos factures dans un espace sécurisé accessible à tout moment.",
      },
    ],
  },

  // ── Article 3 : Réduire les impayés avec les relances automatiques ────────

  {
    slug: "reduire-impayes-relances-automatiques",
    title: "Comment Réduire les Impayés de 80% avec les Relances Automatiques",
    description:
      "Les impayés coûtent cher aux freelances. Découvrez comment les relances automatiques en 3 niveaux et le prélèvement SEPA permettent de récupérer vos factures sans effort.",
    publishedAt: "2026-03-17",
    category: "Gestion financière",
    readingTime: 7,
    keywords: [
      "impayés freelance",
      "relances automatiques factures",
      "réduire impayés auto-entrepreneur",
      "relance amiable facture",
      "prélèvement SEPA facture",
      "GoCardless freelance",
      "recouvrement facture impayée",
      "délai paiement freelance",
    ],
    content: [
      {
        type: "intro",
        text: "En France, 25% des entreprises considèrent les retards de paiement comme une menace pour leur survie. Pour les freelances et auto-entrepreneurs, un impayé peut représenter plusieurs semaines de travail non rémunéré. Pourtant, la plupart des retards sont évitables grâce à un suivi rigoureux et des relances bien calibrées. Voici comment automatiser ce processus et réduire drastiquement vos impayés.",
      },
      {
        type: "h2",
        heading: "L'ampleur du problème des impayés en France",
        text: "Les chiffres sont alarmants. Selon les dernières études de la Banque de France, les délais de paiement entre entreprises dépassent régulièrement les délais légaux. En 2025, le délai moyen de paiement inter-entreprises atteignait 52 jours, soit 22 jours au-delà du délai légal de 30 jours.",
      },
      {
        type: "list",
        items: [
          "1 freelance sur 3 a subi au moins un impayé significatif au cours des 12 derniers mois",
          "Le délai moyen de paiement est de 52 jours pour les transactions B2B en France",
          "Plus de 25% des défaillances d'entreprises sont directement liées aux retards de paiement",
          "Les petites structures attendent en moyenne 60 à 90 jours avant d'entamer une démarche de recouvrement",
          "Le coût moyen d'un impayé non récupéré représente 2 à 3 fois le montant de la facture (temps perdu, frais de recouvrement)",
        ],
      },
      {
        type: "h2",
        heading: "Pourquoi les relances manuelles ne fonctionnent pas",
        text: "La plupart des freelances savent qu'ils devraient relancer leurs clients impayés, mais peu le font systématiquement. Les raisons sont multiples : peur de détériorer la relation client, manque de temps, oubli pur et simple. Or, chaque jour sans relance réduit les chances de récupérer votre argent.",
      },
      {
        type: "list",
        items: [
          "La procrastination : relancer un client est inconfortable, donc on reporte",
          "L'oubli : avec plusieurs factures en cours, difficile de suivre chaque échéance",
          "La peur du conflit : certains freelances préfèrent ne pas relancer pour ne pas 'froisser' le client",
          "Le manque de temps : rédiger une relance personnalisée prend du temps à chaque fois",
          "L'inconsistance : sans processus défini, les relances sont irrégulières et peu efficaces",
        ],
      },
      {
        type: "h2",
        heading: "Les 3 niveaux de relances : la méthode qui fonctionne",
        text: "Un système de relances efficace fonctionne par escalade progressive. Chaque niveau est plus ferme que le précédent, tout en restant professionnel. FacturNow automatise ces 3 niveaux sans aucune action de votre part.",
      },
      {
        type: "h3",
        heading: "Niveau 1 — Relance amiable (J+2 après échéance)",
        text: "Un email courtois qui rappelle simplement que la facture est arrivée à échéance. Ton amical, possible faute d'attention du client. Taux de résolution : environ 60% des retards se règlent à ce stade. Ce message est court, professionnel, sans accusation.",
      },
      {
        type: "h3",
        heading: "Niveau 2 — Relance ferme (J+7 après échéance)",
        text: "Si la première relance est restée sans réponse, le deuxième message est plus direct. On rappelle le montant exact, la date d'échéance dépassée, et on mentionne les pénalités de retard qui s'accumulent. Taux de résolution cumulé : environ 85% après cette relance.",
      },
      {
        type: "h3",
        heading: "Niveau 3 — Relance formelle (J+15 après échéance)",
        text: "Le dernier niveau avant mise en demeure officielle. Le ton est formel, les pénalités sont chiffrées, et on indique clairement les prochaines étapes légales en l'absence de paiement. À ce stade, 95% des factures finissent par être réglées.",
      },
      {
        type: "h2",
        heading: "Comment paramétrer les relances automatiques dans FacturNow",
        text: "L'activation des relances automatiques dans FacturNow prend moins de 2 minutes. Une fois configurées, elles s'appliquent à toutes vos nouvelles factures sans intervention manuelle.",
      },
      {
        type: "list",
        items: [
          "Accédez aux Paramètres > Relances dans votre tableau de bord FacturNow",
          "Activez les 3 niveaux de relances (activés par défaut en plan Pro)",
          "Personnalisez les délais si nécessaire (J+2, J+7, J+15 par défaut)",
          "Rédigez vos templates d'email ou utilisez les modèles fournis",
          "Chaque facture en retard déclenchera automatiquement les relances dans l'ordre",
        ],
      },
      {
        type: "h2",
        heading: "Le SEPA : la solution radicale contre les impayés",
        text: "Si les relances automatiques réduisent considérablement les impayés, le prélèvement SEPA les élimine presque totalement. Avec le SEPA, c'est vous qui initiez le prélèvement directement sur le compte bancaire de votre client — le paiement est automatique, à la date prévue, sans action du client.",
      },
      {
        type: "paragraph",
        text: "Concrètement, votre client signe un mandat SEPA une seule fois (en ligne, depuis un formulaire sécurisé). Ensuite, à chaque facture, FacturNow prélève automatiquement le montant sur son compte via GoCardless. Votre client ne peut plus 'oublier' de payer — le paiement est initié de votre côté.",
      },
      {
        type: "h2",
        heading: "GoCardless et SEPA : comment ça fonctionne avec FacturNow",
        text: "FacturNow intègre GoCardless, le leader européen du prélèvement SEPA, pour vous permettre d'encaisser vos factures automatiquement. La mise en place est simple :",
      },
      {
        type: "list",
        items: [
          "Connectez votre compte GoCardless depuis les paramètres de paiement",
          "Envoyez un lien de mandat SEPA à votre client depuis la facture",
          "Le client entre son IBAN et signe le mandat en ligne (5 minutes)",
          "Le mandat est activé par la banque sous 3 à 5 jours ouvrés",
          "Pour chaque facture suivante, FacturNow prélève automatiquement le montant à l'échéance",
          "Vous recevez une notification à chaque paiement confirmé",
        ],
      },
      {
        type: "h2",
        heading: "Relances + SEPA : la combinaison gagnante pour les clients récurrents",
        text: "Pour les clients avec qui vous travaillez régulièrement (missions longues, abonnements, contrats récurrents), la combinaison relances automatiques + SEPA est imbattable. Les relances protègent les paiements ponctuels, le SEPA sécurise les flux réguliers.",
      },
      {
        type: "list",
        items: [
          "Mission ponctuelle : activez les relances automatiques, le client paie par CB ou virement",
          "Client récurrent mensuel : proposez le mandat SEPA, chaque mois est prélevé automatiquement",
          "Projet en plusieurs étapes : utilisez les acomptes + relances pour chaque jallon",
          "Abonnement logiciel ou service : factures récurrentes + SEPA = zéro intervention manuelle",
        ],
      },
      {
        type: "h2",
        heading: "Les bonnes pratiques pour minimiser les impayés avant même la facture",
        text: "Les meilleures relances sont celles qu'on n'a pas à envoyer. Quelques réflexes simples réduisent considérablement le risque d'impayé dès le début de la relation client :",
      },
      {
        type: "list",
        items: [
          "Toujours signer un devis ou un bon de commande avant de démarrer une mission",
          "Demander un acompte de 30% à 50% pour les nouvelles missions ou les gros projets",
          "Vérifier la solvabilité d'un nouveau client professionnel (SIRET, Infogreffe)",
          "Inclure une clause de résiliation et de paiement partiel dans vos CGV",
          "Facturer rapidement après la livraison — ne pas attendre la fin du mois",
          "Proposer plusieurs modes de paiement (CB, PayPal, SEPA) pour faciliter le règlement",
        ],
      },
      {
        type: "h2",
        heading: "Que faire si toutes les relances échouent ?",
        text: "Dans les rares cas où les relances automatiques et les démarches amiables restent sans succès, des voies légales existent pour récupérer votre dû :",
      },
      {
        type: "list",
        items: [
          "Mise en demeure formelle par lettre recommandée avec accusé de réception",
          "Injonction de payer : procédure judiciaire simple et peu coûteuse pour les créances non contestées (tribunal compétent en fonction du montant)",
          "Médiation du crédit via la Banque de France pour les créances inter-entreprises",
          "Société de recouvrement amiable pour les créances importantes",
          "En dernier recours : action en justice devant le tribunal de commerce",
        ],
      },
      {
        type: "cta_box",
        heading: "Activez les relances automatiques dès aujourd'hui",
        text: "Relances en 3 niveaux + prélèvement SEPA inclus dans le plan Pro. 7 jours d'essai gratuit.",
      },
    ],
    faq: [
      {
        question: "À partir de quand les relances automatiques se déclenchent-elles ?",
        answer:
          "Dans FacturNow, les relances se déclenchent automatiquement à J+2, J+7 et J+15 après la date d'échéance de la facture. Ces délais sont personnalisables dans vos paramètres.",
      },
      {
        question: "Les relances automatiques peuvent-elles nuire à la relation client ?",
        answer:
          "Les relances bien rédigées et progressives ne nuisent pas à la relation client — elles font partie du processus commercial normal. La plupart des clients apprécient les rappels car ils oublient parfois eux-mêmes de payer. FacturNow propose des modèles de relances professionnels et polis.",
      },
      {
        question: "Qu'est-ce qu'un mandat SEPA et comment le faire signer ?",
        answer:
          "Un mandat SEPA est une autorisation que votre client vous donne pour prélever directement sur son compte bancaire. Dans FacturNow, vous lui envoyez un lien depuis la facture. Il remplit son IBAN et signe électroniquement en 5 minutes. Le mandat est valable jusqu'à révocation.",
      },
      {
        question: "Le prélèvement SEPA est-il sécurisé pour mon client ?",
        answer:
          "Oui. GoCardless, notre partenaire SEPA, est régulé par la FCA (Financial Conduct Authority) au Royaume-Uni et la Banque de France. Les prélèvements SEPA bénéficient d'une protection client : toute contestation dans les 8 semaines est automatiquement remboursée par la banque.",
      },
      {
        question: "Combien coûte le prélèvement SEPA via GoCardless ?",
        answer:
          "GoCardless prélève 1% + 0,20 euro par transaction, sans abonnement mensuel. Pour une facture de 1 000 euros, les frais sont de 10,20 euros. C'est souvent moins cher que Stripe (1,5% + 0,25 euro) pour les grosses factures.",
      },
      {
        question: "Puis-je désactiver les relances pour un client spécifique ?",
        answer:
          "Oui. Dans FacturNow, vous pouvez désactiver les relances automatiques sur une facture individuelle ou sur l'ensemble des factures d'un client particulier, depuis votre tableau de bord.",
      },
      {
        question: "Que faire si un client conteste une facture lors d'une relance ?",
        answer:
          "Si un client conteste la facture, il faut suspendre les relances automatiques pour ce document et traiter la situation manuellement. Dans FacturNow, vous pouvez mettre une facture 'en litige' pour stopper les relances et gérer le différend directement avec le client.",
      },
      {
        question: "Les relances automatiques fonctionnent-elles pour les factures récurrentes ?",
        answer:
          "Oui. Pour les factures récurrentes, FacturNow combine la génération automatique et les relances automatiques. Si une facture récurrente n'est pas payée dans les délais, le système de relances s'active exactement comme pour une facture classique.",
      },
    ],
  },

  // ── Article 4 : Prélèvement SEPA guide freelance ─────────────────────────

  {
    slug: "prelevement-sepa-guide-freelance",
    title: "Prélèvement SEPA : Le Guide Complet pour Freelances et Auto-Entrepreneurs",
    description:
      "Tout savoir sur le prélèvement SEPA pour freelances : comment ça fonctionne, comment mettre en place un mandat, les délais, les frais et pourquoi c'est la solution anti-impayés la plus efficace.",
    publishedAt: "2026-03-17",
    category: "Guide pratique",
    readingTime: 7,
    keywords: [
      "prélèvement SEPA freelance",
      "mandat SEPA facturation",
      "GoCardless freelance",
      "paiement automatique facture",
      "SEPA Direct Debit",
      "prélèvement bancaire automatique",
      "facture SEPA auto-entrepreneur",
    ],
    content: [
      {
        type: "intro",
        text: "Le prélèvement SEPA est la solution la plus puissante pour éliminer les impayés dans votre activité de freelance. Plutôt que d'attendre que le client paye, c'est vous qui initiez le paiement directement depuis son compte bancaire — avec son accord préalable. Voici comment ça fonctionne et comment le mettre en place.",
      },
      {
        type: "h2",
        heading: "Qu'est-ce que le prélèvement SEPA ?",
        text: "Le SEPA (Single Euro Payments Area) est l'espace de paiement unique en euros qui regroupe 36 pays européens. Le prélèvement SEPA (ou SEPA Direct Debit) permet à un créancier — vous, le freelance — de prélever directement le montant d'une facture sur le compte bancaire de votre client, après que celui-ci ait signé un mandat SEPA.",
      },
      {
        type: "h2",
        heading: "Comment fonctionne le mandat SEPA ?",
        text: "Le mandat SEPA est un document signé par votre client qui vous autorise à prélever son compte bancaire. Il contient l'IBAN du client, la référence unique du mandat (RUM) et la date de signature. Une fois signé, le mandat est valable indéfiniment — tant que vous l'utilisez au moins tous les 36 mois.",
      },
      {
        type: "list",
        items: [
          "Le client signe le mandat en ligne en quelques secondes (IBAN + signature électronique)",
          "Le mandat est activé sous 3 à 5 jours ouvrés par la banque",
          "Vous pouvez ensuite prélever à chaque facture sans aucune action du client",
          "Le client reçoit une notification avant chaque prélèvement",
          "Le client peut contester un prélèvement dans les 8 semaines",
        ],
      },
      {
        type: "h2",
        heading: "Pourquoi le SEPA élimine les impayés ?",
        text: "Avec un virement bancaire classique, le paiement dépend entièrement du bon vouloir du client : il peut oublier, repousser, ou tout simplement ne pas payer. Avec le SEPA, c'est l'inverse : c'est vous qui déclenchez le paiement à la date d'échéance. Le client ne peut pas 'oublier' de payer — le prélèvement se fait automatiquement.",
      },
      {
        type: "h2",
        heading: "Les délais à connaître",
        text: "Le prélèvement SEPA n'est pas instantané. Voici les délais à anticiper :",
      },
      {
        type: "list",
        items: [
          "Activation du mandat : 3 à 5 jours ouvrés après la signature du client",
          "Délai de préavis : vous devez notifier le client au moins 1 jour avant le prélèvement",
          "Délai d'encaissement : 1 à 2 jours ouvrés après l'initiation du prélèvement",
          "Délai de contestation client : 8 semaines pour un prélèvement autorisé, 13 mois pour un non autorisé",
        ],
      },
      {
        type: "h2",
        heading: "Les frais du prélèvement SEPA",
        text: "Le SEPA est l'un des modes de paiement les moins chers du marché. Via GoCardless (le partenaire SEPA de FacturNow), les frais sont de 1% + 0,20€ par transaction, plafonnés à 4€. Pour une facture de 1 000€, vous payez donc 10,20€ — contre 15-35€ pour une carte bancaire Stripe. Sur des factures récurrentes, l'économie est significative.",
      },
      {
        type: "h2",
        heading: "SEPA et facturation récurrente : la combinaison gagnante",
        text: "Pour les freelances qui facturent des clients au forfait mensuel, la combinaison SEPA + facturation récurrente est idéale. Vous configurez une fois la récurrence et le mandat SEPA, puis chaque mois : la facture est générée automatiquement, envoyée au client, et prélevée à l'échéance. Zéro intervention manuelle, zéro impayé.",
      },
      {
        type: "h2",
        heading: "Comment mettre en place le SEPA sur FacturNow ?",
        text: "La mise en place prend moins de 5 minutes :",
      },
      {
        type: "list",
        items: [
          "Connectez votre compte GoCardless depuis Tableau de bord → Paiements",
          "Créez ou ouvrez une facture et choisissez 'Prélèvement SEPA' comme mode de paiement",
          "Envoyez la facture au client — il reçoit un lien pour signer le mandat",
          "Une fois le mandat activé, les prochaines factures sont prélevées automatiquement",
        ],
      },
      {
        type: "h2",
        heading: "SEPA vs Stripe : lequel choisir ?",
        text: "Les deux ont leur place selon le contexte. Stripe (carte bancaire) est idéal pour les paiements ponctuels et rapides — le client paye immédiatement. Le SEPA est idéal pour les relations longues durées et les montants importants — moins de frais, paiement garanti à l'échéance. Pour les retenues de garantie ou les acomptes, Stripe est plus adapté. Pour les forfaits mensuels, le SEPA est indétrônable.",
      },
    ],
    faq: [
      {
        question: "Le prélèvement SEPA est-il sécurisé pour le freelance ?",
        answer:
          "Oui. Le freelance ne voit jamais l'IBAN complet du client (géré par GoCardless). Le mandat SEPA est protégé par la réglementation bancaire européenne. En cas de litige, la banque arbitre selon les preuves du mandat signé.",
      },
      {
        question: "Mon client peut-il refuser le prélèvement SEPA ?",
        answer:
          "Oui, le client est libre d'accepter ou non le mandat SEPA. Si un client refuse, vous pouvez proposer d'autres modes de paiement (virement, carte). Mais dans la pratique, la grande majorité des clients acceptent — c'est plus simple pour eux aussi.",
      },
      {
        question: "Que se passe-t-il si le compte du client est insuffisamment provisionné ?",
        answer:
          "Le prélèvement est rejeté par la banque et vous en êtes notifié. Vous pouvez alors relancer le client manuellement ou relancer un nouveau prélèvement. GoCardless facture des frais de rejet (environ 1,50€).",
      },
      {
        question: "Le SEPA fonctionne-t-il pour les clients en dehors de France ?",
        answer:
          "Oui, le SEPA couvre 36 pays dont tous les pays de l'Union Européenne, la Suisse, le Royaume-Uni et la Norvège. Tout client ayant un IBAN dans un pays SEPA peut signer un mandat.",
      },
      {
        question: "Combien de temps est valide un mandat SEPA ?",
        answer:
          "Un mandat SEPA est valide tant que vous l'utilisez. Il expire automatiquement après 36 mois sans activité. Vous pouvez aussi l'annuler à tout moment depuis votre tableau de bord.",
      },
      {
        question: "Est-ce que le SEPA remplace la facture ?",
        answer:
          "Non. Le SEPA est uniquement un mode de paiement. Vous devez toujours émettre une facture conforme avec toutes les mentions légales. Le prélèvement SEPA vient en complément — il déclenche le paiement de la facture.",
      },
      {
        question: "Faut-il un compte GoCardless séparé ?",
        answer:
          "Oui, vous devez créer un compte GoCardless (gratuit) et le connecter à FacturNow. L'argent est versé directement sur votre compte bancaire professionnel — GoCardless ne fait que transiter le paiement.",
      },
      {
        question: "Le SEPA est-il disponible sur le plan gratuit ?",
        answer:
          "Non, le prélèvement SEPA via GoCardless est disponible à partir du plan Pro (9,99€/mois). C'est l'une des fonctionnalités phares de FacturNow pour éliminer les impayés.",
      },
    ],
  },

  // ── Article 5 : Devis vs Facture ──────────────────────────────────────────

  {
    slug: "devis-vs-facture-difference",
    title: "Devis vs Facture : Quelle Différence ? Guide Complet pour Freelances",
    description:
      "Devis ou facture : quand utiliser l'un ou l'autre ? Quelles mentions obligatoires ? Quelle valeur juridique ? Tout ce que doit savoir un freelance ou auto-entrepreneur en France.",
    publishedAt: "2026-03-17",
    category: "Guide pratique",
    readingTime: 6,
    keywords: [
      "devis vs facture différence",
      "devis facture freelance",
      "mentions obligatoires devis",
      "valeur juridique devis",
      "quand envoyer un devis",
      "transformer devis en facture",
      "devis signé valeur contrat",
    ],
    content: [
      {
        type: "intro",
        text: "Devis ou facture — deux documents que tout freelance émet régulièrement, mais dont la différence n'est pas toujours claire. L'un engage moralement, l'autre engage financièrement et légalement. Savoir quand utiliser lequel, et comment les rédiger correctement, vous protège en cas de litige.",
      },
      {
        type: "h2",
        heading: "La différence fondamentale",
        text: "Le devis est une proposition commerciale : vous décrivez la prestation et son prix avant de commencer. La facture est un document comptable et fiscal : elle constate la réalité d'une vente ou d'une prestation réalisée. Le devis précède la mission, la facture la clôture.",
      },
      {
        type: "h2",
        heading: "Le devis : une promesse tarifaire",
        text: "Un devis est un document que vous envoyez à un prospect pour lui présenter votre offre. Il détaille les prestations, les quantités, les prix unitaires et le total TTC. Une fois signé par le client avec la mention 'Bon pour accord', il devient un engagement contractuel — vous êtes tenu de réaliser la prestation au prix indiqué.",
      },
      {
        type: "list",
        items: [
          "Pas d'obligation légale d'émettre un devis (sauf dans certains secteurs réglementés comme l'artisanat)",
          "Fortement recommandé pour toute prestation supérieure à 1 500€",
          "Valable pour une durée limitée que vous précisez (ex : 30 jours)",
          "Signé = engagement contractuel pour les deux parties",
          "Ne génère pas d'écriture comptable",
        ],
      },
      {
        type: "h2",
        heading: "La facture : une obligation légale",
        text: "Contrairement au devis, la facture est obligatoire dès lors qu'une prestation est réalisée entre professionnels (B2B) ou sur demande en B2C. Elle doit être émise dès la réalisation de la prestation ou à la livraison. C'est un document fiscal qui entre dans votre comptabilité et que vous devez conserver 10 ans.",
      },
      {
        type: "h2",
        heading: "Mentions obligatoires du devis",
        text: "Pour être valable, un devis doit mentionner :",
      },
      {
        type: "list",
        items: [
          "Vos coordonnées complètes (nom, adresse, SIRET)",
          "Les coordonnées du client",
          "La date du devis et sa durée de validité",
          "La description détaillée des prestations",
          "Le prix unitaire HT et le taux de TVA applicable",
          "Le total HT, TVA et TTC",
          "Les conditions de paiement prévues",
        ],
      },
      {
        type: "h2",
        heading: "Mentions obligatoires de la facture",
        text: "La facture est plus formelle et requiert des mentions supplémentaires :",
      },
      {
        type: "list",
        items: [
          "Numéro de facture unique et séquentiel (ex : FAC-2026-0042)",
          "Date d'émission et date d'échéance",
          "Vos coordonnées + SIRET + numéro de TVA intracommunautaire",
          "Coordonnées complètes du client",
          "Description des prestations, quantités, prix unitaires",
          "Mention 'TVA non applicable — article 293B du CGI' si auto-entrepreneur",
          "Pénalités de retard (taux légal) et indemnité forfaitaire de 40€",
        ],
      },
      {
        type: "h2",
        heading: "Transformer un devis en facture",
        text: "Une fois le devis accepté et la prestation réalisée, vous devez émettre une facture. Dans FacturNow, cette conversion est automatique : un clic sur 'Convertir en facture' reprend toutes les lignes du devis, génère le numéro de facture et calcule la date d'échéance. Vous n'avez rien à ressaisir.",
      },
      {
        type: "h2",
        heading: "L'acompte : entre le devis et la facture",
        text: "Pour les missions importantes, il est courant de demander un acompte (30 à 50%) à la signature du devis. L'acompte donne lieu à une facture d'acompte, distincte de la facture finale. La facture de solde, émise à la livraison, déduit l'acompte déjà versé. FacturNow gère ce flux automatiquement.",
      },
      {
        type: "h2",
        heading: "Quelle valeur juridique en cas de litige ?",
        text: "Un devis signé 'bon pour accord' a la valeur d'un contrat. Si le client refuse de payer après avoir accepté le devis, vous pouvez vous en prévaloir devant un tribunal. Une facture impayée peut faire l'objet d'une injonction de payer (procédure simple et rapide). Conservez toujours les accusés de réception de vos emails et les devis signés.",
      },
    ],
    faq: [
      {
        question: "Peut-on facturer sans avoir envoyé un devis ?",
        answer:
          "Oui, le devis n'est obligatoire que dans certains secteurs réglementés (artisanat, réparation auto, etc.). Pour les prestations intellectuelles (freelance, conseil, design), vous pouvez facturer directement. Mais le devis reste fortement recommandé pour éviter les litiges sur le prix.",
      },
      {
        question: "Un devis signé est-il un contrat ?",
        answer:
          "Oui. Un devis signé avec la mention 'Bon pour accord' constitue un contrat entre vous et votre client. Il engage les deux parties sur le périmètre et le prix de la prestation. En cas de litige, il fait foi devant les tribunaux.",
      },
      {
        question: "Peut-on modifier une facture après envoi ?",
        answer:
          "Non. Une facture émise ne peut pas être modifiée — c'est une obligation légale. Si vous avez fait une erreur, vous devez émettre un avoir (facture d'annulation) et réémettre une nouvelle facture corrigée.",
      },
      {
        question: "Quelle est la durée de validité d'un devis ?",
        answer:
          "Vous fixez librement la durée de validité de votre devis (généralement 30 jours). Passé ce délai, vous n'êtes plus tenu par les tarifs indiqués. Si le client accepte après expiration, vous pouvez réémettre un devis actualisé.",
      },
      {
        question: "Doit-on numéroter les devis ?",
        answer:
          "Il n'y a pas d'obligation légale de numéroter les devis, mais c'est fortement conseillé pour votre organisation et pour référencer vos documents en cas de litige. FacturNow numérote automatiquement vos devis (ex : DEV-2026-0012).",
      },
      {
        question: "Comment gérer la TVA sur un devis quand on est auto-entrepreneur ?",
        answer:
          "Si vous êtes en franchise de TVA (auto-entrepreneur sous le seuil), vous devez mentionner 'TVA non applicable — article 293B du CGI' sur votre devis ET sur votre facture. Vous ne collectez pas de TVA et vous ne la déduisez pas non plus.",
      },
      {
        question: "Peut-on convertir automatiquement un devis en facture ?",
        answer:
          "Oui, c'est l'une des fonctionnalités clés de FacturNow. Depuis la page Devis, un clic sur 'Convertir en facture' reprend toutes les lignes, génère le numéro de facture, calcule l'échéance et archive le devis comme 'accepté'. Aucune ressaisie nécessaire.",
      },
      {
        question: "Combien de temps doit-on conserver devis et factures ?",
        answer:
          "Les factures doivent être conservées 10 ans (obligation comptable et fiscale). Les devis n'ont pas de durée légale imposée, mais conservez-les au minimum 5 ans pour couvrir les délais de prescription commerciale.",
      },
    ],
  },

  // ── Article 6 : Facture récurrente & revenus mensuels automatisés ─────────

  {
    slug: "facture-recurrente-automatiser-revenus",
    title: "Facture Récurrente : Automatiser ses Revenus Mensuels en Freelance",
    description:
      "Arrêtez de refacturer manuellement chaque mois. Découvrez comment la facturation récurrente transforme votre activité freelance en revenus prévisibles et automatisés.",
    publishedAt: "2026-04-21",
    category: "Productivité",
    readingTime: 7,
    keywords: [
      "facture récurrente freelance",
      "facturation automatique mensuelle",
      "abonnement freelance facturation",
      "facture automatique auto-entrepreneur",
      "logiciel facturation récurrente",
      "automatiser factures mensuelles",
      "revenus récurrents freelance",
      "MRR freelance",
    ],
    content: [
      {
        type: "intro",
        text: "Chaque début de mois, c'est le même rituel : rouvrir la facture du mois précédent, changer la date, modifier le numéro, renvoyer l'email. Multiplié par 5, 10 ou 20 clients récurrents, c'est une heure perdue chaque mois — et surtout un risque d'oubli, de retard, ou d'erreur. La facturation récurrente résout ce problème en 5 minutes de configuration. Voici comment transformer vos missions au forfait en revenus 100% automatisés.",
      },
      {
        type: "h2",
        heading: "Qu'est-ce qu'une facture récurrente ?",
        text: "Une facture récurrente (ou facture automatique) est une facture émise à intervalle régulier — hebdomadaire, mensuel, trimestriel ou annuel — sans intervention manuelle. Vous définissez une fois le modèle (client, lignes, montant, TVA), la fréquence et la date de démarrage, puis le logiciel s'occupe de générer et d'envoyer la facture à chaque échéance.",
      },
      {
        type: "paragraph",
        text: "Ce mécanisme, longtemps réservé aux grandes entreprises et aux SaaS, est aujourd'hui accessible à tous les freelances et auto-entrepreneurs. Il change radicalement la nature de votre activité : vous passez d'un modèle à la mission (facturation ponctuelle) à un modèle à revenus récurrents (MRR), plus prévisible et plus scalable.",
      },
      {
        type: "h2",
        heading: "Pourquoi les freelances ont besoin de factures récurrentes",
        text: "Si vous travaillez avec ne serait-ce qu'un seul client au forfait mensuel, vous perdez du temps chaque mois à refacturer manuellement. Et chaque client supplémentaire multiplie le problème. Voici les raisons concrètes de passer à la facturation récurrente :",
      },
      {
        type: "list",
        items: [
          "Gain de temps direct : 5 à 10 minutes par client et par mois, soit plusieurs heures par an",
          "Zéro oubli : la facture est émise pile à la bonne date, même si vous êtes en vacances",
          "Numérotation toujours correcte : pas de risque de sauter un numéro ou d'en dupliquer un",
          "Revenus prévisibles : vous savez à l'avance combien vous allez encaisser chaque mois",
          "Meilleure image professionnelle : le client reçoit sa facture au jour près, toujours bien formatée",
          "Compta simplifiée : les écritures comptables suivent une fréquence régulière et propre",
        ],
      },
      {
        type: "h2",
        heading: "Les types de missions qui se prêtent à la facturation récurrente",
        text: "La facturation récurrente n'est pas réservée aux SaaS. De nombreux types de prestations freelance s'y prêtent parfaitement, dès lors qu'il y a un engagement dans la durée :",
      },
      {
        type: "list",
        items: [
          "Maintenance web / hébergement : contrat mensuel ou annuel avec un montant fixe",
          "Community management : forfait mensuel de gestion des réseaux sociaux",
          "Rédaction éditoriale : x articles par mois à prix forfaitaire",
          "Consultant en retainer : x heures d'accompagnement mensuel garanti",
          "Coaching / formation : abonnement mensuel à une série de sessions",
          "SEO / marketing digital : audit mensuel + optimisations récurrentes",
          "Photographe en contrat annuel : prestations mensuelles sur un événement récurrent",
          "Développeur en maintenance applicative : forfait mensuel de support et évolutions",
        ],
      },
      {
        type: "h2",
        heading: "Les fréquences disponibles : choisir la bonne cadence",
        text: "Selon la nature de la prestation, plusieurs fréquences sont possibles. FacturNow gère les quatre principales :",
      },
      {
        type: "list",
        items: [
          "Hebdomadaire : utile pour des prestations très ponctuelles et régulières (ex. streaming live, coaching intensif)",
          "Mensuelle : la plus fréquente pour les freelances — forfaits, retainers, abonnements",
          "Trimestrielle : idéale pour les consultants facturant par cycle de projet (audit + recommandations)",
          "Annuelle : hébergement, licences, maintenance logicielle, contrats cadre",
        ],
      },
      {
        type: "paragraph",
        text: "Vous pouvez aussi définir une date de fin pour limiter la récurrence à une durée précise (ex : 12 mois pour un contrat annuel), ou laisser la récurrence illimitée tant que le client ne résilie pas. La flexibilité est totale.",
      },
      {
        type: "h2",
        heading: "Le combo imbattable : récurrence + prélèvement SEPA",
        text: "La facturation récurrente élimine la génération manuelle. Le prélèvement SEPA élimine l'encaissement manuel. Combinez les deux, et vous obtenez un flux 100% automatisé : la facture est émise à la date prévue, envoyée par email au client, puis prélevée automatiquement sur son compte bancaire quelques jours plus tard. Aucune action de votre part. Aucun oubli possible du client.",
      },
      {
        type: "list",
        items: [
          "Mois 1 : vous configurez la récurrence + envoyez le mandat SEPA au client (5 minutes, une seule fois)",
          "Mois 2 et suivants : facture générée, envoyée et prélevée automatiquement",
          "Notification instantanée à chaque paiement confirmé sur votre tableau de bord",
          "Aucune relance nécessaire — le paiement est initié de votre côté, pas du sien",
          "Revenus mensuels garantis, prévisibles, sans effort",
        ],
      },
      {
        type: "h2",
        heading: "Comment configurer une récurrence dans FacturNow",
        text: "La mise en place d'une facturation récurrente dans FacturNow est volontairement simple. Voici le parcours complet :",
      },
      {
        type: "list",
        items: [
          "Étape 1 — Accédez à Tableau de bord → Récurrences → Nouvelle récurrence",
          "Étape 2 — Sélectionnez le client concerné (ou créez-le en ligne si besoin)",
          "Étape 3 — Ajoutez les lignes de facturation (produits/services, quantités, prix)",
          "Étape 4 — Choisissez la fréquence (hebdo, mensuelle, trimestrielle, annuelle)",
          "Étape 5 — Définissez la date de démarrage et, si nécessaire, la date de fin",
          "Étape 6 — Choisissez le mode de paiement (SEPA recommandé pour automatisation totale)",
          "Étape 7 — Activez la récurrence. C'est terminé — tout est désormais automatique.",
        ],
      },
      {
        type: "h2",
        heading: "Ce qui se passe automatiquement à chaque échéance",
        text: "Une fois la récurrence active, FacturNow exécute en coulisses toutes les étapes qu'un freelance ferait normalement à la main :",
      },
      {
        type: "list",
        items: [
          "Génération du PDF de la facture avec un nouveau numéro séquentiel",
          "Application automatique des mentions légales, TVA et pénalités de retard",
          "Envoi d'un email au client avec la facture en pièce jointe et le lien de paiement",
          "Si SEPA actif : initiation automatique du prélèvement à la date d'échéance",
          "Mise à jour du statut de la facture (envoyée → payée) sans action de votre part",
          "Enregistrement dans la comptabilité pour les exports FEC et URSSAF",
        ],
      },
      {
        type: "h2",
        heading: "Modifier ou suspendre une récurrence en cours",
        text: "Les contrats évoluent : changement de tarif, augmentation du périmètre, pause estivale, résiliation. FacturNow permet de tout gérer depuis la page Récurrences sans interrompre vos autres clients.",
      },
      {
        type: "list",
        items: [
          "Suspendre temporairement : la récurrence reste active mais aucune facture n'est générée tant qu'elle est en pause",
          "Modifier le montant ou les lignes : s'applique à la prochaine facture sans toucher aux précédentes",
          "Changer la date de fin : prolongation ou arrêt anticipé du contrat",
          "Annuler définitivement : la récurrence passe en statut 'archivée', les factures passées restent accessibles",
        ],
      },
      {
        type: "h2",
        heading: "Le passage au modèle MRR : un changement de mindset",
        text: "Au-delà de l'outil, la facturation récurrente change la façon dont vous vendez vos services. Plutôt que de chiffrer mission par mission, vous proposez des forfaits mensuels avec un engagement minimum (3, 6 ou 12 mois). Votre client paie un montant stable chaque mois, vous avez un revenu prévisible, et la relation s'installe dans la durée.",
      },
      {
        type: "paragraph",
        text: "C'est le modèle qu'ont adopté des milliers de freelances ces dernières années — consultants, community managers, développeurs en maintenance, coachs. Le résultat est presque toujours le même : moins de stress commercial, moins de temps perdu en prospection, plus de temps pour le travail à forte valeur ajoutée.",
      },
      {
        type: "h2",
        heading: "Les erreurs à éviter en passant à la récurrence",
        text: "Quelques pièges classiques à anticiper pour que la transition se passe sans accroc :",
      },
      {
        type: "list",
        items: [
          "Ne pas activer de récurrence sans avoir signé un contrat ou un devis clair qui mentionne la durée et les conditions de résiliation",
          "Ne pas oublier d'informer le client avant chaque hausse de tarif (préavis de 1 à 3 mois recommandé)",
          "Vérifier que le mandat SEPA reste actif (expiration automatique après 36 mois sans prélèvement)",
          "Prévoir une clause de pause estivale dans vos contrats pour les métiers saisonniers",
          "Garder un œil sur les rejets de prélèvement (provision insuffisante) pour relancer rapidement",
        ],
      },
      {
        type: "cta_box",
        heading: "Automatisez vos revenus dès cette semaine",
        text: "Récurrences + SEPA inclus dans le plan Pro. 7 jours d'essai gratuit, sans carte bancaire.",
      },
    ],
    faq: [
      {
        question: "Combien de récurrences puis-je créer simultanément ?",
        answer:
          "Le nombre de récurrences est illimité sur le plan Pro et Business. Sur le plan gratuit, vous êtes limité par le quota mensuel de 10 documents (toutes factures confondues, y compris celles générées par les récurrences).",
      },
      {
        question: "Puis-je personnaliser l'email envoyé automatiquement au client ?",
        answer:
          "Oui. Dans les paramètres de la récurrence, vous pouvez rédiger un modèle d'email personnalisé avec des variables dynamiques (numéro de facture, montant, date d'échéance). Le même email sera envoyé à chaque occurrence.",
      },
      {
        question: "Que se passe-t-il si mon client résilie en cours de mois ?",
        answer:
          "Vous pouvez suspendre ou annuler la récurrence en un clic depuis FacturNow. La facture du mois en cours, si elle a déjà été émise, reste valable. Les prochaines ne seront plus générées.",
      },
      {
        question: "Dois-je obligatoirement utiliser le SEPA avec une récurrence ?",
        answer:
          "Non, ce n'est pas obligatoire. Vous pouvez combiner la récurrence avec n'importe quel mode de paiement : virement bancaire, carte via Stripe, PayPal ou SEPA. Le SEPA reste toutefois le plus pertinent pour automatiser aussi l'encaissement.",
      },
      {
        question: "La TVA est-elle recalculée à chaque facture récurrente ?",
        answer:
          "Oui, la TVA est automatiquement calculée selon les taux applicables au moment de l'émission de chaque facture. Si votre statut TVA change (ex : dépassement du seuil de franchise), les prochaines factures appliqueront le nouveau régime.",
      },
      {
        question: "Puis-je avoir des récurrences avec des montants variables ?",
        answer:
          "Par défaut, une récurrence génère un montant fixe. Pour facturer un montant variable chaque mois (ex : facturation à l'usage), vous pouvez modifier la récurrence avant chaque échéance, ou utiliser des factures classiques avec un modèle réutilisable.",
      },
      {
        question: "Les factures récurrentes sont-elles conformes à la réforme e-facturation 2026 ?",
        answer:
          "Oui. Chaque facture générée par une récurrence est une facture conforme au même titre qu'une facture manuelle. Elle peut être transmise au format Factur-X via SuperPDP en un clic, ou automatiquement si vous activez l'envoi électronique dans la récurrence.",
      },
      {
        question: "Y a-t-il un suivi pour savoir quelles récurrences ont généré des factures impayées ?",
        answer:
          "Oui. Le tableau de bord Récurrences affiche pour chaque abonnement le taux de paiement, la date de la dernière facture émise et les impayés en cours. Si une facture récurrente n'est pas payée, les relances automatiques se déclenchent exactement comme pour une facture classique.",
      },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Récupère tous les articles (triés par date desc) */
export function getAllPosts(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

/** Récupère un article par slug — null si inexistant */
export function getPostBySlug(slug: string): BlogPost | null {
  return blogPosts.find((p) => p.slug === slug) ?? null
}

/** Retourne tous les slugs (pour generateStaticParams) */
export function getAllSlugs(): string[] {
  return blogPosts.map((p) => p.slug)
}

/** Formate une date ISO en français : "17 mars 2026" */
export function formatDateFR(iso: string): string {
  const months = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ]
  const [year, month, day] = iso.split("-").map(Number)
  return `${day} ${months[month - 1]} ${year}`
}

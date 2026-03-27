import type { NextConfig } from "next";

// ─── Headers de sécurité HTTP ─────────────────────────────────────────────────
//
// Appliqués sur toutes les routes (source: "/(.*)" ).
// Références : OWASP Secure Headers Project + MDN.
//
// Points importants :
//  - CSP : 'unsafe-inline' pour les styles (Tailwind/shadcn en ont besoin),
//    'unsafe-eval' uniquement en dev (React Fast Refresh).
//    En production on retire 'unsafe-eval'.
//  - frame-ancestors : remplace X-Frame-Options (plus moderne, même effet).
//  - connect-src : autorise l'URL de l'app + Supabase storage + Resend + providers paiement.
//    Adapter NEXT_PUBLIC_SUPABASE_URL si nécessaire.

const isDev = process.env.NODE_ENV === "development";

const cspDirectives = [
  "default-src 'self'",
  // Scripts : 'unsafe-inline' pour Next.js inline scripts, 'unsafe-eval' limité au dev
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  // Styles : 'unsafe-inline' requis par Tailwind CSS
  "style-src 'self' 'unsafe-inline'",
  // Images : self + data URIs (avatars base64) + Google/GitHub avatars
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
  // Fonts : self + data URIs
  "font-src 'self' data:",
  // Fetch / XHR vers notre API + Supabase + providers externes
  "connect-src 'self' https://*.supabase.co https://api.resend.com https://api.stripe.com https://api.sandbox.gocardless.com https://api.gocardless.com",
  // Iframes : on en a besoin uniquement pour Stripe Elements / GoCardless flows
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://pay.gocardless.com",
  // Bloque le chargement de NOTRE app dans une iframe externe (clickjacking)
  "frame-ancestors 'none'",
  // Objets et embeds : interdits
  "object-src 'none'",
  // Base URI : self uniquement (empêche injection de <base href>)
  "base-uri 'self'",
  // Form action : self uniquement
  "form-action 'self'",
  // Upgrade HTTP → HTTPS automatiquement
  "upgrade-insecure-requests",
];

const securityHeaders = [
  // ── Anti-clickjacking (legacy, au cas où frame-ancestors CSP serait ignoré) ─
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // ── Empêche le MIME-type sniffing ─────────────────────────────────────────
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // ── Force HTTPS pendant 2 ans, inclut les sous-domaines ──────────────────
  // Ne pas activer preload sans avoir soumis le domaine sur hstspreload.org
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  // ── Contrôle l'info du Referrer envoyée aux tiers ─────────────────────────
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // ── Désactive les API navigateur non utilisées ────────────────────────────
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  // ── Content Security Policy ───────────────────────────────────────────────
  {
    key: "Content-Security-Policy",
    value: cspDirectives.join("; "),
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {},
  // Supprime le header X-Powered-By (évite de révéler le framework)
  poweredByHeader: false,
  // ── Tree-shaking optimisé pour ces librairies (réduit le bundle initial) ──
  experimental: {
    // Cache les pages dynamiques (auth/cookies) dans le router client pendant 30s
    // Sans ça, Next.js 15+ re-fetch à chaque navigation (staleTime: 0 par défaut)
    staleTimes: {
      dynamic: 30,
    },
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
      "date-fns",
      "@radix-ui/react-icons",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  // ── Ajout des headers de sécurité sur toutes les routes ─────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

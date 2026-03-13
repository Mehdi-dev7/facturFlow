// src/lib/rate-limit.ts
//
// Rate limiter in-memory léger — pas de dépendance externe (Redis, Upstash, etc.).
//
// Principe : sliding window.
// On conserve en mémoire une Map<clé, timestamps[]> où chaque entrée enregistre
// les instants des N dernières requêtes. À chaque appel on purge les timestamps
// trop anciens et on vérifie si la limite est atteinte.
//
// Limitations :
//  - Fonctionne sur un seul processus Node.js. Sur Vercel Serverless chaque
//    instance est indépendante → le compteur est par instance, pas global.
//    C'est intentionnel : sans Redis c'est le meilleur compromis disponible.
//    Pour un vrai rate limiting distribué, brancher @upstash/ratelimit.
//  - La Map est purgée automatiquement toutes les 5 minutes pour éviter les fuites mémoire.
//
// Usage dans une route :
//   const ip = getClientIp(request)
//   const { limited, remaining } = rateLimit(ip, { max: 5, windowMs: 60_000 })
//   if (limited) return Response.json({ error: "Too many requests" }, { status: 429 })

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RateLimitOptions {
  /** Nombre maximum de requêtes dans la fenêtre */
  max: number;
  /** Durée de la fenêtre en millisecondes */
  windowMs: number;
  /** Préfixe optionnel pour isoler des compteurs différents */
  prefix?: string;
}

export interface RateLimitResult {
  /** true si la limite est dépassée (à bloquer) */
  limited: boolean;
  /** Nombre de requêtes restantes dans la fenêtre */
  remaining: number;
  /** Timestamp (ms) auquel la fenêtre se réinitialise */
  resetAt: number;
}

// ─── Store in-memory ──────────────────────────────────────────────────────────

// Map globale : clé → liste des timestamps des requêtes dans la fenêtre courante
const store = new Map<string, number[]>();

// Nettoyage périodique pour éviter les fuites mémoire
let cleanupScheduled = false;
function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store.entries()) {
      // Supprimer les entrées vides ou avec des timestamps très anciens (>1h)
      if (timestamps.length === 0 || now - (timestamps[0] ?? 0) > 3_600_000) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000); // toutes les 5 minutes
}

// ─── Fonction principale ─────────────────────────────────────────────────────

/**
 * Vérifie et incrémente le compteur pour une clé donnée.
 *
 * @param key  Identifiant unique du client (IP, userId, etc.)
 * @param opts Fenêtre et limite
 */
export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  scheduleCleanup();

  const { max, windowMs, prefix = "rl" } = opts;
  const storeKey = `${prefix}:${key}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Récupérer ou créer le tableau de timestamps
  let timestamps = store.get(storeKey) ?? [];

  // Purger les timestamps hors fenêtre
  timestamps = timestamps.filter((t) => t > windowStart);

  const count = timestamps.length;
  const limited = count >= max;

  if (!limited) {
    // Enregistrer cette requête
    timestamps.push(now);
  }

  store.set(storeKey, timestamps);

  // Le reset est calculé à partir du plus ancien timestamp dans la fenêtre
  const oldest = timestamps[0] ?? now;
  const resetAt = oldest + windowMs;

  return {
    limited,
    remaining: Math.max(0, max - timestamps.length),
    resetAt,
  };
}

// ─── Helper : extraire l'IP du client depuis les headers Next.js ──────────────

/**
 * Extrait l'IP réelle du client depuis les headers de la requête.
 * Priorité : x-forwarded-for (Vercel/proxies) → x-real-ip → "anonymous".
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for peut contenir "IP1, IP2, IP3" → on prend la première
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "anonymous";
}

// ─── Helpers prêts à l'emploi pour les routes sensibles ──────────────────────

/**
 * Rate limit strict pour les routes d'authentification.
 * 10 tentatives par minute par IP.
 */
export function authRateLimit(request: Request): RateLimitResult {
  const ip = getClientIp(request);
  return rateLimit(ip, { max: 10, windowMs: 60_000, prefix: "auth" });
}

/**
 * Rate limit pour l'API publique v1.
 * 60 requêtes par minute par clé API (identifiée par le token haché en préfixe).
 */
export function apiV1RateLimit(request: Request): RateLimitResult {
  const authHeader = request.headers.get("Authorization") ?? "";
  // On utilise les 16 premiers chars du token comme clé (pas le token complet)
  const tokenPrefix = authHeader.slice(7, 23) || getClientIp(request);
  return rateLimit(tokenPrefix, { max: 60, windowMs: 60_000, prefix: "api_v1" });
}

/**
 * Rate limit pour les liens de paiement (anti-abuse).
 * 20 requêtes par minute par IP.
 */
export function paymentRateLimit(request: Request): RateLimitResult {
  const ip = getClientIp(request);
  return rateLimit(ip, { max: 20, windowMs: 60_000, prefix: "pay" });
}

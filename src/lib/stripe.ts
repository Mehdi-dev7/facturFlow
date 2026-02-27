// src/lib/stripe.ts
// Factory Stripe : chaque user a sa propre clé secrète stockée chiffrée en DB.
// On instancie Stripe à la volée avec la clé décryptée.

import Stripe from "stripe";

/**
 * Crée une instance Stripe avec la clé secrète du user.
 * La clé est récupérée depuis PaymentAccount après déchiffrement.
 */
export function getStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey);
}

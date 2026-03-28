// src/app/api/founder-spots/route.ts
// Route publique — retourne le nombre de places Fondateur restantes.
// Interroge Stripe pour connaître le nombre d'utilisations du code promo FONDATEUR.
// Revalidée toutes les heures (ISR).

import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const TOTAL_SPOTS = 50;

// Cache ISR côté Next.js : la réponse est régénérée au plus toutes les 3600s
export const revalidate = 3600;

export async function GET() {
  try {
    // Récupérer le code promo "FONDATEUR" depuis l'API Stripe
    const promoCodes = await stripe.promotionCodes.list({ code: "FONDATEUR", limit: 1 });
    const promo = promoCodes.data[0];

    // Si le code n'existe pas encore dans Stripe, toutes les places sont disponibles
    if (!promo) {
      return NextResponse.json({ remaining: TOTAL_SPOTS, total: TOTAL_SPOTS });
    }

    const remaining = Math.max(0, TOTAL_SPOTS - promo.times_redeemed);
    return NextResponse.json({ remaining, total: TOTAL_SPOTS });
  } catch {
    // En cas d'erreur Stripe, on retourne le max pour ne pas bloquer l'affichage
    return NextResponse.json({ remaining: TOTAL_SPOTS, total: TOTAL_SPOTS });
  }
}

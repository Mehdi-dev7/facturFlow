"use client";
// src/hooks/use-payment-accounts.ts
// Récupère les comptes de paiement connectés de l'utilisateur (Stripe, PayPal, GoCardless)

import { useQuery } from "@tanstack/react-query";
import { getPaymentAccounts } from "@/lib/actions/payments";

export function usePaymentAccounts() {
  return useQuery({
    queryKey: ["paymentAccounts"],
    queryFn: getPaymentAccounts,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/** Retourne un objet { stripe, paypal, gocardless } → true si le provider est connecté et actif */
export function useConnectedProviders() {
  const { data: accounts } = usePaymentAccounts();

  if (!accounts) return { stripe: false, paypal: false, gocardless: false };

  return {
    stripe: accounts.some((a) => a.provider === "STRIPE" && a.isActive),
    paypal: accounts.some((a) => a.provider === "PAYPAL" && a.isActive),
    gocardless: accounts.some((a) => a.provider === "GOCARDLESS" && a.isActive),
  };
}

// src/app/api/cron/disconnect-trial-payments/route.ts
// Cron quotidien (via nightly) : déconnexion des paiements J+7 après fin de trial.
// L'email J+0 (trial expiré) mentionne déjà la déco à J+7 — pas d'email supplémentaire.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// ─── Logique exportée (appelée par le nightly master cron) ───────────────────

export async function runDisconnectTrialPayments(): Promise<{
  disconnected: number;
}> {
  const now = new Date();
  const disconnect7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let disconnected = 0;

  // ── J+7 : déconnecter les paiements (trial expiré il y a > 7 jours) ─────────
  // On cherche les users FREE dont le trial est expiré depuis plus de 7 jours
  // ET qui ont encore des PaymentAccounts enregistrés.
  const usersToDisconnect = await prisma.user.findMany({
    where: {
      trialEndsAt: { lt: disconnect7Days },
      plan: "FREE",
      trialUsed: true,
      // Uniquement ceux qui ont encore des moyens de paiement connectés
      paymentAccounts: { some: {} },
    },
    select: { id: true, email: true, name: true },
  });

  for (const user of usersToDisconnect) {
    try {
      await prisma.paymentAccount.deleteMany({
        where: { userId: user.id },
      });
      disconnected++;
      console.log(
        `[disconnect-trial-payments] Paiements supprimés pour ${user.email}`
      );
    } catch (err) {
      console.error(
        `[disconnect-trial-payments] Suppression échouée pour ${user.email}:`,
        err
      );
    }
  }

  return { disconnected };
}

// ─── Route individuelle (tests manuels en dev) ────────────────────────────────

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const result = await runDisconnectTrialPayments();
    console.log("[disconnect-trial-payments] Résultat :", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[disconnect-trial-payments] Erreur :", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

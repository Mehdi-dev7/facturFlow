// src/app/api/cron/expire-trials/route.ts
// Cron quotidien (2h UTC) : gestion des trials expirés.
//
// Architecture : le plan en DB reste 'FREE' pour les users en trial.
// C'est getEffectivePlan() dans feature-gate.ts qui retourne 'PRO'
// si trialEndsAt > now. Ce cron n'a donc PAS besoin de modifier le plan.
//
// Ce cron envoie un email de rappel 1 jour avant la fin du trial (J-1).
// Ajout futur : email de rappel J-3 si Resend est configuré.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Sécurité : vérifier le secret du cron
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();

  // Fenêtre J-1 : trials qui expirent dans les prochaines 24h (mais pas encore expirés)
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    // Compter les trials expirés (pour les logs)
    const expiredCount = await prisma.user.count({
      where: {
        trialEndsAt: { lt: now },
        plan: "FREE",
        trialUsed: true,
      },
    });

    // Récupérer les users dont le trial expire dans ~24h (pour email de rappel)
    const expiringTomorrow = await prisma.user.findMany({
      where: {
        trialEndsAt: { gte: now, lte: in24h },
        plan: "FREE",
        trialUsed: true,
      },
      select: { id: true, email: true, name: true, trialEndsAt: true },
    });

    // TODO : envoyer un email de rappel à chaque user en fin de trial
    // Exemple : await resend.emails.send({ to: user.email, subject: "Votre essai FacturNow expire demain" })
    for (const user of expiringTomorrow) {
      console.log(
        `[expire-trials] Rappel J-1 : ${user.email} (trial expire le ${user.trialEndsAt?.toISOString()})`
      );
    }

    console.log(
      `[expire-trials] Résultat : ${expiredCount} trials expirés, ${expiringTomorrow.length} rappels J-1`
    );

    return NextResponse.json({
      ok: true,
      expiredTrials: expiredCount,
      remindersToSend: expiringTomorrow.length,
    });
  } catch (error) {
    console.error("[expire-trials] Erreur :", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

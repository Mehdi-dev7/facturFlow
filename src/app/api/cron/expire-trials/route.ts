// src/app/api/cron/expire-trials/route.ts
// Cron quotidien (2h UTC) : gestion des trials expirés.
//
// Architecture : le plan en DB reste 'FREE' pour les users en trial.
// C'est getEffectivePlan() dans feature-gate.ts qui retourne 'PRO'
// si trialEndsAt > now. Ce cron n'a donc PAS besoin de modifier le plan.
//
// Séquence d'emails envoyés :
//   J-1 → sendTrialReminderEmail({ daysLeft: 1 })
//   J+0 → sendTrialExpiredEmail() (les dernières 24h)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendTrialReminderEmail,
  sendTrialExpiredEmail,
} from "@/lib/email/send-trial-reminder-email";

export const runtime = "nodejs";

// ─── Logique exportée (appelée par le nightly master cron) ───────────────────

export async function runExpireTrials() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  let remindersJ1 = 0;
  let expiredEmails = 0;

  // ── J-1 : trials expirant dans les prochaines 24h ──────────────────────────
  const expiringTomorrow = await prisma.user.findMany({
    where: {
      trialEndsAt: { gte: now, lte: in24h },
      plan: "FREE",
      trialUsed: true,
    },
    select: { id: true, email: true, name: true },
  });

  for (const user of expiringTomorrow) {
    try {
      await sendTrialReminderEmail({
        to: user.email,
        userName: user.name ?? "là",
        daysLeft: 1,
      });
      remindersJ1++;
    } catch (err) {
      console.error(`[expire-trials] Rappel J-1 échoué pour ${user.email}:`, err);
    }
  }

  // ── J+0 : trials qui ont expiré dans les dernières 24h ────────────────────
  // On utilise la fenêtre [yesterday, now] pour éviter de renvoyer l'email plusieurs nuits.
  const justExpired = await prisma.user.findMany({
    where: {
      trialEndsAt: { gte: yesterday, lte: now },
      plan: "FREE",
      trialUsed: true,
    },
    select: { id: true, email: true, name: true, trialEndsAt: true },
  });

  for (const user of justExpired) {
    try {
      await sendTrialExpiredEmail({
        to: user.email,
        userName: user.name ?? "là",
      });
      expiredEmails++;
    } catch (err) {
      console.error(`[expire-trials] Email expiration échoué pour ${user.email}:`, err);
    }
  }

  // Nombre total de trials expirés en DB (pour les logs)
  const expiredCount = await prisma.user.count({
    where: { trialEndsAt: { lt: now }, plan: "FREE", trialUsed: true },
  });

  return { expiredTrials: expiredCount, remindersJ1, expiredEmails };
}

// ─── Route individuelle (tests manuels en dev) ────────────────────────────────

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const result = await runExpireTrials();
    console.log("[expire-trials] Résultat :", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[expire-trials] Erreur :", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

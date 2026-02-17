import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── Cron : passer les devis expirés en CANCELLED ──────────────────────────────
//
// Appelé chaque nuit à minuit (UTC) par Vercel Cron.
// Passe en CANCELLED tous les devis SENT dont la date de validité est dépassée.
//
// Sécurisé avec CRON_SECRET (variable d'env définie dans Vercel).

export async function GET(request: NextRequest) {
  // 1. Vérifier le secret Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Début du jour courant (minuit UTC) → toute validité avant = expirée
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // 3. Mettre à jour tous les devis SENT dont la validité est passée
    const result = await prisma.document.updateMany({
      where: {
        type: "QUOTE",
        status: "SENT",
        validUntil: { lt: today },
      },
      data: { status: "CANCELLED" },
    });

    console.log(`[cron/update-expired-quotes] ${result.count} devis passé(s) en CANCELLED`);

    return NextResponse.json({
      success: true,
      updated: result.count,
    });
  } catch (error) {
    console.error("[cron/update-expired-quotes] Erreur:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

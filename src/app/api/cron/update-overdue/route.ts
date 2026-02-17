import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── Cron : passer les factures en OVERDUE ────────────────────────────────────
//
// Appelé chaque nuit à minuit (UTC) par Vercel Cron.
// Passe en OVERDUE toutes les factures SENT dont la date d'échéance est dépassée.
//
// Sécurisé avec CRON_SECRET (variable d'env définie dans Vercel).

export async function GET(request: NextRequest) {
  // 1. Vérifier le secret Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Début du jour courant (minuit UTC) → toute échéance avant = dépassée
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // 3. Mettre à jour toutes les factures SENT dont l'échéance est passée
    const result = await prisma.document.updateMany({
      where: {
        type: "INVOICE",
        status: "SENT",
        dueDate: { lt: today }, // dueDate strictement avant aujourd'hui
      },
      data: { status: "OVERDUE" },
    });

    console.log(`[cron/update-overdue] ${result.count} facture(s) passée(s) en OVERDUE`);

    return NextResponse.json({
      success: true,
      updated: result.count,
    });
  } catch (error) {
    console.error("[cron/update-overdue] Erreur:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

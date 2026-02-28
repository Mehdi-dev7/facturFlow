import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ─── Logique métier (réutilisable par le cron nightly) ───────────────────────

export async function runUpdateExpiredQuotes() {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const { count: updated } = await prisma.document.updateMany({
    where: { type: "QUOTE", status: "SENT", validUntil: { lt: today } },
    data: { status: "CANCELLED" },
  })

  console.log(`[update-expired-quotes] ${updated} devis passé(s) en CANCELLED`)
  return { updated }
}

// ─── Route HTTP (debug / appel manuel) ───────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await runUpdateExpiredQuotes()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[cron/update-expired-quotes] Erreur:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

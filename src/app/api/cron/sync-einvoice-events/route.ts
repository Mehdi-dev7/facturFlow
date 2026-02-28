import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getInvoiceEvents } from "@/lib/superpdp"

// ─── Logique métier (réutilisable par le cron nightly) ───────────────────────

export async function runSyncEInvoiceEvents() {
  // Récupérer ou créer le curseur de sync
  const syncState = await prisma.eInvoiceSyncState.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", lastEventId: 0 },
  })

  let lastEventId = syncState.lastEventId
  let totalProcessed = 0
  let hasMore = true

  // Paginer les events SuperPDP depuis le dernier ID connu
  while (hasMore) {
    const { data: events, has_after } = await getInvoiceEvents(lastEventId)
    if (events.length === 0) break

    for (const event of events) {
      const doc = await prisma.document.findFirst({
        where: { einvoiceRef: String(event.invoice_id) },
        select: { id: true },
      })

      if (doc) {
        await prisma.document.update({
          where: { id: doc.id },
          data: { einvoiceStatus: event.status_code },
        })
        totalProcessed++
      }

      if (event.id > lastEventId) lastEventId = event.id
    }

    hasMore = has_after
  }

  // Sauvegarder le nouveau curseur
  await prisma.eInvoiceSyncState.update({
    where: { id: "singleton" },
    data: { lastEventId },
  })

  console.log(`[sync-einvoice-events] ${totalProcessed} event(s) traité(s), lastEventId=${lastEventId}`)
  return { processed: totalProcessed, lastEventId }
}

// ─── Route HTTP (debug / appel manuel) ───────────────────────────────────────

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await runSyncEInvoiceEvents()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[cron/sync-einvoice-events] Erreur:", error)
    return NextResponse.json({ error: "Erreur lors de la synchronisation" }, { status: 500 })
  }
}

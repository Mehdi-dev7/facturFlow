/**
 * Cron : synchronisation des statuts de factures électroniques SuperPDP
 *
 * Tournant toutes les heures, ce cron :
 * 1. Récupère le dernier event_id traité (table EInvoiceSyncState)
 * 2. Interroge SuperPDP pour les nouveaux events depuis cet id
 * 3. Met à jour Document.einvoiceStatus pour chaque facture concernée
 * 4. Sauvegarde le nouveau max event_id pour la prochaine exécution
 *
 * Sécurisé avec CRON_SECRET (header Authorization: Bearer)
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getInvoiceEvents } from "@/lib/superpdp"

export async function GET(req: NextRequest) {
  // ─ Vérification du secret cron ─
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // ─ 1. Récupérer l'état de sync (créer le singleton s'il n'existe pas) ─
    const syncState = await prisma.eInvoiceSyncState.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton", lastEventId: 0 },
    })

    let lastEventId = syncState.lastEventId
    let totalProcessed = 0
    let hasMore = true

    // ─ 2. Boucle de pagination : on récupère tous les events depuis lastEventId ─
    while (hasMore) {
      const { data: events, has_after } = await getInvoiceEvents(lastEventId)

      if (events.length === 0) break

      // ─ 3. Mettre à jour le statut de chaque facture concernée ─
      for (const event of events) {
        // Chercher la facture FacturFlow par son einvoiceRef (= ID SuperPDP)
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

        // Avancer le curseur
        if (event.id > lastEventId) lastEventId = event.id
      }

      hasMore = has_after
    }

    // ─ 4. Sauvegarder le nouveau curseur en DB ─
    await prisma.eInvoiceSyncState.update({
      where: { id: "singleton" },
      data: { lastEventId },
    })

    return NextResponse.json({
      success: true,
      processed: totalProcessed,
      lastEventId,
    })
  } catch (error) {
    console.error("[cron/sync-einvoice-events] Erreur:", error)
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation" },
      { status: 500 }
    )
  }
}

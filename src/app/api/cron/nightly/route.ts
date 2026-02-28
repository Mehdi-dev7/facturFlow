import { NextRequest, NextResponse } from "next/server"
import { runUpdateOverdue } from "@/app/api/cron/update-overdue/route"
import { runUpdateExpiredQuotes } from "@/app/api/cron/update-expired-quotes/route"
import { runSendReminders } from "@/app/api/cron/send-reminders/route"
import { runSyncEInvoiceEvents } from "@/app/api/cron/sync-einvoice-events/route"

// ─── Cron nightly — point d'entrée unique ────────────────────────────────────
//
// Exécuté chaque nuit à 00:00 UTC par Vercel Cron (1 seul slot utilisé).
// Enchaîne les 4 tâches dans l'ordre logique :
//   1. Factures OVERDUE + planification des relances (J+2 / J+7 / J+15)
//   2. Devis expirés → CANCELLED
//   3. Envoi des relances dont la date est atteinte
//   4. Sync des statuts factures électroniques (SuperPDP)
//
// Les routes individuelles (/api/cron/update-overdue, etc.) restent disponibles
// pour les tests manuels en dev.

export async function GET(request: NextRequest) {
  // Vérifier le secret Vercel Cron
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results: Record<string, unknown> = {}
  const errors: Record<string, string> = {}

  // 1. Factures OVERDUE + création des reminders
  try {
    results.overdue = await runUpdateOverdue()
  } catch (err) {
    errors.overdue = String(err)
    console.error("[nightly] overdue failed:", err)
  }

  // 2. Devis expirés
  try {
    results.expiredQuotes = await runUpdateExpiredQuotes()
  } catch (err) {
    errors.expiredQuotes = String(err)
    console.error("[nightly] expiredQuotes failed:", err)
  }

  // 3. Envoi des relances planifiées
  try {
    results.reminders = await runSendReminders()
  } catch (err) {
    errors.reminders = String(err)
    console.error("[nightly] reminders failed:", err)
  }

  // 4. Sync e-invoicing SuperPDP
  try {
    results.einvoice = await runSyncEInvoiceEvents()
  } catch (err) {
    errors.einvoice = String(err)
    console.error("[nightly] einvoice sync failed:", err)
  }

  console.log("[nightly] Tâches terminées", { results, errors })

  return NextResponse.json({
    success: Object.keys(errors).length === 0,
    results,
    ...(Object.keys(errors).length > 0 && { errors }),
  })
}

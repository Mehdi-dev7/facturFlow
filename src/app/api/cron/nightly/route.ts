import { NextRequest, NextResponse } from "next/server"
import { runUpdateOverdue } from "@/app/api/cron/update-overdue/route"
import { runUpdateExpiredQuotes } from "@/app/api/cron/update-expired-quotes/route"
import { runSendReminders } from "@/app/api/cron/send-reminders/route"
import { runSyncEInvoiceEvents } from "@/app/api/cron/sync-einvoice-events/route"
import { runExpireTrials } from "@/app/api/cron/expire-trials/route"
import { runGenerateRecurring } from "@/app/api/cron/generate-recurring/route"
import { runSendAccountingEmails } from "@/app/api/cron/send-accounting-emails/route"
import { runSendReviewRequests } from "@/app/api/cron/send-review-requests/route"

// ─── Cron nightly — point d'entrée unique ────────────────────────────────────
//
// Exécuté chaque nuit à 01:00 UTC par Vercel Cron (1 seul slot utilisé).
// Enchaîne les tâches dans l'ordre logique :
//   1. Factures OVERDUE + planification des relances (J+2 / J+7 / J+15)
//   2. Devis expirés → CANCELLED
//   3. Envoi des relances dont la date est atteinte
//   4. Sync des statuts factures électroniques (SuperPDP)
//   5. Trials expirés — rappel J-1 par email
//   6. Génération des factures récurrentes + paiements SEPA auto
//   7. Envoi des exports comptables au comptable (1er du mois uniquement)
//
// Les routes individuelles restent disponibles pour les tests manuels en dev.

export async function GET(request: NextRequest) {
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

  // 5. Trials expirés (rappel J-1 + log)
  try {
    results.trials = await runExpireTrials()
  } catch (err) {
    errors.trials = String(err)
    console.error("[nightly] expire-trials failed:", err)
  }

  // 6. Génération des factures récurrentes
  try {
    results.recurring = await runGenerateRecurring()
  } catch (err) {
    errors.recurring = String(err)
    console.error("[nightly] recurring failed:", err)
  }

  // 7. Envoi des exports comptables (1er du mois uniquement)
  try {
    results.accountingEmails = await runSendAccountingEmails()
  } catch (err) {
    errors.accountingEmails = String(err)
    console.error("[nightly] accounting-emails failed:", err)
  }

  // 8. Envoi des demandes d'avis (J+7 après inscription)
  try {
    results.reviewRequests = await runSendReviewRequests()
  } catch (err) {
    errors.reviewRequests = String(err)
    console.error("[nightly] review-requests failed:", err)
  }

  console.log("[nightly] Tâches terminées", { results, errors })

  return NextResponse.json({
    success: Object.keys(errors).length === 0,
    results,
    ...(Object.keys(errors).length > 0 && { errors }),
  })
}

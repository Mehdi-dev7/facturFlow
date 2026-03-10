import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getReminderSubject } from "@/lib/email/reminder-templates"
import { dispatchWebhook } from "@/lib/webhook-dispatcher"

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// ─── Logique métier (réutilisable par le cron nightly) ───────────────────────

export async function runUpdateOverdue() {
  const now = new Date()

  // Statuts éligibles au passage OVERDUE :
  //  - SENT uniquement (REMINDED exclu pour éviter les boucles)
  // SEPA_PENDING exclu (prélèvement en cours)
  const candidates = await prisma.document.findMany({
    where: {
      type: { in: ["INVOICE", "DEPOSIT"] },
      status: "SENT",
      dueDate: { lt: now },
    },
    select: {
      id: true,
      number: true,
      dueDate: true,
      type: true,
      userId: true,
      _count: { select: { reminders: true } },
    },
  })

  if (candidates.length === 0) return { updated: 0, remindersCreated: 0 }

  // Créer les 3 relances uniquement pour les nouveaux documents OVERDUE (pas de relances existantes)
  // et uniquement pour les FACTURES (les acomptes n'ont pas de relances automatiques)
  const invoicesToRemind = candidates.filter(
    (doc) => doc.type === "INVOICE" && doc._count.reminders === 0
  )
  let remindersCreated = 0

  if (invoicesToRemind.length > 0) {
    const { count } = await prisma.reminder.createMany({
      data: invoicesToRemind.flatMap((inv) => {
        const due = inv.dueDate!
        return [
          {
            documentId: inv.id,
            level: "FRIENDLY" as const,
            scheduledFor: addDays(due, 2),
            subject: getReminderSubject("FRIENDLY", inv.number),
            message: "FRIENDLY",
          },
          {
            documentId: inv.id,
            level: "FIRM" as const,
            scheduledFor: addDays(due, 7),
            subject: getReminderSubject("FIRM", inv.number),
            message: "FIRM",
          },
          {
            documentId: inv.id,
            level: "FORMAL" as const,
            scheduledFor: addDays(due, 15),
            subject: getReminderSubject("FORMAL", inv.number),
            message: "FORMAL",
          },
        ]
      }),
    })
    remindersCreated = count
  }

  // Passer tous les candidats en OVERDUE
  const { count: updated } = await prisma.document.updateMany({
    where: { id: { in: candidates.map((doc) => doc.id) } },
    data: { status: "OVERDUE" },
  })

  // Webhooks — fire & forget par userId (groupés pour éviter les doublons)
  const invoicesByUser = candidates.filter((d) => d.type === "INVOICE")
  const userIds = [...new Set(invoicesByUser.map((d) => d.userId))]
  for (const uid of userIds) {
    const ids = invoicesByUser.filter((d) => d.userId === uid).map((d) => d.id)
    dispatchWebhook(uid, "invoice.overdue", { ids }).catch(() => {})
  }

  console.log(`[update-overdue] ${updated} document(s) → OVERDUE | ${remindersCreated} relance(s) planifiée(s)`)
  return { updated, remindersCreated }
}

// ─── Route HTTP (debug / appel manuel) ───────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await runUpdateOverdue()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[cron/update-overdue] Erreur:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

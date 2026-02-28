import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getReminderSubject } from "@/lib/email/reminder-templates"

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// ─── Logique métier (réutilisable par le cron nightly) ───────────────────────

export async function runUpdateOverdue() {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // Trouver les factures SENT dont la dueDate est dépassée
  const candidates = await prisma.document.findMany({
    where: { type: "INVOICE", status: "SENT", dueDate: { lt: today } },
    select: {
      id: true,
      number: true,
      dueDate: true,
      _count: { select: { reminders: true } },
    },
  })

  if (candidates.length === 0) return { updated: 0, remindersCreated: 0 }

  // Créer les 3 relances uniquement pour les nouvelles factures OVERDUE
  const newOnes = candidates.filter((inv) => inv._count.reminders === 0)
  let remindersCreated = 0

  if (newOnes.length > 0) {
    const { count } = await prisma.reminder.createMany({
      data: newOnes.flatMap((inv) => {
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

  // Passer toutes les candidates en OVERDUE
  const { count: updated } = await prisma.document.updateMany({
    where: { id: { in: candidates.map((inv) => inv.id) } },
    data: { status: "OVERDUE" },
  })

  console.log(`[update-overdue] ${updated} facture(s) → OVERDUE | ${remindersCreated} relance(s) planifiée(s)`)
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

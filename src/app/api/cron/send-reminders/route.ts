import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resend } from "@/lib/email/resend"
import { getReminderSubject, getReminderHtml } from "@/lib/email/reminder-templates"
import type { ReminderLevel } from "@prisma/client"

// ─── Logique métier (réutilisable par le cron nightly) ───────────────────────

export async function runSendReminders() {
  const now = new Date()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://facturnow.fr"
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "FacturNow <noreply@facturnow.fr>"

  // Récupérer tous les reminders prêts à être envoyés
  const pendingReminders = await prisma.reminder.findMany({
    where: {
      sent: false,
      scheduledFor: { lte: now },
      document: { status: { notIn: ["PAID", "CANCELLED"] } },
    },
    include: {
      document: {
        include: {
          client: {
            select: { companyName: true, firstName: true, lastName: true, email: true },
          },
          user: {
            select: {
              companyName: true,
              paymentAccounts: { select: { provider: true } },
            },
          },
        },
      },
    },
  })

  if (pendingReminders.length === 0) {
    console.log("[send-reminders] Aucune relance à envoyer")
    return { sent: 0, total: 0 }
  }

  let sentCount = 0
  const errors: string[] = []

  for (const reminder of pendingReminders) {
    const doc = reminder.document
    const client = doc.client
    const level = reminder.level as ReminderLevel

    const clientName =
      client.companyName ??
      [client.firstName, client.lastName].filter(Boolean).join(" ") ??
      client.email

    const emitterName = doc.user.companyName ?? "FacturNow"

    const amount = doc.total.toNumber().toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    const dueDate = doc.dueDate
      ? new Date(doc.dueDate).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "—"

    const hasStripe = doc.user.paymentAccounts.some((a) => a.provider === "STRIPE")
    const hasPaypal = doc.user.paymentAccounts.some((a) => a.provider === "PAYPAL")

    try {
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: [client.email],
        subject: getReminderSubject(level, doc.number),
        html: getReminderHtml({
          level,
          clientName,
          invoiceNumber: doc.number,
          amount,
          dueDate,
          emitterName,
          stripePaymentUrl: hasStripe ? `${appUrl}/api/pay/${doc.id}` : null,
          paypalPaymentUrl: hasPaypal ? `${appUrl}/api/pay-paypal/${doc.id}` : null,
        }),
      })

      if (error) {
        errors.push(`[${reminder.id}] ${error.message}`)
        continue
      }

      // Marquer comme envoyé + passer la facture en REMINDED
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { sent: true, sentAt: new Date() },
      })

      if (doc.status !== "PAID") {
        await prisma.document.update({
          where: { id: doc.id },
          data: { status: "REMINDED" },
        })
      }

      sentCount++
      console.log(`[send-reminders] ${level} → ${client.email} (${doc.number})`)
    } catch (err) {
      errors.push(`[${reminder.id}] ${String(err)}`)
    }
  }

  console.log(`[send-reminders] ${sentCount}/${pendingReminders.length} relance(s) envoyée(s)`)
  if (errors.length > 0) console.error("[send-reminders] Erreurs:", errors)

  return { sent: sentCount, total: pendingReminders.length, errors: errors.length > 0 ? errors : undefined }
}

// ─── Route HTTP (debug / appel manuel) ───────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await runSendReminders()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[cron/send-reminders] Erreur:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

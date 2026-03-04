import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { addWeeks, addMonths, addYears } from "date-fns"
import { decrypt } from "@/lib/encrypt"
import { createSepaPayment } from "@/lib/gocardless"
import { sendRecurringInvoiceEmail } from "@/lib/email/send-recurring-invoice-email"
import type { GocardlessCredential } from "@/lib/actions/payments"

export const runtime = "nodejs"

// ─── Types internes ──────────────────────────────────────────────────────────

interface TemplateLine {
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
}

interface TemplateData {
  lines: TemplateLine[]
  notes?: string
}

// ─── Calcul de la prochaine date selon la fréquence ─────────────────────────

function nextDateFor(date: Date, freq: string): Date {
  switch (freq) {
    case "WEEKLY":     return addWeeks(date, 1)
    case "BIWEEKLY":   return addWeeks(date, 2)
    case "MONTHLY":    return addMonths(date, 1)
    case "QUARTERLY":  return addMonths(date, 3)
    case "SEMIYEARLY": return addMonths(date, 6)
    case "YEARLY":     return addYears(date, 1)
    default:           return addMonths(date, 1)
  }
}

// ─── Logique exportée (appelée par le nightly master cron) ──────────────────

export async function runGenerateRecurring() {
  const now = new Date()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://facturnow.fr"
  // Ne pas inclure des URLs localhost dans les emails (signal spam Gmail)
  const isLocalhost = appUrl.includes("localhost") || appUrl.includes("127.0.0.1")

  // Récurrences actives dont nextDate <= maintenant
  // On inclut le mandat GoCardless du client pour détecter les prélèvements auto
  const due = await prisma.recurringInvoice.findMany({
    where: { active: true, nextDate: { lte: now } },
    include: {
      client: {
        select: {
          id: true,
          gcMandateId: true,
          gcMandateStatus: true,
        },
      },
      user: true,
    },
  })

  let generated = 0
  let errors = 0

  for (const recurring of due) {
    try {
      const templateData = recurring.templateData as unknown as TemplateData

      // Calculer les totaux à partir des lignes template
      const subtotal = templateData.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
      const taxTotal = templateData.lines.reduce(
        (s, l) => s + l.quantity * l.unitPrice * (l.vatRate / 100),
        0,
      )
      const total = subtotal + taxTotal

      // Numéro de facture atomique
      const user = await prisma.user.update({
        where: { id: recurring.userId },
        data: { nextInvoiceNumber: { increment: 1 } },
        select: { nextInvoiceNumber: true, invoicePrefix: true },
      })
      const year = now.getFullYear()
      const num = String(user.nextInvoiceNumber - 1).padStart(4, "0")
      const number = `${user.invoicePrefix}-${year}-${num}`

      // Détecter si le client a un mandat SEPA actif
      const isSepa = recurring.paymentMethod === "SEPA"
      const hasActiveMandate =
        isSepa &&
        !!recurring.client.gcMandateId &&
        recurring.client.gcMandateStatus === "active"

      // Statut initial : SEPA_PENDING si prélèvement auto, sinon SENT
      const initialStatus = hasActiveMandate ? "SEPA_PENDING" : "SENT"

      // Créer la facture avec ses lignes
      const doc = await prisma.document.create({
        data: {
          userId: recurring.userId,
          clientId: recurring.clientId,
          type: "INVOICE",
          status: initialStatus,
          number,
          date: now,
          dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // +30 jours
          subtotal,
          taxTotal,
          total,
          paymentMethod: recurring.paymentMethod,
          notes: templateData.notes,
          lineItems: {
            create: templateData.lines.map((l, i) => ({
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              vatRate: l.vatRate,
              subtotal: l.quantity * l.unitPrice,
              taxAmount: l.quantity * l.unitPrice * (l.vatRate / 100),
              total: l.quantity * l.unitPrice * (1 + l.vatRate / 100),
              order: i,
            })),
          },
        },
      })

      // Calculer la prochaine échéance + désactiver si endDate dépassée
      const nextDate = nextDateFor(recurring.nextDate, recurring.frequency)
      const shouldDeactivate = recurring.endDate && nextDate > recurring.endDate

      await prisma.recurringInvoice.update({
        where: { id: recurring.id },
        data: {
          nextDate,
          invoiceCount: { increment: 1 },
          active: shouldDeactivate ? false : true,
        },
      })

      // ── Préparer les options email ─────────────────────────────────────────

      let sepaAutoTriggered = false
      let sepaUrl: string | undefined
      let stripeUrl: string | undefined
      let paypalUrl: string | undefined

      if (!isLocalhost) {
        if (isSepa) {
          // Récupérer les credentials GoCardless du user
          const gcAccount = await prisma.paymentAccount.findUnique({
            where: { userId_provider: { userId: recurring.userId, provider: "GOCARDLESS" } },
            select: { credential: true, isActive: true },
          })

          if (gcAccount?.isActive) {
            if (hasActiveMandate) {
              // Mandat actif → déclencher le prélèvement automatiquement
              try {
                const cred = JSON.parse(decrypt(gcAccount.credential)) as GocardlessCredential
                const isSandbox = cred.accessToken.startsWith("sandbox_")
                const amountCents = Math.round(total * 100)

                await createSepaPayment(cred.accessToken, isSandbox, {
                  mandateId: recurring.client.gcMandateId!,
                  amountCents,
                  description: `Facture ${number}`,
                  invoiceId: doc.id,
                })

                sepaAutoTriggered = true
                console.log(`[recurring] Prélèvement SEPA auto: ${number} (${amountCents / 100} €)`)
              } catch (sepaErr) {
                // Ne pas bloquer : l'email partira sans le bloc "auto-triggered"
                console.error(`[recurring] Échec prélèvement SEPA pour ${doc.id}:`, sepaErr)
              }
            } else {
              // Pas de mandat → bouton GoCardless dans l'email pour le signer
              sepaUrl = `${appUrl}/api/pay-sepa/${doc.id}`
            }
          }
        } else {
          // Autres modes : vérifier les providers connectés en parallèle
          const [stripeAccount, paypalAccount] = await Promise.all([
            prisma.paymentAccount.findUnique({
              where: { userId_provider: { userId: recurring.userId, provider: "STRIPE" } },
              select: { isActive: true },
            }),
            prisma.paymentAccount.findUnique({
              where: { userId_provider: { userId: recurring.userId, provider: "PAYPAL" } },
              select: { isActive: true },
            }),
          ])

          if (stripeAccount?.isActive) stripeUrl = `${appUrl}/api/pay/${doc.id}`
          if (paypalAccount?.isActive) paypalUrl = `${appUrl}/api/pay-paypal/${doc.id}`
        }
      }

      // ── Envoyer l'email (fire & forget pour ne pas bloquer le cron) ────────
      sendRecurringInvoiceEmail({
        invoiceId: doc.id,
        userId: recurring.userId,
        sepaAutoTriggered,
        sepaUrl,
        stripeUrl,
        paypalUrl,
      }).catch((emailErr) => {
        console.error(`[recurring] Erreur email pour ${number}:`, emailErr)
      })

      generated++
    } catch (err) {
      console.error(`[generate-recurring] Erreur pour récurrence ${recurring.id}:`, err)
      errors++
    }
  }

  return { generated, errors, total: due.length }
}

// ─── Route individuelle (tests manuels en dev) ───────────────────────────────

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await runGenerateRecurring()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error("[generate-recurring] Erreur:", err)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

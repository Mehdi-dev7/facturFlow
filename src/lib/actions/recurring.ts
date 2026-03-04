"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { recurringSchema, type RecurringFormData } from "@/lib/validations/recurring"

// ─── Types ──────────────────────────────────────────────────────────────────

/** Ligne template stockee dans templateData JSON */
interface TemplateLine {
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
}

/** Donnees template stockees en JSON dans RecurringInvoice */
interface TemplateData {
  lines: TemplateLine[]
  notes?: string
}

/** Recurrence formatee pour le frontend */
export interface SavedRecurring {
  id: string
  label: string | null
  paymentMethod: string | null
  frequency: string
  startDate: string
  endDate: string | null
  nextDate: string
  active: boolean
  invoiceCount: number
  createdAt: string
  updatedAt: string
  templateData: TemplateData
  client: {
    id: string
    companyName: string | null
    firstName: string | null
    lastName: string | null
    email: string
  }
  /** Montant HT mensuel (converti selon frequence) */
  monthlyAmount: number
  /** Montant TTC d'une echeance */
  totalAmount: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Multiplicateurs pour convertir le montant par echeance en montant mensuel */
const MONTHLY_MULTIPLIERS: Record<string, number> = {
  WEEKLY: 52 / 12,
  BIWEEKLY: 26 / 12,
  MONTHLY: 1,
  QUARTERLY: 1 / 3,
  SEMIYEARLY: 1 / 6,
  YEARLY: 1 / 12,
}

/** Calcule les montants a partir des lignes template */
function computeAmounts(lines: TemplateLine[], frequency: string) {
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
  const totalTTC = lines.reduce(
    (s, l) => s + l.quantity * l.unitPrice * (1 + l.vatRate / 100),
    0
  )
  const multiplier = MONTHLY_MULTIPLIERS[frequency] ?? 1
  return {
    monthlyAmount: Math.round(subtotal * multiplier * 100) / 100,
    totalAmount: Math.round(totalTTC * 100) / 100,
  }
}

/** Recupere la session courante ou lance une erreur */
async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return null
  return session
}

// ─── Actions ────────────────────────────────────────────────────────────────

/**
 * Liste toutes les recurrences de l'utilisateur connecte.
 */
export async function getRecurrings(): Promise<{
  success: boolean
  data?: SavedRecurring[]
  error?: string
}> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }

  try {
    const recurrings = await prisma.recurringInvoice.findMany({
      where: { userId: session.user.id },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const data: SavedRecurring[] = recurrings.map((r) => {
      const templateData = r.templateData as unknown as TemplateData
      const { monthlyAmount, totalAmount } = computeAmounts(
        templateData.lines,
        r.frequency
      )

      return {
        id: r.id,
        label: r.label,
        paymentMethod: r.paymentMethod,
        frequency: r.frequency,
        startDate: r.startDate.toISOString(),
        endDate: r.endDate?.toISOString() ?? null,
        nextDate: r.nextDate.toISOString(),
        active: r.active,
        invoiceCount: r.invoiceCount,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        templateData,
        client: r.client,
        monthlyAmount,
        totalAmount,
      }
    })

    return { success: true, data }
  } catch (error) {
    console.error("[getRecurrings] Erreur:", error)
    return { success: false, error: "Erreur lors de la recuperation" }
  }
}

/**
 * Cree une nouvelle recurrence.
 */
export async function createRecurring(
  formData: RecurringFormData
): Promise<{ success: boolean; data?: SavedRecurring; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }

  // Validation Zod server-side
  const parsed = recurringSchema.safeParse(formData)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return { success: false, error: firstIssue?.message ?? "Donnees invalides" }
  }

  const { clientId, label, paymentMethod, frequency, startDate, endDate, lines, notes } =
    parsed.data

  try {
    const created = await prisma.recurringInvoice.create({
      data: {
        userId: session.user.id,
        clientId,
        label,
        paymentMethod,
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        nextDate: new Date(startDate),
        active: true,
        templateData: { lines, notes },
        invoiceCount: 0,
      },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    const templateData = created.templateData as unknown as TemplateData
    const { monthlyAmount, totalAmount } = computeAmounts(templateData.lines, frequency)

    revalidatePath("/dashboard/recurring")

    return {
      success: true,
      data: {
        id: created.id,
        label: created.label,
        paymentMethod: created.paymentMethod,
        frequency: created.frequency,
        startDate: created.startDate.toISOString(),
        endDate: created.endDate?.toISOString() ?? null,
        nextDate: created.nextDate.toISOString(),
        active: created.active,
        invoiceCount: created.invoiceCount,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        templateData,
        client: created.client,
        monthlyAmount,
        totalAmount,
      },
    }
  } catch (error) {
    console.error("[createRecurring] Erreur:", error)
    return { success: false, error: "Erreur lors de la creation" }
  }
}

/**
 * Pause ou reprend une recurrence (toggle active).
 */
export async function toggleRecurring(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }

  try {
    // Verification ownership
    const existing = await prisma.recurringInvoice.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!existing) return { success: false, error: "Recurrence introuvable" }

    await prisma.recurringInvoice.update({
      where: { id },
      data: { active: !existing.active },
    })

    revalidatePath("/dashboard/recurring")
    return { success: true }
  } catch (error) {
    console.error("[toggleRecurring] Erreur:", error)
    return { success: false, error: "Erreur lors de la mise a jour" }
  }
}

/**
 * Supprime une recurrence.
 */
export async function deleteRecurring(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }

  try {
    // Verification ownership
    const existing = await prisma.recurringInvoice.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!existing) return { success: false, error: "Recurrence introuvable" }

    await prisma.recurringInvoice.delete({ where: { id } })

    revalidatePath("/dashboard/recurring")
    return { success: true }
  } catch (error) {
    console.error("[deleteRecurring] Erreur:", error)
    return { success: false, error: "Erreur lors de la suppression" }
  }
}

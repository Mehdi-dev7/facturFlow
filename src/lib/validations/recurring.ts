import { z } from "zod"

// ─── Schema ligne de facture récurrente ─────────────────────────────────────

export const recurringLineSchema = z.object({
  description: z.string().min(1, "Description requise"),
  quantity: z.number().min(0.01, "Quantité invalide"),
  unitPrice: z.number().min(0, "Prix invalide"),
  vatRate: z.union([z.literal(0), z.literal(5.5), z.literal(10), z.literal(20)]),
})

// ─── Schema formulaire récurrence ───────────────────────────────────────────

export const recurringSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  label: z.string().min(1, "Nom de la récurrence requis"),
  paymentMethod: z.enum(["BANK_TRANSFER", "STRIPE", "PAYPAL", "SEPA"]),
  frequency: z.enum([
    "WEEKLY",
    "BIWEEKLY",
    "MONTHLY",
    "QUARTERLY",
    "SEMIYEARLY",
    "YEARLY",
  ]),
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().optional(),
  lines: z.array(recurringLineSchema).min(1, "Au moins une ligne requise"),
  notes: z.string().optional(),
})

// ─── Types dérivés ──────────────────────────────────────────────────────────

export type RecurringFormData = z.infer<typeof recurringSchema>
export type RecurringLine = z.infer<typeof recurringLineSchema>

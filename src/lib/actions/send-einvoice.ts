"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import {
  convertInvoiceToXml,
  sendInvoiceXml,
  type EN16931Invoice,
} from "@/lib/superpdp"

// ─── Types internes ───────────────────────────────────────────────────────────

/** Données complètes de facture avec toutes les infos nécessaires pour l'EN16931 */
type InvoiceWithFullData = {
  id: string
  number: string
  date: Date
  dueDate: Date | null
  notes: string | null
  subtotal: { toNumber: () => number }
  taxTotal: { toNumber: () => number }
  total: { toNumber: () => number }
  depositAmount: { toNumber: () => number } | null
  businessMetadata: unknown
  lineItems: {
    description: string
    quantity: { toNumber: () => number }
    unitPrice: { toNumber: () => number }
    vatRate: { toNumber: () => number }
    subtotal: { toNumber: () => number }
  }[]
  client: {
    companyName: string | null
    firstName: string | null
    lastName: string | null
    companySiren: string | null
    companySiret: string | null
    companyVatNumber: string | null
    email: string
    address: string | null
    postalCode: string | null
    city: string | null
    country: string | null
    phone: string | null
  }
  user: {
    companyName: string | null
    companySiren: string | null
    companySiret: string | null
    companyVatNumber: string | null
    companyAddress: string | null
    companyPostalCode: string | null
    companyCity: string | null
    companyEmail: string | null
    companyPhone: string | null
    iban: string | null
    bic: string | null
  }
}

// ─── Builder EN16931 ──────────────────────────────────────────────────────────

/**
 * Convertit nos données de facture en format EN16931 (norme européenne).
 *
 * Le format EN16931 est le modèle sémantique commun à tous les pays européens.
 * SuperPDP prend ce JSON et génère le XML CII conforme DGFiP + Peppol.
 */
function buildEN16931(invoice: InvoiceWithFullData): EN16931Invoice {
  const subtotal = invoice.subtotal.toNumber()
  const taxTotal = invoice.taxTotal.toNumber()
  const total = invoice.total.toNumber()
  const depositAmount = invoice.depositAmount?.toNumber() ?? 0
  const netAPayer = total - depositAmount

  // TVA : on prend le taux de la 1ère ligne (toutes les lignes ont le même taux pour l'instant)
  const vatRate = invoice.lineItems[0]?.vatRate.toNumber() ?? 20
  const vatCategoryCode = vatRate === 0 ? "Z" : "S"

  const { client, user } = invoice

  // Nom affiché du client
  const fullName = `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()
  const buyerName = client.companyName ?? (fullName || client.email)

  return {
    // ─ En-tête ─
    type_code: 380, // 380 = Facture commerciale (norme UNTDID 1001)
    number: invoice.number,
    issue_date: invoice.date.toISOString().substring(0, 10),
    ...(invoice.dueDate && {
      payment_due_date: invoice.dueDate.toISOString().substring(0, 10),
    }),
    currency_code: "EUR",

    // ─ Processus Peppol ─
    process_control: {
      business_process_type: "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0",
      specification_identifier:
        "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:01:1.0",
    },

    // ─ Vendeur (notre utilisateur) ─
    seller: {
      name: user.companyName ?? "FacturFlow User",
      postal_address: {
        address_line1: user.companyAddress ?? undefined,
        city: user.companyCity ?? undefined,
        post_code: user.companyPostalCode ?? undefined,
        country_code: "FR",
      },
      // Adresse Peppol du vendeur (SIREN = identifiant sur le réseau français)
      ...(user.companySiren && {
        electronic_address: { scheme: "0225", value: user.companySiren },
      }),
      // SIRET = identifiant légal
      ...(user.companySiret && {
        legal_registration_identifier: { scheme: "0002", value: user.companySiret },
      }),
      // Numéro de TVA
      ...(user.companyVatNumber && {
        vat_identifier: user.companyVatNumber,
      }),
      ...(user.companyEmail && {
        contact: { email_address: user.companyEmail },
      }),
    },

    // ─ Acheteur (client) ─
    buyer: {
      name: buyerName,
      postal_address: {
        address_line1: client.address ?? undefined,
        city: client.city ?? undefined,
        post_code: client.postalCode ?? undefined,
        country_code: client.country === "France" ? "FR" : (client.country ?? "FR"),
      },
      // Adresse Peppol de l'acheteur (SIREN pour les entreprises françaises)
      ...(client.companySiren && {
        electronic_address: { scheme: "0225", value: client.companySiren },
      }),
      ...(client.companySiret && {
        legal_registration_identifier: { scheme: "0002", value: client.companySiret },
      }),
      ...(client.companyVatNumber && {
        vat_identifier: client.companyVatNumber,
      }),
      contact: { email_address: client.email },
    },

    // ─ Lignes de facture ─
    lines: invoice.lineItems.map((li, idx) => ({
      identifier: String(idx + 1),
      invoiced_quantity: li.quantity.toNumber().toString(),
      invoiced_quantity_code: "C62", // C62 = unité (pièce)
      net_amount: li.subtotal.toNumber().toFixed(2),
      item_information: { name: li.description },
      vat_information: {
        invoiced_item_vat_category_code: vatCategoryCode,
        ...(vatRate > 0 && { invoiced_item_vat_rate: vatRate.toFixed(2) }),
      },
      price_details: { item_net_price: li.unitPrice.toNumber().toFixed(2) },
    })),

    // ─ Totaux ─
    totals: {
      sum_invoice_lines_amount: subtotal.toFixed(2),
      total_without_vat: subtotal.toFixed(2),
      total_vat_amount: { currency_code: "EUR", value: taxTotal.toFixed(2) },
      total_with_vat: total.toFixed(2),
      amount_due_for_payment: netAPayer.toFixed(2),
      ...(depositAmount > 0 && { paid_amount: depositAmount.toFixed(2) }),
    },

    // ─ Ventilation TVA ─
    vat_break_down: [
      {
        vat_category_code: vatCategoryCode,
        ...(vatRate > 0 && { vat_category_rate: vatRate.toFixed(2) }),
        vat_category_taxable_amount: subtotal.toFixed(2),
        vat_category_tax_amount: taxTotal.toFixed(2),
        // Pour les auto-entrepreneurs : exonération article 293 B du CGI
        ...(vatRate === 0 && {
          vat_exemption_reason_code: "VATEX-FR-FRANCHISE",
          vat_exemption_reason: "TVA non applicable, article 293 B du CGI",
        }),
      },
    ],

    // ─ Notes ─
    ...(invoice.notes && {
      notes: [{ note: invoice.notes }],
    }),

    // ─ Instructions de paiement (virement SEPA si IBAN disponible) ─
    ...(user.iban && {
      payment_instructions: {
        payment_means_type_code: "30", // 30 = virement bancaire
        credit_transfers: [
          {
            payment_account_identifier: { scheme: "IBAN", value: user.iban },
            ...(user.bic && { payment_service_provider_identifier: user.bic }),
          },
        ],
      },
    }),
  }
}

// ─── Action principale ────────────────────────────────────────────────────────

/**
 * Envoie une facture en tant que facture électronique certifiée via SuperPDP.
 *
 * Flux :
 * 1. Récupère la facture complète en DB
 * 2. Vérifie que le client et le vendeur ont un SIREN (routage Peppol)
 * 3. Construit l'objet EN16931 JSON
 * 4. POST /invoices/convert?from=en16931&to=cii → XML CII
 * 5. POST /invoices (application/xml) → envoi réseau Peppol
 * 6. Stocke l'ID SuperPDP + statut en DB
 */
export async function sendEInvoice(invoiceId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" } as const
  }

  try {
    // ─ 1. Récupérer la facture avec toutes les données nécessaires ─
    const invoice = await prisma.document.findFirst({
      where: { id: invoiceId, userId: session.user.id, type: "INVOICE" },
      select: {
        id: true,
        number: true,
        date: true,
        dueDate: true,
        notes: true,
        subtotal: true,
        taxTotal: true,
        total: true,
        depositAmount: true,
        businessMetadata: true,
        einvoiceRef: true,
        lineItems: {
          select: {
            description: true,
            quantity: true,
            unitPrice: true,
            vatRate: true,
            subtotal: true,
          },
          orderBy: { order: "asc" },
        },
        client: {
          select: {
            companyName: true,
            firstName: true,
            lastName: true,
            companySiren: true,
            companySiret: true,
            companyVatNumber: true,
            email: true,
            address: true,
            postalCode: true,
            city: true,
            country: true,
            phone: true,
          },
        },
        user: {
          select: {
            companyName: true,
            companySiren: true,
            companySiret: true,
            companyVatNumber: true,
            companyAddress: true,
            companyPostalCode: true,
            companyCity: true,
            companyEmail: true,
            companyPhone: true,
            iban: true,
            bic: true,
          },
        },
      },
    })

    if (!invoice) {
      return { success: false, error: "Facture introuvable" } as const
    }

    // ─ 2. Vérification : on a déjà envoyé cette facture ? ─
    if (invoice.einvoiceRef) {
      return {
        success: false,
        error: "Cette facture a déjà été envoyée électroniquement",
      } as const
    }

    // ─ 3. Vérification : le client doit avoir un SIREN pour le routage Peppol ─
    if (!invoice.client.companySiren) {
      return {
        success: false,
        error:
          "Le client doit avoir un SIREN pour recevoir une facture électronique. " +
          "Ajoutez son SIREN dans la fiche client.",
      } as const
    }

    // ─ 4. Vérification : le vendeur doit avoir un SIREN (requis pour son adresse Peppol) ─
    if (!invoice.user.companySiren) {
      return {
        success: false,
        error:
          "Votre SIREN doit être renseigné dans \"Mon entreprise\" pour envoyer des factures électroniques.",
      } as const
    }

    // ─ 5. Construire l'objet EN16931 ─
    const en16931 = buildEN16931(invoice as unknown as InvoiceWithFullData)

    // ─ 6. Convertir EN16931 JSON → XML CII via SuperPDP ─
    const xml = await convertInvoiceToXml(en16931)

    // ─ 7. Envoyer le XML CII sur le réseau Peppol ─
    const response = await sendInvoiceXml(xml)

    // ─ 8. Persister l'ID SuperPDP et le statut initial en DB ─
    const initialStatus = response.events?.[0]?.status_code ?? "api:uploaded"
    await prisma.document.update({
      where: { id: invoiceId },
      data: {
        einvoiceRef: String(response.id),
        einvoiceStatus: initialStatus,
        einvoiceSentAt: new Date(),
      },
    })

    revalidatePath("/dashboard/invoices")

    return {
      success: true,
      data: { superpdpId: response.id, status: initialStatus },
    } as const
  } catch (error) {
    console.error("[sendEInvoice] Erreur:", error)
    const message = error instanceof Error ? error.message : "Erreur inconnue"
    return { success: false, error: `Envoi électronique échoué : ${message}` } as const
  }
}

// ─── Action : récupérer le statut e-invoice d'une facture ────────────────────

export async function getEInvoiceStatus(invoiceId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié", data: null } as const
  }

  try {
    const doc = await prisma.document.findFirst({
      where: { id: invoiceId, userId: session.user.id },
      select: {
        einvoiceRef: true,
        einvoiceStatus: true,
        einvoiceSentAt: true,
      },
    })

    if (!doc) {
      return { success: false, error: "Facture introuvable", data: null } as const
    }

    return { success: true, data: doc } as const
  } catch (error) {
    console.error("[getEInvoiceStatus] Erreur:", error)
    return { success: false, error: "Erreur lors de la récupération du statut", data: null } as const
  }
}

// src/lib/utils/pdf-preview-helpers.ts
// Convertit les données de formulaire en objets "Saved*" pour les PDF de prévisualisation.
// Les IDs sont factices ("__preview__") — ces objets ne sont jamais persistés.

import { calcInvoiceTotals } from "@/lib/utils/calculs-facture";
import type { InvoiceFormData, CompanyInfo } from "@/lib/validations/invoice";
import type { QuoteFormData } from "@/lib/validations/quote";
import type { DepositFormData, SavedDeposit } from "@/lib/types/deposits";
import type { PurchaseOrderFormData } from "@/lib/validations/purchase-order";
import type { SavedInvoice } from "@/lib/actions/invoices";
import type { SavedQuote } from "@/lib/actions/quotes";
import type { SavedPurchaseOrder } from "@/lib/pdf/purchase-order-pdf-document";
import type { SavedClient } from "@/lib/actions/clients";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppearanceCtx {
  themeColor: string;
  companyFont: string;
  companyLogo: string | null;
  invoiceFooter?: string | null;
}

// ─── Helpers internes ─────────────────────────────────────────────────────────

/** Résout le client depuis clientId (lookup) ou newClient (saisie rapide) */
function resolveClient(
  clientId: string | undefined,
  newClient: InvoiceFormData["newClient"],
  clients: SavedClient[],
) {
  if (newClient) {
    return {
      id: "__new__",
      companyName: null,
      companySiret: newClient.siret ?? null,
      firstName: newClient.name,
      lastName: null,
      email: newClient.email,
      city: newClient.city,
      address: newClient.address,
      postalCode: newClient.zipCode ?? null,
    };
  }
  const found = clients.find((c) => c.id === clientId);
  if (found) {
    return {
      id: found.id,
      companyName: found.companyName ?? null,
      companySiret: found.siret ?? null,
      firstName: found.firstName ?? null,
      lastName: found.lastName ?? null,
      email: found.email,
      city: found.city ?? null,
      address: found.address ?? null,
      postalCode: found.postalCode ?? null,
    };
  }
  return {
    id: "__unknown__",
    companyName: null,
    companySiret: null,
    firstName: "Client",
    lastName: null,
    email: "",
    city: null,
    address: null,
    postalCode: null,
  };
}

/** Construit le bloc `user` depuis companyInfo + apparence */
function buildUser(companyInfo: CompanyInfo | null, appearance: AppearanceCtx) {
  return {
    companyName: companyInfo?.name ?? null,
    companySiret: companyInfo?.siret ?? null,
    companyAddress: companyInfo?.address ?? null,
    companyPostalCode: companyInfo?.zipCode ?? null,
    companyCity: companyInfo?.city ?? null,
    companyEmail: companyInfo?.email ?? null,
    companyPhone: companyInfo?.phone ?? null,
    themeColor: appearance.themeColor,
    companyFont: appearance.companyFont,
    companyLogo: appearance.companyLogo,
    iban: null,  // non disponible hors DB
    bic: null,
    invoiceFooter: appearance.invoiceFooter ?? null,
  };
}

/** Mappe les lignes de formulaire en lineItems PDF */
function buildLineItems(
  lines: { description: string; quantity: number; unitPrice: number; vatRate?: number; category?: string }[],
  globalVatRate: number,
  vatMode?: "global" | "per_line",
) {
  return lines.map((line, i) => {
    const qty = line.quantity || 0;
    const sub = qty * (line.unitPrice || 0);
    const effectiveVat = vatMode === "per_line" ? (line.vatRate ?? globalVatRate) : globalVatRate;
    const tax = sub * (effectiveVat / 100);
    return {
      id: `__line_${i}__`,
      description: line.description || "",
      quantity: qty,
      unitPrice: line.unitPrice || 0,
      vatRate: effectiveVat,
      subtotal: sub,
      taxAmount: tax,
      total: sub + tax,
      category: line.category ?? null,
      order: i,
    };
  });
}

// ─── Builders publics ─────────────────────────────────────────────────────────

/** Facture / Proforma */
export function buildPreviewInvoice(
  values: InvoiceFormData,
  number: string,
  companyInfo: CompanyInfo | null,
  appearance: AppearanceCtx,
  clients: SavedClient[],
): SavedInvoice {
  const vatRate = values.vatRate ?? 20;
  const vatMode = values.vatMode ?? "global";
  const lines = values.lines ?? [];
  const totals = calcInvoiceTotals({
    lines: lines.map((l) => ({ quantity: l.quantity || 0, unitPrice: l.unitPrice || 0, vatRate: l.vatRate })),
    vatRate,
    vatMode,
    discountType: values.discountType,
    discountValue: values.discountValue ?? 0,
    depositAmount: values.depositAmount,
  });

  return {
    id: "__preview__",
    number,
    status: "DRAFT",
    updatedAt: new Date().toISOString(),
    date: values.date || new Date().toISOString().split("T")[0],
    dueDate: values.dueDate || null,
    invoiceType: values.invoiceType ?? null,
    discountType: values.discountType ?? null,
    subtotal: totals.subtotal,
    taxTotal: totals.taxTotal,
    total: totals.totalTTC,
    discount: values.discountValue ?? null,
    depositAmount: values.depositAmount ?? null,
    notes: values.notes ?? null,
    businessMetadata: { vatRate, vatMode },
    einvoiceRef: null,
    einvoiceStatus: null,
    einvoiceSentAt: null,
    lineItems: buildLineItems(lines, vatRate, vatMode),
    client: resolveClient(values.clientId, values.newClient, clients),
    user: buildUser(companyInfo, appearance),
  };
}

/** Devis */
export function buildPreviewQuote(
  values: QuoteFormData,
  number: string,
  companyInfo: CompanyInfo | null,
  appearance: AppearanceCtx,
  clients: SavedClient[],
): SavedQuote {
  const vatRate = values.vatRate ?? 20;
  const lines = values.lines ?? [];
  const totals = calcInvoiceTotals({
    lines: lines.map((l) => ({ quantity: l.quantity || 0, unitPrice: l.unitPrice || 0 })),
    vatRate,
    discountType: values.discountType,
    discountValue: values.discountValue ?? 0,
  });

  return {
    id: "__preview__",
    number,
    status: "DRAFT",
    updatedAt: new Date().toISOString(),
    date: values.date || new Date().toISOString().split("T")[0],
    validUntil: values.validUntil || null,
    invoiceType: values.quoteType ?? null,
    discountType: values.discountType ?? null,
    subtotal: totals.subtotal,
    taxTotal: totals.taxTotal,
    total: totals.totalTTC,
    discount: values.discountValue ?? null,
    depositAmount: values.depositAmount ?? null,
    notes: values.notes ?? null,
    acceptToken: null,
    refuseToken: null,
    businessMetadata: null,
    lineItems: buildLineItems(lines, vatRate),
    client: resolveClient(values.clientId, values.newClient, clients),
    user: buildUser(companyInfo, appearance),
  };
}

/** Acompte */
export function buildPreviewDeposit(
  values: DepositFormData,
  number: string,
  companyInfo: CompanyInfo | null,
  appearance: AppearanceCtx,
  clients: SavedClient[],
): SavedDeposit {
  const vatRate = values.vatRate ?? 20;
  const sub = values.amount || 0;
  const tax = sub * (vatRate / 100);

  const found = clients.find((c) => c.id === values.clientId);
  const client = found
    ? {
        id: found.id,
        companyName: found.companyName ?? null,
        firstName: found.firstName ?? null,
        lastName: found.lastName ?? null,
        email: found.email,
        city: found.city ?? null,
        address: found.address ?? null,
        postalCode: found.postalCode ?? null,
        phone: found.phone ?? null,
        companySiret: found.siret ?? null,
      }
    : {
        id: "__unknown__",
        companyName: null,
        firstName: "Client",
        lastName: null,
        email: "",
        city: null,
        address: null,
        postalCode: null,
        phone: null,
        companySiret: null,
      };

  return {
    id: "__preview__",
    number,
    status: "DRAFT",
    date: new Date().toISOString().split("T")[0],
    dueDate: values.dueDate || null,
    total: sub + tax,
    subtotal: sub,
    taxTotal: tax,
    notes: values.notes ?? null,
    relatedDocumentId: values.relatedQuoteId ?? null,
    businessMetadata: null,
    amount: sub,
    vatRate,
    description: "Acompte",
    clientId: values.clientId,
    client,
    user: buildUser(companyInfo, appearance),
  };
}

/** Bon de commande */
export function buildPreviewPurchaseOrder(
  values: PurchaseOrderFormData,
  number: string,
  companyInfo: CompanyInfo | null,
  appearance: AppearanceCtx,
  clients: SavedClient[],
): SavedPurchaseOrder {
  const vatRate = values.vatRate ?? 20;
  const lines = values.lines ?? [];
  const totals = calcInvoiceTotals({
    lines: lines.map((l) => ({ quantity: l.quantity || 0, unitPrice: l.unitPrice || 0 })),
    vatRate,
    discountType: values.discountType,
    discountValue: values.discountValue ?? 0,
  });

  const client = resolveClient(values.clientId, values.newClient, clients);

  return {
    id: "__preview__",
    number,
    status: "DRAFT",
    date: values.date || new Date().toISOString().split("T")[0],
    deliveryDate: values.deliveryDate || null,
    bcReference: values.bcReference || null,
    subtotal: totals.subtotal,
    taxTotal: totals.taxTotal,
    total: totals.totalTTC,
    discount: values.discountValue ?? null,
    notes: values.notes ?? null,
    invoiceType: values.orderType ?? null,
    businessMetadata: null,
    relatedDocumentId: null,
    lineItems: buildLineItems(lines, vatRate),
    client: {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      companyName: client.companyName,
      email: client.email,
      address: client.address,
      city: client.city,
      postalCode: client.postalCode,
      country: null,
      siret: client.companySiret,
    },
    user: buildUser(companyInfo, appearance),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

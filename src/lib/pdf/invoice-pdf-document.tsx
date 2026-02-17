// src/lib/pdf/invoice-pdf-document.tsx
// Composant PDF partagé (client + serveur) — PAS de "use client"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { SavedInvoice } from "@/lib/actions/invoices";
import { INVOICE_TYPE_CONFIG } from "@/lib/validations/invoice";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtN(n: number) {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getClientName(client: SavedInvoice["client"]) {
  if (client.companyName) return client.companyName;
  const parts = [client.firstName, client.lastName].filter(Boolean);
  return parts.join(" ") || client.email;
}

// ─── Styles PDF ───────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    paddingBottom: 50,
    color: "#1e293b",
  },
  header: {
    backgroundColor: "#7c3aed",
    padding: 20,
    marginBottom: 20,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    fontFamily: "Helvetica-Bold",
  },
  headerNumber: {
    fontSize: 10,
    color: "#ddd6fe",
    marginTop: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerDates: {
    color: "#e0e7ff",
    fontSize: 9,
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#94a3b8",
    letterSpacing: 1,
    marginBottom: 4,
  },
  twoCol: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 20,
  },
  col: {
    flex: 1,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  muted: {
    color: "#64748b",
    fontSize: 9,
    marginBottom: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginVertical: 16,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#94a3b8",
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  totalsContainer: {
    alignItems: "flex-end",
    marginTop: 12,
  },
  totalsRow: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    marginBottom: 3,
  },
  totalLabel: {
    color: "#64748b",
    fontSize: 9,
  },
  totalValue: {
    fontSize: 9,
  },
  grandTotal: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    borderTopWidth: 2,
    borderTopColor: "#7c3aed",
    paddingTop: 4,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#1e293b",
  },
  grandTotalValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#7c3aed",
  },
  notes: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  notesTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
  },
});

// ─── Sous-composant : tableau de lignes ──────────────────────────────────────

interface LinesTablePdfProps {
  lines: SavedInvoice["lineItems"];
  typeConfig: { descriptionLabel: string; quantityLabel: string | null };
  isForfait: boolean;
  title?: string;
}

function LinesTablePdf({ lines, typeConfig, isForfait, title }: LinesTablePdfProps) {
  return (
    <View style={{ marginBottom: 8 }}>
      {title && (
        <Text style={[S.sectionTitle, { color: "#7c3aed", marginBottom: 6 }]}>
          {title}
        </Text>
      )}
      <View style={S.tableHeader}>
        <Text style={[S.tableHeaderCell, { flex: 3 }]}>
          {typeConfig.descriptionLabel}
        </Text>
        {!isForfait && (
          <Text style={[S.tableHeaderCell, { width: 60, textAlign: "right" }]}>
            {typeConfig.quantityLabel ?? "Qté"}
          </Text>
        )}
        <Text style={[S.tableHeaderCell, { width: 70, textAlign: "right" }]}>
          Prix unit.
        </Text>
        {!isForfait && (
          <Text style={[S.tableHeaderCell, { width: 70, textAlign: "right" }]}>
            Total HT
          </Text>
        )}
      </View>
      {lines.map((line) => (
        <View key={line.id} style={S.tableRow}>
          <Text style={{ flex: 3, fontSize: 9 }}>{line.description}</Text>
          {!isForfait && (
            <Text style={{ width: 60, textAlign: "right", fontSize: 9, color: "#64748b" }}>
              {line.quantity}
            </Text>
          )}
          <Text style={{ width: 70, textAlign: "right", fontSize: 9, color: "#64748b" }}>
            {fmtN(line.unitPrice)} €
          </Text>
          {!isForfait && (
            <Text style={{ width: 70, textAlign: "right", fontSize: 9 }}>
              {fmtN(line.subtotal)} €
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Composant principal : document PDF ──────────────────────────────────────

export default function InvoicePdfDocument({ invoice }: { invoice: SavedInvoice }) {
  const typeConfig =
    INVOICE_TYPE_CONFIG[(invoice.invoiceType as keyof typeof INVOICE_TYPE_CONFIG) ?? "basic"] ??
    INVOICE_TYPE_CONFIG["basic"];

  const isForfait = typeConfig.quantityLabel === null;
  const isArtisan = invoice.invoiceType === "artisan";
  const vatRate = (invoice.businessMetadata?.vatRate as number) ?? 20;
  const discount = invoice.discount ?? 0;
  const deposit = invoice.depositAmount ?? 0;
  const netAPayer = invoice.total - deposit;

  const sortedLines = [...invoice.lineItems].sort((a, b) => a.order - b.order);
  const mainOeuvreLines = isArtisan
    ? sortedLines.filter((l) => !l.category || l.category === "main_oeuvre")
    : sortedLines;
  const materiauLines = isArtisan
    ? sortedLines.filter((l) => l.category === "materiel")
    : [];

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <View style={S.headerRow}>
            <View>
              <Text style={S.headerTitle}>FACTURE</Text>
              <Text style={S.headerNumber}>{invoice.number}</Text>
            </View>
            <View>
              <Text style={[S.headerDates, { marginBottom: 2 }]}>
                Date : {fmtDate(invoice.date)}
              </Text>
              <Text style={S.headerDates}>
                Échéance : {fmtDate(invoice.dueDate)}
              </Text>
            </View>
          </View>
        </View>

        {/* Émetteur / Destinataire */}
        <View style={S.twoCol}>
          <View style={S.col}>
            <Text style={S.sectionTitle}>Émetteur</Text>
            <Text style={S.bold}>{invoice.user.companyName ?? "—"}</Text>
            {invoice.user.companyAddress && (
              <Text style={S.muted}>{invoice.user.companyAddress}</Text>
            )}
            {(invoice.user.companyPostalCode || invoice.user.companyCity) && (
              <Text style={S.muted}>
                {[invoice.user.companyPostalCode, invoice.user.companyCity]
                  .filter(Boolean)
                  .join(" ")}
              </Text>
            )}
            {invoice.user.companySiret && (
              <Text style={S.muted}>SIRET : {invoice.user.companySiret}</Text>
            )}
            {invoice.user.companyEmail && (
              <Text style={S.muted}>{invoice.user.companyEmail}</Text>
            )}
          </View>

          <View style={S.col}>
            <Text style={S.sectionTitle}>Destinataire</Text>
            <Text style={S.bold}>{getClientName(invoice.client)}</Text>
            <Text style={S.muted}>{invoice.client.email}</Text>
            {invoice.client.address && (
              <Text style={S.muted}>{invoice.client.address}</Text>
            )}
            {(invoice.client.postalCode || invoice.client.city) && (
              <Text style={S.muted}>
                {[invoice.client.postalCode, invoice.client.city]
                  .filter(Boolean)
                  .join(" ")}
              </Text>
            )}
          </View>
        </View>

        <View style={S.divider} />

        {/* Lignes */}
        {isArtisan ? (
          <>
            <LinesTablePdf lines={mainOeuvreLines} typeConfig={typeConfig} isForfait={false} title="Main d'œuvre" />
            {materiauLines.length > 0 && (
              <LinesTablePdf lines={materiauLines} typeConfig={typeConfig} isForfait={false} title="Matériaux" />
            )}
          </>
        ) : (
          <LinesTablePdf lines={sortedLines} typeConfig={typeConfig} isForfait={isForfait} />
        )}

        {/* Espace entre les lignes et les totaux */}
        <View style={{ minHeight: 80 }} />

        {/* Totaux */}
        <View style={S.totalsContainer}>
          <View style={S.totalsRow}>
            <Text style={S.totalLabel}>Sous-total HT</Text>
            <Text style={S.totalValue}>{fmtN(invoice.subtotal)} €</Text>
          </View>
          {discount > 0 && (
            <View style={S.totalsRow}>
              <Text style={S.totalLabel}>Réduction</Text>
              <Text style={[S.totalValue, { color: "#e11d48" }]}>−{fmtN(discount)} €</Text>
            </View>
          )}
          <View style={S.totalsRow}>
            <Text style={S.totalLabel}>TVA ({vatRate}%)</Text>
            <Text style={S.totalValue}>{fmtN(invoice.taxTotal)} €</Text>
          </View>
          <View style={S.grandTotal}>
            <Text style={S.grandTotalLabel}>Total TTC</Text>
            <Text style={S.grandTotalValue}>{fmtN(invoice.total)} €</Text>
          </View>
          {deposit > 0 && (
            <>
              <View style={[S.totalsRow, { marginTop: 4 }]}>
                <Text style={S.totalLabel}>Acompte versé</Text>
                <Text style={[S.totalValue, { color: "#e11d48" }]}>−{fmtN(deposit)} €</Text>
              </View>
              <View style={S.grandTotal}>
                <Text style={S.grandTotalLabel}>NET À PAYER</Text>
                <Text style={S.grandTotalValue}>{fmtN(netAPayer)} €</Text>
              </View>
            </>
          )}
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={S.notes}>
            <Text style={S.notesTitle}>Notes</Text>
            <Text style={S.muted}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={S.footer}>Document généré par FacturFlow</Text>
      </Page>
    </Document>
  );
}

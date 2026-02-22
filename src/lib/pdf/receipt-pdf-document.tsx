// src/lib/pdf/receipt-pdf-document.tsx
// Composant PDF pour les reçus — PAS de "use client"

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { SavedReceipt } from "@/lib/types/receipts";
import { RECEIPT_PAYMENT_METHODS } from "@/lib/types/receipts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtAmount(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getClientName(client: SavedReceipt["client"]) {
  if (client.companyName) return client.companyName;
  return [client.firstName, client.lastName].filter(Boolean).join(" ") || client.email;
}

function getPaymentLabel(method: string) {
  return RECEIPT_PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#1e293b",
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#7c3aed",
    padding: 20,
    marginBottom: 24,
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {},
  headerTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerNumber: {
    fontSize: 12,
    color: "#e9d5ff",
  },
  headerDate: {
    fontSize: 9,
    color: "#c4b5fd",
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: "#ffffff30",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  headerBadgeText: {
    fontSize: 9,
    color: "#fff",
    fontFamily: "Helvetica-Bold",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#7c3aed",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  partiesRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
  },
  partyBlock: {
    flex: 1,
    backgroundColor: "#f8f7ff",
    padding: 12,
    borderRadius: 4,
    borderLeft: "2px solid #7c3aed",
  },
  partyLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#7c3aed",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  partyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    marginBottom: 3,
  },
  partyInfo: {
    fontSize: 9,
    color: "#64748b",
    lineHeight: 1.5,
  },
  summaryBox: {
    backgroundColor: "#f5f3ff",
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 9,
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 10,
    color: "#1e293b",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #ddd6fe",
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#7c3aed",
  },
  totalAmount: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#7c3aed",
  },
  notesBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  notesText: {
    fontSize: 9,
    color: "#64748b",
    lineHeight: 1.6,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: "1px solid #e2e8f0",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#94a3b8",
  },
  confirmBanner: {
    backgroundColor: "#f0fdf4",
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  confirmText: {
    fontSize: 10,
    color: "#15803d",
    fontFamily: "Helvetica-Bold",
  },
});

// ─── Composant PDF ────────────────────────────────────────────────────────────

export function ReceiptPdfDocument({ receipt }: { receipt: SavedReceipt }) {
  const clientName = getClientName(receipt.client);
  const issuerName = receipt.user.companyName || receipt.user.name;

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Header violet */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            <Text style={S.headerTitle}>REÇU</Text>
            <Text style={S.headerNumber}>{receipt.number}</Text>
            <Text style={S.headerDate}>Émis le {fmtDate(receipt.date)}</Text>
          </View>
          <View style={S.headerBadge}>
            <Text style={S.headerBadgeText}>PAIEMENT REÇU</Text>
          </View>
        </View>

        {/* Confirmation de paiement */}
        <View style={S.confirmBanner}>
          <Text style={S.confirmText}>
            Paiement reçu par {getPaymentLabel(receipt.paymentMethod)} —{" "}
            {fmtAmount(receipt.total)}
          </Text>
        </View>

        {/* Émetteur + Client */}
        <View style={S.partiesRow}>
          <View style={S.partyBlock}>
            <Text style={S.partyLabel}>Émis par</Text>
            <Text style={S.partyName}>{issuerName}</Text>
            {receipt.user.companySiret && (
              <Text style={S.partyInfo}>SIRET : {receipt.user.companySiret}</Text>
            )}
            {receipt.user.companyAddress && (
              <Text style={S.partyInfo}>{receipt.user.companyAddress}</Text>
            )}
            {(receipt.user.companyPostalCode || receipt.user.companyCity) && (
              <Text style={S.partyInfo}>
                {[receipt.user.companyPostalCode, receipt.user.companyCity].filter(Boolean).join(" ")}
              </Text>
            )}
            {receipt.user.companyEmail && (
              <Text style={S.partyInfo}>{receipt.user.companyEmail}</Text>
            )}
          </View>

          <View style={S.partyBlock}>
            <Text style={S.partyLabel}>Reçu de</Text>
            <Text style={S.partyName}>{clientName}</Text>
            {receipt.client.email && (
              <Text style={S.partyInfo}>{receipt.client.email}</Text>
            )}
            {receipt.client.phone && (
              <Text style={S.partyInfo}>{receipt.client.phone}</Text>
            )}
            {receipt.client.address && (
              <Text style={S.partyInfo}>{receipt.client.address}</Text>
            )}
            {(receipt.client.postalCode || receipt.client.city) && (
              <Text style={S.partyInfo}>
                {[receipt.client.postalCode, receipt.client.city].filter(Boolean).join(" ")}
              </Text>
            )}
          </View>
        </View>

        {/* Récapitulatif du paiement */}
        <View style={S.summaryBox}>
          <View style={S.summaryRow}>
            <Text style={S.summaryLabel}>Objet du paiement</Text>
            <Text style={S.summaryValue}>{receipt.description}</Text>
          </View>
          <View style={S.summaryRow}>
            <Text style={S.summaryLabel}>Mode de paiement</Text>
            <Text style={S.summaryValue}>{getPaymentLabel(receipt.paymentMethod)}</Text>
          </View>
          <View style={S.summaryRow}>
            <Text style={S.summaryLabel}>Date du paiement</Text>
            <Text style={S.summaryValue}>{fmtDate(receipt.date)}</Text>
          </View>
          <View style={S.totalRow}>
            <Text style={S.totalLabel}>Montant encaissé</Text>
            <Text style={S.totalAmount}>{fmtAmount(receipt.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {receipt.notes && (
          <View style={S.notesBox}>
            <Text style={[S.sectionTitle, { marginBottom: 4 }]}>Notes</Text>
            <Text style={S.notesText}>{receipt.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={S.footer}>
          <Text style={S.footerText}>
            {receipt.number} — Émis le {fmtDate(receipt.date)}
          </Text>
          <Text style={S.footerText}>Document généré par FacturFlow</Text>
        </View>
      </Page>
    </Document>
  );
}

// src/lib/pdf/quote-pdf-document.tsx
// Composant PDF partagé (client + serveur) — PAS de "use client"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { SavedQuote } from "@/hooks/use-quotes";

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

function getClientName(client: SavedQuote["client"]) {
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
    backgroundColor: "#059669", // Couleur verte pour les devis
    padding: 20,
    marginBottom: 30,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#d1fae5",
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  col: {
    flex: 1,
  },
  colRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#059669",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
    marginBottom: 2,
  },
  textBold: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
  },
  textMuted: {
    fontSize: 9,
    color: "#64748b",
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: 8,
    borderBottom: "1px solid #e2e8f0",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottom: "1px solid #f1f5f9",
  },
  tableColDescription: {
    flex: 3,
  },
  tableColQuantity: {
    flex: 1,
    textAlign: "center",
  },
  tableColPrice: {
    flex: 1,
    textAlign: "right",
  },
  tableColTotal: {
    flex: 1,
    textAlign: "right",
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#475569",
    textTransform: "uppercase",
  },
  tableCellText: {
    fontSize: 9,
    lineHeight: 1.3,
  },
  totalsSection: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    marginBottom: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: "#374151",
  },
  totalValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  totalFinalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#059669",
  },
  totalFinalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#059669",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#64748b",
    borderTop: "1px solid #e2e8f0",
    paddingTop: 10,
  },
  validitySection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#fef3c7",
    borderRadius: 6,
  },
  validityText: {
    fontSize: 10,
    color: "#92400e",
    fontWeight: "bold",
  },
});

// ─── Composant PDF ────────────────────────────────────────────────────────────

interface QuotePdfDocumentProps {
  quote: SavedQuote;
}

export default function QuotePdfDocument({ quote }: QuotePdfDocumentProps) {
  const clientName = getClientName(quote.client);
  
  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <Text style={S.headerTitle}>DEVIS</Text>
          <Text style={S.headerSubtitle}>{quote.number}</Text>
        </View>

        {/* Informations principales */}
        <View style={S.row}>
          {/* Émetteur */}
          <View style={S.col}>
            <Text style={S.sectionTitle}>Émetteur</Text>
            {quote.user.companyName && (
              <Text style={S.textBold}>{quote.user.companyName}</Text>
            )}
            {quote.user.companyAddress && (
              <Text style={S.text}>{quote.user.companyAddress}</Text>
            )}
            {quote.user.companyPostalCode && quote.user.companyCity && (
              <Text style={S.text}>
                {quote.user.companyPostalCode} {quote.user.companyCity}
              </Text>
            )}
            {quote.user.companyEmail && (
              <Text style={S.text}>{quote.user.companyEmail}</Text>
            )}
            {quote.user.companySiret && (
              <Text style={S.textMuted}>SIRET : {quote.user.companySiret}</Text>
            )}
          </View>

          {/* Destinataire */}
          <View style={S.colRight}>
            <Text style={S.sectionTitle}>Destinataire</Text>
            <Text style={S.textBold}>{clientName}</Text>
            {quote.client.address && (
              <Text style={S.text}>{quote.client.address}</Text>
            )}
            {quote.client.postalCode && quote.client.city && (
              <Text style={S.text}>
                {quote.client.postalCode} {quote.client.city}
              </Text>
            )}
            <Text style={S.text}>{quote.client.email}</Text>
            {quote.client.phone && (
              <Text style={S.text}>{quote.client.phone}</Text>
            )}
          </View>
        </View>

        {/* Dates et informations */}
        <View style={S.row}>
          <View style={S.col}>
            <Text style={S.text}>
              <Text style={S.textBold}>Date d'émission :</Text> {fmtDate(quote.date)}
            </Text>
            {quote.validUntil && (
              <Text style={S.text}>
                <Text style={S.textBold}>Valide jusqu'au :</Text> {fmtDate(quote.validUntil)}
              </Text>
            )}
          </View>
        </View>

        {/* Tableau des lignes */}
        <View style={S.table}>
          {/* En-tête */}
          <View style={S.tableHeader}>
            <View style={S.tableColDescription}>
              <Text style={S.tableHeaderText}>Description</Text>
            </View>
            <View style={S.tableColQuantity}>
              <Text style={S.tableHeaderText}>Qté</Text>
            </View>
            <View style={S.tableColPrice}>
              <Text style={S.tableHeaderText}>Prix Unit. HT</Text>
            </View>
            <View style={S.tableColTotal}>
              <Text style={S.tableHeaderText}>Total HT</Text>
            </View>
          </View>

          {/* Lignes */}
          {quote.lineItems.map((line, idx) => (
            <View key={idx} style={S.tableRow}>
              <View style={S.tableColDescription}>
                <Text style={S.tableCellText}>{line.description}</Text>
              </View>
              <View style={S.tableColQuantity}>
                <Text style={S.tableCellText}>{fmtN(line.quantity)}</Text>
              </View>
              <View style={S.tableColPrice}>
                <Text style={S.tableCellText}>{fmtN(line.unitPrice)} €</Text>
              </View>
              <View style={S.tableColTotal}>
                <Text style={S.tableCellText}>{fmtN(line.total)} €</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totaux */}
        <View style={S.totalsSection}>
          <View style={S.totalRow}>
            <Text style={S.totalLabel}>Sous-total HT :</Text>
            <Text style={S.totalValue}>{fmtN(quote.subtotal)} €</Text>
          </View>
          <View style={S.totalRow}>
            <Text style={S.totalLabel}>TVA :</Text>
            <Text style={S.totalValue}>{fmtN(quote.taxTotal)} €</Text>
          </View>
          <View style={S.totalRowFinal}>
            <Text style={S.totalFinalLabel}>Total TTC :</Text>
            <Text style={S.totalFinalValue}>{fmtN(quote.total)} €</Text>
          </View>
        </View>

        {/* Validité */}
        {quote.validUntil && (
          <View style={S.validitySection}>
            <Text style={S.validityText}>
              Ce devis est valable jusqu'au {fmtDate(quote.validUntil)}
            </Text>
          </View>
        )}

        {/* Notes */}
        {quote.notes && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Notes</Text>
            <Text style={S.text}>{quote.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={S.footer}>
          Devis généré par FacturFlow • {new Date().toLocaleDateString("fr-FR")}
        </Text>
      </Page>
    </Document>
  );
}
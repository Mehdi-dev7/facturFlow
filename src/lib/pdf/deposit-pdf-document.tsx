// src/lib/pdf/deposit-pdf-document.tsx
// Composant PDF partagé (client + serveur) — PAS de "use client"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { SavedDeposit } from "@/lib/types/deposits";

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

function getClientName(client: SavedDeposit["client"]) {
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
    backgroundColor: "#7c3aed", // Couleur violette pour les acomptes
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
    color: "#e9d5ff",
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
    color: "#7c3aed",
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
  depositSection: {
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
  },
  depositTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#7c3aed",
    marginBottom: 10,
  },
  depositDescription: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 15,
    color: "#374151",
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
    backgroundColor: "#f3f4f6",
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
    color: "#7c3aed",
  },
  totalFinalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#7c3aed",
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
});

// ─── Composant PDF ────────────────────────────────────────────────────────────

interface DepositPdfDocumentProps {
  deposit: SavedDeposit;
}

export default function DepositPdfDocument({ deposit }: DepositPdfDocumentProps) {
  const clientName = getClientName(deposit.client);
  
  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <Text style={S.headerTitle}>ACOMPTE</Text>
          <Text style={S.headerSubtitle}>{deposit.number}</Text>
        </View>

        {/* Informations principales */}
        <View style={S.row}>
          {/* Émetteur */}
          <View style={S.col}>
            <Text style={S.sectionTitle}>Émetteur</Text>
            {deposit.user.companyName && (
              <Text style={S.textBold}>{deposit.user.companyName}</Text>
            )}
            {deposit.user.companyAddress && (
              <Text style={S.text}>{deposit.user.companyAddress}</Text>
            )}
            {deposit.user.companyPostalCode && deposit.user.companyCity && (
              <Text style={S.text}>
                {deposit.user.companyPostalCode} {deposit.user.companyCity}
              </Text>
            )}
            {deposit.user.companyEmail && (
              <Text style={S.text}>{deposit.user.companyEmail}</Text>
            )}
            {deposit.user.companySiret && (
              <Text style={S.textMuted}>SIRET : {deposit.user.companySiret}</Text>
            )}
          </View>

          {/* Destinataire */}
          <View style={S.colRight}>
            <Text style={S.sectionTitle}>Destinataire</Text>
            <Text style={S.textBold}>{clientName}</Text>
            {deposit.client.address && (
              <Text style={S.text}>{deposit.client.address}</Text>
            )}
            {deposit.client.postalCode && deposit.client.city && (
              <Text style={S.text}>
                {deposit.client.postalCode} {deposit.client.city}
              </Text>
            )}
            <Text style={S.text}>{deposit.client.email}</Text>
            {deposit.client.phone && (
              <Text style={S.text}>{deposit.client.phone}</Text>
            )}
          </View>
        </View>

        {/* Dates et informations */}
        <View style={S.row}>
          <View style={S.col}>
            <Text style={S.text}>
              <Text style={S.textBold}>Date d'émission :</Text> {fmtDate(deposit.date)}
            </Text>
            {deposit.dueDate && (
              <Text style={S.text}>
                <Text style={S.textBold}>Date d'échéance :</Text> {fmtDate(deposit.dueDate)}
              </Text>
            )}
          </View>
        </View>

        {/* Section Acompte */}
        <View style={S.depositSection}>
          <Text style={S.depositTitle}>Détail de l'acompte</Text>
          <Text style={S.depositDescription}>{deposit.description}</Text>
          
          {/* Totaux */}
          <View style={S.totalsSection}>
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>Montant HT :</Text>
              <Text style={S.totalValue}>{fmtN(deposit.amount)} €</Text>
            </View>
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>TVA ({deposit.vatRate}%) :</Text>
              <Text style={S.totalValue}>{fmtN(deposit.taxTotal)} €</Text>
            </View>
            <View style={S.totalRowFinal}>
              <Text style={S.totalFinalLabel}>Total TTC :</Text>
              <Text style={S.totalFinalValue}>{fmtN(deposit.total)} €</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {deposit.notes && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Notes</Text>
            <Text style={S.text}>{deposit.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={S.footer}>
          Acompte généré par FacturFlow • {new Date().toLocaleDateString("fr-FR")}
        </Text>
      </Page>
    </Document>
  );
}
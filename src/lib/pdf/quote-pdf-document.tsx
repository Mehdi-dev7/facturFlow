// src/lib/pdf/quote-pdf-document.tsx
// Composant PDF partagé (client + serveur) — PAS de "use client"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
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

/** Convertit hex 6 chiffres + alpha 0-1 en rgba() pour react-pdf */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─── Styles PDF statiques ────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    paddingBottom: 50,
    color: "#1e293b",
  },
  // ── Header ────
  headerBox: { padding: 20, marginBottom: 24, borderRadius: 8 },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  headerLeft: { flex: 1 },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  headerNumber: { fontSize: 12, color: "#ffffffcc" },
  headerCenter: { flex: 1, flexDirection: "column", alignItems: "center", gap: 4 },
  headerLogoWrapper: { width: 48, height: 48, borderRadius: 24, overflow: "hidden" },
  headerLogo: { width: 48, height: 48 },
  headerCompanyName: { fontSize: 9, color: "#ffffffcc", textAlign: "center" },
  headerRight: { flex: 1, flexDirection: "column", alignItems: "flex-end" },
  headerDateLabel: { fontSize: 9, color: "#ffffffbb", marginBottom: 2 },
  headerDateValue: {
    fontSize: 10,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    textAlign: "right",
  },
  // ── Parties ───
  partiesRow: { flexDirection: "row", gap: 16, marginBottom: 20 },
  partyBlock: { flex: 1 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  text: { fontSize: 10, lineHeight: 1.4, marginBottom: 2 },
  textBold: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  textMuted: { fontSize: 9, color: "#64748b" },
  // ── Tableau ───
  table: { marginBottom: 16 },
  tableHeader: { flexDirection: "row", padding: 8, borderBottom: "1px solid #e2e8f0" },
  tableRow: { flexDirection: "row", padding: 8, borderBottom: "1px solid #f1f5f9" },
  tableColDescription: { flex: 3 },
  tableColQuantity: { flex: 1, textAlign: "center" },
  tableColPrice: { flex: 1, textAlign: "right" },
  tableColTotal: { flex: 1, textAlign: "right" },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  tableCellText: { fontSize: 9, lineHeight: 1.3 },
  // ── Totaux ────
  totalsSection: { alignItems: "flex-end", marginBottom: 16 },
  totalBox: { width: 220, padding: 12, borderRadius: 6 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  totalLabel: { fontSize: 10, color: "#374151" },
  totalValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1e293b" },
  totalFinalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 8,
  },
  totalFinalLabel: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  totalFinalValue: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  // ── Notes ─────
  notesBox: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  notesText: { fontSize: 9, color: "#64748b", lineHeight: 1.5 },
  divider: { height: 1, backgroundColor: "#e2e8f0", marginBottom: 12 },
  // ── Footer ────
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

interface QuotePdfDocumentProps {
  quote: SavedQuote;
}

export default function QuotePdfDocument({ quote }: QuotePdfDocumentProps) {
  const clientName = getClientName(quote.client);
  const themeColor = quote.user.themeColor ?? "#7c3aed";
  const logo = quote.user.companyLogo;
  const displayName = quote.user.companyName ?? "";

  // Couleurs dynamiques (inline car react-pdf ne supporte pas les classes dynamiques)
  const headerBg = { backgroundColor: themeColor };
  const sectionTitleColor = { color: themeColor };
  const tableHeaderBg = { backgroundColor: hexToRgba(themeColor, 0.1) };
  const tableHeaderTextColor = { color: themeColor };
  const totalBoxStyle = {
    backgroundColor: hexToRgba(themeColor, 0.07),
    border: `1px solid ${hexToRgba(themeColor, 0.2)}`,
  };
  const totalFinalBorder = { borderTop: `1.5px solid ${hexToRgba(themeColor, 0.35)}` };
  const totalFinalColor = { color: themeColor };
  const totalHtColor = { color: themeColor };

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* ── Header 3 colonnes ─────────────────────────────────────── */}
        <View style={[S.headerBox, headerBg]}>
          <View style={S.headerRow}>
            {/* Gauche : DEVIS + N° */}
            <View style={S.headerLeft}>
              <Text style={S.headerTitle}>DEVIS</Text>
              <Text style={S.headerNumber}>{quote.number}</Text>
            </View>

            {/* Centre : Logo circulaire + nom entreprise */}
            <View style={S.headerCenter}>
              {logo && (
                <View style={S.headerLogoWrapper}>
                  <Image src={logo} style={S.headerLogo} />
                </View>
              )}
              {displayName ? <Text style={S.headerCompanyName}>{displayName}</Text> : null}
            </View>

            {/* Droite : dates */}
            <View style={S.headerRight}>
              <Text style={S.headerDateLabel}>Date d&apos;émission</Text>
              <Text style={S.headerDateValue}>{fmtDate(quote.date)}</Text>
              {quote.validUntil && (
                <>
                  <Text style={S.headerDateLabel}>Validité</Text>
                  <Text style={S.headerDateValue}>{fmtDate(quote.validUntil)}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* ── Émetteur / Destinataire ───────────────────────────────── */}
        <View style={S.partiesRow}>
          <View style={S.partyBlock}>
            <Text style={[S.sectionTitle, sectionTitleColor]}>Émetteur</Text>
            {quote.user.companyName && <Text style={S.textBold}>{quote.user.companyName}</Text>}
            {quote.user.companyAddress && <Text style={S.text}>{quote.user.companyAddress}</Text>}
            {quote.user.companyPostalCode && quote.user.companyCity && (
              <Text style={S.text}>{quote.user.companyPostalCode} {quote.user.companyCity}</Text>
            )}
            {quote.user.companyEmail && <Text style={S.text}>{quote.user.companyEmail}</Text>}
            {quote.user.companySiret && (
              <Text style={S.textMuted}>SIRET : {quote.user.companySiret}</Text>
            )}
          </View>

          <View style={S.partyBlock}>
            <Text style={[S.sectionTitle, sectionTitleColor]}>Destinataire</Text>
            <Text style={S.textBold}>{clientName}</Text>
            {quote.client.address && <Text style={S.text}>{quote.client.address}</Text>}
            {quote.client.postalCode && quote.client.city && (
              <Text style={S.text}>{quote.client.postalCode} {quote.client.city}</Text>
            )}
            <Text style={S.text}>{quote.client.email}</Text>
            {quote.client.phone && <Text style={S.text}>{quote.client.phone}</Text>}
          </View>
        </View>

        <View style={S.divider} />

        {/* ── Tableau des lignes ────────────────────────────────────── */}
        <View style={S.table}>
          <View style={[S.tableHeader, tableHeaderBg]}>
            <View style={S.tableColDescription}>
              <Text style={[S.tableHeaderText, tableHeaderTextColor]}>Description</Text>
            </View>
            <View style={S.tableColQuantity}>
              <Text style={[S.tableHeaderText, tableHeaderTextColor]}>Qté</Text>
            </View>
            <View style={S.tableColPrice}>
              <Text style={[S.tableHeaderText, tableHeaderTextColor]}>Prix Unit. HT</Text>
            </View>
            <View style={S.tableColTotal}>
              <Text style={[S.tableHeaderText, tableHeaderTextColor]}>Total HT</Text>
            </View>
          </View>

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
                <Text style={[S.tableCellText, totalHtColor]}>{fmtN(line.total)} €</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Totaux ────────────────────────────────────────────────── */}
        <View style={S.totalsSection}>
          <View style={[S.totalBox, totalBoxStyle]}>
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>Sous-total HT :</Text>
              <Text style={S.totalValue}>{fmtN(quote.subtotal)} €</Text>
            </View>
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>TVA :</Text>
              <Text style={S.totalValue}>{fmtN(quote.taxTotal)} €</Text>
            </View>
            <View style={[S.totalFinalRow, totalFinalBorder]}>
              <Text style={[S.totalFinalLabel, totalFinalColor]}>Total TTC :</Text>
              <Text style={[S.totalFinalValue, totalFinalColor]}>{fmtN(quote.total)} €</Text>
            </View>
          </View>
        </View>

        {/* ── Notes ─────────────────────────────────────────────────── */}
        {quote.notes && (
          <View style={S.notesBox}>
            <Text style={[S.sectionTitle, sectionTitleColor, { marginBottom: 4 }]}>Notes</Text>
            <Text style={S.notesText}>{quote.notes}</Text>
          </View>
        )}

        {/* ── Footer ────────────────────────────────────────────────── */}
        <Text style={S.footer}>
          Devis généré par FacturFlow • {new Date().toLocaleDateString("fr-FR")}
        </Text>
      </Page>
    </Document>
  );
}

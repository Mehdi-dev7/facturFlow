// src/lib/pdf/receipt-pdf-document.tsx
// Composant PDF pour les reçus — PAS de "use client"

import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
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

/** Convertit hex 6 chiffres + alpha 0-1 en rgba() pour react-pdf */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─── Styles statiques ─────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#1e293b",
    backgroundColor: "#fff",
  },
  // ── Header ────
  headerBox: { padding: 20, marginBottom: 20, borderRadius: 8 },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  headerLeft: { flex: 1 },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
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
  headerBadge: {
    backgroundColor: "#ffffff30",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 2,
  },
  headerBadgeText: {
    fontSize: 9,
    color: "#fff",
    fontFamily: "Helvetica-Bold",
  },
  // ── Parties ───
  partiesRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  partyBlock: { flex: 1, padding: 12, borderRadius: 4, backgroundColor: "#f8fafc" },
  partyLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
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
  partyInfo: { fontSize: 9, color: "#64748b", lineHeight: 1.5 },
  // ── Summary box ──
  summaryBox: { borderRadius: 4, padding: 16, marginBottom: 16 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 9, color: "#64748b" },
  summaryValue: { fontSize: 10, color: "#1e293b" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  totalAmount: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  // ── Notes ─────
  notesBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  notesText: { fontSize: 9, color: "#64748b", lineHeight: 1.6 },
  // ── Footer ────
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
  footerText: { fontSize: 8, color: "#94a3b8" },
});

// ─── Composant PDF ────────────────────────────────────────────────────────────

export function ReceiptPdfDocument({ receipt }: { receipt: SavedReceipt }) {
  const clientName = getClientName(receipt.client);
  const issuerName = receipt.user.companyName || receipt.user.name;
  const themeColor = receipt.user.themeColor ?? "#7c3aed";
  const logo = receipt.user.companyLogo;
  const displayName = receipt.user.companyName ?? "";

  // Couleurs dynamiques (inline car react-pdf ne supporte pas les classes dynamiques)
  const headerBg = { backgroundColor: themeColor };
  const partyLabelColor = { color: themeColor };
  const partyBorderColor = { borderLeft: `2px solid ${themeColor}` };
  const summaryBg = { backgroundColor: hexToRgba(themeColor, 0.07) };
  const totalBorder = { borderTop: `1px solid ${hexToRgba(themeColor, 0.3)}` };
  const totalColor = { color: themeColor };
  const sectionTitleColor = { color: themeColor };

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* ── Header 3 colonnes ─────────────────────────────────────── */}
        <View style={[S.headerBox, headerBg]}>
          <View style={S.headerRow}>
            {/* Gauche : REÇU + N° */}
            <View style={S.headerLeft}>
              <Text style={S.headerTitle}>REÇU</Text>
              <Text style={S.headerNumber}>{receipt.number}</Text>
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

            {/* Droite : date + badge */}
            <View style={S.headerRight}>
              <Text style={S.headerDateLabel}>Émis le</Text>
              <Text style={S.headerDateValue}>{fmtDate(receipt.date)}</Text>
              <View style={S.headerBadge}>
                <Text style={S.headerBadgeText}>PAIEMENT REÇU</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Émetteur + Client ─────────────────────────────────────── */}
        <View style={S.partiesRow}>
          <View style={[S.partyBlock, partyBorderColor]}>
            <Text style={[S.partyLabel, partyLabelColor]}>Émis par</Text>
            <Text style={S.partyName}>{issuerName}</Text>
            {receipt.user.companySiret && (
              <Text style={S.partyInfo}>SIRET : {receipt.user.companySiret}</Text>
            )}
            {receipt.user.companyAddress && (
              <Text style={S.partyInfo}>{receipt.user.companyAddress}</Text>
            )}
            {(receipt.user.companyPostalCode || receipt.user.companyCity) && (
              <Text style={S.partyInfo}>
                {[receipt.user.companyPostalCode, receipt.user.companyCity]
                  .filter(Boolean)
                  .join(" ")}
              </Text>
            )}
            {receipt.user.companyEmail && (
              <Text style={S.partyInfo}>{receipt.user.companyEmail}</Text>
            )}
          </View>

          <View style={[S.partyBlock, partyBorderColor]}>
            <Text style={[S.partyLabel, partyLabelColor]}>Reçu de</Text>
            <Text style={S.partyName}>{clientName}</Text>
            {receipt.client.email && <Text style={S.partyInfo}>{receipt.client.email}</Text>}
            {receipt.client.phone && <Text style={S.partyInfo}>{receipt.client.phone}</Text>}
            {receipt.client.address && <Text style={S.partyInfo}>{receipt.client.address}</Text>}
            {(receipt.client.postalCode || receipt.client.city) && (
              <Text style={S.partyInfo}>
                {[receipt.client.postalCode, receipt.client.city].filter(Boolean).join(" ")}
              </Text>
            )}
          </View>
        </View>

        {/* ── Récapitulatif du paiement ─────────────────────────────── */}
        <View style={[S.summaryBox, summaryBg]}>
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
          <View style={[S.totalRow, totalBorder]}>
            <Text style={[S.totalLabel, totalColor]}>Montant encaissé</Text>
            <Text style={[S.totalAmount, totalColor]}>{fmtAmount(receipt.total)}</Text>
          </View>
        </View>

        {/* ── Notes ─────────────────────────────────────────────────── */}
        {receipt.notes && (
          <View style={S.notesBox}>
            <Text style={[S.sectionTitle, sectionTitleColor, { marginBottom: 4 }]}>Notes</Text>
            <Text style={S.notesText}>{receipt.notes}</Text>
          </View>
        )}

        {/* ── Footer ────────────────────────────────────────────────── */}
        <View style={S.footer}>
          <Text style={S.footerText}>
            {receipt.number} — Émis le {fmtDate(receipt.date)}
          </Text>
          <Text style={S.footerText}>Document généré par FacturNow</Text>
        </View>
      </Page>
    </Document>
  );
}

// src/lib/pdf/deposit-pdf-document.tsx
// Composant PDF partagé (client + serveur) — PAS de "use client"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
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
  // ── Détail acompte ──
  depositBox: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    border: "1px solid #e2e8f0",
  },
  depositTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  depositDescription: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#374151",
    marginBottom: 12,
  },
  // ── Totaux ────
  totalsSection: { alignItems: "flex-end", marginBottom: 4 },
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

interface DepositPdfDocumentProps {
  deposit: SavedDeposit;
}

export default function DepositPdfDocument({ deposit }: DepositPdfDocumentProps) {
  const clientName = getClientName(deposit.client);
  const themeColor = deposit.user.themeColor ?? "#7c3aed";
  const logo = deposit.user.companyLogo;
  const displayName = deposit.user.companyName ?? "";

  // Couleurs dynamiques (inline car react-pdf ne supporte pas les classes dynamiques)
  const headerBg = { backgroundColor: themeColor };
  const sectionTitleColor = { color: themeColor };
  const depositTitleColor = { color: themeColor };
  const totalBoxStyle = {
    backgroundColor: hexToRgba(themeColor, 0.07),
    border: `1px solid ${hexToRgba(themeColor, 0.2)}`,
  };
  const totalFinalBorder = { borderTop: `1.5px solid ${hexToRgba(themeColor, 0.35)}` };
  const totalFinalColor = { color: themeColor };

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* ── Header 3 colonnes ─────────────────────────────────────── */}
        <View style={[S.headerBox, headerBg]}>
          <View style={S.headerRow}>
            {/* Gauche : ACOMPTE + N° */}
            <View style={S.headerLeft}>
              <Text style={S.headerTitle}>ACOMPTE</Text>
              <Text style={S.headerNumber}>{deposit.number}</Text>
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
              <Text style={S.headerDateValue}>{fmtDate(deposit.date)}</Text>
              {deposit.dueDate && (
                <>
                  <Text style={S.headerDateLabel}>Échéance</Text>
                  <Text style={S.headerDateValue}>{fmtDate(deposit.dueDate)}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* ── Émetteur / Destinataire ───────────────────────────────── */}
        <View style={S.partiesRow}>
          <View style={S.partyBlock}>
            <Text style={[S.sectionTitle, sectionTitleColor]}>Émetteur</Text>
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

          <View style={S.partyBlock}>
            <Text style={[S.sectionTitle, sectionTitleColor]}>Destinataire</Text>
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
            {deposit.client.phone && <Text style={S.text}>{deposit.client.phone}</Text>}
          </View>
        </View>

        <View style={S.divider} />

        {/* ── Détail de l'acompte ───────────────────────────────────── */}
        <View style={S.depositBox}>
          <Text style={[S.depositTitle, depositTitleColor]}>Détail de l&apos;acompte</Text>
          <Text style={S.depositDescription}>{deposit.description}</Text>

          <View style={S.totalsSection}>
            <View style={[S.totalBox, totalBoxStyle]}>
              <View style={S.totalRow}>
                <Text style={S.totalLabel}>Montant HT :</Text>
                <Text style={S.totalValue}>{fmtN(deposit.amount)} €</Text>
              </View>
              <View style={S.totalRow}>
                <Text style={S.totalLabel}>TVA ({deposit.vatRate}%) :</Text>
                <Text style={S.totalValue}>{fmtN(deposit.taxTotal)} €</Text>
              </View>
              <View style={[S.totalFinalRow, totalFinalBorder]}>
                <Text style={[S.totalFinalLabel, totalFinalColor]}>Total TTC :</Text>
                <Text style={[S.totalFinalValue, totalFinalColor]}>{fmtN(deposit.total)} €</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Notes ─────────────────────────────────────────────────── */}
        {deposit.notes && (
          <View style={S.notesBox}>
            <Text style={[S.sectionTitle, sectionTitleColor, { marginBottom: 4 }]}>Notes</Text>
            <Text style={S.notesText}>{deposit.notes}</Text>
          </View>
        )}

        {/* ── Footer ────────────────────────────────────────────────── */}
        <Text style={S.footer}>
          Acompte généré par FacturFlow • {new Date().toLocaleDateString("fr-FR")}
        </Text>
      </Page>
    </Document>
  );
}

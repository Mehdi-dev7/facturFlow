// src/lib/pdf/credit-note-pdf-document.tsx
// Composant PDF pour les avoirs — PAS de "use client"
// Structure identique à receipt-pdf-document.tsx

import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { SavedCreditNote } from "@/lib/types/credit-notes";
import { CREDIT_NOTE_REASONS } from "@/lib/types/credit-notes";

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

function getClientName(client: SavedCreditNote["client"]) {
  if (client.companyName) return client.companyName;
  return [client.firstName, client.lastName].filter(Boolean).join(" ") || client.email;
}

function getReasonLabel(value: string) {
  return CREDIT_NOTE_REASONS.find((r) => r.value === value)?.label ?? value;
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
  // Badge rouge/rose pour distinguer l'avoir du reçu
  headerBadge: {
    backgroundColor: "#ff000030",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 2,
    borderWidth: 1,
    borderColor: "#ff000050",
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
  // Le montant de l'avoir s'affiche en rouge
  totalAmount: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#dc2626" },
  totalAmountPrefix: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#dc2626" },
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

export function CreditNotePdfDocument({ creditNote }: { creditNote: SavedCreditNote }) {
  const clientName = getClientName(creditNote.client);
  const issuerName = creditNote.user.companyName || creditNote.user.name;
  const themeColor = creditNote.user.themeColor ?? "#7c3aed";
  const logo = creditNote.user.companyLogo;
  const displayName = creditNote.user.companyName ?? "";

  // Couleurs dynamiques (react-pdf ne supporte pas les classes dynamiques)
  const headerBg = { backgroundColor: themeColor };
  const partyLabelColor = { color: themeColor };
  const partyBorderColor = { borderLeft: `2px solid ${themeColor}` };
  const summaryBg = { backgroundColor: hexToRgba(themeColor, 0.07) };
  const totalBorder = { borderTop: `1px solid ${hexToRgba(themeColor, 0.3)}` };
  const totalLabelColor = { color: themeColor };
  const sectionTitleColor = { color: themeColor };

  const reasonLabel = getReasonLabel(creditNote.reason);
  const creditTypeLabel = creditNote.type === "full" ? "Avoir total" : "Avoir partiel";

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* ── Header 3 colonnes ─────────────────────────────────────── */}
        <View style={[S.headerBox, headerBg]}>
          <View style={S.headerRow}>
            {/* Gauche : FACTURE D'AVOIR + N° */}
            <View style={S.headerLeft}>
              <Text style={S.headerTitle}>FACTURE D&apos;AVOIR</Text>
              <Text style={S.headerNumber}>{creditNote.number}</Text>
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

            {/* Droite : date + badge rouge */}
            <View style={S.headerRight}>
              <Text style={S.headerDateLabel}>Émis le</Text>
              <Text style={S.headerDateValue}>{fmtDate(creditNote.date)}</Text>
              {/* Badge rouge distinctif */}
              <View style={S.headerBadge}>
                <Text style={S.headerBadgeText}>CREDIT ACCORDE</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Émetteur + Destinataire ───────────────────────────────── */}
        <View style={S.partiesRow}>
          <View style={[S.partyBlock, partyBorderColor]}>
            <Text style={[S.partyLabel, partyLabelColor]}>Emis par</Text>
            <Text style={S.partyName}>{issuerName}</Text>
            {creditNote.user.companySiret && (
              <Text style={S.partyInfo}>SIRET : {creditNote.user.companySiret}</Text>
            )}
            {creditNote.user.companyAddress && (
              <Text style={S.partyInfo}>{creditNote.user.companyAddress}</Text>
            )}
            {(creditNote.user.companyPostalCode || creditNote.user.companyCity) && (
              <Text style={S.partyInfo}>
                {[creditNote.user.companyPostalCode, creditNote.user.companyCity]
                  .filter(Boolean)
                  .join(" ")}
              </Text>
            )}
            {creditNote.user.companyEmail && (
              <Text style={S.partyInfo}>{creditNote.user.companyEmail}</Text>
            )}
          </View>

          <View style={[S.partyBlock, partyBorderColor]}>
            <Text style={[S.partyLabel, partyLabelColor]}>Destinataire</Text>
            <Text style={S.partyName}>{clientName}</Text>
            {creditNote.client.email && <Text style={S.partyInfo}>{creditNote.client.email}</Text>}
            {creditNote.client.phone && <Text style={S.partyInfo}>{creditNote.client.phone}</Text>}
            {creditNote.client.address && <Text style={S.partyInfo}>{creditNote.client.address}</Text>}
            {(creditNote.client.postalCode || creditNote.client.city) && (
              <Text style={S.partyInfo}>
                {[creditNote.client.postalCode, creditNote.client.city].filter(Boolean).join(" ")}
              </Text>
            )}
          </View>
        </View>

        {/* ── Récapitulatif de l'avoir ──────────────────────────────── */}
        <View style={[S.summaryBox, summaryBg]}>
          {/* Référence à la facture d'origine */}
          <View style={S.summaryRow}>
            <Text style={S.summaryLabel}>Reference</Text>
            <Text style={S.summaryValue}>
              Avoir pour la facture N° {creditNote.invoiceNumber}
            </Text>
          </View>

          {/* Type d'avoir */}
          <View style={S.summaryRow}>
            <Text style={S.summaryLabel}>Type</Text>
            <Text style={S.summaryValue}>{creditTypeLabel}</Text>
          </View>

          {/* Motif */}
          <View style={S.summaryRow}>
            <Text style={S.summaryLabel}>Motif</Text>
            <Text style={S.summaryValue}>{reasonLabel}</Text>
          </View>

          {/* Date */}
          <View style={S.summaryRow}>
            <Text style={S.summaryLabel}>Date de l&apos;avoir</Text>
            <Text style={S.summaryValue}>{fmtDate(creditNote.date)}</Text>
          </View>

          {/* Montant net à déduire — affiché en rouge avec − */}
          <View style={[S.totalRow, totalBorder]}>
            <Text style={[S.totalLabel, totalLabelColor]}>Net a deduire</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={S.totalAmountPrefix}>- </Text>
              <Text style={S.totalAmount}>{fmtAmount(creditNote.total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Notes ─────────────────────────────────────────────────── */}
        {creditNote.notes && (
          <View style={S.notesBox}>
            <Text style={[S.sectionTitle, sectionTitleColor, { marginBottom: 4 }]}>Notes</Text>
            <Text style={S.notesText}>{creditNote.notes}</Text>
          </View>
        )}

        {/* ── IBAN (si présent) ──────────────────────────────────────── */}
        {(creditNote.user.iban) && (
          <View style={S.notesBox}>
            <Text style={[S.sectionTitle, sectionTitleColor, { marginBottom: 6 }]}>
              Remboursement par virement
            </Text>
            <Text style={S.notesText}>IBAN : {creditNote.user.iban}</Text>
            {creditNote.user.bic && (
              <Text style={S.notesText}>BIC : {creditNote.user.bic}</Text>
            )}
          </View>
        )}

        {/* ── Footer ────────────────────────────────────────────────── */}
        <View style={S.footer}>
          <Text style={S.footerText}>
            {creditNote.number} — Avoir pour {creditNote.invoiceNumber}
          </Text>
          <Text style={S.footerText}>Document généré par FacturNow</Text>
        </View>
      </Page>
    </Document>
  );
}

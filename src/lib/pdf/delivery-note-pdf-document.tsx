// src/lib/pdf/delivery-note-pdf-document.tsx
// Composant PDF pour les bons de livraison — PAS de "use client"
// Pattern identique à credit-note-pdf-document.tsx
// Polices uniquement intégrées (Helvetica / Helvetica-Bold) — jamais de woff2

import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { SavedDeliveryNote } from "@/lib/types/delivery-notes";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getClientName(client: SavedDeliveryNote["client"]) {
  if (client.companyName) return client.companyName;
  return [client.firstName, client.lastName].filter(Boolean).join(" ") || client.email;
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
  // Badge teal pour le BL
  headerBadge: {
    backgroundColor: "#0d948830",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 2,
    borderWidth: 1,
    borderColor: "#0d948850",
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
  // ── Section référence ──
  refBox: { borderRadius: 4, padding: 14, marginBottom: 16 },
  refRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  refLabel: { fontSize: 9, color: "#64748b" },
  refValue: { fontSize: 10, color: "#1e293b", fontFamily: "Helvetica-Bold" },
  // ── Tableau des lignes ──
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottom: "1px solid #f1f5f9",
  },
  tableRowAlt: { backgroundColor: "#f8fafc" },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colUnit: { flex: 1.5, textAlign: "right" },
  thText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#64748b",
  },
  tdText: { fontSize: 9, color: "#334155" },
  tdQty: { fontSize: 9, color: "#334155", textAlign: "right", fontFamily: "Helvetica-Bold" },
  tdUnit: { fontSize: 9, color: "#64748b", textAlign: "right" },
  // ── Notes ─────
  notesBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    marginTop: 8,
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

export function DeliveryNotePdfDocument({ deliveryNote }: { deliveryNote: SavedDeliveryNote }) {
  const clientName = getClientName(deliveryNote.client);
  const issuerName = deliveryNote.user.companyName || deliveryNote.user.name;
  const themeColor = deliveryNote.user.themeColor ?? "#0d9488";
  const logo = deliveryNote.user.companyLogo;
  const displayName = deliveryNote.user.companyName ?? "";

  // Couleurs dynamiques (react-pdf ne supporte pas les classes dynamiques)
  const headerBg = { backgroundColor: themeColor };
  const partyLabelColor = { color: themeColor };
  const partyBorderColor = { borderLeft: `2px solid ${themeColor}` };
  const refBg = { backgroundColor: hexToRgba(themeColor, 0.07) };
  const tableHeaderBg = { backgroundColor: hexToRgba(themeColor, 0.12) };
  const sectionTitleColor = { color: themeColor };

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* ── Header 3 colonnes ─────────────────────────────────────── */}
        <View style={[S.headerBox, headerBg]}>
          <View style={S.headerRow}>
            {/* Gauche : titre + N° */}
            <View style={S.headerLeft}>
              <Text style={S.headerTitle}>BON DE LIVRAISON</Text>
              <Text style={S.headerNumber}>{deliveryNote.number}</Text>
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

            {/* Droite : date de création + badge teal */}
            <View style={S.headerRight}>
              <Text style={S.headerDateLabel}>Emis le</Text>
              <Text style={S.headerDateValue}>{fmtDate(deliveryNote.date)}</Text>
              <View style={S.headerBadge}>
                <Text style={S.headerBadgeText}>LIVRAISON</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Emetteur + Destinataire ───────────────────────────────── */}
        <View style={S.partiesRow}>
          <View style={[S.partyBlock, partyBorderColor]}>
            <Text style={[S.partyLabel, partyLabelColor]}>Emis par</Text>
            <Text style={S.partyName}>{issuerName}</Text>
            {deliveryNote.user.companySiret && (
              <Text style={S.partyInfo}>SIRET : {deliveryNote.user.companySiret}</Text>
            )}
            {deliveryNote.user.companyAddress && (
              <Text style={S.partyInfo}>{deliveryNote.user.companyAddress}</Text>
            )}
            {(deliveryNote.user.companyPostalCode || deliveryNote.user.companyCity) && (
              <Text style={S.partyInfo}>
                {[deliveryNote.user.companyPostalCode, deliveryNote.user.companyCity]
                  .filter(Boolean)
                  .join(" ")}
              </Text>
            )}
            {deliveryNote.user.companyEmail && (
              <Text style={S.partyInfo}>{deliveryNote.user.companyEmail}</Text>
            )}
          </View>

          <View style={[S.partyBlock, partyBorderColor]}>
            <Text style={[S.partyLabel, partyLabelColor]}>Destinataire</Text>
            <Text style={S.partyName}>{clientName}</Text>
            {deliveryNote.client.email && (
              <Text style={S.partyInfo}>{deliveryNote.client.email}</Text>
            )}
            {deliveryNote.client.phone && (
              <Text style={S.partyInfo}>{deliveryNote.client.phone}</Text>
            )}
            {deliveryNote.client.address && (
              <Text style={S.partyInfo}>{deliveryNote.client.address}</Text>
            )}
            {(deliveryNote.client.postalCode || deliveryNote.client.city) && (
              <Text style={S.partyInfo}>
                {[deliveryNote.client.postalCode, deliveryNote.client.city]
                  .filter(Boolean)
                  .join(" ")}
              </Text>
            )}
          </View>
        </View>

        {/* ── Informations de livraison ──────────────────────────────── */}
        <View style={[S.refBox, refBg]}>
          <View style={S.refRow}>
            <Text style={S.refLabel}>Reference facture</Text>
            <Text style={S.refValue}>
              Bon de livraison pour la facture N° {deliveryNote.invoiceNumber}
            </Text>
          </View>
          <View style={[S.refRow, { marginBottom: 0 }]}>
            <Text style={S.refLabel}>Date de livraison</Text>
            <Text style={S.refValue}>{fmtDate(deliveryNote.deliveryDate)}</Text>
          </View>
        </View>

        {/* ── Tableau des lignes livrées ────────────────────────────── */}
        {deliveryNote.lines.length > 0 && (
          <View>
            {/* En-tête tableau */}
            <View style={[S.tableHeader, tableHeaderBg]}>
              <Text style={[S.thText, S.colDesc]}>Description</Text>
              <Text style={[S.thText, S.colQty]}>Qte</Text>
              <Text style={[S.thText, S.colUnit]}>Unite</Text>
            </View>

            {/* Lignes */}
            {deliveryNote.lines.map((line, index) => (
              <View
                key={line.id}
                style={[S.tableRow, index % 2 === 1 ? S.tableRowAlt : {}]}
              >
                <Text style={[S.tdText, S.colDesc]}>{line.description}</Text>
                <Text style={[S.tdQty, S.colQty]}>{line.quantity}</Text>
                <Text style={[S.tdUnit, S.colUnit]}>{line.unit}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Notes ─────────────────────────────────────────────────── */}
        {deliveryNote.notes && (
          <View style={S.notesBox}>
            <Text style={[S.sectionTitle, sectionTitleColor]}>Notes</Text>
            <Text style={S.notesText}>{deliveryNote.notes}</Text>
          </View>
        )}

        {/* ── Footer ────────────────────────────────────────────────── */}
        <View style={S.footer}>
          <Text style={S.footerText}>
            {deliveryNote.number} — Bon de livraison pour {deliveryNote.invoiceNumber}
          </Text>
          <Text style={S.footerText}>{deliveryNote.user.invoiceFooter ?? "Document généré par FacturNow"}</Text>
        </View>
      </Page>
    </Document>
  );
}

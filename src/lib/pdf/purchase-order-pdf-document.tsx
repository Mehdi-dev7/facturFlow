// src/lib/pdf/purchase-order-pdf-document.tsx
// Composant PDF partagé pour les bons de commande — PAS de "use client"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

import { registerPdfFonts, getPdfFontFamily } from "./pdf-fonts";
import { resolveHeaderTextColor } from "@/components/appearance/theme-config";
registerPdfFonts();

// ─── Type local SavedPurchaseOrder ───────────────────────────────────────────

export interface SavedPurchaseOrder {
  id: string;
  number: string;
  status: string;
  date: string;
  deliveryDate: string | null;
  bcReference: string | null;
  subtotal: number;
  taxTotal: number;
  total: number;
  discount: number | null;
  notes: string | null;
  invoiceType: string | null;
  businessMetadata: Record<string, unknown> | null;
  relatedDocumentId: string | null;
  client: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    email: string;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
    siret: string | null;
  };
  lineItems: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    subtotal: number;
    taxAmount: number;
    total: number;
    order: number;
    category: string | null;
  }[];
  user: {
    companyName: string | null;
    companySiret: string | null;
    companyAddress: string | null;
    companyPostalCode: string | null;
    companyCity: string | null;
    companyEmail: string | null;
    companyPhone: string | null;
    themeColor: string | null;
    companyFont: string | null;
    companyLogo: string | null;
    invoiceFooter: string | null;
    currency: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Couleur teal fixe pour les bons de commande
const TEAL_COLOR = "#0d9488";

function fmtN(n: number) {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Formate un montant avec la bonne devise
function fmtC(n: number, currency: string | null | undefined): string {
  const formatted = n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  switch (currency) {
    case "USD": return formatted + " $";
    case "GBP": return formatted + " £";
    case "MAD": return formatted + " DH";
    default:    return formatted + " €";
  }
}

function fmtDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getClientName(client: SavedPurchaseOrder["client"]) {
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

// ─── Styles PDF ───────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 28,
    paddingBottom: 44,
    color: "#1e293b",
  },
  // ── Header ────
  headerBox: { padding: 16, marginBottom: 20, borderRadius: 8 },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  headerLeft: { flex: 1 },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  headerNumber: { fontSize: 12, color: "#ffffffcc" },
  headerBcRef: { fontSize: 9, color: "#ffffffaa", marginTop: 4 },
  headerCenter: { flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", alignSelf: "stretch" },
  headerLogoWrapper: { width: 48, height: 48, borderRadius: 24, overflow: "hidden" },
  headerLogo: { width: 48, height: 48 },
  headerCompanyName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#ffffff", textAlign: "center", marginTop: 6 },
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
  tableHeader: { flexDirection: "row", padding: 8, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  tableRow: { flexDirection: "row", padding: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  tableColDescription: { flex: 3 },
  tableColCategory: { flex: 1.5 },
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
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  totalFinalLabel: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  totalFinalValue: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  // ── Section artisan (titre de groupe) ────
  sectionGroupTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
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
    bottom: 24,
    left: 28,
    right: 28,
    textAlign: "center",
    fontSize: 8,
    color: "#64748b",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
  },
});

// ─── Composant PDF ────────────────────────────────────────────────────────────

interface PurchaseOrderPdfDocumentProps {
  purchaseOrder: SavedPurchaseOrder;
}

export default function PurchaseOrderPdfDocument({ purchaseOrder }: PurchaseOrderPdfDocumentProps) {
  const clientName = getClientName(purchaseOrder.client);
  // Les BC utilisent toujours la couleur teal (indépendant du thème user)
  const themeColor = TEAL_COLOR;
  const textColor = resolveHeaderTextColor(themeColor, (purchaseOrder.user as Record<string, unknown>).headerTextColor as string | null ?? null);
  const logo = purchaseOrder.user.companyLogo;
  const displayName = purchaseOrder.user.companyName ?? "";
  const companyFontFamily = getPdfFontFamily(purchaseOrder.user.companyFont);

  // Couleurs dynamiques (inline car react-pdf ne supporte pas les classes dynamiques)
  const headerBg: Style = { backgroundColor: themeColor };
  const sectionTitleColor: Style = { color: themeColor };
  const tableHeaderBg: Style = { backgroundColor: hexToRgba(themeColor, 0.1) };
  const tableHeaderTextColor: Style = { color: themeColor };
  const totalBoxStyle: Style = { backgroundColor: hexToRgba(themeColor, 0.07) };
  const totalFinalColor: Style = { color: themeColor };
  const totalHtColor: Style = { color: themeColor };

  // Lignes triées par ordre
  const sortedLines = [...purchaseOrder.lineItems].sort((a, b) => a.order - b.order);

  // Réduction si présente
  const discount = purchaseOrder.discount ?? 0;

  // Split artisan : main d'oeuvre / matériaux
  const invoiceType = purchaseOrder.invoiceType ?? "basic";
  const isArtisan = invoiceType === "artisan";
  const mainOeuvreLines = isArtisan
    ? sortedLines.filter((l) => !l.category || l.category === "main_oeuvre")
    : sortedLines;
  const materiauLines = isArtisan
    ? sortedLines.filter((l) => l.category === "materiel")
    : [];

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* ── Header 3 colonnes ─────────────────────────────────────── */}
        <View style={[S.headerBox, headerBg]}>
          <View style={S.headerRow}>
            {/* Gauche : BON DE COMMANDE + N° */}
            <View style={S.headerLeft}>
              <Text style={[S.headerTitle, { color: textColor }]}>BON DE</Text>
              <Text style={[S.headerTitle, { color: textColor }]}>COMMANDE</Text>
              <Text style={[S.headerNumber, { color: textColor, opacity: 0.9 }]}>{purchaseOrder.number}</Text>
              {/* Référence client optionnelle */}
              {purchaseOrder.bcReference && (
                <Text style={S.headerBcRef}>Réf. client : {purchaseOrder.bcReference}</Text>
              )}
            </View>

            {/* Centre : Logo circulaire + nom entreprise */}
            <View style={S.headerCenter}>
              {logo ? (
                <View style={S.headerLogoWrapper}>
                  <Image src={logo} style={S.headerLogo} />
                </View>
              ) : null}
              {displayName ? (
                <Text style={[S.headerCompanyName, { color: textColor, opacity: 0.9, fontFamily: companyFontFamily }]}>
                  {displayName}
                </Text>
              ) : null}
            </View>

            {/* Droite : dates */}
            <View style={S.headerRight}>
              <Text style={[S.headerDateLabel, { color: textColor, opacity: 0.75 }]}>Date d&apos;émission</Text>
              <Text style={[S.headerDateValue, { color: textColor, opacity: 0.95 }]}>{fmtDate(purchaseOrder.date)}</Text>
              {purchaseOrder.deliveryDate && (
                <>
                  <Text style={[S.headerDateLabel, { color: textColor, opacity: 0.75 }]}>Date de livraison</Text>
                  <Text style={[S.headerDateValue, { color: textColor, opacity: 0.95 }]}>{fmtDate(purchaseOrder.deliveryDate)}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* ── Émetteur / Destinataire ───────────────────────────────── */}
        <View style={S.partiesRow}>
          <View style={S.partyBlock}>
            <Text style={[S.sectionTitle, sectionTitleColor]}>Émetteur</Text>
            {purchaseOrder.user.companyName && (
              <Text style={S.textBold}>{purchaseOrder.user.companyName}</Text>
            )}
            {purchaseOrder.user.companyAddress && (
              <Text style={S.text}>{purchaseOrder.user.companyAddress}</Text>
            )}
            {purchaseOrder.user.companyPostalCode && purchaseOrder.user.companyCity && (
              <Text style={S.text}>
                {purchaseOrder.user.companyPostalCode} {purchaseOrder.user.companyCity}
              </Text>
            )}
            {purchaseOrder.user.companyEmail && (
              <Text style={S.text}>{purchaseOrder.user.companyEmail}</Text>
            )}
            {purchaseOrder.user.companySiret && (
              <Text style={S.textMuted}>SIRET : {purchaseOrder.user.companySiret}</Text>
            )}
          </View>

          <View style={S.partyBlock}>
            <Text style={[S.sectionTitle, sectionTitleColor]}>Destinataire</Text>
            <Text style={S.textBold}>{clientName}</Text>
            {purchaseOrder.client.address && (
              <Text style={S.text}>{purchaseOrder.client.address}</Text>
            )}
            {purchaseOrder.client.postalCode && purchaseOrder.client.city && (
              <Text style={S.text}>
                {purchaseOrder.client.postalCode} {purchaseOrder.client.city}
              </Text>
            )}
            <Text style={S.text}>{purchaseOrder.client.email}</Text>
            {purchaseOrder.client.siret && (
              <Text style={S.textMuted}>SIRET : {purchaseOrder.client.siret}</Text>
            )}
          </View>
        </View>

        <View style={S.divider} />

        {/* ── Tableau des lignes ────────────────────────────────────── */}
        {isArtisan ? (
          // Mode artisan : deux groupes (main d'oeuvre + matériaux)
          <>
            {/* Main d'oeuvre */}
            <Text style={[S.sectionGroupTitle, sectionTitleColor]}>Main d&apos;oeuvre</Text>
            <LinesTable lines={mainOeuvreLines} tableHeaderBg={tableHeaderBg} tableHeaderTextColor={tableHeaderTextColor} totalHtColor={totalHtColor} currency={purchaseOrder.user.currency} />

            {/* Matériaux si présents */}
            {materiauLines.length > 0 && (
              <>
                <Text style={[S.sectionGroupTitle, sectionTitleColor, { marginTop: 12 }]}>Matériaux</Text>
                <LinesTable lines={materiauLines} tableHeaderBg={tableHeaderBg} tableHeaderTextColor={tableHeaderTextColor} totalHtColor={totalHtColor} currency={purchaseOrder.user.currency} />
              </>
            )}
          </>
        ) : (
          // Mode standard : une seule table
          <LinesTable lines={sortedLines} tableHeaderBg={tableHeaderBg} tableHeaderTextColor={tableHeaderTextColor} totalHtColor={totalHtColor} currency={purchaseOrder.user.currency} />
        )}

        {/* ── Totaux ────────────────────────────────────────────────── */}
        <View style={S.totalsSection}>
          <View style={[S.totalBox, totalBoxStyle]}>
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>Sous-total HT :</Text>
              <Text style={S.totalValue}>{fmtC(purchaseOrder.subtotal, purchaseOrder.user.currency)}</Text>
            </View>
            {/* Réduction si présente */}
            {discount > 0 && (
              <View style={S.totalRow}>
                <Text style={S.totalLabel}>Réduction :</Text>
                <Text style={[S.totalValue, { color: "#ef4444" }]}>-{fmtC(discount, purchaseOrder.user.currency)}</Text>
              </View>
            )}
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>TVA :</Text>
              <Text style={S.totalValue}>{fmtC(purchaseOrder.taxTotal, purchaseOrder.user.currency)}</Text>
            </View>
            <View style={S.totalFinalRow}>
              <Text style={[S.totalFinalLabel, totalFinalColor]}>Total TTC :</Text>
              <Text style={[S.totalFinalValue, totalFinalColor]}>{fmtC(purchaseOrder.total, purchaseOrder.user.currency)}</Text>
            </View>
          </View>
        </View>

        {/* ── Notes ─────────────────────────────────────────────────── */}
        {purchaseOrder.notes && (
          <View style={S.notesBox}>
            <Text style={[S.sectionTitle, sectionTitleColor, { marginBottom: 4 }]}>Notes</Text>
            <Text style={S.notesText}>{purchaseOrder.notes}</Text>
          </View>
        )}

        {/* ── Footer ────────────────────────────────────────────────── */}
        <Text style={S.footer}>
          {purchaseOrder.user.invoiceFooter
            ? purchaseOrder.user.invoiceFooter
            : `Bon de commande généré par FacturNow • ${new Date().toLocaleDateString("fr-FR")}`}
        </Text>
      </Page>
    </Document>
  );
}

// ─── Sous-composant tableau de lignes PDF ─────────────────────────────────────

interface LinesTableProps {
  lines: SavedPurchaseOrder["lineItems"];
  tableHeaderBg: Style;
  tableHeaderTextColor: Style;
  totalHtColor: Style;
  currency: string | null | undefined;
}

function LinesTable({ lines, tableHeaderBg, tableHeaderTextColor, totalHtColor, currency }: LinesTableProps) {
  return (
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

      {lines.map((line, idx) => (
        <View key={idx} style={S.tableRow}>
          <View style={S.tableColDescription}>
            <Text style={S.tableCellText}>{line.description}</Text>
          </View>
          <View style={S.tableColQuantity}>
            <Text style={S.tableCellText}>{fmtN(line.quantity)}</Text>
          </View>
          <View style={S.tableColPrice}>
            <Text style={S.tableCellText}>{fmtC(line.unitPrice, currency)}</Text>
          </View>
          <View style={S.tableColTotal}>
            <Text style={[S.tableCellText, totalHtColor]}>{fmtC(line.total, currency)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

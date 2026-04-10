// src/lib/pdf/invoice-pdf-document.tsx
// Composant PDF partagé (client + serveur) — PAS de "use client"

import {
  Document,
  Font,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

import { registerPdfFonts, getPdfFontFamily } from "./pdf-fonts";
registerPdfFonts();
import type { SavedInvoice } from "@/lib/actions/invoices";
import { INVOICE_TYPE_CONFIG } from "@/lib/validations/invoice";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function getClientName(client: SavedInvoice["client"]) {
  if (client.companyName) return client.companyName;
  const parts = [client.firstName, client.lastName].filter(Boolean);
  return parts.join(" ") || client.email;
}

/** Hex 6 chiffres → rgba(r,g,b,a) pour react-pdf */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─── Styles statiques (indépendants de la couleur) ───────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 28,
    paddingBottom: 44,
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 3,
  },
  headerNumber: {
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 2,
  },
  headerDate: {
    fontSize: 8.5,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 1,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-end",
  },
  headerLogoWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  headerLogo: {
    width: 48,
    height: 48,
  },
  headerCompanyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textAlign: "center",
    marginTop: 6,
  },
  // Section title (Émetteur, Destinataire, Détails…)
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
  },
  // Layout 2 colonnes
  twoCol: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
  },
  col: { flex: 1 },
  bold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 2,
  },
  muted: {
    color: "#64748b",
    fontSize: 8.5,
    marginBottom: 1.5,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginVertical: 14,
  },
  // Table
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  // Totaux
  totalsBox: {
    width: 220,
    borderRadius: 6,
    padding: 10,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 9,
  },
  totalValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  grandTotalLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#1e293b",
  },
  grandTotalValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  // Notes
  notes: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  notesTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 18,
    left: 28,
    right: 28,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
  },
  // Bloc virement bancaire
  wireTransferBox: {
    marginTop: 14,
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 3,
  },
  wireTransferTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  wireTransferRow: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 3,
  },
  wireTransferRef: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
  },
});

// ─── Sous-composant : tableau de lignes ──────────────────────────────────────

interface LinesTablePdfProps {
  lines: SavedInvoice["lineItems"];
  typeConfig: { descriptionLabel: string; quantityLabel: string | null };
  isForfait: boolean;
  showVatColumn?: boolean;
  title?: string;
  themeColor: string;
  currency: string | null | undefined;
}

function LinesTablePdf({ lines, typeConfig, isForfait, showVatColumn = false, title, themeColor, currency }: LinesTablePdfProps) {
  const headerBg = hexToRgba(themeColor, 0.1);

  return (
    <View style={{ marginBottom: 6 }}>
      {/* Titre de section (ex: "Main d'œuvre", "Matériaux") */}
      {title && (
        <Text style={[S.sectionTitle, { color: themeColor, marginBottom: 5 }]}>
          {title}
        </Text>
      )}

      {/* Entête du tableau */}
      <View style={{ flexDirection: "row", backgroundColor: headerBg, paddingVertical: 6, paddingHorizontal: 6, borderRadius: 3 }}>
        <Text style={[S.tableHeaderCell, { flex: 3, color: themeColor }]}>
          {typeConfig.descriptionLabel}
        </Text>
        {!isForfait && (
          <Text style={[S.tableHeaderCell, { width: 55, textAlign: "right", color: themeColor }]}>
            {typeConfig.quantityLabel ?? "Qté"}
          </Text>
        )}
        <Text style={[S.tableHeaderCell, { width: 65, textAlign: "right", color: themeColor }]}>
          {isForfait ? "Montant" : "Prix unit."}
        </Text>
        {showVatColumn && (
          <Text style={[S.tableHeaderCell, { width: 42, textAlign: "right", color: themeColor }]}>
            TVA
          </Text>
        )}
        {!isForfait && (
          <Text style={[S.tableHeaderCell, { width: 65, textAlign: "right", color: themeColor }]}>
            Total HT
          </Text>
        )}
      </View>

      {/* Lignes */}
      {lines.map((line, idx) => (
        <View
          key={line.id}
          style={[
            S.tableRow,
            idx % 2 !== 0 ? S.tableRowAlt : {},
          ]}
        >
          <Text style={{ flex: 3, fontSize: 9, color: "#1e293b" }}>{line.description}</Text>
          {!isForfait && (
            <Text style={{ width: 55, textAlign: "right", fontSize: 9, color: "#64748b" }}>
              {line.quantity}
            </Text>
          )}
          <Text style={{ width: 65, textAlign: "right", fontSize: 9, color: "#64748b" }}>
            {fmtC(line.unitPrice, currency)}
          </Text>
          {showVatColumn && (
            <Text style={{ width: 42, textAlign: "right", fontSize: 9, color: "#64748b" }}>
              {line.vatRate}%
            </Text>
          )}
          {!isForfait && (
            <Text style={{ width: 65, textAlign: "right", fontSize: 9, fontFamily: "Helvetica-Bold", color: themeColor }}>
              {fmtC(line.subtotal, currency)}
            </Text>
          )}
        </View>
      ))}

      {lines.length === 0 && (
        <View style={{ padding: 12 }}>
          <Text style={{ fontSize: 9, color: "#94a3b8", textAlign: "center" }}>Aucune ligne</Text>
        </View>
      )}
    </View>
  );
}

// ─── Composant principal : document PDF ──────────────────────────────────────

export default function InvoicePdfDocument({
  invoice,
  documentLabel = "FACTURE",
}: {
  invoice: SavedInvoice;
  documentLabel?: string;
}) {
  // Couleur du thème — fallback violet si non définie
  const themeColor = invoice.user.themeColor ?? "#7c3aed";
  const logo       = invoice.user.companyLogo;

  const typeConfig =
    INVOICE_TYPE_CONFIG[(invoice.invoiceType as keyof typeof INVOICE_TYPE_CONFIG) ?? "basic"] ??
    INVOICE_TYPE_CONFIG["basic"];

  const isForfait  = typeConfig.quantityLabel === null;
  const isArtisan  = invoice.invoiceType === "artisan";
  const vatRate    = (invoice.businessMetadata?.vatRate as number) ?? 20;
  const vatMode    = (invoice.businessMetadata?.vatMode as string | undefined) ?? "global";
  const isPerLine  = vatMode === "per_line";
  const discount   = invoice.discount ?? 0;
  const deposit    = invoice.depositAmount ?? 0;
  const netAPayer  = invoice.total - deposit;

  // Ventilation TVA par taux (mode per_line) — calculée depuis les lignes
  // baseHT = base brute par taux × ratio de réduction (cohérent avec calculs-facture.ts)
  const vatBreakdown: { rate: number; baseHT: number; amount: number }[] = [];
  if (isPerLine) {
    const totalSubtotal = invoice.lineItems.reduce((s, li) => s + li.subtotal, 0);
    const discountRatio = totalSubtotal > 0 ? (invoice.subtotal / totalSubtotal) : 1;

    const groups = new Map<number, number>(); // rate → subtotal brut cumulé
    for (const li of invoice.lineItems) {
      groups.set(li.vatRate, (groups.get(li.vatRate) ?? 0) + li.subtotal);
    }
    for (const [rate, rawBase] of groups) {
      const baseHT = Math.round(rawBase * discountRatio * 100) / 100;
      const amount = Math.round(baseHT * (rate / 100) * 100) / 100;
      vatBreakdown.push({ rate, baseHT, amount });
    }
    vatBreakdown.sort((a, b) => a.rate - b.rate);
  }

  const sortedLines     = [...invoice.lineItems].sort((a, b) => a.order - b.order);
  const mainOeuvreLines = isArtisan ? sortedLines.filter((l) => !l.category || l.category === "main_oeuvre") : sortedLines;
  const materiauLines   = isArtisan ? sortedLines.filter((l) => l.category === "materiel") : [];

  const companyFontFamily = getPdfFontFamily(invoice.user.companyFont);

  // Couleurs dérivées
  const headerBg      = themeColor;
  const totalsBg      = hexToRgba(themeColor, 0.07);

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* ── Header ── */}
        <View style={{ backgroundColor: headerBg, borderRadius: 6, padding: 16, marginBottom: 20 }}>
          <View style={S.headerRow}>
            {/* Gauche : titre + numéro */}
            <View style={S.headerLeft}>
              <Text style={S.headerTitle}>{documentLabel}</Text>
              <Text style={S.headerNumber}>{invoice.number}</Text>
            </View>

            {/* Centre : logo + nom entreprise */}
            <View style={S.headerCenter}>
              {logo ? (
                <View style={S.headerLogoWrapper}>
                  <Image src={logo} style={S.headerLogo} />
                </View>
              ) : null}
              {invoice.user.companyName ? (
                <Text style={[S.headerCompanyName, { fontFamily: companyFontFamily }]}>
                  {invoice.user.companyName}
                </Text>
              ) : null}
            </View>

            {/* Droite : dates */}
            <View style={S.headerRight}>
              <Text style={S.headerDate}>Date : {fmtDate(invoice.date)}</Text>
              <Text style={S.headerDate}>Échéance : {fmtDate(invoice.dueDate)}</Text>
              {invoice.businessMetadata?.deliveryDate ? (
                <Text style={S.headerDate}>
                  Livraison : {fmtDate(invoice.businessMetadata.deliveryDate as string)}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── Émetteur / Destinataire ── */}
        <View style={S.twoCol}>
          <View style={S.col}>
            <Text style={[S.sectionTitle, { color: themeColor }]}>Émetteur</Text>
            <Text style={S.bold}>{invoice.user.companyName ?? "—"}</Text>
            {invoice.user.companyAddress && (
              <Text style={S.muted}>{invoice.user.companyAddress}</Text>
            )}
            {(invoice.user.companyPostalCode || invoice.user.companyCity) && (
              <Text style={S.muted}>
                {[invoice.user.companyPostalCode, invoice.user.companyCity].filter(Boolean).join(" ")}
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
            <Text style={[S.sectionTitle, { color: themeColor }]}>Destinataire</Text>
            <Text style={S.bold}>{getClientName(invoice.client)}</Text>
            <Text style={S.muted}>{invoice.client.email}</Text>
            {invoice.client.address && (
              <Text style={S.muted}>{invoice.client.address}</Text>
            )}
            {(invoice.client.postalCode || invoice.client.city) && (
              <Text style={S.muted}>
                {[invoice.client.postalCode, invoice.client.city].filter(Boolean).join(" ")}
              </Text>
            )}
            {invoice.client.companySiret && (
              <Text style={S.muted}>SIRET : {invoice.client.companySiret}</Text>
            )}
          </View>
        </View>

        <View style={S.divider} />

        {/* ── Titre section Détails ── */}
        <Text style={[S.sectionTitle, { color: themeColor, marginBottom: 8 }]}>Détails</Text>

        {/* ── Tableau de lignes ── */}
        {isArtisan ? (
          <>
            <LinesTablePdf lines={mainOeuvreLines} typeConfig={typeConfig} isForfait={false} showVatColumn={isPerLine} title="Main d'œuvre" themeColor={themeColor} currency={invoice.user.currency} />
            {materiauLines.length > 0 && (
              <LinesTablePdf lines={materiauLines} typeConfig={typeConfig} isForfait={false} showVatColumn={isPerLine} title="Matériaux" themeColor={themeColor} currency={invoice.user.currency} />
            )}
          </>
        ) : (
          <LinesTablePdf lines={sortedLines} typeConfig={typeConfig} isForfait={isForfait} showVatColumn={isPerLine} themeColor={themeColor} currency={invoice.user.currency} />
        )}

        <View style={S.divider} />

        {/* ── Totaux ── */}
        <View style={{ alignItems: "flex-end", marginTop: 4 }}>
          <View style={[S.totalsBox, { backgroundColor: totalsBg }]}>

            {/* Sous-total HT */}
            <View style={S.totalsRow}>
              <Text style={[S.totalLabel, { color: themeColor }]}>Sous-total HT :</Text>
              <Text style={S.totalValue}>{fmtC(invoice.subtotal, invoice.user.currency)}</Text>
            </View>

            {/* Réduction */}
            {discount > 0 && (
              <View style={S.totalsRow}>
                <Text style={[S.totalLabel, { color: themeColor }]}>Réduction :</Text>
                <Text style={[S.totalValue, { color: "#e11d48" }]}>−{fmtC(discount, invoice.user.currency)}</Text>
              </View>
            )}

            {/* TVA — globale ou ventilée par taux avec base HT */}
            {isPerLine ? (
              vatBreakdown.map(({ rate, baseHT, amount }) => (
                <View key={rate}>
                  <View style={S.totalsRow}>
                    <Text style={[S.totalLabel, { color: "#64748b" }]}>Base HT {rate}% :</Text>
                    <Text style={[S.totalValue, { color: "#475569" }]}>{fmtC(baseHT, invoice.user.currency)}</Text>
                  </View>
                  <View style={S.totalsRow}>
                    <Text style={[S.totalLabel, { color: themeColor }]}>TVA {rate}% :</Text>
                    <Text style={S.totalValue}>{fmtC(amount, invoice.user.currency)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={S.totalsRow}>
                <Text style={[S.totalLabel, { color: themeColor }]}>TVA ({vatRate}%) :</Text>
                <Text style={S.totalValue}>{fmtC(invoice.taxTotal, invoice.user.currency)}</Text>
              </View>
            )}

            {/* Total TTC */}
            <View style={S.grandTotalRow}>
              <Text style={S.grandTotalLabel}>Total TTC :</Text>
              <Text style={[S.grandTotalValue, { color: themeColor }]}>{fmtC(invoice.total, invoice.user.currency)}</Text>
            </View>

            {/* Acompte + Net à payer */}
            {deposit > 0 && (
              <>
                <View style={[S.totalsRow, { marginTop: 6 }]}>
                  <Text style={[S.totalLabel, { color: themeColor }]}>Acompte versé :</Text>
                  <Text style={[S.totalValue, { color: "#e11d48" }]}>−{fmtC(deposit, invoice.user.currency)}</Text>
                </View>
                <View style={S.grandTotalRow}>
                  <Text style={S.grandTotalLabel}>NET À PAYER :</Text>
                  <Text style={[S.grandTotalValue, { color: themeColor }]}>{fmtC(netAPayer, invoice.user.currency)}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ── Notes ── */}
        {invoice.notes && (
          <View style={S.notes}>
            <Text style={S.notesTitle}>Notes</Text>
            <Text style={S.muted}>{invoice.notes}</Text>
          </View>
        )}

        {/* ── Virement bancaire (affiché si l'utilisateur a renseigné un IBAN) ── */}
        {invoice.user.iban && (
          <View style={[
            S.wireTransferBox,
            {
              backgroundColor: hexToRgba(themeColor, 0.05),
              borderLeftColor: themeColor,
            },
          ]}>
            <Text style={[S.wireTransferTitle, { color: themeColor }]}>
              Paiement par virement bancaire
            </Text>
            <Text style={S.wireTransferRow}>
              IBAN : {invoice.user.iban}
            </Text>
            {invoice.user.bic ? (
              <Text style={S.wireTransferRow}>
                BIC : {invoice.user.bic}
              </Text>
            ) : null}
            <Text style={S.wireTransferRef}>
              Référence : {invoice.number}
            </Text>
          </View>
        )}

        {/* ── Footer ── */}
        <Text style={S.footer}>
          {invoice.user.invoiceFooter
            ? invoice.user.invoiceFooter
            : "Document généré par FacturNow"}
        </Text>
      </Page>
    </Document>
  );
}

// src/lib/pdf/accounting/urssaf-pdf-document.tsx
// Composant React PDF — Récapitulatif URSSAF trimestriel
// Pas de "use client" — utilisable côté serveur et client

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { UrssafPdfData } from "@/lib/actions/accounting";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtN(n: number): string {
  return n.toFixed(2).replace(".", ",") + " \u20AC";
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const VIOLET = "#1e1b4b";
const ACCENT = "#7c3aed";
const LIGHT = "#f8fafc";
const MUTED = "#64748b";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1e293b",
    padding: 40,
    backgroundColor: "#ffffff",
  },

  // Header
  header: {
    backgroundColor: VIOLET,
    borderRadius: 8,
    padding: 20,
    marginBottom: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: { color: "#ffffff", fontSize: 20, fontFamily: "Helvetica-Bold" },
  headerSub: { color: "#a5b4fc", fontSize: 10, marginTop: 4 },
  headerRight: { alignItems: "flex-end" },
  headerCompany: { color: "#e2e8f0", fontSize: 12, fontFamily: "Helvetica-Bold" },
  headerSiren: { color: "#a5b4fc", fontSize: 9, marginTop: 3 },
  headerDate: { color: "#94a3b8", fontSize: 8, marginTop: 8 },

  // Section
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: VIOLET,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: "1.5px solid #e2e8f0",
  },

  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottom: "1px solid #f1f5f9",
  },
  tableRowAlt: {
    backgroundColor: LIGHT,
  },
  tableRowTotal: {
    flexDirection: "row",
    backgroundColor: VIOLET,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 4,
  },

  // Colonnes (flex)
  colLabel: { flex: 3 },
  colNum: { flex: 2, textAlign: "right" },
  colCount: { flex: 1, textAlign: "right" },

  // Textes header table
  thLabel: { flex: 3, fontSize: 9, fontFamily: "Helvetica-Bold", color: "#475569" },
  thNum: { flex: 2, fontSize: 9, fontFamily: "Helvetica-Bold", color: "#475569", textAlign: "right" },
  thCount: { flex: 1, fontSize: 9, fontFamily: "Helvetica-Bold", color: "#475569", textAlign: "right" },

  // Textes cellules
  tdLabel: { flex: 3, fontSize: 10, color: "#1e293b" },
  tdNum: { flex: 2, fontSize: 10, textAlign: "right", color: "#334155" },
  tdNumBold: { flex: 2, fontSize: 10, textAlign: "right", color: "#1e293b", fontFamily: "Helvetica-Bold" },
  tdCount: { flex: 1, fontSize: 10, textAlign: "right", color: MUTED },

  // Total row (fond violet)
  ttLabel: { flex: 3, fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  ttNum: { flex: 2, fontSize: 10, textAlign: "right", color: "#e2e8f0", fontFamily: "Helvetica-Bold" },
  ttNumAccent: { flex: 2, fontSize: 10, textAlign: "right", color: "#c4b5fd", fontFamily: "Helvetica-Bold" },
  ttCount: { flex: 1, fontSize: 10, textAlign: "right", color: "#a5b4fc" },

  // Note bas de page
  note: {
    marginTop: 24,
    padding: 12,
    backgroundColor: "#fafafa",
    borderRadius: 6,
    borderLeft: "3px solid " + ACCENT,
  },
  noteText: { fontSize: 8, color: MUTED, lineHeight: 1.6 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#cbd5e1",
    borderTop: "1px solid #f1f5f9",
    paddingTop: 8,
  },
});

// ─── Composant ────────────────────────────────────────────────────────────────

interface Props {
  data: UrssafPdfData;
}

export default function UrssafPdfDocument({ data }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Récapitulatif URSSAF</Text>
            <Text style={styles.headerSub}>Chiffre d'affaires encaissé — Année {data.year}</Text>
          </View>
          <View style={styles.headerRight}>
            {data.companyName && (
              <Text style={styles.headerCompany}>{data.companyName}</Text>
            )}
            {data.companySiren && (
              <Text style={styles.headerSiren}>SIREN : {data.companySiren}</Text>
            )}
            <Text style={styles.headerDate}>Généré le {data.generatedAt}</Text>
          </View>
        </View>

        {/* Tableau trimestriel */}
        <Text style={styles.sectionTitle}>CA encaissé par trimestre</Text>

        {/* En-tête tableau */}
        <View style={styles.tableHeader}>
          <Text style={styles.thLabel}>Trimestre</Text>
          <Text style={styles.thNum}>CA HT</Text>
          <Text style={styles.thNum}>CA TTC</Text>
          <Text style={styles.thCount}>Factures</Text>
        </View>

        {/* Lignes */}
        {data.quarters.map((q, i) => (
          <View
            key={i}
            style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
          >
            <Text style={styles.tdLabel}>{q.label}</Text>
            <Text style={styles.tdNum}>{fmtN(q.caHT)}</Text>
            <Text style={styles.tdNumBold}>{fmtN(q.caTTC)}</Text>
            <Text style={styles.tdCount}>{q.count}</Text>
          </View>
        ))}

        {/* Total */}
        <View style={styles.tableRowTotal}>
          <Text style={styles.ttLabel}>TOTAL {data.year}</Text>
          <Text style={styles.ttNum}>{fmtN(data.totalHT)}</Text>
          <Text style={styles.ttNumAccent}>{fmtN(data.totalTTC)}</Text>
          <Text style={styles.ttCount}>{data.totalCount}</Text>
        </View>

        {/* Note */}
        <View style={styles.note}>
          <Text style={styles.noteText}>
            Ce document est établi à titre indicatif à partir des données de facturation enregistrées dans FacturNow.
            Seules les factures au statut "Payée" sont comptabilisées. Il ne constitue pas une déclaration officielle.
            Vérifiez et déclarez votre chiffre d'affaires directement sur urssaf.fr ou net-entreprises.fr.
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          FacturNow — Document généré automatiquement le {data.generatedAt}
        </Text>

      </Page>
    </Document>
  );
}

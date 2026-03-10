// src/lib/pdf/accounting/rapport-annuel-pdf-document.tsx
// Composant React PDF — Rapport Annuel d'activité
// Pas de "use client" — utilisable côté serveur et client

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { AnnualReportPdfData } from "@/lib/actions/accounting";

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
    marginBottom: 20,
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

  // Section title
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: VIOLET,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: "1.5px solid #e2e8f0",
  },

  // KPI cards (ligne de 4)
  kpiRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: LIGHT,
    borderRadius: 6,
    padding: 10,
    borderTopWidth: 3,
    borderTopColor: ACCENT,
    borderTopStyle: "solid",
  },
  kpiLabel: { fontSize: 8, color: MUTED, marginBottom: 4 },
  kpiValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: VIOLET },
  kpiSub: { fontSize: 7, color: "#94a3b8", marginTop: 3 },

  // Stats (grille indicateurs)
  section: { marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  statBox: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: LIGHT,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  statLabel: { fontSize: 9, color: "#475569" },
  statValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1e293b" },

  // Top client
  topClientBox: {
    backgroundColor: "#f5f3ff",
    borderRadius: 6,
    padding: 12,
    borderLeft: "3px solid " + ACCENT,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topClientName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: VIOLET },
  topClientSub: { fontSize: 8, color: ACCENT, marginTop: 3 },
  topClientAmt: { fontSize: 14, fontFamily: "Helvetica-Bold", color: ACCENT },

  // Tableau mensuel
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: "1px solid #f1f5f9",
  },
  tableRowAlt: { backgroundColor: LIGHT },

  // Cellules tableau mensuel
  thMonth: { flex: 2, fontSize: 9, fontFamily: "Helvetica-Bold", color: "#475569" },
  thAmt: { flex: 2, fontSize: 9, fontFamily: "Helvetica-Bold", color: "#475569", textAlign: "right" },
  thCnt: { flex: 1, fontSize: 9, fontFamily: "Helvetica-Bold", color: "#475569", textAlign: "right" },
  tdMonth: { flex: 2, fontSize: 9, color: "#334155" },
  tdAmt: { flex: 2, fontSize: 9, textAlign: "right", color: "#475569" },
  tdAmtBold: { flex: 2, fontSize: 9, textAlign: "right", color: "#1e293b", fontFamily: "Helvetica-Bold" },
  tdCnt: { flex: 1, fontSize: 9, textAlign: "right", color: MUTED },
  tdEmpty: { flex: 2, fontSize: 9, textAlign: "right", color: "#cbd5e1" },

  // Note
  note: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#fafafa",
    borderRadius: 6,
    borderLeft: "3px solid #e2e8f0",
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
  data: AnnualReportPdfData;
}

export default function RapportAnnuelPdfDocument({ data }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Rapport Annuel {data.year}</Text>
            <Text style={styles.headerSub}>Synthèse d'activité et indicateurs clés</Text>
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

        {/* KPIs principaux */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>CA HT encaissé</Text>
            <Text style={styles.kpiValue}>{fmtN(data.caHT)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>CA TTC encaissé</Text>
            <Text style={styles.kpiValue}>{fmtN(data.caTTC)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TVA collectée</Text>
            <Text style={styles.kpiValue}>{fmtN(data.tvaCollectee)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Taux d'encaissement</Text>
            <Text style={styles.kpiValue}>{data.tauxEncaissement} %</Text>
            <Text style={styles.kpiSub}>{data.paidCount} / {data.invoiceCount} factures</Text>
          </View>
        </View>

        {/* Indicateurs complémentaires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicateurs complémentaires</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Factures émises</Text>
              <Text style={styles.statValue}>{data.invoiceCount}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Factures payées</Text>
              <Text style={styles.statValue}>{data.paidCount}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Avoirs émis</Text>
              <Text style={styles.statValue}>{data.creditNoteCount}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { flex: 1 }]}>
              <Text style={styles.statLabel}>Total avoirs</Text>
              <Text style={styles.statValue}>{fmtN(data.avoirsTotal)}</Text>
            </View>
            <View style={[styles.statBox, { flex: 2 }]}>
              <Text style={styles.statLabel}>CA net (TTC - avoirs)</Text>
              <Text style={styles.statValue}>{fmtN(data.caNet)}</Text>
            </View>
          </View>
        </View>

        {/* Top client */}
        {data.topClient && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client principal</Text>
            <View style={styles.topClientBox}>
              <View>
                <Text style={styles.topClientName}>{data.topClient.name}</Text>
                <Text style={styles.topClientSub}>Meilleur client de l'année {data.year}</Text>
              </View>
              <Text style={styles.topClientAmt}>{fmtN(data.topClient.total)}</Text>
            </View>
          </View>
        )}

        {/* Répartition mensuelle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Répartition mensuelle (CA encaissé)</Text>

          <View style={styles.tableHeader}>
            <Text style={styles.thMonth}>Mois</Text>
            <Text style={styles.thAmt}>CA HT</Text>
            <Text style={styles.thAmt}>CA TTC</Text>
            <Text style={styles.thCnt}>Fac.</Text>
          </View>

          {data.monthlyBreakdown.map((m, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={styles.tdMonth}>{m.month}</Text>
              {m.caHT > 0 ? (
                <Text style={styles.tdAmt}>{fmtN(m.caHT)}</Text>
              ) : (
                <Text style={styles.tdEmpty}>—</Text>
              )}
              {m.caTTC > 0 ? (
                <Text style={styles.tdAmtBold}>{fmtN(m.caTTC)}</Text>
              ) : (
                <Text style={styles.tdEmpty}>—</Text>
              )}
              <Text style={styles.tdCnt}>{m.count > 0 ? String(m.count) : "—"}</Text>
            </View>
          ))}
        </View>

        {/* Note */}
        <View style={styles.note}>
          <Text style={styles.noteText}>
            Document établi à titre indicatif à partir des données de facturation enregistrées dans FacturNow.
            Seules les factures au statut "Payée" sont comptabilisées dans le CA encaissé.
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

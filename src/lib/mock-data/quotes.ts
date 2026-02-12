import type { QuoteStatus } from "@/components/dashboard/status-badge";

export interface Quote {
  id: string;
  client: string;
  date: string;
  validUntil: string;
  amount: string;
  status: QuoteStatus;
}

export const mockQuotes: Quote[] = [
  { id: "DEV-2026-018", client: "Dupont & Associés", date: "10/02/2026", validUntil: "10/03/2026", amount: "4 500,00 €", status: "envoyé" },
  { id: "DEV-2026-017", client: "Tech Solutions SAS", date: "08/02/2026", validUntil: "08/03/2026", amount: "8 200,00 €", status: "accepté" },
  { id: "DEV-2026-016", client: "Studio Créatif Lyon", date: "06/02/2026", validUntil: "06/03/2026", amount: "2 100,00 €", status: "en attente" },
  { id: "DEV-2026-015", client: "Marie Lambert - Freelance", date: "04/02/2026", validUntil: "04/03/2026", amount: "950,00 €", status: "refusé" },
  { id: "DEV-2026-014", client: "Agence Web Marseille", date: "02/02/2026", validUntil: "02/03/2026", amount: "6 300,00 €", status: "accepté" },
  { id: "DEV-2026-013", client: "Cabinet Martin", date: "30/01/2026", validUntil: "01/03/2026", amount: "1 800,00 €", status: "brouillon" },
  { id: "DEV-2026-012", client: "Boulangerie Petit Jean", date: "28/01/2026", validUntil: "27/02/2026", amount: "580,00 €", status: "accepté" },
  { id: "DEV-2026-011", client: "Restaurant Le Provençal", date: "25/01/2026", validUntil: "24/02/2026", amount: "1 200,00 €", status: "expiré" },
  { id: "DEV-2026-010", client: "Auto Services Bordeaux", date: "22/01/2026", validUntil: "21/02/2026", amount: "5 400,00 €", status: "accepté" },
  { id: "DEV-2026-009", client: "Pharmacie Centrale", date: "20/01/2026", validUntil: "19/02/2026", amount: "2 750,00 €", status: "expiré" },
  { id: "DEV-2026-008", client: "Garage Dubois", date: "18/01/2026", validUntil: "17/02/2026", amount: "3 900,00 €", status: "accepté" },
  { id: "DEV-2026-007", client: "Cabinet Avocat Moreau", date: "15/01/2026", validUntil: "14/02/2026", amount: "4 100,00 €", status: "envoyé" },
  { id: "DEV-2026-006", client: "Architecte Blanc", date: "12/01/2026", validUntil: "11/02/2026", amount: "12 000,00 €", status: "brouillon" },
  { id: "DEV-2026-005", client: "Clinique Vétérinaire du Parc", date: "10/01/2026", validUntil: "09/02/2026", amount: "1 450,00 €", status: "refusé" },
  { id: "DEV-2026-004", client: "Librairie Voltaire", date: "08/01/2026", validUntil: "07/02/2026", amount: "620,00 €", status: "en attente" },
  { id: "DEV-2026-003", client: "Fleuriste Rosalie", date: "05/01/2026", validUntil: "04/02/2026", amount: "480,00 €", status: "accepté" },
];

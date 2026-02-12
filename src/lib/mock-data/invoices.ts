import type { InvoiceStatus } from "@/components/dashboard/status-badge";

export interface Invoice {
  id: string;
  client: string;
  date: string;
  echeance: string;
  amount: string;
  status: InvoiceStatus;
}

export const mockInvoices: Invoice[] = [
  // Original 10 from dashboard
  { id: "FAC-2026-047", client: "Dupont & Associés", date: "08/02/2026", echeance: "08/03/2026", amount: "3 200,00 €", status: "payée" },
  { id: "FAC-2026-046", client: "Studio Créatif Lyon", date: "06/02/2026", echeance: "08/03/2026", amount: "1 450,00 €", status: "en attente" },
  { id: "FAC-2026-045", client: "Tech Solutions SAS", date: "04/02/2026", echeance: "06/03/2026", amount: "5 800,00 €", status: "payée" },
  { id: "FAC-2026-044", client: "Marie Lambert - Freelance", date: "02/02/2026", echeance: "04/03/2026", amount: "750,00 €", status: "impayée" },
  { id: "FAC-2026-043", client: "Boulangerie Petit Jean", date: "31/01/2026", echeance: "02/03/2026", amount: "420,00 €", status: "payée" },
  { id: "FAC-2026-042", client: "Agence Web Marseille", date: "29/01/2026", echeance: "28/02/2026", amount: "2 800,00 €", status: "payée" },
  { id: "FAC-2026-041", client: "Cabinet Martin", date: "27/01/2026", echeance: "26/02/2026", amount: "1 200,00 €", status: "en attente" },
  { id: "FAC-2026-040", client: "Restaurant Le Provençal", date: "25/01/2026", echeance: "24/02/2026", amount: "680,00 €", status: "impayée" },
  { id: "FAC-2026-039", client: "Auto Services Bordeaux", date: "22/01/2026", echeance: "21/02/2026", amount: "3 500,00 €", status: "payée" },
  { id: "FAC-2026-038", client: "Librairie Voltaire", date: "20/01/2026", echeance: "19/02/2026", amount: "290,00 €", status: "impayée" },
  // 15 additional invoices
  { id: "FAC-2026-037", client: "Pharmacie Centrale", date: "18/01/2026", echeance: "17/02/2026", amount: "1 850,00 €", status: "payée" },
  { id: "FAC-2026-036", client: "Garage Dubois", date: "16/01/2026", echeance: "15/02/2026", amount: "4 200,00 €", status: "payée" },
  { id: "FAC-2026-035", client: "Cabinet Avocat Moreau", date: "14/01/2026", echeance: "13/02/2026", amount: "2 600,00 €", status: "impayée" },
  { id: "FAC-2026-034", client: "Fleuriste Rosalie", date: "12/01/2026", echeance: "11/02/2026", amount: "340,00 €", status: "payée" },
  { id: "FAC-2026-033", client: "Imprimerie Rapide", date: "10/01/2026", echeance: "09/02/2026", amount: "1 100,00 €", status: "en attente" },
  { id: "FAC-2026-032", client: "Clinique Vétérinaire du Parc", date: "08/01/2026", echeance: "07/02/2026", amount: "890,00 €", status: "payée" },
  { id: "FAC-2026-031", client: "Salon de Coiffure Élégance", date: "06/01/2026", echeance: "05/02/2026", amount: "520,00 €", status: "payée" },
  { id: "FAC-2026-030", client: "Architecte Blanc", date: "04/01/2026", echeance: "03/02/2026", amount: "7 500,00 €", status: "impayée" },
  { id: "FAC-2026-029", client: "Café du Commerce", date: "02/01/2026", echeance: "01/02/2026", amount: "450,00 €", status: "payée" },
  { id: "FAC-2026-028", client: "Dupont & Associés", date: "10/02/2026", echeance: "10/03/2026", amount: "1 900,00 €", status: "en attente" },
  { id: "FAC-2026-027", client: "Tech Solutions SAS", date: "09/02/2026", echeance: "09/03/2026", amount: "3 400,00 €", status: "payée" },
  { id: "FAC-2026-026", client: "Studio Créatif Lyon", date: "11/02/2026", echeance: "11/03/2026", amount: "2 250,00 €", status: "en attente" },
  { id: "FAC-2026-025", client: "Agence Web Marseille", date: "07/02/2026", echeance: "07/03/2026", amount: "4 600,00 €", status: "payée" },
  { id: "FAC-2026-024", client: "Cabinet Martin", date: "05/02/2026", echeance: "05/03/2026", amount: "980,00 €", status: "impayée" },
  { id: "FAC-2026-023", client: "Restaurant Le Provençal", date: "03/02/2026", echeance: "03/03/2026", amount: "1 350,00 €", status: "payée" },
];

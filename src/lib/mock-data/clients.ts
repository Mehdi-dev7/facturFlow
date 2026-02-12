export interface Client {
  id: string;
  name: string;
  type: "entreprise" | "particulier";
  email: string;
  phone: string;
  city: string;
  totalInvoiced: string;
  hasRecurring: boolean;
}

export const mockClients: Client[] = [
  { id: "CLI-001", name: "Dupont & Associés", type: "entreprise", email: "contact@dupont-associes.fr", phone: "01 42 56 78 90", city: "Paris", totalInvoiced: "12 400,00 €", hasRecurring: true },
  { id: "CLI-002", name: "Tech Solutions SAS", type: "entreprise", email: "facturation@techsolutions.fr", phone: "04 72 33 44 55", city: "Lyon", totalInvoiced: "18 600,00 €", hasRecurring: true },
  { id: "CLI-003", name: "Studio Créatif Lyon", type: "entreprise", email: "hello@studiocreatiflyon.fr", phone: "04 78 12 34 56", city: "Lyon", totalInvoiced: "5 800,00 €", hasRecurring: false },
  { id: "CLI-004", name: "Marie Lambert", type: "particulier", email: "marie.lambert@gmail.com", phone: "06 12 34 56 78", city: "Bordeaux", totalInvoiced: "2 350,00 €", hasRecurring: false },
  { id: "CLI-005", name: "Boulangerie Petit Jean", type: "entreprise", email: "petitjean@boulangerie.fr", phone: "03 88 22 33 44", city: "Strasbourg", totalInvoiced: "1 420,00 €", hasRecurring: true },
  { id: "CLI-006", name: "Agence Web Marseille", type: "entreprise", email: "admin@agencewebmarseille.fr", phone: "04 91 55 66 77", city: "Marseille", totalInvoiced: "9 200,00 €", hasRecurring: true },
  { id: "CLI-007", name: "Cabinet Martin", type: "entreprise", email: "cabinet@martin-conseil.fr", phone: "01 45 67 89 01", city: "Paris", totalInvoiced: "3 800,00 €", hasRecurring: false },
  { id: "CLI-008", name: "Restaurant Le Provençal", type: "entreprise", email: "contact@leprovencal.fr", phone: "04 94 11 22 33", city: "Nice", totalInvoiced: "2 680,00 €", hasRecurring: false },
  { id: "CLI-009", name: "Auto Services Bordeaux", type: "entreprise", email: "gestion@autoservicesbordeaux.fr", phone: "05 56 78 90 12", city: "Bordeaux", totalInvoiced: "7 500,00 €", hasRecurring: true },
  { id: "CLI-010", name: "Librairie Voltaire", type: "entreprise", email: "librairie.voltaire@orange.fr", phone: "02 40 33 44 55", city: "Nantes", totalInvoiced: "890,00 €", hasRecurring: false },
  { id: "CLI-011", name: "Pharmacie Centrale", type: "entreprise", email: "pharma.centrale@sante.fr", phone: "01 43 21 65 87", city: "Paris", totalInvoiced: "4 600,00 €", hasRecurring: true },
  { id: "CLI-012", name: "Garage Dubois", type: "entreprise", email: "garage.dubois@auto.fr", phone: "03 80 45 67 89", city: "Dijon", totalInvoiced: "6 100,00 €", hasRecurring: false },
  { id: "CLI-013", name: "Architecte Blanc", type: "particulier", email: "p.blanc@architecte.fr", phone: "06 98 76 54 32", city: "Toulouse", totalInvoiced: "10 500,00 €", hasRecurring: false },
  { id: "CLI-014", name: "Café du Commerce", type: "entreprise", email: "cafe.commerce@resto.fr", phone: "05 61 22 33 44", city: "Toulouse", totalInvoiced: "1 350,00 €", hasRecurring: true },
];

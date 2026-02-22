// Types pour les reçus manuels (paiements en espèces, chèque, etc.)
import { z } from "zod";

// ─── Modes de paiement acceptés ─────────────────────────────────────────────

export const RECEIPT_PAYMENT_METHODS = [
  { value: "CASH",     label: "Espèces" },
  { value: "CHECK",    label: "Chèque" },
  { value: "CARD",     label: "Carte bancaire" },
  { value: "TRANSFER", label: "Virement" },
] as const;

export type ReceiptPaymentMethod = typeof RECEIPT_PAYMENT_METHODS[number]["value"];

// ─── Type SavedReceipt (résultat des actions serveur) ───────────────────────

export interface SavedReceipt {
  id: string;
  number: string;
  status: string;      // toujours "PAID" pour un reçu
  date: string;        // ISO string
  total: number;       // Montant TTC
  description: string; // Objet du paiement
  paymentMethod: ReceiptPaymentMethod;
  notes: string | null;
  client: {
    id: string;
    companyName: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
  };
  user: {
    name: string;
    companyName: string | null;
    companySiret: string | null;
    companyAddress: string | null;
    companyPostalCode: string | null;
    companyCity: string | null;
    companyEmail: string | null;
    companyPhone: string | null;
  };
  createdAt: string;
}

// ─── Schema Zod du formulaire ────────────────────────────────────────────────

export const receiptSchema = z.object({
  clientId:      z.string().min(1, "Client requis"),
  amount:        z.number().min(0.01, "Montant requis"),
  description:   z.string().min(1, "Description requise"),
  paymentMethod: z.enum(["CASH", "CHECK", "CARD", "TRANSFER"]),
  date:          z.string().optional(),
  notes:         z.string().optional(),
});

export type ReceiptFormData = z.infer<typeof receiptSchema>;

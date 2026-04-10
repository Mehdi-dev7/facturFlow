// Types pour les reçus manuels (paiements en espèces, chèque, etc.)
import { z } from "zod";

// ─── Modes de paiement acceptés ─────────────────────────────────────────────

export const RECEIPT_PAYMENT_METHODS = [
  { value: "CASH",  label: "Espèces" },
  { value: "CHECK", label: "Chèque" },
  { value: "CARD",  label: "Carte bancaire" },
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
    themeColor: string | null;
    companyFont: string | null;
    companyLogo: string | null;
  };
  createdAt: string;
}

// ─── Schema Zod du formulaire ────────────────────────────────────────────────

// Sous-schema pour un nouveau client créé à la volée depuis un reçu
// Email et adresse sont optionnels : certains reçus sont émis sans facture associée
const newClientSchema = z.object({
  name:    z.string().min(2),
  email:   z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  zipCode: z.string().optional(),
  city:    z.string().min(2),
  siret:   z.string().optional(),
});

export const receiptSchema = z.object({
  clientId:      z.string(),
  newClient:     newClientSchema.optional(),
  amount:        z.number().min(0.01, "Montant requis"),
  description:   z.string().min(1, "Description requise"),
  paymentMethod: z.enum(["CASH", "CHECK", "CARD"]),
  date:          z.string().optional(),
  notes:         z.string().optional(),
}).refine((d) => d.clientId || d.newClient, {
  message: "Client requis",
  path: ["clientId"],
});

export type ReceiptFormData = z.infer<typeof receiptSchema>;

// Types pour les acomptes/dépôts
import { z } from "zod";

export interface SavedDeposit {
  id: string;
  number: string;
  status: string;
  date: string;
  dueDate: string | null;
  total: number;
  subtotal: number;
  taxTotal: number;
  notes: string | null;
  relatedDocumentId: string | null;
  businessMetadata: Record<string, unknown> | null;
  client: {
    id: string;
    companyName: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    city: string | null;
  };
  user: {
    companyName: string | null;
    companySiret: string | null;
    companyAddress: string | null;
    companyPostalCode: string | null;
    companyCity: string | null;
    companyEmail: string | null;
    companyPhone: string | null;
  };
}

// Schema Zod pour les formulaires
export const depositSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  amount: z.number().min(0.01, "Montant requis"),
  vatRate: z.union([z.literal(0), z.literal(5.5), z.literal(10), z.literal(20)]),
  dueDate: z.string().min(1, "Date d'échéance requise"),
  relatedQuoteId: z.string().optional(),
  notes: z.string().optional(),
});

export type DepositFormData = z.infer<typeof depositSchema>;
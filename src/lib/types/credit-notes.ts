// Types pour les avoirs (notes de crédit)

// ─── Type et motif de l'avoir ────────────────────────────────────────────────

export type CreditNoteType = "full" | "partial";

export const CREDIT_NOTE_REASONS = [
  { value: "retour",     label: "Retour de marchandise" },
  { value: "erreur",     label: "Erreur de facturation" },
  { value: "annulation", label: "Annulation de commande" },
  { value: "remise",     label: "Remise commerciale" },
  { value: "litige",     label: "Litige commercial" },
  { value: "autre",      label: "Autre motif" },
] as const;

export type CreditNoteReason = typeof CREDIT_NOTE_REASONS[number]["value"];

// ─── Type SavedCreditNote (résultat des actions serveur) ────────────────────

export interface SavedCreditNote {
  id: string;
  number: string;
  status: string;
  date: string;             // ISO string
  total: number;            // Montant de l'avoir
  type: CreditNoteType;     // "full" ou "partial"
  reason: string;           // Valeur du motif (ex: "erreur")
  invoiceId: string;        // ID de la facture d'origine
  invoiceNumber: string;    // N° de la facture d'origine (ex: FAC-2025-0001)
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
    companySiret: string | null;
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
    invoiceFooter: string | null;
    companyLogo: string | null;
    iban: string | null;
    bic: string | null;
    currency: string | null;
  };
  createdAt: string;
}

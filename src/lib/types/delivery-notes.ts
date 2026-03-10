// Types pour les Bons de Livraison (DELIVERY_NOTE)

// ─── Ligne d'un bon de livraison ─────────────────────────────────────────────

export interface DeliveryNoteLine {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  delivered: boolean; // toujours true en v1 (livraison totale)
}

// ─── Type SavedDeliveryNote (résultat des actions serveur) ───────────────────

export interface SavedDeliveryNote {
  id: string;
  number: string;
  status: string;
  date: string;           // ISO — date de création
  deliveryDate: string;   // ISO — date de livraison prévue/effective
  total: number;
  invoiceId: string;
  invoiceNumber: string;
  notes: string | null;
  lines: DeliveryNoteLine[];
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
    companyLogo: string | null;
  };
  createdAt: string;
}

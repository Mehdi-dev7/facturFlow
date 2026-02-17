import { Resend } from "resend";

// Singleton Resend — la clé API est lue depuis les variables d'environnement
export const resend = new Resend(process.env.RESEND_API_KEY);

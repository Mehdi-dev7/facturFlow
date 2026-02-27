import { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import ContactForm from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Support | FacturFlow",
  description: "Contactez notre équipe support pour toute question ou assistance",
};

export default async function ContactPage() {
  // On récupère la session pour pré-remplir nom + email dans le formulaire
  const session = await auth.api.getSession({ headers: await headers() });

  const userName = session?.user?.name ?? "";
  const userEmail = session?.user?.email ?? "";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gradient mb-2">Contact Support</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm ">
          Besoin d&apos;aide ? Notre équipe vous répond sous 24h ouvrées.
        </p>
      </div>

      {/* Formulaire client (pré-rempli avec les infos de session) */}
      <ContactForm defaultName={userName} defaultEmail={userEmail} />
    </div>
  );
}

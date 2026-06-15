// src/lib/invoice-number.ts
// Helper partagé : génération du prochain numéro de facture, garanti unique.
// Extrait de invoices.ts pour être réutilisable côté envoi (send-invoice-email)
// sans l'exposer comme server action publique.
//
// Calcule max(compteur_stocké, dernier_numéro_en_DB + 1) pour éviter les doublons
// même après des suppressions ou manipulations du compteur.

import { prisma } from "@/lib/prisma";

export async function resolveNextInvoiceNumber(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { invoicePrefix: true, nextInvoiceNumber: true },
  });
  if (!user) throw new Error("Utilisateur introuvable");

  const year = new Date().getFullYear();
  const prefix = user.invoicePrefix;

  // Trouver le plus grand numéro de séquence déjà utilisé cette année
  const existing = await prisma.document.findMany({
    where: { userId, type: "INVOICE", number: { startsWith: `${prefix}-${year}-` } },
    select: { number: true },
  });
  const maxUsed = existing.reduce((max, doc) => {
    const seq = parseInt(doc.number.split("-").pop() ?? "0", 10);
    return isNaN(seq) ? max : Math.max(max, seq);
  }, 0);

  // Le prochain sûr = max entre le compteur stocké et le plus grand utilisé + 1
  const safeNext = Math.max(user.nextInvoiceNumber, maxUsed + 1);

  // Mettre à jour le compteur pour la prochaine fois
  await prisma.user.update({
    where: { id: userId },
    data: { nextInvoiceNumber: safeNext + 1 },
  });

  return `${prefix}-${year}-${String(safeNext).padStart(4, "0")}`;
}

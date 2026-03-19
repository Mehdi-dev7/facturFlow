/**
 * clean-demo.ts — Supprime toutes les données insérées par seed-demo.ts
 * Usage : npx tsx scripts/clean-demo.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_TAG = "DEMO_SEED";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "lady.haya.75@gmail.com" },
  });

  if (!user) {
    console.error("User introuvable !");
    process.exit(1);
  }

  // Supprimer les documents (cascade supprime les lineItems + reminders)
  const deletedDocs = await prisma.document.deleteMany({
    where: { userId: user.id, notes: DEMO_TAG },
  });

  // Supprimer les clients (cascade supprime leurs documents liés)
  const deletedClients = await prisma.client.deleteMany({
    where: { userId: user.id, notes: DEMO_TAG },
  });

  console.log(`✅ Nettoyé : ${deletedDocs.count} documents + ${deletedClients.count} clients supprimés`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

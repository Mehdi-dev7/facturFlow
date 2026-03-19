/**
 * seed-demo.ts — Insère des fausses données pour la vidéo démo
 * Usage : npx tsx scripts/seed-demo.ts
 * Cleanup : npx tsx scripts/clean-demo.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_TAG = "DEMO_SEED"; // Tag dans les notes pour retrouver et supprimer

async function main() {
  // ── Trouver le user ──────────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { email: "lady.haya.75@gmail.com" },
  });

  if (!user) {
    console.error("User introuvable !");
    process.exit(1);
  }

  console.log(`User trouvé : ${user.name} (${user.id})`);

  // ── Créer les clients factices ────────────────────────────────────────────
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        userId: user.id,
        type: "COMPANY",
        companyName: "Agence Pixel Studio",
        email: "contact@pixel-studio.fr",
        phone: "01 42 68 90 12",
        address: "14 rue du Faubourg Saint-Antoine",
        postalCode: "75011",
        city: "Paris",
        notes: DEMO_TAG,
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        type: "COMPANY",
        companyName: "BatiRénov Pro",
        email: "direction@batirenovpro.fr",
        phone: "04 91 55 32 18",
        address: "23 avenue du Prado",
        postalCode: "13006",
        city: "Marseille",
        notes: DEMO_TAG,
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        type: "INDIVIDUAL",
        firstName: "Sophie",
        lastName: "Mercier",
        email: "sophie.mercier@gmail.com",
        phone: "06 78 34 21 90",
        address: "7 rue des Lilas",
        postalCode: "69003",
        city: "Lyon",
        notes: DEMO_TAG,
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        type: "COMPANY",
        companyName: "TechVision SAS",
        email: "admin@techvision.io",
        phone: "05 56 89 44 77",
        address: "2 allée des Pins",
        postalCode: "33000",
        city: "Bordeaux",
        notes: DEMO_TAG,
      },
    }),
  ]);

  console.log(`${clients.length} clients créés`);

  const [pixelStudio, batiRenov, sophie, techVision] = clients;

  // ── Helper lignes ─────────────────────────────────────────────────────────
  const makeLine = (description: string, qty: number, unitPrice: number, vatRate = 20) => {
    const subtotal = qty * unitPrice;
    const taxAmount = subtotal * (vatRate / 100);
    return {
      description,
      quantity: qty,
      unit: "unité",
      unitPrice,
      vatRate,
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
      order: 0,
    };
  };

  const makeDoc = (
    clientId: string,
    number: string,
    status: string,
    lines: ReturnType<typeof makeLine>[],
    extra: Record<string, unknown> = {}
  ) => {
    const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
    const taxTotal = lines.reduce((s, l) => s + l.taxAmount, 0);
    const total = subtotal + taxTotal;
    return {
      userId: user.id,
      clientId,
      type: "INVOICE" as const,
      number,
      status,
      subtotal,
      taxTotal,
      total,
      notes: DEMO_TAG,
      lineItems: { create: lines.map((l, i) => ({ ...l, order: i })) },
      ...extra,
    };
  };

  // Dates utilitaires
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
  const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000);

  // ── Créer les factures ────────────────────────────────────────────────────

  // 1. PAID — Pixel Studio
  await prisma.document.create({
    data: makeDoc(
      pixelStudio.id,
      "FAC-2025-0012",
      "PAID",
      [
        makeLine("Création site web vitrine", 1, 2400),
        makeLine("Intégration CMS WordPress", 1, 600),
      ],
      {
        date: daysAgo(45),
        dueDate: daysAgo(15),
        paidAt: daysAgo(10),
        paidAmount: 3600,
        paymentMethod: "stripe",
      }
    ),
  });

  // 2. PAID — TechVision
  await prisma.document.create({
    data: makeDoc(
      techVision.id,
      "FAC-2025-0013",
      "PAID",
      [makeLine("Développement application mobile", 1, 5800), makeLine("Tests & déploiement", 1, 400)],
      {
        date: daysAgo(30),
        dueDate: daysAgo(5),
        paidAt: daysAgo(3),
        paidAmount: 7440,
        paymentMethod: "virement",
      }
    ),
  });

  // 3. OVERDUE — BatiRénov
  await prisma.document.create({
    data: makeDoc(
      batiRenov.id,
      "FAC-2025-0014",
      "OVERDUE",
      [makeLine("Pose carrelage salle de bain", 18, 85), makeLine("Fourniture matériaux", 1, 340)],
      {
        date: daysAgo(60),
        dueDate: daysAgo(30),
      }
    ),
  });

  // 4. SENT — Sophie Mercier
  await prisma.document.create({
    data: makeDoc(
      sophie.id,
      "FAC-2025-0015",
      "SENT",
      [makeLine("Coaching professionnel — 5 séances", 5, 120)],
      {
        date: daysAgo(5),
        dueDate: daysFromNow(25),
      }
    ),
  });

  // 5. DRAFT — Pixel Studio
  await prisma.document.create({
    data: makeDoc(
      pixelStudio.id,
      "FAC-2025-0016",
      "DRAFT",
      [
        makeLine("Refonte identité visuelle", 1, 1800),
        makeLine("Charte graphique complète", 1, 950),
      ],
      {
        date: daysAgo(1),
        dueDate: daysFromNow(30),
      }
    ),
  });

  // 6. SEPA_PENDING — TechVision
  await prisma.document.create({
    data: makeDoc(
      techVision.id,
      "FAC-2025-0017",
      "SEPA_PENDING",
      [makeLine("Maintenance mensuelle — Mars 2025", 1, 450)],
      {
        date: daysAgo(3),
        dueDate: daysFromNow(27),
        paymentMethod: "sepa",
      }
    ),
  });

  // 7. REMINDED — BatiRénov
  await prisma.document.create({
    data: makeDoc(
      batiRenov.id,
      "FAC-2025-0018",
      "REMINDED",
      [makeLine("Rénovation cuisine — acompte 2", 1, 2200)],
      {
        date: daysAgo(40),
        dueDate: daysAgo(10),
      }
    ),
  });

  // 8. VIEWED — Sophie Mercier
  await prisma.document.create({
    data: makeDoc(
      sophie.id,
      "FAC-2025-0019",
      "VIEWED",
      [makeLine("Formation gestion du temps", 1, 380)],
      {
        date: daysAgo(2),
        dueDate: daysFromNow(28),
      }
    ),
  });

  // ── Créer un devis (ACCEPTED) ─────────────────────────────────────────────
  const quoteSubtotal = 3200;
  const quoteTax = quoteSubtotal * 0.2;
  await prisma.document.create({
    data: {
      userId: user.id,
      clientId: pixelStudio.id,
      type: "QUOTE",
      number: "QUO-2025-0007",
      status: "ACCEPTED",
      subtotal: quoteSubtotal,
      taxTotal: quoteTax,
      total: quoteSubtotal + quoteTax,
      date: daysAgo(10),
      validUntil: daysFromNow(20),
      notes: DEMO_TAG,
      lineItems: {
        create: [
          { description: "Audit SEO complet", quantity: 1, unit: "unité", unitPrice: 1200, vatRate: 20, subtotal: 1200, taxAmount: 240, total: 1440, order: 0 },
          { description: "Stratégie de contenu 3 mois", quantity: 1, unit: "unité", unitPrice: 2000, vatRate: 20, subtotal: 2000, taxAmount: 400, total: 2400, order: 1 },
        ],
      },
    },
  });

  console.log("✅ Seed démo terminé !");
  console.log("Pour nettoyer : npx tsx scripts/clean-demo.ts");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

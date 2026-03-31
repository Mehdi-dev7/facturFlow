// src/app/api/extract-bc/route.ts
// Reçoit un PDF/image de bon de commande externe, l'envoie à l'API Claude,
// et retourne les données extraites en JSON structuré pour pré-remplir une facture.
// Réservé au plan Business.

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { PDFDocument } from "pdf-lib";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { canUseFeature } from "@/lib/feature-gate";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Taille max : 10 MB
const MAX_SIZE = 10 * 1024 * 1024;

// Types acceptés
const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

export async function POST(req: NextRequest) {
  // Auth check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Feature gate — Business only + vérification quota pages
  const BC_PAGES_INCLUDED = 150; // Pages incluses par mois
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, trialEndsAt: true, email: true, grantedPlan: true, bcPagesUsedThisMonth: true, bcPagesCredit: true },
  });
  const hasAccess = dbUser && canUseFeature(dbUser, "bc_import");
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Cette fonctionnalité est réservée au plan Business." },
      { status: 403 }
    );
  }

  // Calcul des pages disponibles (incluses + crédit acheté)
  const pagesUsed = dbUser.bcPagesUsedThisMonth ?? 0;
  const pagesCredit = dbUser.bcPagesCredit ?? 0;
  const pagesIncludedLeft = Math.max(0, BC_PAGES_INCLUDED - pagesUsed);
  const totalPagesLeft = pagesIncludedLeft + pagesCredit;

  if (totalPagesLeft <= 0) {
    return NextResponse.json(
      { error: "quota_exceeded", pagesUsed, pagesCredit, limit: BC_PAGES_INCLUDED },
      { status: 402 }
    );
  }

  // Récupération du fichier
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
  }
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Format non supporté. Utilisez PDF, PNG ou JPG." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (max 10 MB)" },
      { status: 400 }
    );
  }

  // Conversion en base64
  // Pour les PDFs multi-pages : on limite à 3 pages max pour réduire les tokens (et le coût)
  // Un BC peut tenir sur plusieurs pages (lignes longues), mais rarement plus de 3
  const MAX_PDF_PAGES = 3;
  let arrayBuffer = await file.arrayBuffer();
  if (file.type === "application/pdf") {
    try {
      const originalPdf = await PDFDocument.load(arrayBuffer);
      if (originalPdf.getPageCount() > MAX_PDF_PAGES) {
        const trimmedPdf = await PDFDocument.create();
        const pageIndexes = Array.from({ length: MAX_PDF_PAGES }, (_, i) => i);
        const pages = await trimmedPdf.copyPages(originalPdf, pageIndexes);
        pages.forEach((p) => trimmedPdf.addPage(p));
        const trimmedBytes = await trimmedPdf.save();
        arrayBuffer = trimmedBytes.buffer as ArrayBuffer;
      }
    } catch {
      // Échec du découpage → on envoie le PDF original (pas bloquant)
    }
  }
  // Compter le nombre de pages qui seront effectivement envoyées à Claude
  let pagesConsumed = 1; // images = 1 page
  if (file.type === "application/pdf") {
    try {
      const countPdf = await PDFDocument.load(arrayBuffer);
      pagesConsumed = Math.min(countPdf.getPageCount(), MAX_PDF_PAGES);
    } catch { pagesConsumed = 1; }
  }

  // Vérifier qu'on a assez de pages pour ce fichier
  if (pagesConsumed > totalPagesLeft) {
    return NextResponse.json(
      { error: "quota_exceeded", pagesUsed, pagesCredit, limit: BC_PAGES_INCLUDED },
      { status: 402 }
    );
  }

  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mediaType = file.type as "application/pdf" | "image/png" | "image/jpeg" | "image/webp";

  // Prompt d'extraction structurée
  const extractionPrompt = `Tu es un assistant spécialisé dans l'extraction de données de bons de commande.

Analyse ce bon de commande et retourne UNIQUEMENT un objet JSON valide (sans texte autour, sans markdown) avec cette structure exacte :

{
  "bcReference": "string ou null",
  "clientName": "string ou null",
  "clientAddress": "string ou null",
  "clientCity": "string ou null",
  "clientSiret": "string ou null",
  "clientEmail": "string ou null",
  "clientPhone": "string ou null",
  "date": "YYYY-MM-DD ou null",
  "dueDate": "YYYY-MM-DD ou null",
  "lines": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "vatRate": number
    }
  ],
  "notes": "string ou null"
}

Règles :
- vatRate : utilise uniquement 0, 5.5, 10 ou 20 (taux français standard). Si non précisé, mets 20.
- unitPrice : montant HT par unité (sans TVA)
- quantity : nombre (décimal si besoin)
- date et dueDate : format YYYY-MM-DD uniquement
- clientCity : ville seule (sans code postal ni pays)
- clientAddress : rue + numéro uniquement (sans ville ni code postal)
- Si une valeur est absente ou illisible, mets null
- Retourne UNIQUEMENT le JSON, aucun texte avant ou après`;

  try {
    // Appel Claude avec support natif PDF/image
    // Pour les PDFs : type "document", pour les images : type "image"
    const isPdf = mediaType === "application/pdf";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileBlock: any = isPdf
      ? {
          type: "document",
          source: { type: "base64", media_type: mediaType, data: base64 },
        }
      : {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: base64 },
        };

    // Retry automatique x3 si les serveurs Anthropic sont surchargés (erreur 529)
    let message;
    let lastError: unknown;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        message = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: [
                fileBlock,
                { type: "text", text: extractionPrompt },
              ],
            },
          ],
        });
        break; // succès → on sort de la boucle
      } catch (e: unknown) {
        lastError = e;
        const status = (e as { status?: number })?.status;
        if (status === 529 && attempt < 2) {
          // Serveurs Anthropic surchargés → attendre avant de réessayer
          await new Promise((r) => setTimeout(r, attempt * 2000));
          continue;
        }
        // Autre erreur ou 3ème tentative → on remonte l'erreur
        if (status === 529) {
          return NextResponse.json(
            {
              error: "overloaded",
              message:
                "Les serveurs d'intelligence artificielle sont momentanément surchargés. Ce n'est pas un problème FacturNow — réessayez dans quelques secondes.",
            },
            { status: 503 }
          );
        }
        throw e;
      }
    }
    if (!message) throw lastError;

    // Extraction du contenu texte
    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "Aucune réponse de l'IA" }, { status: 500 });
    }

    // Parse du JSON retourné par Claude
    let extracted: unknown;
    try {
      // Nettoyage au cas où Claude ajouterait des backticks
      const cleaned = textContent.text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      extracted = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Impossible de parser la réponse de l'IA", raw: textContent.text },
        { status: 500 }
      );
    }

    // Décompter les pages consommées — d'abord sur l'inclus, puis sur le crédit
    const deductFromIncluded = Math.min(pagesConsumed, pagesIncludedLeft);
    const deductFromCredit = pagesConsumed - deductFromIncluded;
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        bcPagesUsedThisMonth: { increment: deductFromIncluded },
        ...(deductFromCredit > 0 && { bcPagesCredit: { decrement: deductFromCredit } }),
      },
    });

    const newPagesLeft = totalPagesLeft - pagesConsumed;
    return NextResponse.json({ success: true, data: extracted, pagesLeft: newPagesLeft });
  } catch (err) {
    console.error("[extract-bc] Erreur API Claude :", err);
    return NextResponse.json(
      { error: "Erreur lors de l'extraction. Veuillez réessayer." },
      { status: 500 }
    );
  }
}

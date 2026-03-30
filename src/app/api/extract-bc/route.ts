// src/app/api/extract-bc/route.ts
// Reçoit un PDF/image de bon de commande externe, l'envoie à l'API Claude,
// et retourne les données extraites en JSON structuré pour pré-remplir une facture.
// Réservé au plan Business.

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
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

  // Feature gate — Business only (récupérer le user en DB pour vérifier le plan)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, trialEndsAt: true, email: true, grantedPlan: true },
  });
  const hasAccess = dbUser && canUseFeature(dbUser, "bc_import");
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Cette fonctionnalité est réservée au plan Business." },
      { status: 403 }
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
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mediaType = file.type as "application/pdf" | "image/png" | "image/jpeg" | "image/webp";

  // Prompt d'extraction structurée
  const extractionPrompt = `Tu es un assistant spécialisé dans l'extraction de données de bons de commande.

Analyse ce bon de commande et retourne UNIQUEMENT un objet JSON valide (sans texte autour, sans markdown) avec cette structure exacte :

{
  "bcReference": "string ou null",
  "clientName": "string ou null",
  "clientAddress": "string ou null",
  "clientSiret": "string ou null",
  "clientEmail": "string ou null",
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

    const message = await anthropic.messages.create({
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

    return NextResponse.json({ success: true, data: extracted });
  } catch (err) {
    console.error("[extract-bc] Erreur API Claude :", err);
    return NextResponse.json(
      { error: "Erreur lors de l'extraction. Veuillez réessayer." },
      { status: 500 }
    );
  }
}

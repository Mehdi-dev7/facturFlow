// ROUTE DE TEST TEMPORAIRE — À SUPPRIMER APRÈS LES TESTS
//
// Usage conversion  : GET /api/test-einvoice?number=FAC-2026-0019
// Usage envoi Peppol: GET /api/test-einvoice?send=true
//   → Récupère une facture test sandbox SuperPDP et l'envoie directement
//
// SÉCURITÉ : protégée par le même CRON_SECRET que les routes cron.
// Accessible uniquement en développement ou avec le header Authorization.

import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { testEInvoiceConversion } from "@/lib/actions/send-einvoice"
import { getTestInvoice, sendInvoiceXml, convertInvoiceToXml } from "@/lib/superpdp"

export async function GET(request: NextRequest) {
  // ── Protection : dev uniquement OU clé secrète ────────────────────────────
  const isDev = process.env.NODE_ENV === "development"
  const authHeader = request.headers.get("authorization")
  const validSecret = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!isDev && !validSecret) {
    return Response.json({ error: "Route de test non disponible en production sans autorisation" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id     = searchParams.get("id")
  const number = searchParams.get("number")
  const send   = searchParams.get("send") === "true"

  // ─ Mode envoi sandbox : utilise generate_test_invoice de SuperPDP ─
  if (send) {
    try {
      const testInvoice = await getTestInvoice()
      const xml = await convertInvoiceToXml(testInvoice)
      const result = await sendInvoiceXml(xml)
      return Response.json({ success: true, superpdp_id: result.id, events: result.events })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue"
      return Response.json({ success: false, error: message }, { status: 500 })
    }
  }

  // ─ Mode conversion : teste notre buildEN16931 sur une vraie facture ─
  if (!id && !number) {
    return Response.json({
      error: "Paramètre 'id', 'number' ou 'send=true' manquant",
      usage: {
        conversion: "/api/test-einvoice?number=FAC-2026-0019",
        send_sandbox: "/api/test-einvoice?send=true",
      },
    }, { status: 400 })
  }

  let invoiceId = id
  if (!invoiceId && number) {
    const doc = await prisma.document.findFirst({
      where: { number, type: "INVOICE" },
      select: { id: true },
    })
    if (!doc) return Response.json({ error: `Facture "${number}" introuvable` }, { status: 404 })
    invoiceId = doc.id
  }

  const result = await testEInvoiceConversion(invoiceId!)
  return Response.json(result)
}

// ROUTE DE TEST TEMPORAIRE — À SUPPRIMER APRÈS LES TESTS
//
// Usage conversion  : GET /api/test-einvoice?number=FAC-2026-0019
// Usage envoi Peppol: GET /api/test-einvoice?send=true
//   → Récupère une facture test sandbox SuperPDP et l'envoie directement

import { prisma } from "@/lib/prisma"
import { testEInvoiceConversion } from "@/lib/actions/send-einvoice"
import { getTestInvoice, sendInvoiceXml, convertInvoiceToXml } from "@/lib/superpdp"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id     = searchParams.get("id")
  const number = searchParams.get("number")
  const send   = searchParams.get("send") === "true"

  // ─ Mode envoi sandbox : utilise generate_test_invoice de SuperPDP ─
  // Bypasse notre buildEN16931, utilise directement la facture test sandbox
  // (seller = entreprise sandbox 000000002, buyer = acheteur sandbox aléatoire)
  if (send) {
    try {
      const testInvoice = await getTestInvoice()
      // getTestInvoice retourne un objet EN16931 → on convertit puis envoie
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

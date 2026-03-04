// src/app/api/debug/overdue/route.ts
// Endpoint de diagnostic temporaire — À SUPPRIMER après debug

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // 1. Toutes les factures SENT (sans filtre date)
  const allSent = await prisma.document.findMany({
    where: { type: "INVOICE", status: "SENT" },
    select: { id: true, number: true, status: true, dueDate: true, type: true },
    take: 10,
  })

  // 2. Factures SENT avec dueDate < maintenant
  const overdueCandidates = await prisma.document.findMany({
    where: { type: "INVOICE", status: "SENT", dueDate: { lt: now } },
    select: { id: true, number: true, status: true, dueDate: true },
  })

  // 3. Tous types de statuts distincts en DB
  const allStatuses = await prisma.document.groupBy({
    by: ["status", "type"],
    _count: true,
  })

  return NextResponse.json({
    serverTime: now.toISOString(),
    allSentInvoices: allSent,
    overdueCandidatesCount: overdueCandidates.length,
    overdueCandidates,
    statusBreakdown: allStatuses,
  })
}

'use server'

import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'

export interface NotificationCounts {
  invoices: boolean  // OVERDUE ou PAID depuis <7j
  quotes: boolean    // ACCEPTED ou REJECTED depuis <7j
  deposits: boolean  // OVERDUE ou PAID depuis <7j
  admin: boolean     // Nouveaux inscrits <48h ou avis en attente (admin uniquement)
}

// Retourne si chaque section a une notif active
export async function getNotificationCounts(userId: string): Promise<NotificationCounts> {
  const sevenDaysAgo = subDays(new Date(), 7)

  const [
    overdueInvoices, paidInvoices,
    overdueDeposits, paidDeposits,
    acceptedQuotes, refusedQuotes,
  ] = await Promise.all([
    // Factures OVERDUE (action requise)
    prisma.document.count({
      where: { userId, type: 'INVOICE', status: 'OVERDUE' },
    }),
    // Factures PAID récentes (7j)
    prisma.document.count({
      where: { userId, type: 'INVOICE', status: 'PAID', updatedAt: { gte: sevenDaysAgo } },
    }),
    // Acomptes OVERDUE
    prisma.document.count({
      where: { userId, type: 'DEPOSIT', status: 'OVERDUE' },
    }),
    // Acomptes PAID récents (7j)
    prisma.document.count({
      where: { userId, type: 'DEPOSIT', status: 'PAID', updatedAt: { gte: sevenDaysAgo } },
    }),
    // Devis ACCEPTED récents (7j)
    prisma.document.count({
      where: { userId, type: 'QUOTE', status: 'ACCEPTED', updatedAt: { gte: sevenDaysAgo } },
    }),
    // Devis REJECTED récents (7j)
    prisma.document.count({
      where: { userId, type: 'QUOTE', status: 'REJECTED', updatedAt: { gte: sevenDaysAgo } },
    }),
  ])

  return {
    invoices: overdueInvoices + paidInvoices > 0,
    deposits: overdueDeposits + paidDeposits > 0,
    quotes: acceptedQuotes + refusedQuotes > 0,
    admin: false, // géré séparément dans le layout (admin uniquement)
  }
}

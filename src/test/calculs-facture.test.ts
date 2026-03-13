import { describe, it, expect } from 'vitest'
import { calcInvoiceTotals, type CalcOptions } from '@/lib/utils/calculs-facture'

describe('calcInvoiceTotals', () => {
  // Test simple : une ligne sans TVA ni remise
  it('should calculate simple total without VAT or discount', () => {
    const result = calcInvoiceTotals({
      lines: [{ quantity: 1, unitPrice: 100 }],
      vatRate: 0,
    })

    expect(result.subtotal).toBe(100)
    expect(result.discountAmount).toBe(0)
    expect(result.netHT).toBe(100)
    expect(result.taxTotal).toBe(0)
    expect(result.totalTTC).toBe(100)
    expect(result.depositAmount).toBe(0)
    expect(result.netAPayer).toBe(100)
  })

  // Test TVA 20% simple
  it('should apply 20% VAT correctly', () => {
    const result = calcInvoiceTotals({
      lines: [{ quantity: 1, unitPrice: 100 }],
      vatRate: 20,
    })

    expect(result.subtotal).toBe(100)
    expect(result.netHT).toBe(100)
    expect(result.taxTotal).toBe(20)
    expect(result.totalTTC).toBe(120)
    expect(result.netAPayer).toBe(120)
  })

  // Test TVA 5.5%
  it('should apply 5.5% VAT correctly', () => {
    const result = calcInvoiceTotals({
      lines: [{ quantity: 2, unitPrice: 100 }],
      vatRate: 5.5,
    })

    expect(result.subtotal).toBe(200)
    expect(result.netHT).toBe(200)
    expect(result.taxTotal).toBe(11)
    expect(result.totalTTC).toBe(211)
  })

  // Test remise en pourcentage
  it('should apply percentage discount correctly', () => {
    const result = calcInvoiceTotals({
      lines: [{ quantity: 1, unitPrice: 100 }],
      vatRate: 20,
      discountType: 'pourcentage',
      discountValue: 10,
    })

    expect(result.subtotal).toBe(100)
    expect(result.discountAmount).toBe(10)
    expect(result.netHT).toBe(90)
    expect(result.taxTotal).toBe(18) // 90 * 0.2
    expect(result.totalTTC).toBe(108)
    expect(result.netAPayer).toBe(108)
  })

  // Test remise en montant fixe
  it('should apply fixed discount correctly', () => {
    const result = calcInvoiceTotals({
      lines: [{ quantity: 1, unitPrice: 100 }],
      vatRate: 20,
      discountType: 'montant',
      discountValue: 20,
    })

    expect(result.subtotal).toBe(100)
    expect(result.discountAmount).toBe(20)
    expect(result.netHT).toBe(80)
    expect(result.taxTotal).toBe(16) // 80 * 0.2
    expect(result.totalTTC).toBe(96)
    expect(result.netAPayer).toBe(96)
  })

  // Test remise plafonnée à 100%
  it('should cap percentage discount at 100%', () => {
    const result = calcInvoiceTotals({
      lines: [{ quantity: 1, unitPrice: 100 }],
      vatRate: 20,
      discountType: 'pourcentage',
      discountValue: 150, // Plus que 100%
    })

    expect(result.discountAmount).toBe(100) // Plafonné à 100
    expect(result.netHT).toBe(0)
    expect(result.taxTotal).toBe(0)
    expect(result.totalTTC).toBe(0)
  })

  // Test remise montant plafonnée au subtotal
  it('should cap fixed discount at subtotal', () => {
    const result = calcInvoiceTotals({
      lines: [{ quantity: 1, unitPrice: 100 }],
      vatRate: 20,
      discountType: 'montant',
      discountValue: 150, // Plus que subtotal
    })

    expect(result.discountAmount).toBe(100) // Plafonné au subtotal
    expect(result.netHT).toBe(0)
    expect(result.taxTotal).toBe(0)
    expect(result.totalTTC).toBe(0)
  })

  // Test acompte (dépôt)
  it('should subtract deposit amount from total', () => {
    const result = calcInvoiceTotals({
      lines: [{ quantity: 1, unitPrice: 100 }],
      vatRate: 20,
      depositAmount: 50,
    })

    expect(result.totalTTC).toBe(120)
    expect(result.depositAmount).toBe(50)
    expect(result.netAPayer).toBe(70) // 120 - 50
  })

  // Test acompte plafonné au totalTTC
  it('should cap deposit amount at total TTC', () => {
    const result = calcInvoiceTotals({
      lines: [{ quantity: 1, unitPrice: 100 }],
      vatRate: 20,
      depositAmount: 200, // Plus que le total
    })

    expect(result.totalTTC).toBe(120)
    expect(result.depositAmount).toBe(120) // Plafonné au total
    expect(result.netAPayer).toBe(0)
  })

  // Test avec plusieurs lignes
  it('should calculate correctly with multiple lines', () => {
    const result = calcInvoiceTotals({
      lines: [
        { quantity: 2, unitPrice: 50 },
        { quantity: 1, unitPrice: 100 },
        { quantity: 3, unitPrice: 25 },
      ],
      vatRate: 20,
    })

    // subtotal = 100 + 100 + 75 = 275
    expect(result.subtotal).toBe(275)
    expect(result.netHT).toBe(275)
    expect(result.taxTotal).toBe(55) // 275 * 0.2
    expect(result.totalTTC).toBe(330)
  })

  // Test cas limite : quantité 0
  it('should handle zero quantity correctly', () => {
    const result = calcInvoiceTotals({
      lines: [
        { quantity: 0, unitPrice: 100 },
        { quantity: 2, unitPrice: 50 },
      ],
      vatRate: 20,
    })

    expect(result.subtotal).toBe(100) // 0 + 100
    expect(result.netHT).toBe(100)
    expect(result.taxTotal).toBe(20)
    expect(result.totalTTC).toBe(120)
  })

  // Test cas limite : prix unitaire 0
  it('should handle zero unit price correctly', () => {
    const result = calcInvoiceTotals({
      lines: [
        { quantity: 5, unitPrice: 0 },
        { quantity: 2, unitPrice: 50 },
      ],
      vatRate: 20,
    })

    expect(result.subtotal).toBe(100) // 0 + 100
    expect(result.netHT).toBe(100)
    expect(result.taxTotal).toBe(20)
    expect(result.totalTTC).toBe(120)
  })

  // Test avec acompte zéro (cas par défaut)
  it('should default deposit amount to 0', () => {
    const result = calcInvoiceTotals({
      lines: [{ quantity: 1, unitPrice: 100 }],
      vatRate: 20,
    })

    expect(result.depositAmount).toBe(0)
    expect(result.netAPayer).toBe(120)
  })

  // Test remise complexe : % + TVA + acompte
  it('should combine percentage discount, VAT, and deposit', () => {
    const result = calcInvoiceTotals({
      lines: [{ quantity: 2, unitPrice: 100 }],
      vatRate: 20,
      discountType: 'pourcentage',
      discountValue: 25,
      depositAmount: 50,
    })

    // subtotal = 200
    // discountAmount = 200 * 0.25 = 50
    // netHT = 150
    // taxTotal = 150 * 0.2 = 30
    // totalTTC = 180
    // netAPayer = 180 - 50 = 130

    expect(result.subtotal).toBe(200)
    expect(result.discountAmount).toBe(50)
    expect(result.netHT).toBe(150)
    expect(result.taxTotal).toBe(30)
    expect(result.totalTTC).toBe(180)
    expect(result.depositAmount).toBe(50)
    expect(result.netAPayer).toBe(130)
  })

  // Test remise montant complexe : montant fixe + TVA + acompte
  it('should combine fixed discount, VAT, and deposit', () => {
    const result = calcInvoiceTotals({
      lines: [{ quantity: 1, unitPrice: 200 }],
      vatRate: 20,
      discountType: 'montant',
      discountValue: 30,
      depositAmount: 40,
    })

    // subtotal = 200
    // discountAmount = 30
    // netHT = 170
    // taxTotal = 170 * 0.2 = 34
    // totalTTC = 204
    // netAPayer = 204 - 40 = 164

    expect(result.subtotal).toBe(200)
    expect(result.discountAmount).toBe(30)
    expect(result.netHT).toBe(170)
    expect(result.taxTotal).toBe(34)
    expect(result.totalTTC).toBe(204)
    expect(result.depositAmount).toBe(40)
    expect(result.netAPayer).toBe(164)
  })

  // Test arrondi à 2 décimales
  it('should round to 2 decimal places', () => {
    const result = calcInvoiceTotals({
      lines: [{ quantity: 3, unitPrice: 10.33 }],
      vatRate: 19.6, // TVA à 19.6% pour obtenir des décimales
    })

    // subtotal = 30.99
    // netHT = 30.99
    // taxTotal = 30.99 * 0.196 = 6.07404 → 6.07
    // totalTTC = 37.06
    expect(result.subtotal).toBe(30.99)
    expect(result.netHT).toBe(30.99)
    expect(result.taxTotal).toBe(6.07)
    expect(result.totalTTC).toBe(37.06)
  })

  // Test tableau vide
  it('should handle empty lines array', () => {
    const result = calcInvoiceTotals({
      lines: [],
      vatRate: 20,
    })

    expect(result.subtotal).toBe(0)
    expect(result.netHT).toBe(0)
    expect(result.taxTotal).toBe(0)
    expect(result.totalTTC).toBe(0)
    expect(result.netAPayer).toBe(0)
  })

  // Test sans options optionnelles
  it('should work with minimal options', () => {
    const result = calcInvoiceTotals({
      lines: [{ quantity: 1, unitPrice: 100 }],
      vatRate: 0,
    })

    expect(result.totalTTC).toBe(100)
    expect(result.depositAmount).toBe(0)
    expect(result.netAPayer).toBe(100)
  })

  // Test TVA 0% sur devis (cas fréquent)
  it('should calculate quote with 0% VAT', () => {
    const result = calcInvoiceTotals({
      lines: [{ quantity: 5, unitPrice: 200 }],
      vatRate: 0,
      discountType: 'pourcentage',
      discountValue: 15,
    })

    // subtotal = 1000
    // discountAmount = 150
    // netHT = 850
    // taxTotal = 0
    // totalTTC = 850

    expect(result.subtotal).toBe(1000)
    expect(result.discountAmount).toBe(150)
    expect(result.netHT).toBe(850)
    expect(result.taxTotal).toBe(0)
    expect(result.totalTTC).toBe(850)
  })
})

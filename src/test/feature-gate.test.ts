import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getEffectivePlan, canUseFeature, type Feature } from '@/lib/feature-gate'

describe('getEffectivePlan', () => {
  const mockUser = {
    plan: 'FREE',
    trialEndsAt: null,
    email: null,
    grantedPlan: null,
  }

  // Test admin email
  it('should return BUSINESS for admin email', () => {
    const adminEmail = 'admin@test.fr'
    vi.stubEnv('ADMIN_EMAIL', adminEmail)

    const user = {
      ...mockUser,
      email: adminEmail,
    }

    const result = getEffectivePlan(user)
    expect(result).toBe('BUSINESS')

    vi.unstubAllEnvs()
  })

  // Test grantedPlan BUSINESS
  it('should return BUSINESS when grantedPlan is BUSINESS', () => {
    const user = {
      ...mockUser,
      grantedPlan: 'BUSINESS',
    }

    const result = getEffectivePlan(user)
    expect(result).toBe('BUSINESS')
  })

  // Test trial actif
  it('should return PRO for active trial', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1) // Demain

    const user = {
      ...mockUser,
      trialEndsAt: futureDate,
    }

    const result = getEffectivePlan(user)
    expect(result).toBe('PRO')
  })

  // Test trial expiré
  it('should return FREE when trial has expired', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1) // Hier

    const user = {
      ...mockUser,
      plan: 'FREE',
      trialEndsAt: pastDate,
    }

    const result = getEffectivePlan(user)
    expect(result).toBe('FREE')
  })

  // Test plan BUSINESS
  it('should return BUSINESS for BUSINESS plan', () => {
    const user = {
      ...mockUser,
      plan: 'BUSINESS',
    }

    const result = getEffectivePlan(user)
    expect(result).toBe('BUSINESS')
  })

  // Test plan PRO
  it('should return PRO for PRO plan', () => {
    const user = {
      ...mockUser,
      plan: 'PRO',
    }

    const result = getEffectivePlan(user)
    expect(result).toBe('PRO')
  })

  // Test plan FREE
  it('should return FREE for FREE plan', () => {
    const user = {
      ...mockUser,
      plan: 'FREE',
    }

    const result = getEffectivePlan(user)
    expect(result).toBe('FREE')
  })

  // Test priorité : admin > grantedPlan > trial > plan
  it('should prioritize admin email over grantedPlan and trial', () => {
    const adminEmail = 'admin@test.fr'
    vi.stubEnv('ADMIN_EMAIL', adminEmail)

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)

    const user = {
      plan: 'FREE',
      email: adminEmail,
      trialEndsAt: futureDate,
      grantedPlan: null,
    }

    const result = getEffectivePlan(user)
    expect(result).toBe('BUSINESS')

    vi.unstubAllEnvs()
  })

  // Test priorité : grantedPlan > trial > plan
  it('should prioritize grantedPlan over trial', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)

    const user = {
      plan: 'FREE',
      email: null,
      trialEndsAt: futureDate,
      grantedPlan: 'BUSINESS',
    }

    const result = getEffectivePlan(user)
    expect(result).toBe('BUSINESS')
  })

  // Test priorité : trial > plan
  it('should prioritize active trial over plan', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)

    const user = {
      plan: 'FREE',
      email: null,
      trialEndsAt: futureDate,
      grantedPlan: null,
    }

    const result = getEffectivePlan(user)
    expect(result).toBe('PRO')
  })

  // Test admin email sans ADMIN_EMAIL configuré
  it('should not return BUSINESS if ADMIN_EMAIL is not configured', () => {
    // Pas de configuration d'ADMIN_EMAIL
    const user = {
      ...mockUser,
      email: 'random@test.fr',
    }

    const result = getEffectivePlan(user)
    expect(result).not.toBe('BUSINESS')
  })
})

describe('canUseFeature', () => {
  const mockUser = {
    plan: 'FREE',
    trialEndsAt: null,
  }

  // Test FREE : pas de features
  it('should not allow unlimited_documents on FREE plan', () => {
    const user = { ...mockUser, plan: 'FREE' }
    const result = canUseFeature(user, 'unlimited_documents')
    expect(result).toBe(false)
  })

  // Test FREE : pas de stripe
  it('should not allow payment_stripe on FREE plan', () => {
    const user = { ...mockUser, plan: 'FREE' }
    const result = canUseFeature(user, 'payment_stripe')
    expect(result).toBe(false)
  })

  // Test FREE : pas de paypal
  it('should not allow payment_paypal on FREE plan', () => {
    const user = { ...mockUser, plan: 'FREE' }
    const result = canUseFeature(user, 'payment_paypal')
    expect(result).toBe(false)
  })

  // Test FREE : pas de gocardless
  it('should not allow payment_gocardless on FREE plan', () => {
    const user = { ...mockUser, plan: 'FREE' }
    const result = canUseFeature(user, 'payment_gocardless')
    expect(result).toBe(false)
  })

  // Test FREE : pas de csv_export
  it('should not allow csv_export on FREE plan', () => {
    const user = { ...mockUser, plan: 'FREE' }
    const result = canUseFeature(user, 'csv_export')
    expect(result).toBe(false)
  })

  // Test PRO : unlimited_documents
  it('should allow unlimited_documents on PRO plan', () => {
    const user = { ...mockUser, plan: 'PRO' }
    const result = canUseFeature(user, 'unlimited_documents')
    expect(result).toBe(true)
  })

  // Test PRO : stripe
  it('should allow payment_stripe on PRO plan', () => {
    const user = { ...mockUser, plan: 'PRO' }
    const result = canUseFeature(user, 'payment_stripe')
    expect(result).toBe(true)
  })

  // Test PRO : paypal
  it('should allow payment_paypal on PRO plan', () => {
    const user = { ...mockUser, plan: 'PRO' }
    const result = canUseFeature(user, 'payment_paypal')
    expect(result).toBe(true)
  })

  // Test PRO : gocardless
  it('should allow payment_gocardless on PRO plan', () => {
    const user = { ...mockUser, plan: 'PRO' }
    const result = canUseFeature(user, 'payment_gocardless')
    expect(result).toBe(true)
  })

  // Test PRO : csv_export
  it('should allow csv_export on PRO plan', () => {
    const user = { ...mockUser, plan: 'PRO' }
    const result = canUseFeature(user, 'csv_export')
    expect(result).toBe(true)
  })

  // Test PRO : einvoice_100
  it('should allow einvoice_100 on PRO plan', () => {
    const user = { ...mockUser, plan: 'PRO' }
    const result = canUseFeature(user, 'einvoice_100')
    expect(result).toBe(true)
  })

  // Test PRO : NOT api_webhooks (BUSINESS only)
  it('should not allow api_webhooks on PRO plan', () => {
    const user = { ...mockUser, plan: 'PRO' }
    const result = canUseFeature(user, 'api_webhooks')
    expect(result).toBe(false)
  })

  // Test PRO : NOT einvoice_unlimited (BUSINESS only)
  it('should not allow einvoice_unlimited on PRO plan', () => {
    const user = { ...mockUser, plan: 'PRO' }
    const result = canUseFeature(user, 'einvoice_unlimited')
    expect(result).toBe(false)
  })

  // Test BUSINESS : api_webhooks
  it('should allow api_webhooks on BUSINESS plan', () => {
    const user = { ...mockUser, plan: 'BUSINESS' }
    const result = canUseFeature(user, 'api_webhooks')
    expect(result).toBe(true)
  })

  // Test BUSINESS : einvoice_unlimited
  it('should allow einvoice_unlimited on BUSINESS plan', () => {
    const user = { ...mockUser, plan: 'BUSINESS' }
    const result = canUseFeature(user, 'einvoice_unlimited')
    expect(result).toBe(true)
  })

  // Test BUSINESS : fec_export
  it('should allow fec_export on BUSINESS plan', () => {
    const user = { ...mockUser, plan: 'BUSINESS' }
    const result = canUseFeature(user, 'fec_export')
    expect(result).toBe(true)
  })

  // Test BUSINESS : multi_users
  it('should allow multi_users on BUSINESS plan', () => {
    const user = { ...mockUser, plan: 'BUSINESS' }
    const result = canUseFeature(user, 'multi_users')
    expect(result).toBe(true)
  })

  // Test BUSINESS : monthly_accounting_report
  it('should allow monthly_accounting_report on BUSINESS plan', () => {
    const user = { ...mockUser, plan: 'BUSINESS' }
    const result = canUseFeature(user, 'monthly_accounting_report')
    expect(result).toBe(true)
  })

  // Test BUSINESS : annual_report
  it('should allow annual_report on BUSINESS plan', () => {
    const user = { ...mockUser, plan: 'BUSINESS' }
    const result = canUseFeature(user, 'annual_report')
    expect(result).toBe(true)
  })

  // Test trial actif traité comme PRO
  it('should allow payment_stripe on active trial', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)

    const user = {
      plan: 'FREE',
      trialEndsAt: futureDate,
    }

    const result = canUseFeature(user, 'payment_stripe')
    expect(result).toBe(true)
  })

  // Test trial expiré, plan FREE
  it('should not allow payment_stripe when trial expired and plan is FREE', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)

    const user = {
      plan: 'FREE',
      trialEndsAt: pastDate,
    }

    const result = canUseFeature(user, 'payment_stripe')
    expect(result).toBe(false)
  })

  // Test trial expiré, plan PRO
  it('should allow payment_stripe when trial expired but plan is PRO', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)

    const user = {
      plan: 'PRO',
      trialEndsAt: pastDate,
    }

    const result = canUseFeature(user, 'payment_stripe')
    expect(result).toBe(true)
  })

  // Test PRO : custom_appearance
  it('should allow custom_appearance on PRO plan', () => {
    const user = { ...mockUser, plan: 'PRO' }
    const result = canUseFeature(user, 'custom_appearance')
    expect(result).toBe(true)
  })

  // Test PRO : auto_reminders
  it('should allow auto_reminders on PRO plan', () => {
    const user = { ...mockUser, plan: 'PRO' }
    const result = canUseFeature(user, 'auto_reminders')
    expect(result).toBe(true)
  })

  // Test PRO : recurring_invoices
  it('should allow recurring_invoices on PRO plan', () => {
    const user = { ...mockUser, plan: 'PRO' }
    const result = canUseFeature(user, 'recurring_invoices')
    expect(result).toBe(true)
  })

  // Test PRO : statistics
  it('should allow statistics on PRO plan', () => {
    const user = { ...mockUser, plan: 'PRO' }
    const result = canUseFeature(user, 'statistics')
    expect(result).toBe(true)
  })

  // Test PRO : business_templates
  it('should allow business_templates on PRO plan', () => {
    const user = { ...mockUser, plan: 'PRO' }
    const result = canUseFeature(user, 'business_templates')
    expect(result).toBe(true)
  })

  // Test FREE : custom_appearance NOT allowed
  it('should not allow custom_appearance on FREE plan', () => {
    const user = { ...mockUser, plan: 'FREE' }
    const result = canUseFeature(user, 'custom_appearance')
    expect(result).toBe(false)
  })

  // Test BUSINESS hérite de PRO
  it('should inherit all PRO features on BUSINESS plan', () => {
    const user = { ...mockUser, plan: 'BUSINESS' }

    // Quelques features PRO
    expect(canUseFeature(user, 'unlimited_documents')).toBe(true)
    expect(canUseFeature(user, 'payment_stripe')).toBe(true)
    expect(canUseFeature(user, 'csv_export')).toBe(true)
    expect(canUseFeature(user, 'einvoice_100')).toBe(true)
  })
})

# Exemples de Tests - FacturNow

Ce fichier contient des exemples pour écrire des tests pour différents types de logique.

## 1. Tests de fonctions pures (calculs, logique métier)

**Meilleur cas pour les tests unitaires.**

```typescript
import { describe, it, expect } from 'vitest'
import { calculateDiscount } from '@/lib/calculations'

describe('calculateDiscount', () => {
  it('should return 0 for 0% discount', () => {
    const result = calculateDiscount(100, 0)
    expect(result).toBe(0)
  })

  it('should calculate percentage correctly', () => {
    const result = calculateDiscount(100, 10)
    expect(result).toBe(10)
  })

  it('should cap at 100%', () => {
    const result = calculateDiscount(100, 150)
    expect(result).toBe(100)
  })

  it('should handle decimal prices', () => {
    const result = calculateDiscount(99.99, 25)
    expect(result).toBeCloseTo(24.9975, 2)
  })
})
```

## 2. Tests de validation Zod

```typescript
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { invoiceSchema } from '@/lib/validations/invoice'

describe('invoiceSchema', () => {
  it('should validate a correct invoice', () => {
    const data = {
      clientId: 'client-123',
      lines: [{ quantity: 1, unitPrice: 100 }],
      dueDate: new Date(),
    }

    const result = invoiceSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject missing clientId', () => {
    const data = {
      lines: [{ quantity: 1, unitPrice: 100 }],
      dueDate: new Date(),
    }

    const result = invoiceSchema.safeParse(data)
    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('clientId')
    }
  })

  it('should reject negative unit price', () => {
    const data = {
      clientId: 'client-123',
      lines: [{ quantity: 1, unitPrice: -50 }],
      dueDate: new Date(),
    }

    const result = invoiceSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject invalid email', () => {
    const emailSchema = z.string().email()

    const result = emailSchema.safeParse('not-an-email')
    expect(result.success).toBe(false)
  })
})
```

## 3. Tests de composants React

**Nécessite @testing-library/react.**

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InvoiceForm } from '@/components/invoice-form'

describe('InvoiceForm', () => {
  it('should render the form', () => {
    render(<InvoiceForm onSubmit={() => {}} />)

    expect(screen.getByLabelText('Client')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('should call onSubmit when form is submitted', async () => {
    const mockSubmit = vi.fn()
    render(<InvoiceForm onSubmit={mockSubmit} />)

    await userEvent.type(screen.getByLabelText('Client'), 'John Doe')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(mockSubmit).toHaveBeenCalled()
  })

  it('should show validation errors', async () => {
    render(<InvoiceForm onSubmit={() => {}} />)

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByText(/client is required/i)).toBeInTheDocument()
  })
})
```

## 4. Tests avec mocking de dépendances

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createInvoice } from '@/lib/actions/invoices'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    document: {
      create: vi.fn(),
    },
  },
}))

describe('createInvoice', () => {
  it('should create invoice with correct data', async () => {
    const mockPrisma = vi.mocked(prisma)
    mockPrisma.document.create.mockResolvedValue({
      id: 'inv-123',
      number: 'INV-2025-001',
      // ... autres champs
    })

    const result = await createInvoice({
      clientId: 'client-123',
      lines: [{ quantity: 1, unitPrice: 100 }],
    })

    expect(result.id).toBe('inv-123')
    expect(mockPrisma.document.create).toHaveBeenCalled()
  })

  it('should handle errors gracefully', async () => {
    const mockPrisma = vi.mocked(prisma)
    mockPrisma.document.create.mockRejectedValue(new Error('DB error'))

    const result = await createInvoice({
      clientId: 'client-123',
      lines: [{ quantity: 1, unitPrice: 100 }],
    })

    expect(result.error).toBe('DB error')
  })
})
```

## 5. Tests d'async/await

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { fetchInvoice } from '@/lib/api/invoices'

describe('fetchInvoice', () => {
  it('should fetch invoice data', async () => {
    const result = await fetchInvoice('inv-123')

    expect(result).toBeDefined()
    expect(result.id).toBe('inv-123')
  })

  it('should handle network errors', async () => {
    try {
      await fetchInvoice('invalid-id')
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error.message).toContain('Not found')
    }
  })
})
```

## 6. Tests de hooks custom (avec Vitest)

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInvoiceForm } from '@/hooks/use-invoice-form'

describe('useInvoiceForm', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useInvoiceForm())

    expect(result.current.clientId).toBe('')
    expect(result.current.lines).toEqual([])
  })

  it('should update clientId when setClientId is called', () => {
    const { result } = renderHook(() => useInvoiceForm())

    act(() => {
      result.current.setClientId('client-123')
    })

    expect(result.current.clientId).toBe('client-123')
  })
})
```

## 7. Tests de snapshots (usage prudent)

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { InvoicePDF } from '@/components/invoice-pdf'

describe('InvoicePDF', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <InvoicePDF invoice={mockInvoice} />
    )

    expect(container.firstChild).toMatchSnapshot()
  })
})
```

**⚠️ Utiliser les snapshots avec prudence** : ils peuvent masquer des bugs. À préférer aux tests de contenu exact.

## 8. Tests de dates

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { isOverdue } from '@/lib/utils/dates'

describe('isOverdue', () => {
  beforeEach(() => {
    // Mock la date actuelle
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-03-13'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return true if due date is in the past', () => {
    const pastDate = new Date('2025-03-10')
    expect(isOverdue(pastDate)).toBe(true)
  })

  it('should return false if due date is in the future', () => {
    const futureDate = new Date('2025-03-20')
    expect(isOverdue(futureDate)).toBe(false)
  })

  it('should return false if due date is today', () => {
    const today = new Date('2025-03-13')
    expect(isOverdue(today)).toBe(false)
  })
})
```

## 9. Tests de formatage

```typescript
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'

describe('formatCurrency', () => {
  it('should format to French locale', () => {
    const result = formatCurrency(1234.56)
    expect(result).toBe('1 234,56 €')
  })

  it('should handle edge cases', () => {
    expect(formatCurrency(0)).toBe('0,00 €')
    expect(formatCurrency(0.01)).toBe('0,01 €')
    expect(formatCurrency(999999)).toBe('999 999,00 €')
  })
})

describe('formatDate', () => {
  it('should format date to French locale', () => {
    const date = new Date('2025-03-13T10:30:00')
    const result = formatDate(date)
    expect(result).toBe('13 mars 2025')
  })
})
```

## 10. Tests d'énumérations et constantes

```typescript
import { describe, it, expect } from 'vitest'
import { DOCUMENT_TYPES, PAYMENT_METHODS } from '@/lib/constants'

describe('Constants', () => {
  it('should have all required document types', () => {
    expect(DOCUMENT_TYPES).toContain('INVOICE')
    expect(DOCUMENT_TYPES).toContain('QUOTE')
    expect(DOCUMENT_TYPES).toContain('CREDIT_NOTE')
  })

  it('should have all payment methods', () => {
    expect(PAYMENT_METHODS).toHaveLength(4)
    expect(PAYMENT_METHODS).toContain('STRIPE')
    expect(PAYMENT_METHODS).toContain('PAYPAL')
    expect(PAYMENT_METHODS).toContain('GOCARDLESS')
    expect(PAYMENT_METHODS).toContain('BANK_TRANSFER')
  })
})
```

## Best Practices à retenir

### ✅ À faire
- **Tests descriptifs** : noms clairs et spécifiques
- **Tests isolés** : chaque test indépendant des autres
- **Arrange-Act-Assert** : structure claire
- **Pas de logique** : pas de boucles, conditions dans les tests
- **Tester le comportement** : pas les implémentations internes
- **Grouper avec describe** : tests liés ensemble

### ❌ À éviter
- **Tests génériques** : `it('should work')` est trop vague
- **Dépendances entre tests** : ne pas faire dépendre un test d'un autre
- **Timeouts longs** : utiliser `vi.useFakeTimers()` si possible
- **Trop de mocking** : trop de mocks = test fragile
- **Console logs** : utiliser `expect()` plutôt que `console.log()`
- **Over-testing** : tester l'implémentation plutôt que le comportement

## Ressources

- [Vitest Docs](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro)
- [Jest Matchers](https://jestjs.io/docs/expect)
- [Zod](https://zod.dev/)

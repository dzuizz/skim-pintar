import { generatePayNowString, generateReference } from '../paynow-qr'

describe('generateReference', () => {
  it('formats as SP-XXXX-YYYYMM', () => {
    expect(generateReference(1, '2026-03')).toBe('SP-0001-202603')
  })

  it('pads donor ID to 4 digits', () => {
    expect(generateReference(42, '2026-12')).toBe('SP-0042-202612')
  })

  it('handles large donor IDs', () => {
    expect(generateReference(9999, '2026-01')).toBe('SP-9999-202601')
  })
})

describe('generatePayNowString', () => {
  const result = generatePayNowString({ amount: 50, reference: 'SP-0001-202603' })

  it('starts with payload format indicator', () => {
    expect(result.startsWith('000201')).toBe(true)
  })

  it('contains UEN', () => {
    expect(result).toContain('T08CC4018F')
  })

  it('contains SG.PAYNOW', () => {
    expect(result).toContain('SG.PAYNOW')
  })

  it('contains the amount', () => {
    expect(result).toContain('50.00')
  })

  it('contains the reference', () => {
    expect(result).toContain('SP-0001-202603')
  })

  it('contains country code SG', () => {
    expect(result).toContain('SG')
  })

  it('ends with 4-char CRC', () => {
    expect(result).toMatch(/6304[0-9A-F]{4}$/)
  })

  it('produces consistent output for same input', () => {
    const result2 = generatePayNowString({ amount: 50, reference: 'SP-0001-202603' })
    expect(result).toBe(result2)
  })
})

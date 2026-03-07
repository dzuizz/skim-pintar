import { matchPayments, parseCSV } from '../reconcile'

describe('matchPayments', () => {
  it('matches by exact reference code', () => {
    const bankRows = [{ reference: 'SP-0001-202603', amount: 50, date: '2026-03-01' }]
    const pending = [{ id: 1, reference: 'SP-0001-202603', amount: 50 }]
    const result = matchPayments(bankRows, pending)
    expect(result.matched).toHaveLength(1)
    expect(result.matched[0].donationId).toBe(1)
    expect(result.unmatched).toHaveLength(0)
  })

  it('flags unmatched bank rows', () => {
    const bankRows = [{ reference: 'UNKNOWN-REF', amount: 50, date: '2026-03-01' }]
    const pending: { id: number; reference: string; amount: number }[] = []
    const result = matchPayments(bankRows, pending)
    expect(result.unmatched).toHaveLength(1)
    expect(result.matched).toHaveLength(0)
  })

  it('detects duplicate payments', () => {
    const bankRows = [
      { reference: 'SP-0001-202603', amount: 50, date: '2026-03-01' },
      { reference: 'SP-0001-202603', amount: 50, date: '2026-03-02' },
    ]
    const pending = [{ id: 1, reference: 'SP-0001-202603', amount: 50 }]
    const result = matchPayments(bankRows, pending)
    expect(result.matched).toHaveLength(1)
    expect(result.duplicates).toHaveLength(1)
  })

  it('handles amount mismatches', () => {
    const bankRows = [{ reference: 'SP-0001-202603', amount: 60, date: '2026-03-01' }]
    const pending = [{ id: 1, reference: 'SP-0001-202603', amount: 50 }]
    const result = matchPayments(bankRows, pending)
    expect(result.matched).toHaveLength(1)
    expect(result.matched[0].amountMismatch).toBe(true)
  })

  it('marks amountMismatch false when amounts match', () => {
    const bankRows = [{ reference: 'SP-0001-202603', amount: 50, date: '2026-03-01' }]
    const pending = [{ id: 1, reference: 'SP-0001-202603', amount: 50 }]
    const result = matchPayments(bankRows, pending)
    expect(result.matched[0].amountMismatch).toBe(false)
  })

  it('includes donorName in matched results', () => {
    const bankRows = [{ reference: 'SP-0002-202603', amount: 30, date: '2026-03-01' }]
    const pending = [{ id: 2, reference: 'SP-0002-202603', amount: 30, donorName: 'Ahmad' }]
    const result = matchPayments(bankRows, pending)
    expect(result.matched[0].donorName).toBe('Ahmad')
  })

  it('handles multiple matches and unmatched together', () => {
    const bankRows = [
      { reference: 'SP-0001-202603', amount: 50, date: '2026-03-01' },
      { reference: 'SP-0002-202603', amount: 30, date: '2026-03-01' },
      { reference: 'UNKNOWN', amount: 100, date: '2026-03-01' },
    ]
    const pending = [
      { id: 1, reference: 'SP-0001-202603', amount: 50 },
      { id: 2, reference: 'SP-0002-202603', amount: 30 },
    ]
    const result = matchPayments(bankRows, pending)
    expect(result.matched).toHaveLength(2)
    expect(result.unmatched).toHaveLength(1)
    expect(result.duplicates).toHaveLength(0)
  })
})

describe('parseCSV', () => {
  it('parses CSV with headers', () => {
    const csv = 'Date,Reference,Amount\n2026-03-01,SP-0001-202603,50.00'
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].reference).toBe('SP-0001-202603')
    expect(rows[0].amount).toBe(50)
  })

  it('handles empty CSV', () => {
    const rows = parseCSV('Date,Reference,Amount\n')
    expect(rows).toHaveLength(0)
  })

  it('handles Windows-style line endings', () => {
    const csv = 'Date,Reference,Amount\r\n2026-03-01,SP-0001-202603,50.00\r\n'
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].reference).toBe('SP-0001-202603')
  })

  it('handles quoted fields', () => {
    const csv = 'Date,Reference,Amount\n"2026-03-01","SP-0001-202603","50.00"'
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].reference).toBe('SP-0001-202603')
    expect(rows[0].amount).toBe(50)
  })

  it('handles flexible header names', () => {
    const csv = 'Transaction Date,Payment Reference,Transfer Amount\n2026-03-01,SP-0001-202603,50.00'
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].reference).toBe('SP-0001-202603')
  })

  it('handles extra whitespace in values', () => {
    const csv = 'Date, Reference , Amount\n 2026-03-01 , SP-0001-202603 , 50.00 '
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].reference).toBe('SP-0001-202603')
    expect(rows[0].amount).toBe(50)
  })

  it('parses multiple rows', () => {
    const csv =
      'Date,Reference,Amount\n2026-03-01,SP-0001-202603,50.00\n2026-03-02,SP-0002-202603,30.00'
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(2)
    expect(rows[0].reference).toBe('SP-0001-202603')
    expect(rows[1].reference).toBe('SP-0002-202603')
  })

  it('skips rows with missing reference or amount', () => {
    const csv = 'Date,Reference,Amount\n2026-03-01,,50.00\n2026-03-02,SP-0002-202603,'
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(0)
  })

  it('returns empty array if headers are missing required columns', () => {
    const csv = 'Name,Email\nJohn,john@example.com'
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(0)
  })
})

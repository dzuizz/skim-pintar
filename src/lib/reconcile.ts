export interface BankRow {
  reference: string
  amount: number
  date: string
}

export interface PendingDonation {
  id: number
  reference: string
  amount: number
  donorName?: string
}

export interface MatchedItem {
  bankRow: BankRow
  donationId: number
  donorName?: string
  amountMismatch: boolean
}

export interface MatchResult {
  matched: MatchedItem[]
  unmatched: BankRow[]
  duplicates: { bankRow: BankRow; donationId: number }[]
}

export function matchPayments(
  bankRows: BankRow[],
  pendingDonations: PendingDonation[],
): MatchResult {
  const matched: MatchedItem[] = []
  const unmatched: BankRow[] = []
  const duplicates: { bankRow: BankRow; donationId: number }[] = []

  // Build a lookup map by reference for O(1) access
  const donationsByRef = new Map<string, PendingDonation>()
  for (const donation of pendingDonations) {
    donationsByRef.set(donation.reference, donation)
  }

  // Track which donation IDs have already been matched
  const matchedDonationIds = new Set<number>()

  for (const bankRow of bankRows) {
    const donation = donationsByRef.get(bankRow.reference)

    if (!donation) {
      unmatched.push(bankRow)
      continue
    }

    if (matchedDonationIds.has(donation.id)) {
      // This donation was already matched by a previous bank row — duplicate
      duplicates.push({ bankRow, donationId: donation.id })
      continue
    }

    // Match found
    matchedDonationIds.add(donation.id)
    matched.push({
      bankRow,
      donationId: donation.id,
      donorName: donation.donorName,
      amountMismatch: bankRow.amount !== donation.amount,
    })
  }

  return { matched, unmatched, duplicates }
}

/**
 * Parse a CSV string into BankRow[].
 * Flexibly matches columns containing "reference", "amount", "date" in headers.
 * Handles quoted fields, extra whitespace, and Windows-style line endings.
 */
export function parseCSV(csvText: string): BankRow[] {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')

  if (lines.length < 2) return []

  const headerLine = lines[0]
  const headers = parseCSVLine(headerLine).map((h) => h.toLowerCase().trim())

  // Find column indices by matching header keywords
  const refIndex = headers.findIndex((h) => h.includes('reference'))
  const amountIndex = headers.findIndex((h) => h.includes('amount'))
  const dateIndex = headers.findIndex((h) => h.includes('date'))

  if (refIndex === -1 || amountIndex === -1 || dateIndex === -1) {
    return []
  }

  const rows: BankRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const fields = parseCSVLine(line)
    const reference = (fields[refIndex] ?? '').trim()
    const amountStr = (fields[amountIndex] ?? '').trim()
    const date = (fields[dateIndex] ?? '').trim()

    if (!reference || !amountStr) continue

    const amount = parseFloat(amountStr.replace(/[^0-9.\-]/g, ''))
    if (isNaN(amount)) continue

    rows.push({ reference, amount, date })
  }

  return rows
}

/**
 * Parse a single CSV line, handling quoted fields with escaped quotes.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote (double-double-quote)
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++ // skip next quote
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        fields.push(current)
        current = ''
      } else {
        current += char
      }
    }
  }

  fields.push(current)
  return fields
}

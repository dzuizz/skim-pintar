export interface GiroTrackingEntry {
  id: number
  phase: string
  detail: string | null
  created_at: string
}

export interface GiroDependant {
  id: number
  full_name: string
  relationship: string
  phone: string | null
  address: string | null
}

export interface GiroDonor {
  id: number
  full_name: string
  phone: string
  email: string | null
  address: string | null
  postal_code: string | null
  membership_no: string | null
  tier: string | null
  monthly_amount: number | null
  giro_status: string
  bank_name: string | null
  remarks: string | null
  status: string | null
  submitted_to_bank_at: string | null
  bank_verified_at: string | null
  first_deduction_at: string | null
  activated_at: string | null
  updated_at: string | null
  tracking_url: string
}

export interface GiroLookupResponse {
  source: 'giro'
  donor: GiroDonor
  dependants: GiroDependant[]
  tracking: GiroTrackingEntry[]
  current_phase_since: string | null
  current_phase_days: number
}

export function isGiroLookupConfigured() {
  return Boolean(process.env.GIRO_LOOKUP_API_BASE_URL)
}

export async function fetchGiroLookup(phone: string): Promise<GiroLookupResponse | null> {
  const baseUrl = process.env.GIRO_LOOKUP_API_BASE_URL
  if (!baseUrl) return null

  const url = new URL('/api/public/giro/lookup', baseUrl)
  url.searchParams.set('phone', phone)

  const headers: Record<string, string> = {}
  if (process.env.GIRO_LOOKUP_API_TOKEN) {
    headers['X-Skimpintar-Dashboard-Token'] = process.env.GIRO_LOOKUP_API_TOKEN
  }

  const response = await fetch(url, {
    headers,
    cache: 'no-store',
  })

  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`GIRO lookup failed with ${response.status}`)
  }

  return response.json() as Promise<GiroLookupResponse>
}

export interface Donor {
  id: number
  name: string
  phone: string
  email: string | null
  nric_last4: string | null
  reminder_channel: 'WHATSAPP' | 'SMS' | 'EMAIL'
  created_at: string
  updated_at: string
}

export interface Pledge {
  id: number
  donor_id: number
  amount: number
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  reminder_day: number
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED'
  created_at: string
  updated_at: string
}

export interface Donation {
  id: number
  pledge_id: number
  donor_id: number
  amount: number
  reference: string
  cycle_month: string
  status: 'PENDING' | 'RECEIVED' | 'MISSED'
  received_at: string | null
  created_at: string
  updated_at: string
}

export interface Admin {
  id: number
  name: string
  email: string
  password_hash: string
  created_at: string
  updated_at: string
}

export interface TransparencyConfig {
  id: number
  category: string
  percentage: number
  description: string
  sort_order: number
  updated_at: string
}

// Types for joined queries
export interface DonorWithPledges extends Donor {
  pledges: Pledge[]
}

export interface DonationWithDonor extends Donation {
  donors: { name: string }
}

export interface PledgeWithDonor extends Pledge {
  donors: { name: string }
}

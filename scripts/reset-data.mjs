import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load .env manually
const envFile = readFileSync('.env', 'utf-8')
for (const line of envFile.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx)
  const value = trimmed.slice(eqIdx + 1)
  if (!process.env[key]) process.env[key] = value
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Insert rows into a table. Fails clearly if columns are missing.
async function insertRows(client, table, rows, selectCols) {
  const { data, error } = await client
    .from(table)
    .insert(rows)
    .select(selectCols)

  if (error) {
    const isMissingCol = error.code === 'PGRST204' || error.code === '42703'
    if (isMissingCol) {
      console.error(`\n  ERROR: Missing column in '${table}': ${error.message}`)
      console.error(`\n  Run the migration SQL in your Supabase SQL Editor:`)
      console.error(`    ALTER TABLE pledges ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'INDIVIDUAL';`)
      console.error(`    ALTER TABLE pledges ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'MANUAL';`)
      console.error(`    ALTER TABLE pledges ADD COLUMN IF NOT EXISTS missed_count INTEGER NOT NULL DEFAULT 0;`)
      console.error(`    ALTER TABLE pledges ADD COLUMN IF NOT EXISTS grace_deadline TIMESTAMPTZ;`)
      console.error(`    ALTER TABLE transparency_config ADD COLUMN IF NOT EXISTS target NUMERIC(10,2) NOT NULL DEFAULT 0;`)
      console.error()
    } else {
      console.error(`  Insert into ${table} failed:`, error)
    }
    return null
  }
  return data
}

async function reset() {
  console.log('Resetting database...\n')

  // 1. Delete in foreign-key order
  console.log('  Clearing donations...')
  await supabase.from('donations').delete().neq('id', 0)

  console.log('  Clearing pledges...')
  await supabase.from('pledges').delete().neq('id', 0)

  console.log('  Clearing donors...')
  await supabase.from('donors').delete().neq('id', 0)

  console.log('  Clearing transparency config...')
  await supabase.from('transparency_config').delete().neq('id', 0)

  // 2. Re-seed transparency config (7 Ar-Raudhah-specific categories)
  console.log('  Seeding transparency config...')
  let configRows = [
    { category: 'Khidmat Jenazah', percentage: 30, description: 'Funeral services, burial assistance, and bereavement support for the community', sort_order: 1, target: 21600 },
    { category: 'Zakat Family Support', percentage: 20, description: 'Financial assistance, groceries, and essential aid for families in need', sort_order: 2, target: 14400 },
    { category: 'Islamic Education', percentage: 15, description: 'Subsidised Quran classes, Islamic studies, and enrichment programmes for all ages', sort_order: 3, target: 10800 },
    { category: 'Youth Programmes', percentage: 12, description: 'aLIVE, Al-Fateh, sports, mentorship, and leadership development for youth', sort_order: 4, target: 8640 },
    { category: 'Community Outreach', percentage: 10, description: 'ARRPromise, interfaith dialogues, new Muslim support, and public education', sort_order: 5, target: 7200 },
    { category: 'Mosque Operations', percentage: 8, description: 'Utilities, maintenance, cleaning, and daily upkeep of the mosque', sort_order: 6, target: 5760 },
    { category: 'Community Events', percentage: 5, description: 'Hijrah Walk, Ramadan bazaar, Hari Raya celebrations, and festive programmes', sort_order: 7, target: 3600 },
  ]

  const configs = await insertRows(supabase, 'transparency_config', configRows, 'id')
  if (!configs || configs.length === 0) {
    console.error('Failed to seed transparency config')
    process.exit(1)
  }

  // 3. Re-seed members
  console.log('  Seeding members...')
  const { data: donors } = await supabase
    .from('donors')
    .insert([
      { name: 'Ahmad bin Ibrahim', phone: '+6591234567', email: 'ahmad@example.com', reminder_channel: 'WHATSAPP' },
      { name: 'Siti Nurhaliza', phone: '+6598765432', email: 'siti@example.com', reminder_channel: 'EMAIL' },
      { name: 'Muhammad Farhan', phone: '+6587654321', reminder_channel: 'SMS' },
    ])
    .select('id, name')
    .order('id')

  if (!donors || donors.length < 3) {
    console.error('Failed to create members')
    process.exit(1)
  }

  // 4. Re-seed pledges
  console.log('  Seeding pledges...')
  const now = new Date()
  const grace30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const grace12 = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString()

  const pledgeRows = [
    { donor_id: donors[0].id, amount: 20, frequency: 'MONTHLY', reminder_day: 1, status: 'ACTIVE', tier: 'FAMILY', missed_count: 0 },
    { donor_id: donors[1].id, amount: 5, frequency: 'MONTHLY', reminder_day: 1, status: 'ACTIVE', tier: 'INDIVIDUAL', missed_count: 2, grace_deadline: grace30 },
    { donor_id: donors[2].id, amount: 30, frequency: 'MONTHLY', reminder_day: 1, status: 'ACTIVE', tier: 'CUSTOM', missed_count: 3, grace_deadline: grace12 },
  ]

  const pledges = await insertRows(supabase, 'pledges', pledgeRows, 'id, donor_id, amount')

  if (!pledges || pledges.length < 3) {
    console.error('Failed to create pledges')
    process.exit(1)
  }

  // 5. Re-seed donations (last 3 months)
  console.log('  Seeding donations...')
  const months = []
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const currentMonth = months[months.length - 1]

  const donations = []
  for (const pledge of pledges) {
    const donorIdx = donors.findIndex((d) => d.id === pledge.donor_id)
    for (const m of months) {
      const isCurrent = m === currentMonth
      donations.push({
        pledge_id: pledge.id,
        donor_id: pledge.donor_id,
        amount: pledge.amount,
        reference: `SP-${String(donorIdx + 1).padStart(4, '0')}-${m.replace('-', '')}`,
        cycle_month: m,
        status: isCurrent ? 'PENDING' : 'RECEIVED',
        received_at: isCurrent ? null : now.toISOString(),
      })
    }
  }

  await supabase.from('donations').insert(donations)

  console.log('\nReset complete!')
  console.log(`  ${(configs ?? []).length} transparency categories`)
  console.log(`  ${donors.length} members`)
  console.log(`  ${pledges.length} pledges (1 healthy, 2 at-risk)`)
  console.log(`  ${donations.length} donations`)
}

reset().catch((err) => {
  console.error('Reset failed:', err)
  process.exit(1)
})

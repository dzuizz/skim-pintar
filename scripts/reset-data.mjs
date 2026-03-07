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

  // 2. Re-seed transparency config
  console.log('  Seeding transparency config...')
  const { data: configs } = await supabase
    .from('transparency_config')
    .insert([
      { category: 'Mosque Operations & Maintenance', percentage: 35, description: 'Daily upkeep, utilities, and facility maintenance of the mosque', sort_order: 1, target: 24000 },
      { category: 'Religious Education', percentage: 25, description: 'Madrasah programmes, Quran classes, and Islamic studies', sort_order: 2, target: 18000 },
      { category: 'Community Welfare & Assistance', percentage: 20, description: 'Financial aid, food distribution, and family support services', sort_order: 3, target: 12000 },
      { category: 'Youth Development', percentage: 10, description: 'Mentorship programmes, sports, and leadership development for youth', sort_order: 4, target: 9600 },
      { category: "Da'wah & Outreach", percentage: 10, description: 'Community events, interfaith dialogues, and public education', sort_order: 5, target: 6000 },
    ])
    .select('id')
    .order('sort_order')

  const configIds = (configs ?? []).map((c) => c.id)

  // 3. Re-seed donors
  console.log('  Seeding donors...')
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
    console.error('Failed to create donors')
    process.exit(1)
  }

  // 4. Re-seed pledges
  console.log('  Seeding pledges...')
  const now = new Date()
  const grace30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const grace12 = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString()

  const { data: pledges } = await supabase
    .from('pledges')
    .insert([
      { donor_id: donors[0].id, amount: 50, frequency: 'MONTHLY', reminder_day: 1, status: 'ACTIVE', missed_count: 0, initiative_priorities: configIds.slice(0, 3) },
      { donor_id: donors[1].id, amount: 100, frequency: 'MONTHLY', reminder_day: 1, status: 'ACTIVE', missed_count: 2, grace_deadline: grace30, initiative_priorities: configIds.slice(1, 4) },
      { donor_id: donors[2].id, amount: 30, frequency: 'MONTHLY', reminder_day: 1, status: 'ACTIVE', missed_count: 3, grace_deadline: grace12, initiative_priorities: configIds },
    ])
    .select('id, donor_id, amount')
    .order('id')

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
  console.log(`  ${donors.length} donors`)
  console.log(`  ${pledges.length} pledges (1 healthy, 2 at-risk)`)
  console.log(`  ${donations.length} donations`)
}

reset().catch((err) => {
  console.error('Reset failed:', err)
  process.exit(1)
})

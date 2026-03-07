import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.resolve(__dirname, 'dev.db')

const { PrismaClient } = await import('../src/generated/prisma/client.js')
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Seed TransparencyConfig
  const categories = [
    { category: 'Mosque Operations & Maintenance', percentage: 35, description: 'Daily upkeep, utilities, and facility maintenance of the mosque', sortOrder: 1 },
    { category: 'Religious Education', percentage: 25, description: 'Madrasah programmes, Quran classes, and Islamic studies', sortOrder: 2 },
    { category: 'Community Welfare & Assistance', percentage: 20, description: 'Financial aid, food distribution, and family support services', sortOrder: 3 },
    { category: 'Youth Development', percentage: 10, description: 'Mentorship programmes, sports, and leadership development for youth', sortOrder: 4 },
    { category: "Da'wah & Outreach", percentage: 10, description: 'Community events, interfaith dialogues, and public education', sortOrder: 5 },
  ]

  for (const cat of categories) {
    await prisma.transparencyConfig.upsert({
      where: { id: cat.sortOrder },
      update: cat,
      create: cat,
    })
  }

  // Seed Admin
  const passwordHash = await bcrypt.hash('admin123', 10)
  await prisma.admin.upsert({
    where: { email: 'admin@arraudhah.org.sg' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@arraudhah.org.sg',
      passwordHash,
    },
  })

  // Seed sample donors
  const donors = [
    { name: 'Ahmad bin Ibrahim', phone: '+6591234567', email: 'ahmad@example.com', reminderChannel: 'WHATSAPP' },
    { name: 'Siti Nurhaliza', phone: '+6598765432', email: 'siti@example.com', reminderChannel: 'EMAIL' },
    { name: 'Muhammad Farhan', phone: '+6587654321', reminderChannel: 'SMS' },
  ]

  for (const donorData of donors) {
    const donor = await prisma.donor.upsert({
      where: { phone: donorData.phone },
      update: {},
      create: donorData,
    })

    // Create active pledge
    const existingPledge = await prisma.pledge.findFirst({ where: { donorId: donor.id, status: 'ACTIVE' } })
    if (!existingPledge) {
      const amounts = [50, 100, 30]
      const pledge = await prisma.pledge.create({
        data: {
          donorId: donor.id,
          amount: amounts[donors.indexOf(donorData)],
          frequency: 'MONTHLY',
          reminderDay: 1,
          status: 'ACTIVE',
        },
      })

      // Create sample donation records
      const months = ['2026-01', '2026-02', '2026-03']
      const statuses = ['RECEIVED', 'RECEIVED', 'PENDING']
      for (let i = 0; i < months.length; i++) {
        const ref = `SP-${String(donor.id).padStart(4, '0')}-${months[i].replace('-', '')}`
        await prisma.donation.create({
          data: {
            pledgeId: pledge.id,
            donorId: donor.id,
            amount: pledge.amount,
            reference: ref,
            cycleMonth: months[i],
            status: statuses[i],
            receivedAt: statuses[i] === 'RECEIVED' ? new Date() : null,
          },
        })
      }
    }
  }

  console.log('Seed completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

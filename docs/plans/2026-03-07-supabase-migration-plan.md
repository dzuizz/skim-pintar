# Supabase Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate Skim Pintar from Prisma/SQLite to Supabase PostgreSQL with Supabase JS client while keeping all existing UI and NextAuth unchanged.

**Architecture:** Replace Prisma client with @supabase/supabase-js. Create PostgreSQL tables via SQL migration. Rewrite all server-side DB queries (API routes + server components) to use Supabase client. No UI component changes.

**Tech Stack:** @supabase/supabase-js, PostgreSQL (Supabase-hosted), NextAuth.js (unchanged), Next.js App Router

---

### Task 1: Update Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Remove Prisma dependencies and add Supabase**

```bash
npm uninstall prisma @prisma/client @prisma/adapter-better-sqlite3 better-sqlite3 dotenv
npm uninstall -D @types/better-sqlite3 tsx
npm install @supabase/supabase-js
```

**Step 2: Remove the prisma seed config from package.json**

Remove this block from package.json:
```json
"prisma": {
  "seed": "npx tsx prisma/seed.mts"
}
```

**Step 3: Verify the app still compiles (it won't yet — that's expected)**

This task just updates dependencies. The build will break until we replace db.ts and all Prisma imports.

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: swap Prisma dependencies for Supabase JS client"
```

---

### Task 2: SQL Migration and Seed Script

**Files:**
- Create: `supabase/schema.sql`
- Create: `supabase/seed.sql`
- Delete: `prisma/` directory (schema.prisma, seed.mts, migrations/, config)
- Delete: `src/generated/` directory (Prisma generated client)

**Step 1: Create supabase/schema.sql**

```sql
-- Enums
CREATE TYPE reminder_channel_type AS ENUM ('WHATSAPP', 'SMS', 'EMAIL');
CREATE TYPE frequency_type AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');
CREATE TYPE pledge_status_type AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');
CREATE TYPE donation_status_type AS ENUM ('PENDING', 'RECEIVED', 'MISSED');

-- Donors
CREATE TABLE donors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  nric_last4 TEXT,
  reminder_channel reminder_channel_type NOT NULL DEFAULT 'WHATSAPP',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pledges
CREATE TABLE pledges (
  id SERIAL PRIMARY KEY,
  donor_id INTEGER NOT NULL REFERENCES donors(id),
  amount NUMERIC(10,2) NOT NULL,
  frequency frequency_type NOT NULL DEFAULT 'MONTHLY',
  reminder_day INTEGER NOT NULL DEFAULT 1 CHECK (reminder_day BETWEEN 1 AND 28),
  status pledge_status_type NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Donations
CREATE TABLE donations (
  id SERIAL PRIMARY KEY,
  pledge_id INTEGER NOT NULL REFERENCES pledges(id),
  donor_id INTEGER NOT NULL REFERENCES donors(id),
  amount NUMERIC(10,2) NOT NULL,
  reference TEXT NOT NULL,
  cycle_month TEXT NOT NULL,
  status donation_status_type NOT NULL DEFAULT 'PENDING',
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admins
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transparency Config
CREATE TABLE transparency_config (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  percentage INTEGER NOT NULL CHECK (percentage BETWEEN 0 AND 100),
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pledges_donor_id ON pledges(donor_id);
CREATE INDEX idx_pledges_status ON pledges(status);
CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_donations_pledge_id ON donations(pledge_id);
CREATE INDEX idx_donations_cycle_month ON donations(cycle_month);
CREATE INDEX idx_donations_status ON donations(status);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER donors_updated_at BEFORE UPDATE ON donors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER pledges_updated_at BEFORE UPDATE ON pledges FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER donations_updated_at BEFORE UPDATE ON donations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER transparency_config_updated_at BEFORE UPDATE ON transparency_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Step 2: Create supabase/seed.sql**

```sql
-- Seed transparency config
INSERT INTO transparency_config (category, percentage, description, sort_order) VALUES
  ('Mosque Operations & Maintenance', 35, 'Daily upkeep, utilities, and facility maintenance of the mosque', 1),
  ('Religious Education', 25, 'Madrasah programmes, Quran classes, and Islamic studies', 2),
  ('Community Welfare & Assistance', 20, 'Financial aid, food distribution, and family support services', 3),
  ('Youth Development', 10, 'Mentorship programmes, sports, and leadership development for youth', 4),
  ('Da''wah & Outreach', 10, 'Community events, interfaith dialogues, and public education', 5)
ON CONFLICT DO NOTHING;

-- Seed admin (password: admin123, bcrypt hash)
INSERT INTO admins (name, email, password_hash) VALUES
  ('Admin', 'admin@arraudhah.org.sg', '$2a$10$rQEY0tEMm9UnjeJGNjFZ4OG1GPlVbILCqYvlstAfly2Re7rSTxyNy')
ON CONFLICT (email) DO NOTHING;

-- Seed sample donors
INSERT INTO donors (name, phone, email, reminder_channel) VALUES
  ('Ahmad bin Ibrahim', '+6591234567', 'ahmad@example.com', 'WHATSAPP'),
  ('Siti Nurhaliza', '+6598765432', 'siti@example.com', 'EMAIL'),
  ('Muhammad Farhan', '+6587654321', NULL, 'SMS')
ON CONFLICT (phone) DO NOTHING;

-- Seed pledges (for the 3 donors above)
INSERT INTO pledges (donor_id, amount, frequency, reminder_day, status) VALUES
  (1, 50.00, 'MONTHLY', 1, 'ACTIVE'),
  (2, 100.00, 'MONTHLY', 1, 'ACTIVE'),
  (3, 30.00, 'MONTHLY', 1, 'ACTIVE')
ON CONFLICT DO NOTHING;

-- Seed sample donations
INSERT INTO donations (pledge_id, donor_id, amount, reference, cycle_month, status, received_at) VALUES
  (1, 1, 50.00, 'SP-0001-202601', '2026-01', 'RECEIVED', NOW()),
  (1, 1, 50.00, 'SP-0001-202602', '2026-02', 'RECEIVED', NOW()),
  (1, 1, 50.00, 'SP-0001-202603', '2026-03', 'PENDING', NULL),
  (2, 2, 100.00, 'SP-0002-202601', '2026-01', 'RECEIVED', NOW()),
  (2, 2, 100.00, 'SP-0002-202602', '2026-02', 'RECEIVED', NOW()),
  (2, 2, 100.00, 'SP-0002-202603', '2026-03', 'PENDING', NULL),
  (3, 3, 30.00, 'SP-0003-202601', '2026-01', 'RECEIVED', NOW()),
  (3, 3, 30.00, 'SP-0003-202602', '2026-02', 'RECEIVED', NOW()),
  (3, 3, 30.00, 'SP-0003-202603', '2026-03', 'PENDING', NULL)
ON CONFLICT DO NOTHING;
```

Note: The bcrypt hash above is for "admin123". Generate a fresh one using: `node -e "require('bcryptjs').hash('admin123', 10).then(console.log)"`

**Step 3: Delete the prisma/ directory and src/generated/ directory**

```bash
rm -rf prisma/ src/generated/ prisma.config.ts
```

**Step 4: Commit**

```bash
git add supabase/ -A
git commit -m "feat: add Supabase SQL schema and seed, remove Prisma"
```

---

### Task 3: Supabase Client and Types

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/types.ts`
- Delete: `src/lib/db.ts`
- Modify: `.env.example`
- Modify: `.gitignore`

**Step 1: Create src/lib/supabase.ts**

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
```

**Step 2: Create src/lib/types.ts**

Define TypeScript types matching the database tables (since we no longer have Prisma-generated types):

```ts
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
```

**Step 3: Delete src/lib/db.ts**

```bash
rm src/lib/db.ts
```

**Step 4: Update .env.example**

Replace DATABASE_URL with Supabase vars:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

**Step 5: Update .env with actual Supabase credentials**

The user will need to create a Supabase project and paste their credentials. For now, use placeholder values in .env.

**Step 6: Commit**

```bash
git add src/lib/supabase.ts src/lib/types.ts .env.example -A
git commit -m "feat: add Supabase client, types, and remove Prisma db.ts"
```

---

### Task 4: Migrate Auth

**Files:**
- Modify: `src/lib/auth.ts`

**Step 1: Rewrite auth.ts to use Supabase**

Replace `import { prisma } from './db'` with `import { supabase } from './supabase'`.

Change the `authorize` function:
- Before: `prisma.admin.findUnique({ where: { email } })`
- After: `supabase.from('admins').select('*').eq('email', email).single()`

The admin row returns `password_hash` (snake_case) instead of `passwordHash`.

Full rewrite:

```ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabase } from './supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const { data: admin, error } = await supabase
          .from('admins')
          .select('*')
          .eq('email', credentials.email)
          .single()

        if (error || !admin) return null

        const isValid = await bcrypt.compare(credentials.password, admin.password_hash)
        if (!isValid) return null

        return {
          id: String(admin.id),
          name: admin.name,
          email: admin.email,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
```

**Step 2: Commit**

```bash
git add src/lib/auth.ts
git commit -m "refactor: migrate auth to use Supabase client"
```

---

### Task 5: Migrate Landing Page and Transparency API

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/api/transparency/route.ts`

**Step 1: Rewrite src/app/page.tsx**

Replace:
```ts
import { prisma } from '@/lib/db'
// ...
const transparencyData = await prisma.transparencyConfig.findMany({
  orderBy: { sortOrder: 'asc' },
})
```

With:
```ts
import { supabase } from '@/lib/supabase'
// ...
const { data: transparencyData } = await supabase
  .from('transparency_config')
  .select('category, percentage, description')
  .order('sort_order', { ascending: true })

const categories = (transparencyData ?? []).map((t) => ({
  category: t.category,
  percentage: t.percentage,
  description: t.description,
}))
```

**Step 2: Rewrite src/app/api/transparency/route.ts**

GET handler:
```ts
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('transparency_config')
    .select('id, category, percentage, description, sort_order')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

PUT handler — replace the `prisma.$transaction` with Supabase operations:
```ts
// Delete all existing
await supabase.from('transparency_config').delete().neq('id', 0)

// Insert new ones
const { data: updated, error: insertError } = await supabase
  .from('transparency_config')
  .insert(categories.map((cat, i) => ({
    category: cat.category.trim(),
    percentage: cat.percentage,
    description: cat.description.trim(),
    sort_order: cat.sortOrder ?? i,
  })))
  .select()
```

Note: Supabase doesn't have client-side transactions. For this use case (delete all + insert all in transparency config), the risk of partial failure is acceptable since it's a rare admin operation.

**Step 3: Commit**

```bash
git add src/app/page.tsx src/app/api/transparency/route.ts
git commit -m "refactor: migrate landing page and transparency API to Supabase"
```

---

### Task 6: Migrate Pledge API

**Files:**
- Modify: `src/app/api/pledges/route.ts`
- Modify: `src/app/api/pledges/[id]/route.ts`

**Step 1: Rewrite POST /api/pledges**

Key changes:
- `prisma.donor.upsert(...)` → Supabase: try select by phone, then update or insert
- `prisma.pledge.findFirst(...)` → `supabase.from('pledges').select().eq('donor_id', ...).eq('status', 'ACTIVE').maybeSingle()`
- `prisma.pledge.create(...)` → `supabase.from('pledges').insert(...).select().single()`
- `prisma.donation.create(...)` → `supabase.from('donations').insert(...)`

Column name mappings: `donorId` → `donor_id`, `pledgeId` → `pledge_id`, `cycleMonth` → `cycle_month`, `reminderDay` → `reminder_day`, `reminderChannel` → `reminder_channel`, `nricLast4` → `nric_last4`

**Step 2: Rewrite PATCH /api/pledges/[id]**

- `prisma.pledge.findUnique(...)` → `supabase.from('pledges').select().eq('id', ...).single()`
- `prisma.pledge.update(...)` → `supabase.from('pledges').update({ status }).eq('id', ...).select().single()`

**Step 3: Commit**

```bash
git add src/app/api/pledges/
git commit -m "refactor: migrate pledge API routes to Supabase"
```

---

### Task 7: Migrate Donor APIs

**Files:**
- Modify: `src/app/api/donors/route.ts`
- Modify: `src/app/api/donors/lookup/route.ts`

**Step 1: Rewrite GET /api/donors**

The Prisma query with `include: { pledges }` becomes a Supabase query with embedded select:
```ts
const { data: donors } = await supabase
  .from('donors')
  .select('*, pledges(*)')
  .order('created_at', { ascending: false })
```

For search filtering, use `.or()` and `.ilike()`:
```ts
query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
```

For status filtering, the Prisma `where: { pledges: { some: { status } } }` pattern doesn't have a direct Supabase equivalent. Instead: query all donors with pledges, then filter in JS. Or use an RPC function. Simplest: fetch donors with pledges and filter client-side.

**Step 2: Rewrite POST /api/donors/lookup**

- `prisma.donor.findUnique({ where: { phone } })` → `supabase.from('donors').select().eq('phone', phone).single()`
- `prisma.pledge.findFirst(...)` → `supabase.from('pledges').select().eq('donor_id', ...).order('created_at', { ascending: false }).limit(1).maybeSingle()`
- `prisma.donation.findMany(...)` → `supabase.from('donations').select().eq('donor_id', ...).order('cycle_month', { ascending: false })`
- `prisma.transparencyConfig.findMany(...)` → `supabase.from('transparency_config').select().order('sort_order')`

**Step 3: Commit**

```bash
git add src/app/api/donors/
git commit -m "refactor: migrate donor API routes to Supabase"
```

---

### Task 8: Migrate Donation APIs

**Files:**
- Modify: `src/app/api/donations/route.ts`
- Modify: `src/app/api/donations/[id]/route.ts`

**Step 1: Rewrite GET /api/donations**

```ts
const { data: donations } = await supabase
  .from('donations')
  .select('*, donors(name)')
  .eq('cycle_month', month)
  .order('created_at', { ascending: false })
```

Sort by status in JS after fetching (same pattern as before).

**Step 2: Rewrite PATCH /api/donations/[id]**

- `prisma.donation.findUnique(...)` → `supabase.from('donations').select().eq('id', ...).single()`
- `prisma.donation.update(...)` → `supabase.from('donations').update(updateData).eq('id', ...).select().single()`

Column mapping: `receivedAt` → `received_at`

**Step 3: Commit**

```bash
git add src/app/api/donations/
git commit -m "refactor: migrate donation API routes to Supabase"
```

---

### Task 9: Migrate Reconcile and Admin APIs

**Files:**
- Modify: `src/app/api/reconcile/route.ts`
- Modify: `src/app/api/reconcile/apply/route.ts`
- Modify: `src/app/api/admin/route.ts`

**Step 1: Rewrite POST /api/reconcile**

```ts
const { data: pendingDonations } = await supabase
  .from('donations')
  .select('id, reference, amount, donors(name)')
  .eq('cycle_month', month)
  .eq('status', 'PENDING')
```

Map `donors.name` → `donorName` for the matching function.

**Step 2: Rewrite POST /api/reconcile/apply**

```ts
const { data, error } = await supabase
  .from('donations')
  .update({ status: 'RECEIVED', received_at: new Date().toISOString() })
  .in('id', matchedIds)
  .eq('status', 'PENDING')
  .select()
```

Return `{ updated: data?.length ?? 0, total: matchedIds.length }`.

**Step 3: Rewrite GET/POST /api/admin**

GET:
```ts
const { data: admins } = await supabase
  .from('admins')
  .select('id, name, email, created_at')
  .order('created_at', { ascending: false })
```

POST — check existing:
```ts
const { data: existing } = await supabase
  .from('admins')
  .select('id')
  .eq('email', email.trim().toLowerCase())
  .maybeSingle()
```

Create:
```ts
const { data: admin } = await supabase
  .from('admins')
  .insert({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password_hash: passwordHash,
  })
  .select('id, name, email, created_at')
  .single()
```

**Step 4: Commit**

```bash
git add src/app/api/reconcile/ src/app/api/admin/
git commit -m "refactor: migrate reconcile and admin APIs to Supabase"
```

---

### Task 10: Migrate Server Components (Admin Pages)

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/donors/page.tsx`
- Modify: `src/app/admin/donors/[id]/page.tsx`
- Modify: `src/app/pledge/success/page.tsx`

**Step 1: Rewrite admin dashboard (src/app/admin/page.tsx)**

Replace all Prisma queries:
- Active donors count: `supabase.from('donors').select('id, pledges!inner(status)').eq('pledges.status', 'ACTIVE')` — use `!inner` for inner join, then count result rows
- Active pledges sum: `supabase.from('pledges').select('amount').eq('status', 'ACTIVE')`
- Current month donations: `supabase.from('donations').select('status, amount').eq('cycle_month', currentMonth)`
- Recent pledges: `supabase.from('pledges').select('*, donors(name)').order('created_at', { ascending: false }).limit(10)`
- Recent donations: `supabase.from('donations').select('*, donors(name)').eq('status', 'RECEIVED').order('received_at', { ascending: false }).limit(10)`

Note: Supabase returns dates as ISO strings, not Date objects. The ActivityList `time` field needs to accept strings and convert: `new Date(item.time)`.

**Step 2: Rewrite admin donors list (src/app/admin/donors/page.tsx)**

```ts
let query = supabase
  .from('donors')
  .select('*, pledges(*)')
  .order('created_at', { ascending: false })

if (search) {
  query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
}
```

For status filter, filter in JS after fetch:
```ts
let donors = data ?? []
if (status) {
  donors = donors.filter(d => d.pledges?.some(p => p.status === status))
}
```

Note: Column names in the response are now snake_case (e.g., `donor.nric_last4` instead of `donor.nricLast4`, `pledge.reminder_day` instead of `pledge.reminderDay`). Update all template references.

**Step 3: Rewrite admin donor detail (src/app/admin/donors/[id]/page.tsx)**

```ts
const { data: donor } = await supabase
  .from('donors')
  .select('*, pledges(*), donations(*, pledges(amount, frequency))')
  .eq('id', donorId)
  .single()
```

Update all field references to snake_case:
- `donor.nricLast4` → `donor.nric_last4`
- `donor.reminderChannel` → `donor.reminder_channel`
- `donor.createdAt` → `donor.created_at`
- `pledge.donorId` → `pledge.donor_id`
- `pledge.reminderDay` → `pledge.reminder_day`
- `donation.cycleMonth` → `donation.cycle_month`
- `donation.receivedAt` → `donation.received_at`

**Step 4: Rewrite pledge success page (src/app/pledge/success/page.tsx)**

```ts
const { data: donor } = await supabase.from('donors').select().eq('id', donorId).single()
const { data: pledge } = await supabase.from('pledges').select().eq('id', pledgeId).single()
const { data: pendingDonation } = await supabase
  .from('donations')
  .select()
  .eq('pledge_id', pledge.id)
  .eq('status', 'PENDING')
  .order('cycle_month')
  .limit(1)
  .maybeSingle()
```

Update field references:
- `pledge.donorId` → `pledge.donor_id`
- `pledge.reminderDay` → `pledge.reminder_day`
- `donor.reminderChannel` → `donor.reminder_channel`

**Step 5: Commit**

```bash
git add src/app/admin/ src/app/pledge/success/
git commit -m "refactor: migrate admin pages and success page to Supabase"
```

---

### Task 11: Update Activity List Component for String Dates

**Files:**
- Modify: `src/components/admin/activity-list.tsx`

**Step 1: Update ActivityItem type**

Supabase returns dates as ISO strings, not Date objects. Update the `time` field:

```ts
// Before
time: Date

// After
time: Date | string
```

And in the relative time function, ensure you parse:
```ts
const date = typeof item.time === 'string' ? new Date(item.time) : item.time
```

**Step 2: Commit**

```bash
git add src/components/admin/activity-list.tsx
git commit -m "fix: handle string dates from Supabase in activity list"
```

---

### Task 12: Clean Up and Final Verification

**Step 1: Search for any remaining Prisma imports**

```bash
grep -r "prisma" src/ --include="*.ts" --include="*.tsx" -l
grep -r "@/lib/db" src/ --include="*.ts" --include="*.tsx" -l
grep -r "from.*db" src/lib/ --include="*.ts" -l
```

Fix any remaining references.

**Step 2: Search for camelCase column references that should be snake_case**

Common ones to check:
- `donorId` should be `donor_id` in Supabase queries
- `pledgeId` → `pledge_id`
- `cycleMonth` → `cycle_month`
- `reminderDay` → `reminder_day`
- `reminderChannel` → `reminder_channel`
- `nricLast4` → `nric_last4`
- `receivedAt` → `received_at`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `sortOrder` → `sort_order`
- `passwordHash` → `password_hash`

Note: These only need to change in DB queries and when reading DB response fields. UI component props can stay camelCase — just map at the query boundary.

**Step 3: Run tests**

```bash
npx jest --verbose
```

PayNow QR and reconcile tests should still pass (they don't touch the database).

**Step 4: Run linter**

```bash
npm run lint
```

**Step 5: Build**

```bash
npm run build
```

Fix any build errors.

**Step 6: Remove old files**

```bash
rm -f prisma.config.ts
```

Verify `.gitignore` no longer has SQLite-specific entries (*.db lines can stay, they're harmless).

**Step 7: Final commit**

```bash
git add -A
git commit -m "chore: complete Supabase migration, clean up Prisma artifacts"
```

# Skim Pintar 2.0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a PayNow-based recurring donation web app for Masjid Ar-Raudhah with donor pledge flow, QR generation, transparency breakdown, donor dashboard, and admin dashboard.

**Architecture:** Next.js App Router monolith with Prisma + SQLite. Server Actions for mutations. NextAuth for admin auth. PayNow QR codes generated via EMVCo string format.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, Prisma, SQLite, NextAuth.js, qrcode npm package

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Step 1: Create Next.js app**

Run:
```bash
cd /Users/dzuizz/Developer/ada/skim-pintar
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

**Step 2: Install dependencies**

Run:
```bash
npm install prisma @prisma/client next-auth@4 bcryptjs qrcode
npm install -D @types/bcryptjs @types/qrcode
```

**Step 3: Verify dev server starts**

Run: `npm run dev` (check it starts without errors, then stop)

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with dependencies"
```

---

### Task 2: Configure Tailwind Theme

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Step 1: Update tailwind.config.ts with Ar-Raudhah theme**

Add custom colors to the theme extend:
```ts
colors: {
  primary: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#43A047',
    600: '#2E7D32',
    700: '#1B5E20',
    800: '#145218',
    900: '#0D3B10',
  },
  gold: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#D4A843',
    600: '#C49A38',
    700: '#A67C28',
    800: '#8B6914',
    900: '#6D5010',
  },
  cream: '#FDF8F0',
  warmWhite: '#FAFAF5',
}
```

**Step 2: Update globals.css**

Set base styles: warm off-white body background, default font smoothing, Islamic geometric pattern CSS for decorative sections.

**Step 3: Update layout.tsx**

Configure Inter font via `next/font/google`. Set metadata title to "Skim Pintar | Masjid Ar-Raudhah". Apply font class to body.

**Step 4: Commit**

```bash
git add tailwind.config.ts src/app/globals.css src/app/layout.tsx
git commit -m "style: configure Ar-Raudhah theme with dark green and gold palette"
```

---

### Task 3: Prisma Schema and Seed

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Modify: `package.json` (add prisma seed script)
- Create: `src/lib/db.ts`

**Step 1: Initialize Prisma**

Run:
```bash
npx prisma init --datasource-provider sqlite
```

**Step 2: Write schema.prisma**

Define all 5 models (Donor, Pledge, Donation, Admin, TransparencyConfig) with enums for ReminderChannel, Frequency, PledgeStatus, DonationStatus. Use the exact fields from the design doc.

**Step 3: Write seed.ts**

Seed data:
- 5 TransparencyConfig rows:
  1. Mosque Operations & Maintenance — 35%
  2. Religious Education — 25%
  3. Community Welfare & Assistance — 20%
  4. Youth Development — 10%
  5. Da'wah & Outreach — 10%
- 1 Admin: name "Admin", email "admin@arraudhah.org.sg", password "admin123" (bcrypt hashed)
- 3 sample Donors with active Pledges
- A few sample Donation records

**Step 4: Create src/lib/db.ts**

Standard Prisma client singleton pattern for Next.js (prevent multiple instances in dev).

**Step 5: Run migration and seed**

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

**Step 6: Verify with Prisma Studio**

Run: `npx prisma studio` — check all tables have data.

**Step 7: Commit**

```bash
git add prisma/ src/lib/db.ts package.json
git commit -m "feat: add Prisma schema, migrations, and seed data"
```

---

### Task 4: PayNow QR Utility

**Files:**
- Create: `src/lib/paynow-qr.ts`
- Create: `src/lib/__tests__/paynow-qr.test.ts`

**Step 1: Write failing tests**

Test cases:
1. `generatePayNowString` returns valid EMVCo string with UEN, amount, reference
2. String contains correct merchant account info block
3. String ends with valid CRC-16 checksum
4. `generateReference` returns format `SP-XXXX-YYYYMM`

```ts
import { generatePayNowString, generateReference } from '../paynow-qr'

describe('generateReference', () => {
  it('formats as SP-XXXX-YYYYMM', () => {
    const ref = generateReference(1, '2026-03')
    expect(ref).toBe('SP-0001-202603')
  })

  it('pads donor ID to 4 digits', () => {
    const ref = generateReference(42, '2026-12')
    expect(ref).toBe('SP-0042-202612')
  })
})

describe('generatePayNowString', () => {
  it('contains UEN proxy type', () => {
    const str = generatePayNowString({ amount: 50, reference: 'SP-0001-202603' })
    expect(str).toContain('T08CC4018F')
  })

  it('contains the amount', () => {
    const str = generatePayNowString({ amount: 50, reference: 'SP-0001-202603' })
    expect(str).toContain('50.00')
  })

  it('ends with 4-char CRC', () => {
    const str = generatePayNowString({ amount: 50, reference: 'SP-0001-202603' })
    expect(str).toMatch(/[0-9A-F]{4}$/)
  })
})
```

**Step 2: Install Jest**

```bash
npm install -D jest ts-jest @types/jest
npx ts-jest config:init
```

Update `jest.config.js` to use `ts-jest` preset with `moduleNameMapper` for `@/*` alias.

**Step 3: Run tests — verify they fail**

```bash
npx jest src/lib/__tests__/paynow-qr.test.ts
```

**Step 4: Implement paynow-qr.ts**

Implement EMVCo QR string builder for PayNow:
- Point of Initiation: `010212` (dynamic QR)
- Merchant Account: Tag 26, subtags: `00` = `SG.PAYNOW`, `01` = `2` (UEN), `02` = UEN value, `03` = `1` (editable amount)
- Transaction Amount: Tag 54
- Merchant Name: Tag 59 = `MASJID AR-RAUDHAH`
- Country: Tag 58 = `SG`
- Currency: Tag 53 = `702` (SGD)
- Reference: Tag 62 subtag 01
- CRC: Tag 63, CRC-16/CCITT-FALSE checksum

Export `generatePayNowString(opts)` and `generateReference(donorId, cycleMonth)`.
Export `generateQRDataURL(opts)` that calls `qrcode.toDataURL()` with the PayNow string.

**Step 5: Run tests — verify they pass**

```bash
npx jest src/lib/__tests__/paynow-qr.test.ts
```

**Step 6: Commit**

```bash
git add src/lib/paynow-qr.ts src/lib/__tests__/ jest.config.js
git commit -m "feat: add PayNow QR code generation utility with tests"
```

---

### Task 5: Shared UI Components

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/select.tsx`
- Create: `src/components/ui/stepper.tsx`
- Create: `src/lib/utils.ts`

**Step 1: Create utils.ts**

Simple `cn()` helper using `clsx` + `tailwind-merge`:
```bash
npm install clsx tailwind-merge
```

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Step 2: Create Button component**

Variants: `primary` (dark green bg, white text), `secondary` (gold bg, dark text), `outline`, `ghost`. Sizes: `sm`, `md`, `lg`. Forward ref, accept all button props.

**Step 3: Create Card component**

`Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`. Warm white bg, rounded-xl, soft shadow.

**Step 4: Create Input component**

Styled text input with label prop, error state, helper text. Forward ref.

**Step 5: Create Badge component**

Variants for donation status: `received` (green), `pending` (gold), `missed` (red/muted).

**Step 6: Create Select component**

Styled native select with label.

**Step 7: Create Stepper component**

Horizontal step indicator for the 4-step pledge flow. Props: `steps: string[]`, `currentStep: number`. Active step in gold, completed in green, upcoming in grey.

**Step 8: Commit**

```bash
git add src/components/ui/ src/lib/utils.ts package.json
git commit -m "feat: add shared UI component library"
```

---

### Task 6: Landing Page

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/donor/transparency-preview.tsx`

**Step 1: Build the landing page**

Sections:
1. **Hero** — geometric pattern background, mosque name, tagline "Support Ar-Raudhah Every Month", subtitle about 2-minute setup, "Start My Pledge" CTA button linking to `/pledge`
2. **How It Works** — 3-step visual: Pledge, Pay, Track (icons + short descriptions)
3. **Impact** — Sample transparency breakdown using TransparencyPreview component (fetch from DB via server component)
4. **Footer** — Masjid Ar-Raudhah, address placeholder, links

**Step 2: Create TransparencyPreview component**

Props: `amount: number`, `categories: { category: string, percentage: number, description: string }[]`
Renders:
- "Where Your $X Could Go" heading
- Horizontal stacked bar with colored segments
- List of categories with percentage, dollar amount
- Disclaimer microcopy

**Step 3: Verify visually**

Run `npm run dev`, check landing page renders correctly on mobile and desktop.

**Step 4: Commit**

```bash
git add src/app/page.tsx src/components/donor/
git commit -m "feat: add landing page with hero, how-it-works, and transparency preview"
```

---

### Task 7: Pledge Registration Flow

**Files:**
- Create: `src/app/pledge/page.tsx`
- Create: `src/components/donor/pledge-form.tsx`
- Create: `src/components/donor/step-contact.tsx`
- Create: `src/components/donor/step-amount.tsx`
- Create: `src/components/donor/step-preview.tsx`
- Create: `src/components/donor/step-confirm.tsx`
- Create: `src/app/api/pledges/route.ts`

**Step 1: Create pledge page**

Client component with state machine for 4 steps. Uses Stepper component. Manages form data across steps.

**Step 2: Create StepContact**

Fields: name (required), phone (required, +65 format), email (optional), nricLast4 (optional), reminderChannel (radio: WhatsApp/SMS/Email). Validation before proceeding.

**Step 3: Create StepAmount**

Preset amount cards ($10, $30, $50, $100) with impact anchors + custom input. Frequency selector (Monthly default, Quarterly, Annual). Reminder day (1st, 15th, 25th). Each preset card shows short description.

**Step 4: Create StepPreview**

Shows TransparencyPreview for selected amount. Fetches categories from `/api/transparency`.

**Step 5: Create StepConfirm**

Summary card: name, amount, frequency, reminder prefs. Consent text. "Confirm My Pledge" button. Submits to POST `/api/pledges`.

**Step 6: Create API route POST /api/pledges**

- Validate input
- Create Donor (or find existing by phone)
- Create Pledge with ACTIVE status
- Generate first Donation record (PENDING) with reference
- Return donor ID and pledge ID

**Step 7: On success, redirect to `/pledge/success?donorId=X&pledgeId=Y`**

**Step 8: Commit**

```bash
git add src/app/pledge/ src/components/donor/ src/app/api/pledges/
git commit -m "feat: add multi-step pledge registration flow"
```

---

### Task 8: Pledge Success Page

**Files:**
- Create: `src/app/pledge/success/page.tsx`
- Create: `src/components/donor/qr-display.tsx`
- Create: `src/app/api/qr/route.ts`

**Step 1: Create QR API route**

GET `/api/qr?donorId=X&cycleMonth=YYYY-MM` — returns PayNow QR as base64 data URL using `generateQRDataURL`.

**Step 2: Create QRDisplay component**

Props: `donorId`, `amount`, `reference`, `qrDataUrl`. Shows:
- PayNow QR code image
- Reference code in large text
- Amount
- "Scan with your banking app" instruction

**Step 3: Create success page**

Server component that:
- Reads `donorId` and `pledgeId` from search params
- Fetches donor + pledge from DB
- Shows congratulations message with donor ID
- Shows QRDisplay for first donation
- Link to `/my` donor dashboard

**Step 4: Commit**

```bash
git add src/app/pledge/success/ src/components/donor/qr-display.tsx src/app/api/qr/
git commit -m "feat: add pledge success page with PayNow QR code"
```

---

### Task 9: Donor Dashboard

**Files:**
- Create: `src/app/my/page.tsx`
- Create: `src/components/donor/donor-login.tsx`
- Create: `src/components/donor/donor-dashboard.tsx`
- Create: `src/app/api/donors/lookup/route.ts`
- Create: `src/app/api/pledges/[id]/route.ts`

**Step 1: Create donor lookup API**

POST `/api/donors/lookup` with `{ phone, name }`. Returns donor with active pledge and donation history if match found. Returns 404 if no match.

**Step 2: Create DonorLogin component**

Simple form: phone + name fields. On submit, calls lookup API. If found, shows dashboard. If not, shows error.

**Step 3: Create DonorDashboard component**

Shows:
- Current pledge card (amount, frequency, status, reminder day)
- Giving history table (month, amount, reference, status badge)
- Cumulative total
- TransparencyPreview for their pledge amount
- "Pause Pledge" / "Cancel Pledge" buttons with confirmation

**Step 4: Create pause/cancel API**

PATCH `/api/pledges/[id]` with `{ status: "PAUSED" | "CANCELLED" }`.

**Step 5: Commit**

```bash
git add src/app/my/ src/components/donor/donor-login.tsx src/components/donor/donor-dashboard.tsx src/app/api/donors/ src/app/api/pledges/
git commit -m "feat: add donor dashboard with pledge management"
```

---

### Task 10: Admin Auth Setup

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/middleware.ts`
- Create: `.env.local.example`

**Step 1: Create auth config**

NextAuth with CredentialsProvider. Validate email + password against Admin table (bcrypt compare). JWT strategy.

**Step 2: Create NextAuth route handler**

Standard catch-all route exporting GET and POST.

**Step 3: Create middleware**

Protect all `/admin/*` routes (except `/admin/login`) — redirect to `/admin/login` if no session.

**Step 4: Create .env.local.example**

```
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

**Step 5: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/ src/middleware.ts .env.local.example
git commit -m "feat: add NextAuth admin authentication with middleware"
```

---

### Task 11: Admin Login Page

**Files:**
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/layout.tsx`

**Step 1: Create admin login page**

Email + password form. Uses `signIn("credentials")` from next-auth/react. On success, redirect to `/admin`. Error display for invalid credentials. Styled with Ar-Raudhah theme.

**Step 2: Create admin layout**

Sidebar navigation with links: Dashboard, Donors, Donations, Reconcile, Transparency, Settings. Top bar with mosque name and logout button. Content area. Dark green sidebar, gold accents.

**Step 3: Commit**

```bash
git add src/app/admin/login/ src/app/admin/layout.tsx
git commit -m "feat: add admin login page and sidebar layout"
```

---

### Task 12: Admin Dashboard Overview

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/components/admin/stats-cards.tsx`
- Create: `src/components/admin/recent-activity.tsx`

**Step 1: Create stats cards**

Server component querying DB for:
- Total active donors
- Total pledged per month (sum of active pledge amounts)
- This month's fulfilment rate (received / total pending+received)
- Total received this month

Display as 4 cards with icons.

**Step 2: Create recent activity**

Last 10 events: new pledges, received donations, paused/cancelled pledges. Simple list with timestamps.

**Step 3: Create dashboard page**

Compose stats + recent activity.

**Step 4: Commit**

```bash
git add src/app/admin/page.tsx src/components/admin/
git commit -m "feat: add admin dashboard overview with stats and activity"
```

---

### Task 13: Admin Donors Page

**Files:**
- Create: `src/app/admin/donors/page.tsx`
- Create: `src/app/admin/donors/[id]/page.tsx`
- Create: `src/components/admin/donor-table.tsx`
- Create: `src/components/admin/donor-detail.tsx`
- Create: `src/app/api/donors/route.ts`

**Step 1: Create donors API**

GET `/api/donors` — list all donors with their active pledge. Support query params: `search`, `status`.

**Step 2: Create donor table component**

Searchable table with columns: Name, Phone, Amount, Frequency, Status, Joined. Click row to navigate to detail.

**Step 3: Create donors list page**

Server component fetching donors. Search bar. Filter by status (All/Active/Paused/Cancelled).

**Step 4: Create donor detail page**

Show donor info, pledge details, full donation history, PayNow QR for current month. Actions: mark donation as received, pause/cancel pledge.

**Step 5: Create donations API for status update**

PATCH `/api/donations/[id]` — update status to RECEIVED with receivedAt timestamp.

**Step 6: Commit**

```bash
git add src/app/admin/donors/ src/components/admin/donor-table.tsx src/components/admin/donor-detail.tsx src/app/api/donors/
git commit -m "feat: add admin donors list and detail pages"
```

---

### Task 14: Admin Donations Tracking

**Files:**
- Create: `src/app/admin/donations/page.tsx`
- Create: `src/components/admin/donations-table.tsx`
- Create: `src/app/api/donations/route.ts`

**Step 1: Create donations API**

GET `/api/donations?month=2026-03` — list all donations for a given month with donor name and pledge info.

**Step 2: Create donations table**

Table with: Donor Name, Amount, Reference, Status (badge), Received At. Month selector dropdown. Bulk action: mark selected as received.

**Step 3: Create donations page**

Month picker (defaults to current month). Summary stats at top (X received, Y pending, Z missed). Table below.

**Step 4: Commit**

```bash
git add src/app/admin/donations/ src/components/admin/donations-table.tsx src/app/api/donations/
git commit -m "feat: add admin monthly donations tracking page"
```

---

### Task 15: Admin Reconciliation

**Files:**
- Create: `src/app/admin/reconcile/page.tsx`
- Create: `src/components/admin/reconcile-upload.tsx`
- Create: `src/components/admin/reconcile-results.tsx`
- Create: `src/app/api/reconcile/route.ts`
- Create: `src/lib/reconcile.ts`
- Create: `src/lib/__tests__/reconcile.test.ts`

**Step 1: Write failing tests for reconciliation logic**

```ts
import { matchPayments } from '../reconcile'

describe('matchPayments', () => {
  it('matches by exact reference code', () => {
    const bankRows = [{ reference: 'SP-0001-202603', amount: 50, date: '2026-03-01' }]
    const pendingDonations = [{ id: 1, reference: 'SP-0001-202603', amount: 50 }]
    const result = matchPayments(bankRows, pendingDonations)
    expect(result.matched).toHaveLength(1)
    expect(result.matched[0].donationId).toBe(1)
  })

  it('flags unmatched bank rows', () => {
    const bankRows = [{ reference: 'UNKNOWN', amount: 50, date: '2026-03-01' }]
    const pendingDonations: any[] = []
    const result = matchPayments(bankRows, pendingDonations)
    expect(result.unmatched).toHaveLength(1)
  })

  it('detects duplicate payments', () => {
    const bankRows = [
      { reference: 'SP-0001-202603', amount: 50, date: '2026-03-01' },
      { reference: 'SP-0001-202603', amount: 50, date: '2026-03-02' },
    ]
    const pendingDonations = [{ id: 1, reference: 'SP-0001-202603', amount: 50 }]
    const result = matchPayments(bankRows, pendingDonations)
    expect(result.duplicates).toHaveLength(1)
  })
})
```

**Step 2: Run tests — verify they fail**

**Step 3: Implement reconcile.ts**

`matchPayments(bankRows, pendingDonations)` returns `{ matched, unmatched, duplicates }`.

Parse CSV rows. Match by reference code. Flag duplicates. Flag amount mismatches.

**Step 4: Run tests — verify they pass**

**Step 5: Create reconcile API**

POST `/api/reconcile` — accepts CSV file upload, parses it, runs matching against pending donations for the detected month, returns results. POST `/api/reconcile/apply` — applies matched results (updates donation statuses to RECEIVED).

**Step 6: Create reconcile UI**

Upload area (drag & drop CSV). Results view: matched (green), unmatched (yellow), duplicates (red). "Apply Matches" button to confirm.

**Step 7: Commit**

```bash
git add src/app/admin/reconcile/ src/components/admin/reconcile-*.tsx src/app/api/reconcile/ src/lib/reconcile.ts src/lib/__tests__/reconcile.test.ts
git commit -m "feat: add admin CSV reconciliation with matching logic"
```

---

### Task 16: Admin Transparency Config

**Files:**
- Create: `src/app/admin/transparency/page.tsx`
- Create: `src/components/admin/transparency-editor.tsx`
- Create: `src/app/api/transparency/route.ts`

**Step 1: Create transparency API**

GET `/api/transparency` — return all categories ordered by sortOrder.
PUT `/api/transparency` — update all categories (array of { id, category, percentage, description, sortOrder }). Validate percentages sum to 100.

**Step 2: Create transparency editor**

Editable list of categories. Each row: category name, percentage (number input), description. Live preview of the stacked bar. Validation: percentages must sum to 100 (show warning if not). Save button.

**Step 3: Create page**

Title, editor, live TransparencyPreview below for $50 sample amount.

**Step 4: Commit**

```bash
git add src/app/admin/transparency/ src/components/admin/transparency-editor.tsx src/app/api/transparency/
git commit -m "feat: add admin transparency config editor"
```

---

### Task 17: Admin Settings

**Files:**
- Create: `src/app/admin/settings/page.tsx`
- Create: `src/app/api/admin/route.ts`

**Step 1: Create settings page**

Two sections:
1. **Mosque Config** — UEN display (read-only placeholder for now)
2. **Admin Accounts** — list current admins, form to add new admin (name, email, password)

**Step 2: Create admin API**

GET `/api/admin` — list admins (without password hashes).
POST `/api/admin` — create new admin (hash password with bcrypt).

**Step 3: Commit**

```bash
git add src/app/admin/settings/ src/app/api/admin/
git commit -m "feat: add admin settings page"
```

---

### Task 18: Polish and Final Verification

**Step 1: Run full test suite**

```bash
npx jest --verbose
```

**Step 2: Run linter**

```bash
npm run lint
```

**Step 3: Build production bundle**

```bash
npm run build
```

Fix any build errors.

**Step 4: Manual smoke test**

1. Landing page loads with theme
2. Complete pledge flow end-to-end
3. Success page shows QR code
4. Donor dashboard login and view
5. Admin login
6. Admin dashboard stats
7. Admin donors list and detail
8. Admin donations tracking
9. Admin reconciliation with sample CSV
10. Admin transparency editor

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: polish and fix build issues"
```

# Supabase Migration Design

**Date:** 2026-03-07
**Status:** Approved

## Overview

Migrate Skim Pintar 2.0 from SQLite/Prisma to Supabase PostgreSQL with Supabase JS client. Keep NextAuth for admin auth. No UI changes.

## Motivation

Hosted PostgreSQL database for easy Vercel deployment without SQLite limitations.

## What Changes

| Layer | Before | After |
|-------|--------|-------|
| Database | SQLite via Prisma | Supabase PostgreSQL |
| DB Client | @prisma/client | @supabase/supabase-js |
| Schema | prisma/schema.prisma | SQL migration file |
| Enums | String fields | PostgreSQL enums |
| Seed | prisma/seed.ts | SQL seed file |
| Auth | NextAuth + Prisma query | NextAuth + Supabase query |
| API routes | prisma.donor.findMany() | supabase.from('donors').select() |
| UI | No change | No change |

## New Dependencies

- Add: @supabase/supabase-js
- Remove: prisma, @prisma/client, @prisma/adapter-better-sqlite3, better-sqlite3

## New Env Vars

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## Database Schema

Tables use snake_case naming:
- donors (id, name, phone, email, nric_last4, reminder_channel, created_at, updated_at)
- pledges (id, donor_id, amount, frequency, reminder_day, status, created_at, updated_at)
- donations (id, pledge_id, donor_id, amount, reference, cycle_month, status, received_at, created_at, updated_at)
- admins (id, name, email, password_hash, created_at, updated_at)
- transparency_config (id, category, percentage, description, sort_order, updated_at)

PostgreSQL enums:
- reminder_channel_type: WHATSAPP, SMS, EMAIL
- frequency_type: MONTHLY, QUARTERLY, ANNUAL
- pledge_status_type: ACTIVE, PAUSED, CANCELLED
- donation_status_type: PENDING, RECEIVED, MISSED

## Client Setup

src/lib/supabase.ts exports:
- createServerClient() using SUPABASE_SERVICE_ROLE_KEY (for API routes and server components)
- No public client needed (all queries are server-side)

## Files to Modify

All API routes and server components that currently import from @/lib/db:
- src/lib/db.ts → replaced by src/lib/supabase.ts
- src/lib/auth.ts (NextAuth authorize)
- src/app/page.tsx (landing page transparency query)
- src/app/admin/page.tsx (dashboard stats)
- src/app/admin/donors/page.tsx
- src/app/admin/donors/[id]/page.tsx
- src/app/pledge/success/page.tsx
- src/app/api/pledges/route.ts
- src/app/api/pledges/[id]/route.ts
- src/app/api/donors/route.ts
- src/app/api/donors/lookup/route.ts
- src/app/api/donations/route.ts
- src/app/api/donations/[id]/route.ts
- src/app/api/transparency/route.ts
- src/app/api/reconcile/route.ts
- src/app/api/reconcile/apply/route.ts
- src/app/api/admin/route.ts

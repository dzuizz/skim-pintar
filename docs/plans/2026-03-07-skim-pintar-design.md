# Skim Pintar 2.0 — Design Document

**Date:** 2026-03-07
**Project:** Masjid Ar-Raudhah Recurring Donation Platform
**Status:** Approved

## Overview

Skim Pintar 2.0 replaces Ar-Raudhah's slow GIRO-based recurring donation process with a PayNow-centred pledge-and-reminder system. Donors register in under 2 minutes, receive monthly reminders with pre-filled PayNow QR codes, and can track their giving via a simple dashboard.

## Tech Stack

- Next.js 14+ (App Router) with TypeScript
- Tailwind CSS (warm/traditional theme: dark green + gold)
- SQLite with Prisma ORM
- NextAuth.js (Credentials provider for admin)
- Deployment: Vercel

## MVP Scope

### In Scope
1. Donor-facing pledge registration flow (multi-step form)
2. PayNow QR code generation with pre-filled reference
3. "Where Your Donation Could Go" transparency breakdown
4. Donor dashboard (view pledge, giving history)
5. Admin dashboard (view donors, manage pledges, manual reconciliation)

### Deferred
- WhatsApp/SMS reminder integration
- Automated bank statement reconciliation
- Donor self-reporting
- Tax receipt generation
- GIRO hybrid option

## Data Model

### Donor
- id, name, phone (unique), email (optional), nricLast4 (optional)
- reminderChannel (WHATSAPP | SMS | EMAIL)
- createdAt, updatedAt

### Pledge
- id, donorId (FK), amount (decimal), frequency (MONTHLY | QUARTERLY | ANNUAL)
- reminderDay (int 1-28, default 1), status (ACTIVE | PAUSED | CANCELLED)
- createdAt, updatedAt

### Donation
- id, pledgeId (FK), donorId (FK), amount (decimal)
- reference (e.g. "SP-0001-202603"), cycleMonth ("2026-03")
- status (PENDING | RECEIVED | MISSED), receivedAt (nullable)
- createdAt, updatedAt

### Admin
- id, name, email (unique), passwordHash
- createdAt, updatedAt

### TransparencyConfig
- id, category, percentage (int), description, sortOrder
- updatedAt

## Page Structure

### Public
- `/` — Landing page
- `/pledge` — Multi-step pledge form
- `/pledge/success` — Confirmation + first donation QR
- `/my` — Donor dashboard (phone + name access)

### Admin
- `/admin/login` — Admin login
- `/admin` — Dashboard overview
- `/admin/donors` — Donor list
- `/admin/donors/[id]` — Donor detail
- `/admin/donations` — Monthly tracking
- `/admin/reconcile` — CSV upload + matching
- `/admin/transparency` — Edit breakdown percentages
- `/admin/settings` — Admin accounts, UEN config

### API Routes
- `/api/auth/[...nextauth]` — NextAuth
- `/api/donors` — CRUD
- `/api/pledges` — CRUD
- `/api/donations` — CRUD + status updates
- `/api/reconcile` — CSV upload + matching
- `/api/qr` — PayNow QR generation
- `/api/transparency` — CRUD

## Pledge Registration Flow

1. Contact details (name, phone, email, NRIC last 4, reminder channel)
2. Donation amount (presets: $10/$30/$50/$100 + custom, frequency, reminder day)
3. Transparency preview ("Where Your $X Could Go")
4. Confirm & pledge (summary, consent, submit)
5. Success page (donor ID, PayNow QR for first donation, dashboard link)

## Donor Dashboard Access

Lightweight phone + name lookup (no password). Shows pledge details, giving history, transparency breakdown, pause/cancel controls.

## PayNow QR Generation

SGQR/EMVCo format encoding:
- Recipient UEN: placeholder `T08CC4018F`
- Recipient name: `MASJID AR-RAUDHAH`
- Pre-filled amount and reference (SP-XXXX-YYYYMM)
- Rendered via `qrcode` npm package

## Visual Design

- Primary: dark green (#1B5E20 range)
- Accent: gold (#D4A843 range)
- Subtle geometric Islamic patterns on hero/header
- Warm off-white backgrounds, rounded cards, soft shadows
- Mobile-first responsive
- Font: Inter via next/font

## Seed Data

- 5 transparency categories with default percentages
- 1 admin account (admin@arraudhah.org.sg / admin123)
- Sample donors and pledges for demo

## Project Structure

```
src/
  app/
    page.tsx
    pledge/
    my/
    admin/
    api/
  components/
    ui/
    donor/
    admin/
  lib/
    db.ts
    paynow-qr.ts
    auth.ts
    utils.ts
prisma/
  schema.prisma
  seed.ts
```

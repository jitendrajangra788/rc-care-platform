# Roshan Care — Advanced Home Nursing Platform

Next.js app for **Roshan Care** (Bhilwara): marketing site + role-based care operations.

## Features

- Marketing: Home, Services, How it works, Pricing, About, Careers, Contact, Book
- Roles: **Super Admin**, **Admin**, **Care Coordinator**, **Nurse**, **Family**, **Patient**
- Patient CRM, bookings, advanced Day/Week/Month schedule with conflict detection
- Attendance (GPS geofence + site PIN), locations/allotment
- Care plans, vitals timeline, daily care reports, medicine chart, care notes
- Family portal + patient portal
- Billing, manual payments ledger, expenses, payroll slips
- Complaints, notifications, reports, users & roles, settings
- Ops Hub (SOS, leaves, documents, audit)
- JSON file datastore (`data/db.json`)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Copy `.env.example` to `.env.local` and set `SESSION_SECRET` for production.

## Demo logins (development)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | super@roshancare.in | super123 |
| Admin | admin@roshancare.in | admin123 |
| Care Coordinator | coord@roshancare.in | coord123 |
| Nurse | nurse@roshancare.in | 12345678 |
| Family | family@roshancare.in | family123 |
| Patient | patient@roshancare.in | patient123 |

Demo buttons are hidden when `NODE_ENV=production` unless `NEXT_PUBLIC_DEMO_LOGINS=true`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
```

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind 4
- date-fns, Zod validation, Lucide, Framer Motion
- Signed session cookies + scrypt password hashes
- File-based JSON DB (persistent disk required for `next start`)

## Deploy notes

- Prefer Node hosting with writable `data/` and `public/uploads/`
- Set `SESSION_SECRET`, `DEMO_LOGINS`/`NEXT_PUBLIC_DEMO_LOGINS=false`
- Backup `data/db.json` and uploads on each release
- Passwords migrate from legacy plaintext to scrypt on successful login

## URL aliases

- `/dashboard/admin/calendar` → `/dashboard/admin/schedule`
- `/dashboard/nurse/duties` → `/dashboard/nurse`
- `/api/scheduling` → `/api/schedule`

# Balochistan Lottery Management System

A mobile-first Next.js (App Router) application that digitizes manual lottery ticket record-keeping —
customers submit ticket details digitally, and an authorized admin verifies and manages every record from
a secure dashboard.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack) — frontend + backend in one project (API routes under `src/app/api`)
- **Tailwind CSS 4** — styling
- **lowdb** (JSON file at `src/data/db.json`) — lightweight embedded database, swappable for Postgres/MySQL later
- **jose** — signed httpOnly JWT session cookies for admin auth
- **bcryptjs** — password hashing
- **zod** — server-side input validation

## Getting started

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

### Demo admin login

- URL: `/admin/login`
- Username: `admin`
- Password: `admin123`

The database seeds itself with sample draws, tickets, and this admin account on first run.

## Key flows

- **Customer:** Home → Submit Ticket (4-step form) → Reference ID → Check Ticket Status
- **Admin:** Login → Dashboard → Tickets (search/filter/sort) → Ticket Details (verify/reject/cancel/edit,
  duplicate flag, digital receipt) → Reports (CSV export) → Audit Logs → Notifications

## Notes

- File uploads (ticket/receipt images) are stored as base64 data URLs inside the JSON store for simplicity —
  swap for S3/Cloud Storage in production.
- Rate limiting is in-memory and per-process — replace with a shared store (Redis) for multi-instance deployments.
- WhatsApp/SMS delivery is stubbed via the Notifications log; connect a provider (Twilio, WhatsApp Cloud API) in
  `src/app/api/tickets/[id]/route.ts` and `src/app/api/tickets/route.ts` where notifications are created.

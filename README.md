# EduBridge Africa

Real-time school-to-parent communication platform for Uganda — attendance,
grades, and fee visibility from any phone, SMS-first, no app download
required.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Supabase** — Postgres, Auth (phone OTP), Storage, Row Level Security
- **Tailwind CSS v4**
- **Africa's Talking** — SMS delivery
- **Vercel** — hosting + cron jobs

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Africa's Talking credentials
npm run dev                  # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npm run lint          # ESLint
npm run typecheck    # tsc --noEmit
npm run format        # Prettier write
```

## Database

SQL migrations live in `supabase/migrations/`. Run them against your Supabase
project in order (`001_initial_schema.sql`, `002_rls_policies.sql`,
`003_seed_data.sql`) via the Supabase SQL editor or CLI.

## Project structure

- `src/app/(auth)` — login / OTP verification
- `src/app/(dashboard)/{admin,teacher,parent}` — role-scoped dashboards
- `src/app/api` — route handlers (auth, students, attendance, grades, fees, SMS, cron)
- `src/components` — shared UI, layout nav, and feature components
- `src/lib/supabase` — browser/server Supabase clients + session helper used by `src/proxy.ts`
- `src/lib/africastalking` — SMS send helper
- `src/lib/utils` — formatting, Zod validation schemas, constants
- `src/types` — shared TypeScript types mirroring the database schema
- `supabase/migrations` — SQL schema, RLS policies, seed data

## Notes on the stack version

This project runs Next.js 16, not 14 as referenced in the original product
spec. Two things differ from that spec's proposed repo structure as a result:

- `middleware.ts` is `src/proxy.ts` — Next.js 16 renamed Middleware to Proxy
  (same behavior, new file convention).
- There's no `tailwind.config.ts` — Tailwind v4 is configured via
  `@theme`/`@import` directly in `src/app/globals.css`.

See `AGENTS.md` for why: this environment's Next.js docs (in
`node_modules/next/dist/docs/`) take precedence over training-data
assumptions about Next.js conventions.

## Build phases

This repo currently reflects **Phase 1, Week 1**: project scaffolding,
Supabase wiring, and the full route/component folder structure with
placeholder screens. Auth, admin setup, attendance, grades, and fees ship
in Weeks 2–8.

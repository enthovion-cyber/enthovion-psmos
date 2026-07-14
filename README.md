# PSM OS

Process Safety Management Operating System for chemical, petrochemical, refinery, LNG, fertilizer, and industrial manufacturing facilities.

This repository follows the Phase 1 definitive structure:

- Backend: NestJS, Supabase, PostgreSQL, Redis, BullMQ
- Frontend: Next.js 14 App Router, TypeScript, Tailwind, shadcn/ui-compatible component structure
- Monorepo: pnpm workspaces and Turborepo

## Mandatory Build Order

1. Platform foundation
2. Equipment Registry
3. Workflow Engine and Universal Action Engine hardening
4. Permit to Work
5. Management of Change
6. HAZOP & PHA
7. PSSR
8. Employee Participation & Hazard Reporting

## Local Start

```bash
pnpm install
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The seed creates a demo HSE Manager:

- Email: `imran.shah@psmos.local`
- Password: `ChangeMe123!`
# enthovion-psmos

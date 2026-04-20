# ACERP

Multi-company ERP for beer & spirits production. Tanzania-tax aware.

## Stack

- Next.js 15 (App Router) + React 19
- TypeScript, Tailwind CSS, shadcn/ui
- Drizzle ORM + Turso (libSQL)
- NextAuth v5 (Auth.js) — credentials + JWT sessions
- Zod for validation
- Deployed on Vercel

## Modules (scaffolded)

- Master data: Companies, Warehouses, Products, Recipes, Customers, Suppliers
- Procurement: Purchase Orders, Goods Receipts
- Inventory: Stock, Batches/Lots, Transfers
- Production: Brews (beer), Distillations, Aging/Barrels, Bottling
- Quality: QC checks, non-conformances
- Sales: Orders, Invoices, Customers, Routes
- My Sales (sales rep portal): KPI dashboard, new order, visits
- Finance: Receivables, Payables, Tax (TRA VAT + excise)
- Reports & Settings (users, roles, tax)

## Multi-tenancy

Row-level. Every business table has `companyId`. Active company stored in cookie via `lib/tenant.ts`. Switch via the company selector in the topbar.

## Local setup

1. Create a Turso database:
   ```bash
   turso db create beverage-erp
   turso db show beverage-erp --url
   turso db tokens create beverage-erp
   ```
2. Copy `.env.example` → `.env` and fill `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET`.
3. Install and run:
   ```bash
   npm install
   npm run db:push     # apply schema to Turso
   npm run db:seed     # creates admin user + demo company
   npm run dev
   ```
4. Login: `admin@example.com` / `admin12345`.

## Deploy on Vercel

- Add the same env vars in Vercel project settings.
- Push to the deploy branch; Vercel builds Next.js automatically.
- For DB migrations, run `npm run db:push` from CI or manually before promoting.

## Project layout

```
app/
  (auth)/           login, register
  (app)/            authenticated shell + all modules
  api/auth/         NextAuth route
components/
  ui/               shadcn primitives
  layout/           sidebar, topbar, company switcher
db/
  schema/           Drizzle tables, split per domain
  seed.ts
lib/
  db.ts             Drizzle client (libSQL)
  auth.ts           NextAuth config
  tenant.ts         Active company resolution
  rbac.ts           Permissions + role presets
  tax/tanzania.ts   VAT 18% + excise helpers
server/
  actions/          Server actions, grouped per module
  services/         Pure business logic (testable)
```

## Tax (Tanzania)

- Default VAT 18% on (subtotal + excise).
- Excise per litre by product class (beer / spirit). Rates in `excise_rate` table; placeholders in `lib/tax/tanzania.ts` — verify with TRA before use.

## Adding shadcn components

```bash
npx shadcn@latest add table dialog form select toast
```

## Roadmap

This commit is structural scaffolding only. Next steps:
1. Wire CRUD for Master Data (products, customers, suppliers).
2. Build Production flows (brews → bottling) with stock posting.
3. Sales rep KPI service and live dashboard.
4. Tax invoice PDF + TRA reports.

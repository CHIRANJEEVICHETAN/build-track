# BuildTrack — Construction Management Dashboard

A professional construction project management web app. Full ERP-grade tool for tracking budgets, expenses, materials, labor, vendors, and timeline.

## Features

- **Dashboard** — KPI cards, charts, alerts, progress meter
- **Project Overview** — Master config, budget, timeline calculator
- **Daily Expenses** — Full expense ledger with filters
- **Material Tracker** — Inventory with low-stock alerts & wastage analytics
- **Labor Tracker** — Worker wages, attendance, pending dues
- **Vendor Management** — Contracts, payments, overdue alerts
- **Budget Planning** — Phase-wise planned vs actual with charts
- **Cash Flow Planner** — Monthly financial planning
- **Timeline Tracker** — Gantt-style phase scheduling
- **Site Progress** — Daily construction log
- **Document Tracker** — Invoice, contract, receipt registry

## Tech Stack

- Vite + React 18
- Tailwind CSS
- Recharts
- date-fns
- localStorage + Supabase client (PostgreSQL + Storage)

## Deploy to Vercel

### Option 1 — Vercel CLI
```bash
npm install -g vercel
cd construction-dashboard
npm install
vercel
```

### Option 2 — GitHub + Vercel Dashboard
1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → Import your repo
3. Framework: Vite
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy!

## Local Development
```bash
npm install
npm run dev
```
Open http://localhost:5173

## Data Storage
- Primary: Supabase PostgreSQL + Storage (when env vars are configured)
- Fallback: Browser localStorage (offline-safe)
- Automatic one-time migration from legacy `localStorage` state to Supabase

## Supabase Setup
1. Copy `.env.example` to `.env`
2. Fill:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (preferred) or `VITE_SUPABASE_ANON_KEY` (legacy fallback)
   - `VITE_SUPABASE_DOCS_BUCKET`
3. Run SQL from `supabase/schema.sql` in your Supabase SQL editor
4. Create the storage bucket (default: `construction-docs`)

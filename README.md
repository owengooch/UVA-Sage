# UVA Engineering Planner (Prototype)

Beginner-friendly prototype for collecting student goals and showing a curated UVA Engineering dashboard.

## Stack

- Next.js (App Router)
- Tailwind CSS
- Supabase (schema + seed files included)

## Setup

1. Install Node.js 20+ and npm.
2. Install dependencies:
   - `npm install`
3. Copy environment file:
   - `cp .env.example .env.local`
4. Add Supabase keys to `.env.local`.
5. Run development server:
   - `npm run dev`

## Supabase

- Schema: `supabase/migrations/001_initial.sql`
- Seed data: `supabase/seed.sql`

Apply both files in Supabase SQL editor (or via Supabase CLI) before integrating live queries.

## Current Prototype Behavior

- Onboarding form saves profile data to browser local storage.
- Dashboard uses rule-based matching from sample data.
- Project includes Supabase clients and SQL files to transition to persisted DB-backed data.

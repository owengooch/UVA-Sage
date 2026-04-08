# UVA Engineering Planner (Sage)

Next.js app for UVA Engineering students: **username/password sign-up** (backed by Supabase Auth), **onboarding** (major, goals, interests, **UVA email**), and a **dashboard** that combines catalog data, major requirements, study abroad programs, and rule-based recommendations.

## Stack

- **Next.js 15** (App Router), React 19, Tailwind CSS
- **Supabase**: Auth, Postgres (courses, requirements, profiles, study abroad), RLS
- **Vercel** + **GitHub** for hosting and CI (typical setup)

## Local setup

1. Install **Node.js 20+** and npm.
2. `npm install`
3. `cp .env.example .env.local`
4. Set in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. In the **Supabase SQL editor** (or Supabase CLI), apply migrations **in numeric order**:
   - `supabase/migrations/001_initial.sql` through `015_courses_elective_fulfillments.sql`
   - Re-run `014_ensure_onboarding_schema.sql` anytime the hosted DB is missing columns the app expects (it is idempotent).
6. Optional: load seed data — `supabase/seed.sql`, `supabase/seed_majors.sql`, and study-abroad seeds as needed.
7. `npm run dev` → open [http://localhost:3000](http://localhost:3000)

### Supabase Auth (recommended for this app)

- **Email provider**: Under Authentication → Providers → Email, turn **off** “Confirm email” for development so `signUp` returns a session immediately (the UI expects this). For production with confirmations, turn it on and add redirect URLs below.
- **Site URL**: e.g. `http://localhost:3000` locally, `https://<your-vercel-domain>` in production.
- **Redirect URLs**: include  
  `http://localhost:3000/auth/callback`  
  `https://<your-vercel-domain>/auth/callback`

Users sign in with a **username**; internally Auth uses `username@uvasage.invalid`. Their **real** `@virginia.edu` / `@email.virginia.edu` address is collected on onboarding and stored on `student_profiles.uva_email`.

## Vercel

1. Import the GitHub repo; framework preset **Next.js**.
2. Environment variables (Production / Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In Supabase, add your Vercel URL(s) to **Site URL** and **Redirect URLs** as above.

No `SUPABASE_SERVICE_ROLE_KEY` is required for the web app runtime (only for maintenance scripts).

## Data pipeline

| Task | Command / notes |
|------|-----------------|
| Harvest course HTML (Hooslist) | `npm run harvest:hooslist` |
| Apply harvest to Supabase | `npm run import:hooslist` — needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (see `scripts/apply-hooslist-to-supabase.mjs`) |
| Backfill `courses.elective_fulfillments` | Apply migration `015`, then `npm run recompute:electives` (needs **service role** key in `.env.local`) |

Elective tags are derived from Undergraduate Record footnotes via `src/lib/elective-fulfillment-tags.ts`.

## App behavior

- **Dashboard** requires a signed-in user with a **saved** `student_profiles` row. Otherwise the app sends you to **onboarding** (or **login** if anonymous).
- **Onboarding** requires a valid **UVA email** before the save-to-server step succeeds.

## Scripts (package.json)

- `npm run dev` — development server  
- `npm run build` — production build  
- `npm run lint` — ESLint  

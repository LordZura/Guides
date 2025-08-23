# TourGuideHub — Starter (Vite + React + Tailwind + Supabase client)

## What this scaffold includes
- Vite + React (TypeScript)
- TailwindCSS
- React Router pages: `/`, `/explore`, `/tour/:id`, `/guides/:id`, `/login`, `/signup`, `/dashboard`
- Components: NavBar, Footer, TourCard, AuthForm
- Supabase client wrapper: `src/supabaseClient.ts` (reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY`)
- Local seed data: `src/data/tours.json` (3 sample tours shown on Home)

## Quick start

1. Copy environment example:
```bash
cp .env.example .env
# Fill in the values in .env (use public anon key for dev)

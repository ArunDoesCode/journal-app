# Body Metrics PWA

Daily body measurement and journaling progressive web app.

## Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase · Zustand · Sonner · Recharts · next-pwa

## Environment variables

Create a `.env.local` file in this directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_APP_URL=https://your-ngrok-or-production-url
```

Both values are found in your Supabase project → Settings → API.

## Supabase setup

1. Create the tables and RLS policies listed in the project `plan.md` (at repo root).
2. Create a `journal` storage bucket set to public.
3. Set the auth redirect URL to `<your-domain>/auth/callback`.

## Adding components

```bash
npx shadcn@latest add button
```

## PWA

The app includes `app/manifest.json` and PWA meta tags — it is installable on mobile. A service worker (via `next-pwa`) was excluded because `next-pwa@5.x` requires webpack and Next.js 16 uses Turbopack by default. Add a service worker when Turbopack-compatible PWA tooling becomes available.

## Development

```bash
npm install
npm run dev
```
